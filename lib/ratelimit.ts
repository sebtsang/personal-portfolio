/**
 * Per-IP rate limiting via @upstash/ratelimit v2.
 *
 * Two sliding windows:
 *   - burst:  8 requests / 10 seconds — scripted abuse protection
 *   - hourly: 40 requests / hour      — budget protection
 *
 * Fails OPEN — if Upstash is unreachable, let the request through.
 * Better UX than hard-failing every request when Redis has a bad day.
 *
 * Local dev: if UPSTASH env vars are unset, we skip rate limiting
 * entirely (returns { allowed: true }) — nothing to rate-limit against.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { redis, hasUpstash } from "./redis";

const burstLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(8, "10 s"),
      prefix: "chat:burst",
      analytics: true,
    })
  : null;

const hourlyLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(40, "1 h"),
      prefix: "chat:hourly",
      analytics: true,
    })
  : null;

export type RateLimitResult =
  | { allowed: true }
  | {
      allowed: false;
      retryAfterSeconds: number;
      which: "burst" | "hourly";
    };

/**
 * Extract the client IP from Vercel-trusted headers.
 * - In production, Vercel overwrites x-forwarded-for (cannot be spoofed).
 * - In local dev, request.headers.get("x-forwarded-for") returns null;
 *   we fall back to a sentinel.
 */
export function getClientKey(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "local-dev";
}

/**
 * Check both limits in parallel. First one to fail wins (and determines
 * the Retry-After header). Fails open on Upstash errors.
 */
export async function checkRateLimit(key: string): Promise<RateLimitResult> {
  if (!burstLimit || !hourlyLimit) {
    // No Upstash configured — rate limit disabled. OK for local dev.
    return { allowed: true };
  }

  try {
    const [burst, hourly] = await Promise.all([
      burstLimit.limit(key),
      hourlyLimit.limit(key),
    ]);

    if (!burst.success) {
      return {
        allowed: false,
        which: "burst",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((burst.reset - Date.now()) / 1000)
        ),
      };
    }
    if (!hourly.success) {
      return {
        allowed: false,
        which: "hourly",
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((hourly.reset - Date.now()) / 1000)
        ),
      };
    }
    return { allowed: true };
  } catch (err) {
    // Upstash is down or misconfigured — fail open so the site stays up.
    console.error("[ratelimit] Upstash error, failing open:", err);
    return { allowed: true };
  }
}

/**
 * Exported for the /api/chat route to branch on the missing-config
 * case and surface a clear log line on first request.
 */
export const rateLimitEnabled = hasUpstash;

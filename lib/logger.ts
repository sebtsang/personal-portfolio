/**
 * Structured logging for /api/chat — fire-and-forget into Upstash Redis.
 *
 * DESIGN:
 * - Append JSON strings to a Redis list `chat:logs` (LPUSH).
 * - TTL: 7 days. List grows unbounded otherwise; use LRANGE to read.
 * - Optional feedback bucket `chat:feedback` for opt-in content-gap
 *   logging when a user message ends with the literal "#feedback".
 * - IP addresses are HASHED before storage (sha256 + LOG_SALT, 12 chars).
 *   Same IP → same hash (enables "unique visitors" analysis) without
 *   revealing the real IP.
 *
 * PRIVACY:
 * - Never logs raw user messages or LLM responses. Only token counts,
 *   tool names, latency, status.
 * - Exception: the #feedback bucket, where the user opted in by tagging
 *   their message. Logged to a SEPARATE list with 30-day TTL.
 *
 * LATENCY:
 * - All writes go through waitUntil() — happen after the response is
 *   sent, never block the stream.
 *
 * LOCAL DEV:
 * - If UPSTASH env vars are unset, logToRedis is a no-op. No errors,
 *   no setup friction.
 */

import { Redis } from "@upstash/redis";
import { waitUntil } from "@vercel/functions";
import crypto from "node:crypto";
import type { LLMProvider } from "./llm";

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL &&
  !!process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = hasUpstash ? Redis.fromEnv() : null;

const LOG_LIST_KEY = "chat:logs";
const FEEDBACK_LIST_KEY = "chat:feedback";
const LOG_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const FEEDBACK_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** Allowed statuses — keep the union tight so the read script can filter. */
export type LogStatus =
  | "ok"
  | "empty-retry-ok"
  | "empty-fallback"
  | "rate-limited"
  | "validation-failed"
  | "upstream-error"
  | "aborted";

export type ChatLog = {
  ts: number;
  ip_hash: string;
  provider: LLMProvider | "unknown";
  model?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  tool_calls: string[];
  latency_ms: number;
  status: LogStatus;
  feedback_flag?: true;
};

/**
 * Stable hash of the client IP. Uses LOG_SALT env if set, otherwise a
 * weak default (fine for local dev — production should set a real one).
 */
export function hashIp(ip: string): string {
  const salt = process.env.LOG_SALT ?? "dev-only-weak-salt";
  return crypto
    .createHash("sha256")
    .update(ip + salt)
    .digest("hex")
    .slice(0, 12);
}

/**
 * Detect opt-in feedback marker. The suffix is hidden from the persona
 * and not shown in the UI — users type `#feedback` at the end of a
 * message to opt in.
 */
export function isFeedbackFlagged(content: string): boolean {
  return /#feedback\s*$/i.test(content);
}

/**
 * Fire-and-forget append to the Redis log list. Uses waitUntil so we
 * never block the stream on log writes.
 */
export function logChat(entry: ChatLog): void {
  if (!redis) return;
  const payload = JSON.stringify(entry);
  waitUntil(
    (async () => {
      try {
        await redis.lpush(LOG_LIST_KEY, payload);
        await redis.expire(LOG_LIST_KEY, LOG_TTL_SECONDS);
      } catch (err) {
        console.error("[logger] Failed to write log:", err);
      }
    })()
  );
}

/**
 * Log an opted-in feedback message so Seb can catch content gaps in
 * the corpus. Only called when the user ended their message with
 * `#feedback`. Stored separately with a longer TTL.
 */
export function logFeedback(entry: {
  ts: number;
  ip_hash: string;
  message: string; // yes, the raw message — user opted in
}): void {
  if (!redis) return;
  const payload = JSON.stringify(entry);
  waitUntil(
    (async () => {
      try {
        await redis.lpush(FEEDBACK_LIST_KEY, payload);
        await redis.expire(FEEDBACK_LIST_KEY, FEEDBACK_TTL_SECONDS);
      } catch (err) {
        console.error("[logger] Failed to write feedback:", err);
      }
    })()
  );
}

export const loggingEnabled = hasUpstash;

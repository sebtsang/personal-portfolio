import { streamChat, currentConfig } from "@/lib/llm";
import { getSystemPromptTokens } from "@/lib/llm/prompt";
import { validateChatRequest } from "@/lib/validation";
import { checkRateLimit, getClientKey } from "@/lib/ratelimit";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Request pipeline:
 *   1. rate-limit per client IP (Upstash sliding windows)
 *   2. parse + Zod-validate the body (+ garbage heuristics)
 *   3. token-budget check against assembled system prompt
 *   4. delegate to streamChat() for provider dispatch + streaming
 */
export async function POST(req: Request) {
  // 1. Rate limit (fails open if Upstash unreachable)
  const key = getClientKey(req);
  const rl = await checkRateLimit(key);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({
        error: "rate-limited",
        retryAfter: rl.retryAfterSeconds,
        which: rl.which,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfterSeconds),
        },
      }
    );
  }

  // 2. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  // 3. Validate + budget check
  const { provider } = currentConfig();
  const validation = validateChatRequest(body, getSystemPromptTokens(provider));
  if (!validation.ok) {
    return jsonError(validation.status, validation.error);
  }

  // 4. Delegate
  return streamChat({
    messages: validation.messages,
    signal: req.signal,
  });
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

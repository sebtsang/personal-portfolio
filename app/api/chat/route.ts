import { streamChat, currentConfig } from "@/lib/llm";
import { getSystemPromptTokens } from "@/lib/llm/prompt";
import { validateChatRequest } from "@/lib/validation";
import { checkRateLimit, getClientKey } from "@/lib/ratelimit";
import {
  hashIp,
  isFeedbackFlagged,
  logChat,
  logFeedback,
} from "@/lib/logger";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Request pipeline:
 *   1. rate-limit per client IP (Upstash sliding windows)
 *   2. parse + Zod-validate the body (+ garbage heuristics)
 *   3. token-budget check against assembled system prompt
 *   4. delegate to streamChat() for provider dispatch + streaming
 *
 * Logs:
 *   - rate-limited    → status "rate-limited"
 *   - validation fail → status "validation-failed"
 *   - success or upstream-error → emitted by the provider once the
 *     stream completes (see lib/llm/ollama.ts, claude.ts, openai.ts)
 *   - #feedback tag on last user message → opt-in feedback log
 */
export async function POST(req: Request) {
  const startedAt = Date.now();
  const key = getClientKey(req);
  const ipHash = hashIp(key);
  const { provider } = currentConfig();

  // 1. Rate limit
  const rl = await checkRateLimit(key);
  if (!rl.allowed) {
    logChat({
      ts: startedAt,
      ip_hash: ipHash,
      provider,
      tool_calls: [],
      latency_ms: Date.now() - startedAt,
      status: "rate-limited",
    });
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

  // 2. Parse
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    logChat({
      ts: startedAt,
      ip_hash: ipHash,
      provider,
      tool_calls: [],
      latency_ms: Date.now() - startedAt,
      status: "validation-failed",
    });
    return jsonError(400, "Invalid JSON body.");
  }

  // 3. Validate + budget check
  const validation = validateChatRequest(body, getSystemPromptTokens(provider));
  if (!validation.ok) {
    logChat({
      ts: startedAt,
      ip_hash: ipHash,
      provider,
      tool_calls: [],
      latency_ms: Date.now() - startedAt,
      status: "validation-failed",
    });
    return jsonError(validation.status, validation.error);
  }

  // Opt-in feedback logging: if last user message ended with "#feedback",
  // log just THAT message to the feedback bucket.
  const lastUserMsg = [...validation.messages]
    .reverse()
    .find((m) => m.role === "user");
  const feedbackFlag = lastUserMsg && isFeedbackFlagged(lastUserMsg.content);
  if (feedbackFlag && lastUserMsg) {
    logFeedback({
      ts: startedAt,
      ip_hash: ipHash,
      message: lastUserMsg.content,
    });
  }

  // 4. Delegate — provider is responsible for the final "ok" log
  // (tokens + tool calls + latency) once the stream completes.
  return streamChat({
    messages: validation.messages,
    signal: req.signal,
    logContext: {
      startedAt,
      ipHash,
      feedbackFlag: feedbackFlag || undefined,
    },
  });
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

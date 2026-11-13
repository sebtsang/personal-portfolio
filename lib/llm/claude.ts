/**
 * Claude provider, built on the official Anthropic SDK.
 *
 * Why not the Vercel AI SDK adapter (@ai-sdk/anthropic v1): it always
 * sends a temperature (0 when unset), and Claude Haiku 5.5 returns a 400
 * for any non-default temperature or top_p. It also can't set `effort`.
 *
 * One non-streaming call, then the reply is written out in the AI SDK v4
 * data-stream protocol that useChat consumes. Streaming would buy
 * nothing: guardResponse (lib/llm/guard.ts) holds the whole reply
 * anyway. A single call also means every upstream failure is known
 * before we return, so LLM_FALLBACK_PROVIDER can still take over.
 *
 * The stable part of the system prompt (voice, override, corpus) is
 * marked for prompt caching. It is identical across visitors, so after
 * the first request every reply within five minutes reads it at a tenth
 * of the input price.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage, LogContext } from "./index";
import { MODEL_CONFIG } from "./config";
import { toolNames, toolSchemas, type ToolName } from "@/lib/tools";
import { logChat, type LogStatus } from "@/lib/logger";

/** Every tool takes no arguments; the model only picks which page to show. */
const CLAUDE_TOOLS: Anthropic.Tool[] = toolNames.map((name) => ({
  name,
  description: toolSchemas[name].description,
  input_schema: { type: "object", properties: {}, additionalProperties: false },
}));

let client: Anthropic | undefined;
function getClient(): Anthropic {
  // One retry, not the SDK's default two, so a configured fallback
  // provider takes over sooner.
  client ??= new Anthropic({ maxRetries: 1 });
  return client;
}

export async function streamClaude({
  messages,
  system,
  model,
  signal,
  logContext,
}: {
  messages: ChatMessage[];
  system: { stable: string; tail: string };
  model: string;
  signal?: AbortSignal;
  logContext?: LogContext;
}): Promise<Response> {
  const emitLog = (
    status: LogStatus,
    opts: {
      prompt_tokens?: number;
      completion_tokens?: number;
      cache_read_tokens?: number;
      tool_calls?: string[];
    } = {}
  ) => {
    const latencyMs = Date.now() - (logContext?.startedAt ?? Date.now());
    const tc = opts.tool_calls?.length ? ` tools=[${opts.tool_calls.join(",")}]` : "";
    console.log(
      `[claude] ${model} ${status} prompt=${opts.prompt_tokens ?? 0} ` +
        `cached=${opts.cache_read_tokens ?? 0} completion=${opts.completion_tokens ?? 0} ` +
        `latency=${latencyMs}ms${tc}`
    );

    if (!logContext) return;
    logChat({
      ts: logContext.startedAt,
      ip_hash: logContext.ipHash,
      provider: "claude",
      model,
      prompt_tokens: opts.prompt_tokens,
      completion_tokens: opts.completion_tokens,
      tool_calls: opts.tool_calls ?? [],
      latency_ms: latencyMs,
      status,
      feedback_flag: logContext.feedbackFlag,
    });
  };

  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(
      500,
      "provider-misconfigured",
      "ANTHROPIC_API_KEY is not set. Set it in .env.local or switch LLM_PROVIDER."
    );
  }

  const params = MODEL_CONFIG.claude;

  let response: Anthropic.Message;
  try {
    response = await getClient().messages.create(
      {
        model,
        max_tokens: params.maxTokens,
        output_config: { effort: params.effort },
        system: [
          { type: "text", text: system.stable, cache_control: { type: "ephemeral" } },
          { type: "text", text: system.tail },
        ],
        tools: CLAUDE_TOOLS,
        messages: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      },
      { signal }
    );
  } catch (err) {
    if (err instanceof Anthropic.APIUserAbortError) {
      emitLog("aborted");
      return jsonError(499, "aborted");
    }
    emitLog("upstream-error");
    if (err instanceof Anthropic.APIConnectionError) {
      console.error("[claude] connection failed:", err);
      return jsonError(503, "upstream-unreachable", "Couldn't reach the Anthropic API.");
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`[claude] ${err.status}:`, err.message);
      // 503 for every upstream status, same reasoning as lib/llm/ollama.ts:
      // Cloudflare replaces 502 bodies, and a 429 here must not look like
      // our own "rate-limited" code to the client.
      return jsonError(
        503,
        "upstream-unavailable",
        `Anthropic returned ${err.status}. Check ANTHROPIC_API_KEY and LLM_MODEL.`
      );
    }
    console.error("[claude] fatal:", err);
    return jsonError(503, "upstream-unavailable");
  }

  // A response can start with thinking blocks (empty by default), so read
  // blocks by type, never by position.
  let text = "";
  const toolCalls: { toolCallId: string; toolName: ToolName }[] = [];
  for (const block of response.content) {
    if (block.type === "text") {
      text += block.text;
    } else if (block.type === "tool_use") {
      if (!(block.name in toolSchemas)) {
        console.warn(`[claude] Dropping unknown tool call "${block.name}"`);
        continue;
      }
      toolCalls.push({ toolCallId: block.id, toolName: block.name as ToolName });
    }
  }

  let status: LogStatus = "ok";
  // Covers a refusal, and thinking that used the whole max_tokens budget.
  if (!text.trim() && toolCalls.length === 0) {
    console.warn(
      `[claude] Empty reply (stop_reason=${response.stop_reason}). Sending the fallback line.`
    );
    text = pickFallback();
    status = "empty-fallback";
  }

  const usage = response.usage;
  const promptTokens =
    usage.input_tokens +
    (usage.cache_read_input_tokens ?? 0) +
    (usage.cache_creation_input_tokens ?? 0);
  const finishReason =
    toolCalls.length > 0
      ? "tool-calls"
      : response.stop_reason === "max_tokens"
        ? "length"
        : "stop";
  const streamUsage = { promptTokens, completionTokens: usage.output_tokens };

  const parts: string[] = [];
  if (text) parts.push(encode("0", text));
  for (const call of toolCalls) {
    parts.push(encode("9", { ...call, args: {} }));
    parts.push(encode("a", { toolCallId: call.toolCallId, result: { ok: true } }));
  }
  parts.push(encode("e", { finishReason, usage: streamUsage, isContinued: false }));
  parts.push(encode("d", { finishReason, usage: streamUsage }));

  emitLog(status, {
    prompt_tokens: promptTokens,
    completion_tokens: usage.output_tokens,
    cache_read_tokens: usage.cache_read_input_tokens ?? 0,
    tool_calls: toolCalls.map((c) => c.toolName),
  });

  return new Response(parts.join(""), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function encode(code: string, payload: unknown): string {
  return `${code}:${JSON.stringify(payload)}\n`;
}

const FALLBACKS = [
  "Brain stalled. Try me again?",
  "That one broke me. Try a different angle?",
  "I went to answer that and forgot what I was saying. Try again?",
  "Blanked. Maybe try a shortcut below instead.",
  "Lost the plot on that one. Ask me something else?",
];
function pickFallback(): string {
  return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
}

/** `error` is a stable machine code; see jsonError in lib/llm/ollama.ts. */
function jsonError(status: number, error: string, detail?: string): Response {
  return new Response(JSON.stringify(detail ? { error, detail } : { error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

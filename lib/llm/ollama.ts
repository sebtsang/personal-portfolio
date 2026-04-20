/**
 * Ollama provider — works against both the local daemon and Ollama Cloud.
 *
 * Why hand-rolled (not @ai-sdk/openai-compatible or ollama-ai-provider):
 * those providers don't expose Ollama's `think: false` parameter. Without
 * it, reasoning models (Qwen, GLM, MiniMax) burn 500+ tokens on chain-of-
 * thought before producing any visible output — unusable for chat UX.
 *
 * This streams Ollama's native /api/chat NDJSON and transforms it into
 * the AI SDK v4 data-stream protocol that useChat consumes.
 */

import type { ChatMessage, LogContext } from "./index";
import { MODEL_CONFIG } from "./config";
import { toolSchemas, type ToolName } from "@/lib/tools";
import { logChat, type LogStatus } from "@/lib/logger";

/**
 * Base URL for the Ollama server.
 * - Local daemon:  http://localhost:11434 (default)
 * - Ollama Cloud:  https://ollama.com
 */
function resolveBaseURL(): string {
  if (process.env.OLLAMA_BASE_URL) return process.env.OLLAMA_BASE_URL;
  // If the user set an API key without a base URL, assume they want the cloud.
  if (process.env.OLLAMA_API_KEY) return "https://ollama.com";

  // On Vercel, localhost would try to hit the serverless function itself.
  // Fail loudly at the first request rather than 500ing on every one.
  if (process.env.VERCEL === "1") {
    throw new Error(
      "[ollama] Running on Vercel with no OLLAMA_API_KEY or OLLAMA_BASE_URL. " +
        "Set OLLAMA_API_KEY (for Ollama Cloud) or OLLAMA_BASE_URL " +
        "(for a tunneled home server) in the Vercel project env vars."
    );
  }

  return "http://localhost:11434";
}

/**
 * Tool schemas in Ollama's OpenAI-function JSON Schema form. Mirror
 * lib/tools.ts but for Ollama — the Vercel AI SDK's Zod helpers aren't
 * used here because we call Ollama natively.
 */
const OLLAMA_TOOLS = [
  {
    type: "function",
    function: {
      name: "showAbout",
      description:
        "Display Seb's personal About page. Call for open-ended 'tell me about yourself' / 'who are you' / 'what's your story' style questions, or when the user explicitly asks for /about.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "showExperience",
      description:
        "Display an animated timeline of work experience. Call when the user asks about jobs, companies, or work history.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "showContact",
      description:
        "Display contact information. Call when the user wants to reach out.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "showLinkedIn",
      description:
        "Display a stacked-deck carousel of Sebastian's favorite LinkedIn posts. Call when the user asks about LinkedIn, posts, or public writing.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

function encode(code: string, payload: unknown): string {
  return `${code}:${JSON.stringify(payload)}\n`;
}

export async function streamOllama({
  messages,
  system,
  model,
  signal,
  logContext,
}: {
  messages: ChatMessage[];
  system: string;
  model: string;
  signal?: AbortSignal;
  logContext?: LogContext;
}): Promise<Response> {
  const emitLog = (
    status: LogStatus,
    opts: {
      prompt_tokens?: number;
      completion_tokens?: number;
      tool_calls?: string[];
    } = {}
  ) => {
    if (!logContext) return;
    logChat({
      ts: logContext.startedAt,
      ip_hash: logContext.ipHash,
      provider: "ollama",
      model,
      prompt_tokens: opts.prompt_tokens,
      completion_tokens: opts.completion_tokens,
      tool_calls: opts.tool_calls ?? [],
      latency_ms: Date.now() - logContext.startedAt,
      status,
      feedback_flag: logContext.feedbackFlag,
    });
  };


  let baseURL: string;
  try {
    baseURL = resolveBaseURL();
  } catch (err) {
    console.error("[ollama]", err);
    return new Response(
      JSON.stringify({
        error:
          err instanceof Error ? err.message : "Ollama config error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  const apiKey = process.env.OLLAMA_API_KEY;
  const params = MODEL_CONFIG.ollama;

  const ollamaBody = {
    model,
    stream: true,
    think: false,
    options: {
      temperature: params.temperature,
      top_p: params.topP,
      // Witty replies are under 50 tokens. The configured cap is 180
      // (see lib/llm/config.ts) — when the model stalls on tool
      // indecision, this limits dead time to ~6-7s instead of 15s.
      num_predict: params.maxTokens,
    },
    tools: OLLAMA_TOOLS,
    messages: [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  // Chain abort: if the client disconnects OR the upstream fetch is
  // aborted, tear down the Ollama connection too. Wrap in try/catch
  // so the listener never throws an unhandled rejection when the
  // request signal aborts after we've already closed things.
  const upstreamAbort = new AbortController();
  const safeAbort = () => {
    try {
      if (!upstreamAbort.signal.aborted) upstreamAbort.abort();
    } catch {
      /* ignore */
    }
  };
  if (signal) {
    if (signal.aborted) safeAbort();
    else signal.addEventListener("abort", safeAbort, { once: true });
  }

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(ollamaBody),
      signal: upstreamAbort.signal,
    });
  } catch (err) {
    console.error("[ollama] Fetch failed:", err);
    emitLog("upstream-error");
    return jsonError(
      503,
      `Couldn't reach Ollama at ${baseURL}. Is it running? (ollama serve, or check OLLAMA_API_KEY for cloud).`
    );
  }

  if (!ollamaRes.ok || !ollamaRes.body) {
    const text = await ollamaRes.text().catch(() => "");
    console.error(`[ollama] ${ollamaRes.status}:`, text);
    emitLog("upstream-error");
    return jsonError(
      502,
      `Ollama returned ${ollamaRes.status}. If using cloud, check OLLAMA_API_KEY. If local, try \`ollama pull ${model}\`.`
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = ollamaRes.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      let promptTokens = 0;
      let completionTokens = 0;
      let finishReason: "stop" | "length" | "tool-calls" = "stop";

      // Track whether we emitted anything visible. Reasoning-ish models
      // sometimes reply with many tokens that don't surface as content.
      let emittedContent = false;
      let emittedToolCall = false;
      let latestThinking = "";
      // Keep the raw final chunk when diagnosing empty completions.
      let lastChunkRaw: unknown = null;
      // Accumulate tool names for the final log line.
      const toolCallNames: string[] = [];
      // Track whether the final status is "empty-retry-ok" / "empty-fallback"
      // so emitLog in the `done` block reports accurately.
      let finalStatus: LogStatus = "ok";

      // Has the client disconnected? Guard against writing to a closed
      // controller, which throws ERR_INVALID_STATE.
      let clientGone = false;
      const onClientAbort = () => {
        clientGone = true;
        // Propagate to upstream Ollama so we're not burning cloud tokens
        // for a browser that's no longer listening.
        safeAbort();
        try {
          reader.cancel();
        } catch {
          /* already canceled is fine */
        }
      };
      if (signal) {
        if (signal.aborted) onClientAbort();
        else signal.addEventListener("abort", onClientAbort, { once: true });
      }

      const safeEnqueue = (bytes: Uint8Array) => {
        if (clientGone) return;
        try {
          controller.enqueue(bytes);
        } catch {
          // Stream was closed by the consumer — stop trying to write.
          clientGone = true;
        }
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let nl: number;
          while ((nl = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, nl).trim();
            buffer = buffer.slice(nl + 1);
            if (!line) continue;

            let chunk: {
              message?: {
                content?: string;
                thinking?: string;
                tool_calls?: Array<{
                  function: {
                    name: string;
                    arguments: Record<string, unknown> | string;
                  };
                }>;
              };
              prompt_eval_count?: number;
              eval_count?: number;
              done?: boolean;
              done_reason?: string;
            };
            try {
              chunk = JSON.parse(line);
            } catch {
              continue;
            }
            if (chunk.done) lastChunkRaw = chunk;

            const text = chunk.message?.content;
            if (text) {
              emittedContent = true;
              safeEnqueue(encoder.encode(encode("0", text)));
            }

            // Keep the latest thinking snippet so we can surface it as a
            // fallback if content never arrives.
            if (chunk.message?.thinking) {
              latestThinking = chunk.message.thinking;
            }

            const toolCalls = chunk.message?.tool_calls;
            if (toolCalls?.length) {
              for (const tc of toolCalls) {
                const rawArgs =
                  typeof tc.function.arguments === "string"
                    ? safeJson(tc.function.arguments)
                    : tc.function.arguments;

                // Validate the tool call shape + args against the shared
                // Zod schemas. Silently drop invalid calls — the model
                // gets to try again on the next turn, and we never
                // dispatch a malformed view change.
                const validated = validateToolCall(
                  tc.function.name,
                  rawArgs
                );
                if (!validated.ok) {
                  console.warn(
                    `[ollama] Invalid tool call "${tc.function.name}":`,
                    validated.error
                  );
                  continue;
                }

                const toolCallId = `call_${crypto.randomUUID()}`;
                safeEnqueue(
                  encoder.encode(
                    encode("9", {
                      toolCallId,
                      toolName: validated.name,
                      args: validated.args,
                    })
                  )
                );
                safeEnqueue(
                  encoder.encode(
                    encode("a", { toolCallId, result: { ok: true } })
                  )
                );
                emittedToolCall = true;
                toolCallNames.push(validated.name);
                finishReason = "tool-calls";
              }
            }

            if (typeof chunk.prompt_eval_count === "number")
              promptTokens = chunk.prompt_eval_count;
            if (typeof chunk.eval_count === "number")
              completionTokens = chunk.eval_count;

            if (chunk.done) {
              // Recovery: if the model produced neither content nor tool
              // calls, the tools themselves are often the distraction —
              // try once more WITHOUT tools. If that still comes back
              // empty, fall back to a witty "try again" message.
              if (!emittedContent && !emittedToolCall) {
                console.warn(
                  `[ollama] Empty completion (${completionTokens} tokens, ` +
                    `done_reason=${chunk.done_reason}, ` +
                    `thinking=${latestThinking.length}). Retrying without tools...`
                );
                const retryText = await retryWithoutTools(
                  baseURL,
                  apiKey,
                  model,
                  system,
                  messages
                );
                if (retryText) {
                  safeEnqueue(encoder.encode(encode("0", retryText)));
                  finalStatus = "empty-retry-ok";
                } else {
                  console.warn(
                    `[ollama] Retry also empty. Raw final chunk:`,
                    JSON.stringify(lastChunkRaw)
                  );
                  safeEnqueue(encoder.encode(encode("0", pickFallback())));
                  finalStatus = "empty-fallback";
                }
              }
              if (chunk.done_reason === "length") finishReason = "length";
              const usage = { promptTokens, completionTokens };
              safeEnqueue(
                encoder.encode(
                  encode("e", { finishReason, usage, isContinued: false })
                )
              );
              safeEnqueue(encoder.encode(encode("d", { finishReason, usage })));
              // Fire the final log line (fire-and-forget via waitUntil)
              emitLog(finalStatus, {
                prompt_tokens: promptTokens,
                completion_tokens: completionTokens,
                tool_calls: toolCallNames,
              });
            }
          }
        }
      } catch (err) {
        // AbortError is expected when the client disconnects mid-stream.
        // Everything else is worth surfacing.
        if (err instanceof Error && err.name === "AbortError") {
          console.log("[ollama] stream aborted (client disconnect)");
          emitLog("aborted", {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            tool_calls: toolCallNames,
          });
        } else {
          console.error("[ollama] Stream error:", err);
          safeEnqueue(
            encoder.encode(
              encode("3", err instanceof Error ? err.message : "stream error")
            )
          );
          emitLog("upstream-error", {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            tool_calls: toolCallNames,
          });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      // Consumer (our Response stream) was canceled — cascade to Ollama.
      safeAbort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

function safeJson(s: string): Record<string, unknown> | null {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * Validate a tool call emitted by Ollama against the shared Zod
 * schemas in lib/tools.ts. Unknown tool names are rejected; args that
 * don't match the schema are rejected.
 *
 * Prevents pathological inputs like showProject({id: "../../etc/passwd"})
 * from reaching the client store.
 */
type ValidatedToolCall =
  | { ok: true; name: ToolName; args: Record<string, unknown> }
  | { ok: false; error: string };

function validateToolCall(
  rawName: string,
  rawArgs: Record<string, unknown> | null
): ValidatedToolCall {
  // Is the name one of the known tools?
  if (!(rawName in toolSchemas)) {
    return { ok: false, error: `unknown tool "${rawName}"` };
  }
  const name = rawName as ToolName;
  const schema = toolSchemas[name];
  const parsed = schema.parameters.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.errors.map((e) => e.message).join("; "),
    };
  }
  return { ok: true, name, args: (parsed.data ?? {}) as Record<string, unknown> };
}

/**
 * One-shot retry without tools + no streaming. Short casual prompts
 * (like "wassup", "hi", "wth") sometimes make Qwen hang on tool-call
 * indecision and emit zero content. Removing tools from the payload
 * usually unblocks a snappy reply.
 */
async function retryWithoutTools(
  baseURL: string,
  apiKey: string | undefined,
  model: string,
  system: string,
  messages: ChatMessage[]
): Promise<string | null> {
  const params = MODEL_CONFIG.ollama;
  const body = {
    model,
    stream: false,
    think: false,
    options: {
      temperature: params.temperature,
      top_p: params.topP,
      num_predict: params.maxTokens,
    },
    messages: [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  try {
    const res = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { message?: { content?: string } };
    const text = json.message?.content?.trim();
    return text ? text : null;
  } catch (err) {
    console.error("[ollama] retry failed:", err);
    return null;
  }
}

// Rotating fallbacks — less jarring than the same string every time.
// All on-voice for the persona so failures feel like a quirk, not a bug.
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

function jsonError(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

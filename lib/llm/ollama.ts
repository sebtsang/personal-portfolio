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

import type { ChatMessage } from "./index";
import { projects } from "@/content/projects";

/**
 * Base URL for the Ollama server.
 * - Local daemon:  http://localhost:11434 (default)
 * - Ollama Cloud:  https://ollama.com
 */
function resolveBaseURL(): string {
  if (process.env.OLLAMA_BASE_URL) return process.env.OLLAMA_BASE_URL;
  // If the user set an API key without a base URL, assume they want the cloud.
  if (process.env.OLLAMA_API_KEY) return "https://ollama.com";
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
      name: "showProjects",
      description:
        "Display a grid of all Sebastian's projects on the stage. Call when the user asks to see projects, work, or portfolio.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "showProject",
      description:
        "Display the detail view for a single project. Call when the user asks about a specific project by name.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            enum: projects.map((p) => p.id),
            description: "Project id.",
          },
        },
        required: ["id"],
      },
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
      name: "showResume",
      description:
        "Display a full formatted resume view. Call when the user asks for a resume or CV.",
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
];

function encode(code: string, payload: unknown): string {
  return `${code}:${JSON.stringify(payload)}\n`;
}

export async function streamOllama({
  messages,
  system,
  model,
}: {
  messages: ChatMessage[];
  system: string;
  model: string;
}): Promise<Response> {
  const baseURL = resolveBaseURL();
  const apiKey = process.env.OLLAMA_API_KEY;

  const ollamaBody = {
    model,
    stream: true,
    think: false,
    options: {
      temperature: 0.85,
      // Cap at 180 — witty replies are under 50 tokens, 180 is plenty
      // of headroom, and when the model goes off-track this caps dead
      // time at ~6-7s instead of 15s.
      num_predict: 180,
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

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(`${baseURL}/api/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify(ollamaBody),
    });
  } catch (err) {
    console.error("[ollama] Fetch failed:", err);
    return jsonError(
      503,
      `Couldn't reach Ollama at ${baseURL}. Is it running? (ollama serve, or check OLLAMA_API_KEY for cloud).`
    );
  }

  if (!ollamaRes.ok || !ollamaRes.body) {
    const text = await ollamaRes.text().catch(() => "");
    console.error(`[ollama] ${ollamaRes.status}:`, text);
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
              controller.enqueue(encoder.encode(encode("0", text)));
            }

            // Keep the latest thinking snippet so we can surface it as a
            // fallback if content never arrives.
            if (chunk.message?.thinking) {
              latestThinking = chunk.message.thinking;
            }

            const toolCalls = chunk.message?.tool_calls;
            if (toolCalls?.length) {
              for (const tc of toolCalls) {
                const args =
                  typeof tc.function.arguments === "string"
                    ? safeJson(tc.function.arguments)
                    : tc.function.arguments;
                const toolCallId = `call_${crypto.randomUUID()}`;
                controller.enqueue(
                  encoder.encode(
                    encode("9", {
                      toolCallId,
                      toolName: tc.function.name,
                      args: args ?? {},
                    })
                  )
                );
                controller.enqueue(
                  encoder.encode(
                    encode("a", { toolCallId, result: { ok: true } })
                  )
                );
                emittedToolCall = true;
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
                  controller.enqueue(encoder.encode(encode("0", retryText)));
                } else {
                  console.warn(
                    `[ollama] Retry also empty. Raw final chunk:`,
                    JSON.stringify(lastChunkRaw)
                  );
                  controller.enqueue(
                    encoder.encode(encode("0", pickFallback()))
                  );
                }
              }
              if (chunk.done_reason === "length") finishReason = "length";
              const usage = { promptTokens, completionTokens };
              controller.enqueue(
                encoder.encode(
                  encode("e", { finishReason, usage, isContinued: false })
                )
              );
              controller.enqueue(
                encoder.encode(encode("d", { finishReason, usage }))
              );
            }
          }
        }
      } catch (err) {
        console.error("[ollama] Stream error:", err);
        controller.enqueue(
          encoder.encode(
            encode("3", err instanceof Error ? err.message : "stream error")
          )
        );
      } finally {
        controller.close();
      }
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
  const body = {
    model,
    stream: false,
    think: false,
    options: { temperature: 0.85, num_predict: 180 },
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

import { SYSTEM_PROMPT } from "@/lib/persona";
import { projects } from "@/content/projects";

// Node runtime, not Edge — we hit a local Ollama daemon.
export const runtime = "nodejs";
export const maxDuration = 60;

// Local Ollama native API. Override with OLLAMA_BASE_URL if needed.
// NOTE: only works when `npm run dev` runs on the same machine as Ollama.
// For Vercel deploys, expose Ollama via a Cloudflare Tunnel and set
// OLLAMA_BASE_URL to the tunnel URL.
const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";

// Primary model. Swap by changing this one string.
//   - "qwen3.5:cloud"       (current — fast, witty, ~1-2s replies)
//   - "glm-5.1:cloud"       (stronger tool calling, slightly slower)
//   - "minimax-m2.7:cloud"  (most sophisticated, but heavy reasoning)
//   - "gemma4:e4b"          (local, snappy, less clever)
const MODEL_ID = "qwen3.5:cloud";

/**
 * Ollama tool definitions — mirror lib/tools.ts but in OpenAI-function
 * JSON Schema form that Ollama's /api/chat expects.
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

type ClientMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/**
 * AI SDK v4 data stream protocol encoder. Each output line is:
 *   <code>:<json>\n
 * Code reference: https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol
 */
function encode(code: string, payload: unknown): string {
  return `${code}:${JSON.stringify(payload)}\n`;
}

export async function POST(req: Request) {
  const body = (await req.json()) as { messages: ClientMessage[] };
  const messages = body.messages ?? [];

  // Build Ollama request. `think: false` is critical — without it,
  // reasoning models burn 500+ tokens thinking before any output.
  const ollamaBody = {
    model: MODEL_ID,
    stream: true,
    think: false,
    options: {
      temperature: 0.85,
      num_predict: 400,
    },
    tools: OLLAMA_TOOLS,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
  };

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ollamaBody),
    });
  } catch (err) {
    console.error("[chat] Fetch to Ollama failed:", err);
    return new Response(
      JSON.stringify({
        error:
          "Couldn't reach Ollama at " +
          OLLAMA_BASE_URL +
          ". Is it running? (ollama serve). Quick commands still work.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!ollamaRes.ok || !ollamaRes.body) {
    const text = await ollamaRes.text().catch(() => "");
    console.error(`[chat] Ollama returned ${ollamaRes.status}:`, text);
    return new Response(
      JSON.stringify({
        error: `Ollama returned ${ollamaRes.status}. Model "${MODEL_ID}" may not be pulled — try \`ollama pull ${MODEL_ID}\`.`,
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // Transform Ollama's newline-delimited JSON stream into AI SDK data
  // stream protocol that useChat can consume.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = ollamaRes.body!.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();
      let buffer = "";
      let promptTokens = 0;
      let completionTokens = 0;
      let finishReason: "stop" | "length" | "tool-calls" | "unknown" = "stop";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // Ollama emits one JSON object per line.
          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIdx).trim();
            buffer = buffer.slice(newlineIdx + 1);
            if (!line) continue;

            let chunk: {
              message?: {
                content?: string;
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

            // Text delta
            const text = chunk.message?.content;
            if (text) {
              controller.enqueue(encoder.encode(encode("0", text)));
            }

            // Tool calls — Ollama typically emits them on the final
            // chunk (done: true) with the full args.
            const toolCalls = chunk.message?.tool_calls;
            if (toolCalls && toolCalls.length) {
              for (const tc of toolCalls) {
                const args =
                  typeof tc.function.arguments === "string"
                    ? safeJson(tc.function.arguments)
                    : tc.function.arguments;
                const toolCallId = `call_${crypto.randomUUID()}`;
                // `9:` = tool-call on AI SDK v4 data stream protocol
                controller.enqueue(
                  encoder.encode(
                    encode("9", {
                      toolCallId,
                      toolName: tc.function.name,
                      args: args ?? {},
                    })
                  )
                );
                // Immediately emit a synthetic tool result so the
                // AI SDK client marks the invocation as complete.
                controller.enqueue(
                  encoder.encode(
                    encode("a", {
                      toolCallId,
                      result: { ok: true },
                    })
                  )
                );
                finishReason = "tool-calls";
              }
            }

            if (typeof chunk.prompt_eval_count === "number")
              promptTokens = chunk.prompt_eval_count;
            if (typeof chunk.eval_count === "number")
              completionTokens = chunk.eval_count;

            if (chunk.done) {
              if (chunk.done_reason === "length") finishReason = "length";
              const usage = { promptTokens, completionTokens };
              // `e:` = finish-step, `d:` = finish-message
              controller.enqueue(
                encoder.encode(
                  encode("e", {
                    finishReason,
                    usage,
                    isContinued: false,
                  })
                )
              );
              controller.enqueue(
                encoder.encode(encode("d", { finishReason, usage }))
              );
            }
          }
        }
      } catch (err) {
        console.error("[chat] Stream error:", err);
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

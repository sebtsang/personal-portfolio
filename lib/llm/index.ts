/**
 * LLM provider abstraction.
 *
 * Flip between providers by setting LLM_PROVIDER in .env.local:
 *   LLM_PROVIDER=ollama   (default — local daemon OR Ollama Cloud API)
 *   LLM_PROVIDER=claude
 *   LLM_PROVIDER=openai
 *
 * Override the model with LLM_MODEL. Each provider ships a sensible
 * default if LLM_MODEL isn't set.
 *
 * The system prompt is assembled here via buildSystemPrompt(provider)
 * so callers don't need to know about the prompt structure.
 */

import { buildSystemPrompt } from "./prompt";
import { streamOllama } from "./ollama";
import { streamClaude } from "./claude";
import { streamOpenAI } from "./openai";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

/** Metadata threaded from the route to the provider for log emission. */
export type LogContext = {
  startedAt: number;
  ipHash: string;
  feedbackFlag?: true;
};

export type ChatRequest = {
  messages: ChatMessage[];
  signal?: AbortSignal;
  logContext?: LogContext;
};

export type LLMProvider = "ollama" | "claude" | "openai";

const PROVIDER = (process.env.LLM_PROVIDER ?? "ollama") as LLMProvider;

const DEFAULT_MODELS: Record<LLMProvider, string> = {
  ollama: "qwen3.5:cloud",
  claude: "claude-haiku-4-5-20251001",
  openai: "gpt-4.1-mini",
};

export function currentConfig() {
  return {
    provider: PROVIDER,
    model: process.env.LLM_MODEL ?? DEFAULT_MODELS[PROVIDER],
  };
}

export async function streamChat(req: ChatRequest): Promise<Response> {
  const model = process.env.LLM_MODEL ?? DEFAULT_MODELS[PROVIDER];
  const system = buildSystemPrompt(PROVIDER);

  switch (PROVIDER) {
    case "ollama":
      return streamOllama({ ...req, system, model });
    case "claude":
      return streamClaude({ ...req, system, model });
    case "openai":
      return streamOpenAI({ ...req, system, model });
    default:
      return new Response(
        JSON.stringify({
          error: `Unknown LLM_PROVIDER "${PROVIDER}". Use ollama, claude, or openai.`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
  }
}

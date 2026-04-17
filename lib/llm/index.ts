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
 */

import { streamOllama } from "./ollama";
import { streamClaude } from "./claude";
import { streamOpenAI } from "./openai";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export type ChatRequest = {
  messages: ChatMessage[];
  system: string;
  signal?: AbortSignal;
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

  switch (PROVIDER) {
    case "ollama":
      return streamOllama({ ...req, model });
    case "claude":
      return streamClaude({ ...req, model });
    case "openai":
      return streamOpenAI({ ...req, model });
    default:
      return new Response(
        JSON.stringify({
          error: `Unknown LLM_PROVIDER "${PROVIDER}". Use ollama, claude, or openai.`,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
  }
}

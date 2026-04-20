/**
 * Per-provider generation parameters.
 *
 * Centralizes temperature / top_p / max_tokens so magic numbers don't
 * drift across provider files. Values tuned empirically for the
 * persona's voice on each model.
 */

import type { LLMProvider } from "./index";

export type ModelParams = {
  /** 0-2 for OpenAI / Claude, 0-2 for Ollama (native API). */
  temperature: number;
  /** 0-1. 1.0 = consider all tokens. Lower = more focused. */
  topP: number;
  /** Max tokens to generate in the completion. */
  maxTokens: number;
};

export const MODEL_CONFIG: Record<LLMProvider, ModelParams> = {
  ollama: {
    // Reasoning-adjacent models (Qwen/GLM/MiniMax) hit num_predict fast
    // when they stall on tool indecision. 180 caps that dead time at
    // ~6-7s. Our no-tools retry path covers the rest.
    temperature: 0.85,
    topP: 0.95,
    maxTokens: 180,
  },
  claude: {
    // Claude defaults toward verbose + helpful. Dialing temp down helps
    // match the terse few-shot examples.
    temperature: 0.75,
    topP: 0.95,
    maxTokens: 400,
  },
  openai: {
    // GPT needs a nudge to commit to humor over helpful. Higher temp
    // pulls it toward the jokier end of the distribution.
    temperature: 0.9,
    topP: 1.0,
    maxTokens: 400,
  },
};

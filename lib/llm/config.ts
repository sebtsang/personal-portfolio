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
    // 250 chosen for gpt-oss:120b-cloud (current default). Previous 180
    // was tuned for qwen3.5:cloud's reasoning-spiral failure mode —
    // gpt-oss is less prone to that and was hitting the cap on legitimate
    // substantive answers, producing mid-sentence truncations like
    // "Probably the Interac stint where he" <EOF>. 250 gives ~190 words
    // of room — enough for a two-breath answer without letting the bot
    // drift verbose. Empty-reply retry path still covers the rare
    // CoT-burn case. If you swap back to qwen/GLM/MiniMax, drop to 180.
    temperature: 0.85,
    topP: 0.95,
    maxTokens: 250,
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
  github: {
    // GitHub Models via OpenAI-compatible endpoint — same default
    // characteristics as direct OpenAI but lower maxTokens because
    // GitHub's free tier has a per-minute token budget you'll blow
    // through fast if every response is 400 tokens. 250 balances
    // "long enough for real answers" with "not wasting budget."
    // Bump up if you switch to the paid tier.
    temperature: 0.85,
    topP: 1.0,
    maxTokens: 250,
  },
};

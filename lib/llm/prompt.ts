/**
 * System-prompt assembly.
 *
 * Composes the final system message from three sources:
 *   1. lib/persona/voice.ts          — stable voice rules + few-shot
 *   2. lib/persona/overrides/<p>.ts  — per-provider nudges
 *   3. content/corpus/*.md           — prose reference material
 *
 * Result is memoized per-provider so we read the markdown files once
 * per process (not once per request).
 *
 * CORPUS BUDGET WARNING: console.warn at module load if the assembled
 * prompt exceeds CORPUS_WARN_TOKENS, so runaway corpus growth is caught
 * early.
 *
 * The old threshold (9000) was justified by "the small models' context
 * window" — that rationale is dead. Every configured default now has at
 * least a 128k window (gpt-oss:120b 128k, Claude Haiku 4.5 200k,
 * gpt-4.1-mini 1M), so a 9k prompt is ~7% of the smallest one and the
 * context window is nowhere near the binding constraint.
 *
 * What actually binds is MAX_TOTAL_TOKENS in lib/validation.ts (30000),
 * which covers system prompt + conversation history. The warning is set
 * to leave comfortable room for history under that ceiling: at 20k the
 * prompt would still leave ~10k for the conversation, which is more
 * than MAX_MESSAGES_PER_REQUEST x MAX_MESSAGE_CHARS can realistically
 * produce.
 *
 * Retrieval is NOT the answer if this trips. Published guidance puts the
 * stuff-vs-retrieve crossover around ~50k tokens, and more importantly
 * most of this corpus is unconditional behavioural rules (never mention
 * GPA, never share phone, the project deflection) rather than lookup
 * facts — similarity search would drop exactly the parts that must be
 * present on every request. If this warning fires, dedupe first.
 */

import fs from "node:fs";
import path from "node:path";
import { VOICE } from "@/lib/persona/voice";
import { override as ollamaOverride } from "@/lib/persona/overrides/ollama";
import { override as claudeOverride } from "@/lib/persona/overrides/claude";
import { override as openaiOverride } from "@/lib/persona/overrides/openai";
import { override as githubOverride } from "@/lib/persona/overrides/github";
import type { LLMProvider } from "@/lib/llm";

/** See the CORPUS BUDGET WARNING note at the top of this file. */
const CORPUS_WARN_TOKENS = 20000;

const CORPUS_DIR = path.join(process.cwd(), "content", "corpus");
const CORPUS_FILES = [
  "bio.md",
  "experience.md",
  "projects.md",
  "opinions.md",
  "taste.md",
  "quirks.md",
  "looking-for.md",
  "faq.md",
] as const;

const OVERRIDES: Record<LLMProvider, string> = {
  ollama: ollamaOverride,
  claude: claudeOverride,
  openai: openaiOverride,
  github: githubOverride,
};

// Memoized per-provider after first build.
const promptCache = new Map<LLMProvider, string>();

function loadCorpus(): string {
  const sections: string[] = [];
  for (const filename of CORPUS_FILES) {
    const filePath = path.join(CORPUS_DIR, filename);
    try {
      const raw = fs.readFileSync(filePath, "utf8").trim();
      if (raw) sections.push(raw);
    } catch (err) {
      // Missing corpus file is a bug — surface it loudly, don't silently
      // serve a lobotomized bot.
      console.error(`[prompt] Failed to read corpus file ${filePath}:`, err);
    }
  }
  return sections.join("\n\n---\n\n");
}

function buildForProvider(provider: LLMProvider): string {
  const parts = [VOICE.trim(), OVERRIDES[provider].trim()];
  const corpus = loadCorpus();
  if (corpus) parts.push("# Reference material\n\n" + corpus);
  const assembled = parts.filter(Boolean).join("\n\n");

  // ~1 token per 4 chars (rough English estimate — good enough for a warning threshold)
  const approxTokens = Math.round(assembled.length / 4);
  if (approxTokens > CORPUS_WARN_TOKENS) {
    console.warn(
      `[prompt] Assembled system prompt is ~${approxTokens} tokens ` +
        `(>${CORPUS_WARN_TOKENS}). Dedupe content/corpus/*.md — see the ` +
        `note at the top of this file before reaching for retrieval.`
    );
  }

  return assembled;
}

export function buildSystemPrompt(provider: LLMProvider): string {
  const cached = promptCache.get(provider);
  if (cached) return cached;
  const built = buildForProvider(provider);
  promptCache.set(provider, built);
  return built;
}

/**
 * Token count estimate for the assembled system prompt of a given
 * provider. Used for the budget check in lib/validation.ts.
 */
export function getSystemPromptTokens(provider: LLMProvider): number {
  return estimateTokens(buildSystemPrompt(provider));
}

/** Estimated token count (for logging). Cheap, rough, good enough. */
export function estimateTokens(text: string): number {
  return Math.round(text.length / 4);
}

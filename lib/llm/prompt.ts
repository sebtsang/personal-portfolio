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
 * CORPUS BUDGET WARNING: if the assembled prompt exceeds 5000 tokens
 * (~20,000 chars), console.warn at module load so you catch runaway
 * corpus growth before it hits prompt-cache thresholds or the small
 * models' context window.
 */

import fs from "node:fs";
import path from "node:path";
import { VOICE } from "@/lib/persona/voice";
import { override as ollamaOverride } from "@/lib/persona/overrides/ollama";
import { override as claudeOverride } from "@/lib/persona/overrides/claude";
import { override as openaiOverride } from "@/lib/persona/overrides/openai";
import type { LLMProvider } from "@/lib/llm";

const CORPUS_DIR = path.join(process.cwd(), "content", "corpus");
const CORPUS_FILES = ["bio.md", "experience.md", "projects.md", "opinions.md", "faq.md"] as const;

const OVERRIDES: Record<LLMProvider, string> = {
  ollama: ollamaOverride,
  claude: claudeOverride,
  openai: openaiOverride,
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
  if (approxTokens > 5000) {
    console.warn(
      `[prompt] Assembled system prompt is ~${approxTokens} tokens (>5000). ` +
        `Consider trimming content/corpus/*.md or moving to retrieval.`
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

/** Estimated token count (for logging). Cheap, rough, good enough. */
export function estimateTokens(text: string): number {
  return Math.round(text.length / 4);
}

/**
 * TOOL REGISTRY — SCAFFOLD ONLY (see plan §7, DEFERRED).
 *
 * Per the hardening plan, this will become the single source of truth
 * for tool definitions. Today, tools are defined in three places:
 *
 *   1. lib/tools.ts         — Zod schemas (Claude/OpenAI paths)
 *   2. lib/llm/ollama.ts    — OLLAMA_TOOLS JSON Schema (Ollama path)
 *   3. lib/intents.ts       — regex matchers + canned replies (frontend)
 *
 * TARGET STATE:
 *   One file per tool under lib/tools/<name>.ts (each exports a single
 *   ToolDefinition). This index.ts exports:
 *     - ALL_TOOLS                     — array of ToolDefinition
 *     - ToolName                      — union type derived from registry
 *     - getLLMSchemas()               — AI SDK shape { [name]: tool({...}) }
 *     - getOllamaSchemas()            — native Ollama JSON Schema array
 *     - matchIntent(message)          — runs regex against ALL_TOOLS
 *     - dispatchByName(name, args)    — validates via Zod + returns view
 *
 * Callers consume from here:
 *     - lib/llm/claude.ts / openai.ts     → getLLMSchemas()
 *     - lib/llm/ollama.ts                  → getOllamaSchemas()
 *     - lib/store.ts dispatchTool          → dispatchByName()
 *     - components/chat/ChatShell.tsx      → matchIntent()
 *
 * DEFERRED because the new chat UI may change intent-matching
 * requirements (looser matching, richer reply surfaces). Migrate
 * once the UI stabilizes. Until then, the three existing sources of
 * truth continue working.
 */

import type { z } from "zod";
import type { StageView } from "@/lib/store";

/**
 * Full contract for a single tool. Same shape will be used for all 6
 * existing tools plus any future additions.
 */
export type ToolDefinition<
  P extends z.ZodTypeAny = z.ZodTypeAny,
> = {
  /** Unique tool name. Becomes the key in LLM tool schemas. */
  name: string;
  /** Shown to the LLM to explain when to call this tool. */
  description: string;
  /** Zod schema for the tool's arguments. `z.object({})` for no-args. */
  parameters: P;
  /** Regex alternates for the frontend intent matcher. */
  intents: RegExp[];
  /** Canned assistant reply when the frontend intent matcher fires. */
  intentReply: string;
  /**
   * Returns the Zustand StageView mutation for this tool. Called from
   * both the frontend (after intent match) and the backend (after
   * LLM tool call + validation).
   */
  dispatch: (args: z.infer<P>) => StageView;
};

/**
 * Builder helper for declaring a tool. Preserves generic types so
 * `dispatch(args)` is typed by the `parameters` schema.
 */
export function defineTool<P extends z.ZodTypeAny>(
  def: ToolDefinition<P>
): ToolDefinition<P> {
  return def;
}

/**
 * Exported interface (unimplemented until the migration lands).
 * Callers that import these today will get TypeScript errors — that's
 * the reminder to complete the migration.
 */
export const ALL_TOOLS: ReadonlyArray<ToolDefinition> = [];
export type ToolName = never;

export function getLLMSchemas(): Record<string, unknown> {
  throw new Error(
    "[tools] Registry not implemented. See lib/tools/index.ts comment."
  );
}

export function getOllamaSchemas(): unknown[] {
  throw new Error(
    "[tools] Registry not implemented. See lib/tools/index.ts comment."
  );
}

export function matchIntent(_message: string): ToolDefinition | null {
  throw new Error(
    "[tools] Registry not implemented. See lib/tools/index.ts comment."
  );
}

export function dispatchByName(_name: string, _args: unknown): StageView {
  throw new Error(
    "[tools] Registry not implemented. See lib/tools/index.ts comment."
  );
}

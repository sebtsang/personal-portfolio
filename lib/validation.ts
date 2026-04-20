/**
 * Request validation for /api/chat.
 *
 * Rejects:
 * - malformed bodies (not JSON, not the expected shape)
 * - too many messages per request (>30, which = 15 conversational turns)
 * - messages too long (>2000 chars — longest reasonable question <500)
 * - messages with empty content
 * - role: "system" from clients (that's ours to inject, not theirs)
 * - garbage content (see lib/sanitize.ts)
 * - total prompt budget blown (> ~10000 tokens system + history)
 */

import { z } from "zod";
import { isLikelyGarbage } from "./sanitize";
import { estimateTokens } from "./llm/prompt";

export const MAX_MESSAGE_CHARS = 2000;
export const MAX_MESSAGES_PER_REQUEST = 30;
export const MAX_TOTAL_TOKENS = 10000;

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z
    .string()
    .min(1, "Message cannot be empty.")
    .max(MAX_MESSAGE_CHARS, `Message exceeds ${MAX_MESSAGE_CHARS} characters.`)
    .refine((c) => !isLikelyGarbage(c), {
      message: "Message content looks malformed.",
    }),
});

export const ChatRequestSchema = z.object({
  messages: z
    .array(ChatMessageSchema)
    .min(1, "At least one message is required.")
    .max(
      MAX_MESSAGES_PER_REQUEST,
      `Conversation exceeds ${MAX_MESSAGES_PER_REQUEST} messages.`
    ),
});

export type ValidatedMessages = z.infer<typeof ChatRequestSchema>["messages"];

export type ValidationResult =
  | { ok: true; messages: ValidatedMessages }
  | { ok: false; status: number; error: string };

/**
 * Validate + budget-check. Returns discriminated union so callers can
 * branch without try/catch.
 */
export function validateChatRequest(
  body: unknown,
  systemPromptTokens: number
): ValidationResult {
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      error: parsed.error.errors
        .map((e) => `${e.path.join(".") || "body"}: ${e.message}`)
        .join("; "),
    };
  }

  // Total prompt budget check: system + all messages.
  const messageTokens = parsed.data.messages.reduce(
    (sum, m) => sum + estimateTokens(m.content),
    0
  );
  if (systemPromptTokens + messageTokens > MAX_TOTAL_TOKENS) {
    return {
      ok: false,
      status: 413,
      error: `Prompt budget exceeded (${systemPromptTokens + messageTokens} > ${MAX_TOTAL_TOKENS} tokens).`,
    };
  }

  return { ok: true, messages: parsed.data.messages };
}

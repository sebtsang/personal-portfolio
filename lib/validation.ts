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
 * - total prompt budget blown (see MAX_TOTAL_TOKENS)
 */

import { z } from "zod";
import { isLikelyGarbage } from "./sanitize";
import { estimateTokens } from "./llm/prompt";

export const MAX_MESSAGE_CHARS = 2000;
export const MAX_MESSAGES_PER_REQUEST = 30;
/**
 * Ceiling on system prompt + conversation history, in estimated tokens.
 *
 * Was 12000, which was picked when the corpus was small and the
 * configured models were assumed to have tight context windows. Neither
 * holds: the system prompt now sits around 8.5-9k, and every configured
 * default model has at least a 128k window (gpt-oss:120b 128k, Claude
 * Haiku 4.5 200k, gpt-4.1-mini 1M). At 12000 the corpus was crowding
 * out conversation history and a long chat would have 413'd for no
 * reason the model actually cared about.
 *
 * 30000 is still a hard ceiling, not an invitation: MAX_MESSAGES_PER_
 * REQUEST (30) x MAX_MESSAGE_CHARS (2000) already bounds history at
 * ~15k tokens, so system + history can't realistically exceed ~24k.
 * This constant is the backstop for a pathological request, not the
 * thing shaping normal conversations.
 */
export const MAX_TOTAL_TOKENS = 30000;

/**
 * Per-role schema. Assistant messages are allowed to have empty content
 * because tool-calling models sometimes emit a tool call with no text
 * preceding it — useChat then stores that assistant turn with
 * `content: ""` and sends it back in history on the next request. If we
 * hard-rejected empty content, the bot would 400 itself on any follow-up
 * after a silent tool call. User content must still be non-empty.
 */
export const ChatMessageSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("user"),
    content: z
      .string()
      .min(1, "Message cannot be empty.")
      .max(MAX_MESSAGE_CHARS, `Message exceeds ${MAX_MESSAGE_CHARS} characters.`)
      .refine((c) => !isLikelyGarbage(c), {
        message: "Message content looks malformed.",
      }),
  }),
  z.object({
    role: z.literal("assistant"),
    content: z
      .string()
      .max(MAX_MESSAGE_CHARS, `Message exceeds ${MAX_MESSAGE_CHARS} characters.`),
  }),
]);

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

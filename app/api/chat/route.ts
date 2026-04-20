import { streamChat, currentConfig } from "@/lib/llm";
import { getSystemPromptTokens } from "@/lib/llm/prompt";
import { validateChatRequest } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * All provider-specific logic lives in lib/llm/*. This route:
 *   1. parses + validates the request body (Zod + garbage heuristics)
 *   2. budget-checks system prompt + history token count
 *   3. delegates to streamChat() for the provider dispatch
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body.");
  }

  const { provider } = currentConfig();
  const validation = validateChatRequest(body, getSystemPromptTokens(provider));
  if (!validation.ok) {
    return jsonError(validation.status, validation.error);
  }

  return streamChat({
    messages: validation.messages,
    // Cascade client disconnects all the way down to the Ollama fetch.
    signal: req.signal,
  });
}

function jsonError(status: number, error: string) {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

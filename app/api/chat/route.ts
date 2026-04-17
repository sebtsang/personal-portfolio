import { streamChat } from "@/lib/llm";
import { SYSTEM_PROMPT } from "@/lib/persona";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * All provider-specific logic lives in lib/llm/*. This route just
 * marshals the request and delegates to whichever provider is
 * configured via LLM_PROVIDER.
 */
export async function POST(req: Request) {
  const { messages } = await req.json();
  return streamChat({
    messages: messages ?? [],
    system: SYSTEM_PROMPT,
    // Cascade client disconnects all the way down to the Ollama fetch.
    signal: req.signal,
  });
}

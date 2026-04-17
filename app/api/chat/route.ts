import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { streamText, tool } from "ai";
import { SYSTEM_PROMPT } from "@/lib/persona";
import { toolSchemas } from "@/lib/tools";

export const runtime = "edge";
export const maxDuration = 30;

// Ollama Cloud exposes an OpenAI-compatible endpoint.
// Docs: https://ollama.com/ (see "API keys" in your Ollama account settings)
const ollama = createOpenAICompatible({
  name: "ollama-cloud",
  baseURL: "https://ollama.com/v1",
  apiKey: process.env.OLLAMA_API_KEY,
});

// Model picked by Sebastian — agentic-tuned, strong tool calling.
const MODEL_ID = "minimax-m2.7:cloud";

export async function POST(req: Request) {
  if (!process.env.OLLAMA_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "OLLAMA_API_KEY not set. Quick commands still work — free-form chat needs the key.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages } = await req.json();

  const result = streamText({
    model: ollama(MODEL_ID),
    system: SYSTEM_PROMPT,
    messages,
    maxTokens: 400,
    temperature: 0.7,
    tools: {
      showProjects: tool({
        description: toolSchemas.showProjects.description,
        parameters: toolSchemas.showProjects.parameters,
        execute: async () => ({ ok: true }),
      }),
      showProject: tool({
        description: toolSchemas.showProject.description,
        parameters: toolSchemas.showProject.parameters,
        execute: async ({ id }) => ({ ok: true, id }),
      }),
      showExperience: tool({
        description: toolSchemas.showExperience.description,
        parameters: toolSchemas.showExperience.parameters,
        execute: async () => ({ ok: true }),
      }),
      showResume: tool({
        description: toolSchemas.showResume.description,
        parameters: toolSchemas.showResume.parameters,
        execute: async () => ({ ok: true }),
      }),
      showContact: tool({
        description: toolSchemas.showContact.description,
        parameters: toolSchemas.showContact.parameters,
        execute: async () => ({ ok: true }),
      }),
    },
  });

  return result.toDataStreamResponse();
}

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import { SYSTEM_PROMPT } from "@/lib/persona";
import { toolSchemas } from "@/lib/tools";

export const runtime = "edge";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: SYSTEM_PROMPT,
    messages,
    maxTokens: 400,
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

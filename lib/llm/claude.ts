/**
 * Claude provider via Anthropic API. Uses the Vercel AI SDK for
 * streaming + tool calling.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import type { ChatMessage } from "./index";
import { toolSchemas } from "@/lib/tools";

export async function streamClaude({
  messages,
  system,
  model,
}: {
  messages: ChatMessage[];
  system: string;
  model: string;
}): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "ANTHROPIC_API_KEY not set. Either set it in .env.local or switch LLM_PROVIDER.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const result = streamText({
      model: anthropic(model),
      system,
      messages: messages.filter(
        (m): m is ChatMessage & { role: "user" | "assistant" } =>
          m.role !== "system"
      ),
      maxTokens: 400,
      temperature: 0.85,
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
      onError: (err) => {
        console.error("[claude] stream error:", err);
      },
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error("[claude] fatal:", err);
    return new Response(
      JSON.stringify({ error: "Claude request failed. See server logs." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

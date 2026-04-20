/**
 * Claude provider via Anthropic API. Uses the Vercel AI SDK for
 * streaming + tool calling.
 */

import { anthropic } from "@ai-sdk/anthropic";
import { streamText, tool } from "ai";
import type { ChatMessage, LogContext } from "./index";
import { MODEL_CONFIG } from "./config";
import { toolSchemas } from "@/lib/tools";
import { logChat, type LogStatus } from "@/lib/logger";

export async function streamClaude({
  messages,
  system,
  model,
  logContext,
}: {
  messages: ChatMessage[];
  system: string;
  model: string;
  logContext?: LogContext;
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

  const params = MODEL_CONFIG.claude;
  const emitLog = (
    status: LogStatus,
    opts: {
      prompt_tokens?: number;
      completion_tokens?: number;
      tool_calls?: string[];
    } = {}
  ) => {
    if (!logContext) return;
    logChat({
      ts: logContext.startedAt,
      ip_hash: logContext.ipHash,
      provider: "claude",
      model,
      prompt_tokens: opts.prompt_tokens,
      completion_tokens: opts.completion_tokens,
      tool_calls: opts.tool_calls ?? [],
      latency_ms: Date.now() - logContext.startedAt,
      status,
      feedback_flag: logContext.feedbackFlag,
    });
  };

  try {
    const result = streamText({
      model: anthropic(model),
      system,
      messages: messages.filter(
        (m): m is ChatMessage & { role: "user" | "assistant" } =>
          m.role !== "system"
      ),
      maxTokens: params.maxTokens,
      temperature: params.temperature,
      topP: params.topP,
      maxSteps: 1,
      tools: {
        showAbout: tool({
          description: toolSchemas.showAbout.description,
          parameters: toolSchemas.showAbout.parameters,
          execute: async () => ({ ok: true }),
        }),
        showExperience: tool({
          description: toolSchemas.showExperience.description,
          parameters: toolSchemas.showExperience.parameters,
          execute: async () => ({ ok: true }),
        }),
        showContact: tool({
          description: toolSchemas.showContact.description,
          parameters: toolSchemas.showContact.parameters,
          execute: async () => ({ ok: true }),
        }),
        showLinkedIn: tool({
          description: toolSchemas.showLinkedIn.description,
          parameters: toolSchemas.showLinkedIn.parameters,
          execute: async () => ({ ok: true }),
        }),
      },
      onError: (err) => {
        console.error("[claude] stream error:", err);
        emitLog("upstream-error");
      },
      onFinish: (event) => {
        emitLog("ok", {
          prompt_tokens: event.usage?.promptTokens,
          completion_tokens: event.usage?.completionTokens,
          tool_calls: (event.toolCalls ?? []).map((t) => t.toolName),
        });
      },
    });

    return result.toDataStreamResponse();
  } catch (err) {
    console.error("[claude] fatal:", err);
    emitLog("upstream-error");
    return new Response(
      JSON.stringify({ error: "Claude request failed. See server logs." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

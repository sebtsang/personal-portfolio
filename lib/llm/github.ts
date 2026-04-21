/**
 * GitHub Models provider — OpenAI-compatible inference endpoint served
 * by GitHub. Any GitHub account gets a free rate-limited tier without
 * a Copilot subscription; a fine-grained PAT with "Models: read"
 * permission is all that's needed.
 *
 * Endpoint: https://models.github.ai/inference (append /chat/completions
 * via the AI SDK's OpenAI provider, which handles the suffix).
 * Auth:     Authorization: Bearer <GITHUB_TOKEN>
 * Models:   namespaced, e.g. "openai/gpt-4.1-mini", "openai/o4-mini",
 *           "meta/meta-llama-3.3-70b-instruct", "deepseek/DeepSeek-V3-0324".
 *
 * Used via LLM_PROVIDER=github. Also works as a fallback target —
 * see lib/llm/index.ts for LLM_FALLBACK_PROVIDER.
 */

import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool } from "ai";
import type { ChatMessage, LogContext } from "./index";
import { MODEL_CONFIG } from "./config";
import { toolSchemas } from "@/lib/tools";
import { logChat, type LogStatus } from "@/lib/logger";

/**
 * Factory — one client per process, cached lazily. createOpenAI needs
 * the token at creation, and process.env.GITHUB_TOKEN may not be set
 * at module-load time in all runtimes (edge, preview), so defer.
 */
function getClient() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  return createOpenAI({
    baseURL: "https://models.github.ai/inference",
    apiKey: token,
  });
}

export async function streamGitHub({
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
  const client = getClient();
  if (!client) {
    return new Response(
      JSON.stringify({
        error:
          "GITHUB_TOKEN not set. Generate a fine-grained PAT at " +
          "github.com/settings/personal-access-tokens with 'Models: read' " +
          "permission and set it in .env.local (or Vercel env vars). " +
          "Or switch LLM_PROVIDER.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const params = MODEL_CONFIG.github;
  const emitLog = (
    status: LogStatus,
    opts: {
      prompt_tokens?: number;
      completion_tokens?: number;
      tool_calls?: string[];
    } = {}
  ) => {
    const latencyMs = Date.now() - (logContext?.startedAt ?? Date.now());
    const pt = opts.prompt_tokens ?? 0;
    const ct = opts.completion_tokens ?? 0;
    const tc = opts.tool_calls?.length
      ? ` tools=[${opts.tool_calls.join(",")}]`
      : "";
    console.log(
      `[github] ${model} ${status} prompt=${pt} completion=${ct} total=${pt + ct} latency=${latencyMs}ms${tc}`
    );
    if (!logContext) return;
    logChat({
      ts: logContext.startedAt,
      ip_hash: logContext.ipHash,
      provider: "github",
      model,
      prompt_tokens: opts.prompt_tokens,
      completion_tokens: opts.completion_tokens,
      tool_calls: opts.tool_calls ?? [],
      latency_ms: latencyMs,
      status,
      feedback_flag: logContext.feedbackFlag,
    });
  };

  try {
    const result = streamText({
      model: client(model),
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
        console.error("[github] stream error:", err);
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
    console.error("[github] fatal:", err);
    emitLog("upstream-error");
    return new Response(
      JSON.stringify({
        error: "GitHub Models request failed. See server logs.",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}

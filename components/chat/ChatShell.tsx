"use client";

import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { matchIntent } from "@/lib/intents";
import { useStageStore } from "@/lib/store";
import type { ToolName } from "@/lib/tools";
import { ChatPanel } from "./ChatPanel";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";
import { StageFrame } from "@/components/stage/StageFrame";
import { profile } from "@/content/site";

const WELCOME_BUBBLE = `Welcome to Seb's site.`;

const INTRO_BUBBLE = `Quick briefing: CS at Guelph, Toronto-based. Did time at Interac and BMO, incoming at EY on the AI & Data team. Builds AI workflows that usually work. There's a 90% chance he'll smoke you at basketball.`;

const CTA_BUBBLE = `Ask anything. Fair warning: I will gently roast you if you open with "tell me about yourself."`;

type LocalMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function ChatShell() {
  const view = useStageStore((s) => s.view);
  const setView = useStageStore((s) => s.setView);
  const dispatchTool = useStageStore((s) => s.dispatchTool);
  const isHome = view.kind === "empty";

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [seedMessages] = useState<LocalMessage[]>([
    { id: "greeting-welcome", role: "assistant", content: WELCOME_BUBBLE },
    { id: "greeting-intro", role: "assistant", content: INTRO_BUBBLE },
    { id: "greeting-cta", role: "assistant", content: CTA_BUBBLE },
  ]);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);

  const {
    messages: aiMessages,
    input,
    handleInputChange,
    append,
    isLoading,
    setInput,
    error,
    reload,
    stop,
  } = useChat({
    api: "/api/chat",
    onToolCall: ({ toolCall }) => {
      dispatchTool(
        toolCall.toolName as ToolName,
        toolCall.args as Record<string, unknown>
      );
    },
    onError: (err) => {
      // Surfaces in the server log and the retry UI below.
      console.error("[chat] request failed:", err);
    },
  });

  // Warmup ping — fires once on mount. Ollama Cloud cold-starts can
  // take 20-30s, which makes the first real prompt feel broken. This
  // lets the model complete generation in the background while the
  // user reads the greeting bubbles, so the first real prompt is snappy.
  //
  // IMPORTANT: we must fully drain the stream — canceling it mid-flight
  // aborts the upstream Ollama generation and defeats the warmup. We
  // consume and discard the bytes.
  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [{ role: "user", content: "hi" }],
          }),
          signal: controller.signal,
        });
        if (!res.body) return;
        const reader = res.body.getReader();
        // Drain without processing so the upstream generation completes.
        while (true) {
          const { done } = await reader.read();
          if (done) break;
        }
      } catch {
        /* cold-start may reject or abort — harmless */
      }
    })();
    return () => controller.abort();
  }, []);

  const displayMessages = useMemo(() => {
    const mapped = aiMessages
      // Drop assistant messages that have no text AND no tool calls —
      // happens when the model returns empty content and no invocation,
      // which would otherwise render a blank bubble.
      .filter(
        (m) =>
          m.role !== "assistant" ||
          (m.content && m.content.length > 0) ||
          (m.toolInvocations && m.toolInvocations.length > 0)
      )
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content || "",
      }));
    return [...seedMessages, ...localMessages, ...mapped];
  }, [aiMessages, localMessages, seedMessages]);

  const handleSubmit = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setInput("");

      const intent = matchIntent(text);
      if (intent) {
        setLocalMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: text },
          { id: crypto.randomUUID(), role: "assistant", content: intent.reply },
        ]);
        setTimeout(() => dispatchTool(intent.tool, intent.args), 120);
        return;
      }

      append({ role: "user", content: text });
    },
    [append, dispatchTool, setInput]
  );

  const goHome = useCallback(() => {
    setView({ kind: "empty" });
  }, [setView]);

  // Command palette keybind
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        if (!isHome) goHome();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isHome, goHome]);

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden">
      <TopBar />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* PAGE AREA — only mounted when not home */}
        <AnimatePresence mode="wait">
          {!isHome && (
            <motion.div
              key="page"
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{
                duration: 0.5,
                ease: EASE,
                delay: 0.12,
              }}
              className="relative min-h-0 flex-1 overflow-hidden"
            >
              <StageFrame onHome={goHome} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* CHAT — single mounted instance, morphs between layouts */}
        <motion.div
          layout
          transition={{
            layout: { duration: 0.6, ease: EASE },
          }}
          className={
            isHome
              ? "relative flex min-h-0 flex-1 flex-col"
              : "relative flex min-h-0 w-full flex-col border-l border-[color-mix(in_srgb,var(--color-line)_70%,transparent)] bg-[color-mix(in_srgb,var(--color-paper)_75%,transparent)] backdrop-blur-md md:w-[400px] md:shrink-0 lg:w-[440px]"
          }
        >
          <ChatPanel
            isHome={isHome}
            messages={displayMessages}
            isLoading={isLoading}
            input={input}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onOpenPalette={() => setPaletteOpen(true)}
            error={error}
            onRetry={reload}
            onStop={stop}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {paletteOpen && (
          <CommandPalette
            onClose={() => setPaletteOpen(false)}
            onDispatch={handleSubmit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TopBar() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="relative z-10 flex shrink-0 items-center justify-between border-b border-[color-mix(in_srgb,var(--color-line)_70%,transparent)] bg-[color-mix(in_srgb,var(--color-paper)_85%,transparent)] px-4 py-3 backdrop-blur-md md:px-6"
    >
      <div className="flex items-center gap-3">
        <div
          className="relative h-2 w-2 rounded-full"
          style={{ background: "var(--color-accent)" }}
          aria-label="online"
        >
          <span
            className="absolute inset-0 animate-ping rounded-full opacity-60"
            style={{ background: "var(--color-accent)" }}
          />
        </div>
        <span className="font-mono text-[0.78rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          sebastian.dev · live
        </span>
      </div>
      <ThemeToggle />
    </motion.header>
  );
}

"use client";

import { useChat } from "@ai-sdk/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { matchIntent } from "@/lib/intents";
import { useStageStore } from "@/lib/store";
import type { ToolName } from "@/lib/tools";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { QuickCommands } from "./QuickCommands";
import { CommandPalette } from "./CommandPalette";
import { ThemeToggle } from "./ThemeToggle";
import { StageCanvas } from "@/components/stage/StageCanvas";
import { profile } from "@/content/site";

const GREETING = `Hey — welcome to ${profile.shortName.toLowerCase()}.dev. Yeah, the whole site is a chatbot. Meta, I know.

Ask me anything, or hit one of the shortcuts below.`;

type LocalMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  local?: boolean;
};

export function ChatShell() {
  const dispatchTool = useStageStore((s) => s.dispatchTool);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Local-only seed message (not part of LLM history)
  const [seedMessages] = useState<LocalMessage[]>([
    { id: "greeting", role: "assistant", content: GREETING, local: true },
  ]);
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([]);

  const {
    messages: aiMessages,
    input,
    handleInputChange,
    append,
    isLoading,
    setInput,
  } = useChat({
    api: "/api/chat",
    onToolCall: ({ toolCall }) => {
      dispatchTool(toolCall.toolName as ToolName, toolCall.args as Record<string, unknown>);
    },
  });

  // Merge local + AI messages for display
  const displayMessages = useMemo(() => {
    const mapped = aiMessages.map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content:
        m.content ||
        (m.toolInvocations?.length ? "" : "…"),
    }));
    return [...seedMessages, ...localMessages, ...mapped];
  }, [aiMessages, localMessages, seedMessages]);

  const handleSubmit = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setInput("");

      // Try local intent match first
      const intent = matchIntent(text);
      if (intent) {
        setLocalMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", content: text, local: true },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: intent.reply,
            local: true,
          },
        ]);
        // Dispatch after a beat so the message bubble animates in first
        setTimeout(() => {
          dispatchTool(intent.tool, intent.args);
        }, 120);
        return;
      }

      // Fall back to LLM
      append({ role: "user", content: text });
    },
    [append, dispatchTool, setInput]
  );

  // Command palette keybind
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden">
      {/* Top bar */}
      <TopBar />

      {/* Main split */}
      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Stage (top on mobile, right on desktop) */}
        <div className="relative order-1 min-h-[38svh] flex-1 lg:order-2 lg:min-h-0">
          <StageCanvas />
        </div>

        {/* Chat (bottom on mobile, left on desktop) */}
        <div className="relative order-2 flex min-h-0 w-full flex-col lg:order-1 lg:w-[min(480px,42%)] lg:border-r lg:border-[color-mix(in_srgb,var(--color-line)_70%,transparent)]">
          <MessageList messages={displayMessages} isLoading={isLoading} />
          <div className="shrink-0 border-t border-[color-mix(in_srgb,var(--color-line)_70%,transparent)] bg-[color-mix(in_srgb,var(--color-paper)_92%,transparent)] backdrop-blur-md">
            <QuickCommands onSelect={handleSubmit} />
            <ChatInput
              value={input}
              onChange={handleInputChange}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onOpenPalette={() => setPaletteOpen(true)}
            />
          </div>
        </div>
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
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
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

"use client";

import { motion } from "framer-motion";
import type { ChangeEvent } from "react";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { QuickCommands } from "./QuickCommands";
import { HomeHero } from "./HomeHero";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function ChatPanel({
  isHome,
  messages,
  isLoading,
  input,
  onInputChange,
  onSubmit,
  onOpenPalette,
  error,
  onRetry,
  onStop,
}: {
  isHome: boolean;
  messages: Message[];
  isLoading: boolean;
  input: string;
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (value: string) => void;
  onOpenPalette: () => void;
  error?: Error;
  onRetry?: () => void;
  onStop?: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      {/* Home hero only visible in home mode */}
      <motion.div
        initial={false}
        animate={{
          height: isHome ? "auto" : 0,
          opacity: isHome ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="shrink-0 overflow-hidden"
      >
        <HomeHero compact={false} />
      </motion.div>

      <MessageList
        messages={messages}
        isLoading={isLoading}
        isHome={isHome}
        error={error}
        onRetry={onRetry}
      />

      <div
        className={
          isHome
            ? "shrink-0"
            : "shrink-0 border-t border-[color-mix(in_srgb,var(--color-line)_70%,transparent)] bg-[color-mix(in_srgb,var(--color-paper)_92%,transparent)] backdrop-blur-md"
        }
      >
        <QuickCommands onSelect={onSubmit} compact={!isHome} />
        <ChatInput
          value={input}
          onChange={onInputChange}
          onSubmit={onSubmit}
          isLoading={isLoading}
          onOpenPalette={onOpenPalette}
          onStop={onStop}
          compact={!isHome}
        />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { MessageBubble } from "./MessageBubble";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function MessageList({
  messages,
  isLoading,
  isHome = false,
  error,
  onRetry,
}: {
  messages: Message[];
  isLoading: boolean;
  isHome?: boolean;
  error?: Error;
  onRetry?: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, isLoading, error]);

  return (
    <div
      ref={scrollRef}
      className={
        "scroll-thin min-h-0 flex-1 overflow-y-auto " +
        (isHome ? "px-6 py-4 md:px-8" : "px-4 py-4 md:px-5")
      }
    >
      <div
        className={
          "mx-auto flex flex-col " +
          (isHome ? "max-w-2xl gap-3" : "gap-3")
        }
      >
        <AnimatePresence initial={true}>
          {messages.map((m, i) => {
            // Stagger the initial seed bubbles (greeting + intro) so they feel
            // like the bot is typing. Subsequent messages appear immediately.
            const isSeed = m.id.startsWith("greeting-");
            const seedOrder: Record<string, number> = {
              "greeting-welcome": 0,
              "greeting-intro": 1,
              "greeting-cta": 2,
            };
            const seedIndex = isSeed ? (seedOrder[m.id] ?? 0) : 0;
            const delay = isSeed ? 0.45 + seedIndex * 0.7 : 0;
            return (
              <motion.div
                key={m.id}
                layout
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                  delay,
                }}
                className={
                  m.role === "user" ? "flex justify-end" : "flex justify-start"
                }
              >
                <MessageBubble role={m.role} content={m.content} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isLoading && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bubble bubble-assistant flex items-center gap-1">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex justify-start"
          >
            <div
              className="bubble bubble-assistant flex flex-col gap-2"
              style={{
                borderColor:
                  "color-mix(in srgb, var(--color-accent) 40%, transparent)",
              }}
            >
              <span className="text-[0.9rem]">
                Brain took a nap — that request didn&apos;t make it back. Cold-start
                on the model, probably. Try again?
              </span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-line)_75%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_85%,transparent)] px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
                >
                  <RefreshCw className="h-3 w-3" strokeWidth={2} />
                  Retry
                </button>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

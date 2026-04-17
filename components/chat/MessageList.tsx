"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
}: {
  messages: Message[];
  isLoading: boolean;
  isHome?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length, isLoading]);

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
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.35,
                ease: [0.22, 1, 0.36, 1],
                delay: i === 0 ? 0.55 : 0,
              }}
              className={
                m.role === "user" ? "flex justify-end" : "flex justify-start"
              }
            >
              <MessageBubble role={m.role} content={m.content} />
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
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
      </div>
    </div>
  );
}

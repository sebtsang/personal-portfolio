"use client";

import { AnimatePresence, motion } from "framer-motion";

const COMMANDS = [
  "/about",
  "/experience",
  "/linkedin",
  "/contact",
] as const;

// Matches the chat-retract spring so the whole transition reads as
// one physical motion — chat column, chips, and label all settle
// together.
const REFLOW_SPRING = {
  type: "spring" as const,
  stiffness: 140,
  damping: 24,
  mass: 0.8,
};

export function SlashCommandRow({
  onDispatch,
  compact = false,
}: {
  onDispatch: (cmd: string) => void;
  compact?: boolean;
}) {
  return (
    <motion.div
      layout
      transition={REFLOW_SPRING}
      style={{
        display: "flex",
        flexDirection: compact ? "column" : "row",
        flexWrap: "wrap",
        gap: compact ? 6 : 18,
        marginBottom: 14,
        alignItems: compact ? "flex-start" : "center",
      }}
    >
      <AnimatePresence initial={false}>
        {!compact && (
          <motion.span
            key="try-label"
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-meta)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "color-mix(in srgb, var(--color-ink-soft) 45%, transparent)",
              alignSelf: "center",
            }}
          >
            try —
          </motion.span>
        )}
      </AnimatePresence>
      {COMMANDS.map((cmd) => (
        <motion.button
          key={cmd}
          layout
          transition={REFLOW_SPRING}
          type="button"
          onClick={() => onDispatch(cmd)}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "var(--font-script)",
            fontSize: compact ? "var(--fs-chip)" : "var(--fs-script)",
            color: "color-mix(in srgb, var(--color-ink-soft) 70%, transparent)",
            borderBottom:
              "1px dashed color-mix(in srgb, var(--color-ink-soft) 30%, transparent)",
            lineHeight: 1.1,
            transition:
              "color 160ms var(--ease-out-expo), border-color 160ms var(--ease-out-expo), font-size 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-ink-soft)";
            e.currentTarget.style.borderBottomColor =
              "var(--color-ink-soft)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color =
              "color-mix(in srgb, var(--color-ink-soft) 70%, transparent)";
            e.currentTarget.style.borderBottomColor =
              "color-mix(in srgb, var(--color-ink-soft) 30%, transparent)";
          }}
        >
          {cmd}
        </motion.button>
      ))}
    </motion.div>
  );
}

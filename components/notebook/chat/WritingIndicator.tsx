"use client";

import { memo, useEffect, useState } from "react";
import { motion } from "framer-motion";

const CYCLE_MS = 450;

const LABEL_SPRING = {
  type: "spring" as const,
  stiffness: 140,
  damping: 24,
  mass: 0.8,
};

/**
 * Pseudo-message rendered while SebBot is streaming. Matches the
 * NotebookMessage layout: inline label + text in home mode, stacked in
 * compact mode, with the label sitting just inside the red margin.
 *
 * memo'd so parent re-renders (which happen on every streamed token
 * because the messages array grows) don't also re-render this — its
 * internal tick interval handles the dot animation locally.
 */
export const WritingIndicator = memo(function WritingIndicator({
  compact = false,
}: {
  compact?: boolean;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), CYCLE_MS);
    return () => window.clearInterval(id);
  }, []);
  const dots = ".".repeat(tick % 4);

  const fontSize = compact ? "var(--fs-script)" : "var(--fs-body)";
  const lineHeight = "var(--line)";
  const paddingLeft = compact ? "calc(12% + var(--pad-content-sm))" : "calc(12% + var(--pad-content))";
  const paddingRight = compact ? "6%" : "8%";

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-meta)",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "color-mix(in srgb, var(--color-ink-soft) 65%, transparent)",
    lineHeight: "var(--line)",
    pointerEvents: "none",
  };

  const textStyle: React.CSSProperties = {
    fontFamily: "var(--font-script)",
    fontSize,
    fontWeight: 500,
    color: "var(--color-ink)",
    opacity: 0.55,
    lineHeight,
  };

  const body = (
    <>
      writing
      <span
        style={{
          display: "inline-block",
          minWidth: "1.5ch",
          textAlign: "left",
        }}
      >
        {dots}
      </span>
    </>
  );

  // Unified structure — see NotebookMessage for the same pattern + full
  // rationale on the translateY / lineHeight tweaks in inline mode.
  return (
    <motion.div
      layout
      transition={LABEL_SPRING}
      style={{
        paddingLeft,
        paddingRight,
        display: "flex",
        flexDirection: compact ? "column" : "row",
        alignItems: compact ? "flex-start" : "baseline",
        gap: compact ? 0 : 12,
        willChange: "transform",
      }}
    >
      <motion.div
        layout
        transition={LABEL_SPRING}
        style={{
          ...labelStyle,
          lineHeight: compact ? "var(--line)" : 1,
          flexShrink: 0,
          width: compact ? "auto" : 64,
        }}
      >
        <div
          style={{
            transform: compact
              ? "none"
              : "translateY(calc(var(--line) * -0.19))",
            transition: "transform 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          sebbot
        </div>
      </motion.div>
      <motion.div
        layout
        transition={LABEL_SPRING}
        style={{ ...textStyle, flex: compact ? undefined : 1, minWidth: 0 }}
      >
        {body}
      </motion.div>
    </motion.div>
  );
});

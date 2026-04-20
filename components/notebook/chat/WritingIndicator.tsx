"use client";

import { useEffect, useState } from "react";

const CYCLE_MS = 450;

/**
 * Pseudo-message rendered while SebBot is streaming. Shows "writing" +
 * cycling dots in the same Caveat + gutter-label style as a real message.
 */
export function WritingIndicator({ compact = false }: { compact?: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), CYCLE_MS);
    return () => window.clearInterval(id);
  }, []);
  const dots = ".".repeat(tick % 4);

  const fontSize = compact ? 20 : 26;
  // Match NotebookMessage — always on the 32px ruler grid.
  const lineHeight = "var(--line)";

  return (
    <div
      style={{
        position: "relative",
        paddingLeft: compact ? "calc(12% + 8px)" : "calc(12% + 16px)",
        paddingRight: compact ? "6%" : "8%",
      }}
    >
      {!compact && (
        <span
          style={{
            position: "absolute",
            left: "calc(3% + 28px)",
            top: 0,
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color:
              "color-mix(in srgb, var(--color-ink-soft) 65%, transparent)",
            lineHeight: "var(--line)",
            pointerEvents: "none",
          }}
        >
          sebbot
        </span>
      )}
      <div
        style={{
          fontFamily: "var(--font-script)",
          fontSize,
          fontWeight: 500,
          color: "var(--color-ink)",
          opacity: 0.55,
          lineHeight,
        }}
      >
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
      </div>
    </div>
  );
}

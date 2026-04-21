"use client";

import { memo, useEffect, useState } from "react";

const CYCLE_MS = 450;

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

  if (compact) {
    return (
      <div style={{ paddingLeft, paddingRight }}>
        <div style={labelStyle}>sebbot</div>
        <div style={textStyle}>{body}</div>
      </div>
    );
  }

  return (
    <div
      style={{
        paddingLeft,
        paddingRight,
        display: "flex",
        alignItems: "baseline",
        gap: 12,
      }}
    >
      <div style={{ ...labelStyle, flexShrink: 0, width: 64 }}>sebbot</div>
      <div style={{ ...textStyle, flex: 1, minWidth: 0 }}>{body}</div>
    </div>
  );
});

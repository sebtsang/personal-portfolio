"use client";

import { HandwrittenText } from "../primitives/HandwrittenText";

export type ChatRole = "user" | "assistant";

/**
 * Chat message with author label.
 *
 * Home mode (wide chat): label sits INLINE to the left of the first
 * text line, both aligned just inside the red margin. A fixed-width
 * label column + a flex text column keep baselines aligned.
 *
 * Compact mode (narrow chat sidebar in split view): label stacks
 * ABOVE the message, both at the same left padding. No horizontal
 * room for inline labels at ~28% viewport width.
 */
export function NotebookMessage({
  text,
  role,
  compact = false,
}: {
  text: string;
  role: ChatRole;
  idx: number;
  compact?: boolean;
}) {
  const isUser = role === "user";
  const weight = isUser ? 400 : 500;
  const textColor = isUser ? "var(--color-ink-soft)" : "var(--color-ink)";
  const labelColor = isUser
    ? "color-mix(in srgb, var(--color-ink-soft) 50%, transparent)"
    : "color-mix(in srgb, var(--color-ink-soft) 65%, transparent)";

  const fontSize = compact ? 20 : 26;
  // Always ride the 32px ruler grid so every wrapped line lands on a rule.
  const lineHeight = "var(--line)";

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: 10,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: labelColor,
    lineHeight: "var(--line)",
    pointerEvents: "none",
  };

  const textStyle: React.CSSProperties = {
    fontFamily: "var(--font-script)",
    fontSize,
    fontWeight: weight,
    color: textColor,
    lineHeight,
    // Wrap at word boundaries only — never split a word mid-line.
    wordBreak: "normal",
    overflowWrap: "normal",
    maxWidth: compact ? "100%" : 720,
  };

  // Both modes share this padding so the label + text column starts just
  // inside the red spread margin line.
  const paddingLeft = compact ? "calc(12% + 8px)" : "calc(12% + 16px)";
  const paddingRight = compact ? "6%" : "8%";

  if (compact) {
    return (
      <div style={{ paddingLeft, paddingRight }}>
        <div style={{ ...labelStyle, marginBottom: 0 }}>
          {isUser ? "you" : "sebbot"}
        </div>
        <div style={textStyle}>
          <HandwrittenText text={text} />
        </div>
      </div>
    );
  }

  // Home mode: label inline, fixed-width column; text fills the rest.
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
      <div
        style={{
          ...labelStyle,
          flexShrink: 0,
          width: 64,
        }}
      >
        {isUser ? "you" : "sebbot"}
      </div>
      <div style={{ ...textStyle, flex: 1, minWidth: 0 }}>
        <HandwrittenText text={text} />
      </div>
    </div>
  );
}

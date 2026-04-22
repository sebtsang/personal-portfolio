"use client";

import { memo } from "react";
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
 *
 * Wrapped in React.memo so streaming chat updates don't re-render
 * previously-rendered messages on every token. The only prop that
 * usually changes per message is `text` (for the currently-streaming
 * one); older messages' props are stable so their re-renders drop
 * to zero. Big main-thread relief during concurrent animations.
 */
export const NotebookMessage = memo(function NotebookMessage({
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

  const fontSize = compact ? "var(--fs-script)" : "var(--fs-body)";
  // Always ride the 32px ruler grid so every wrapped line lands on a rule.
  const lineHeight = "var(--line)";

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-mono)",
    fontSize: "var(--fs-meta)",
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
    maxWidth: compact ? "100%" : "clamp(560px, 50vw, 900px)",
  };

  // Both modes share this padding so the label + text column starts just
  // inside the red spread margin line.
  const paddingLeft = compact ? "calc(12% + var(--pad-content-sm))" : "calc(12% + var(--pad-content))";
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
  // The label overrides lineHeight to 1 (was var(--line)) because flex
  // baseline alignment measures each item's line-box ascent+descent,
  // and a mono label with lineHeight:var(--line) has much more leading
  // below its baseline than Caveat body does. That asymmetry inflates
  // the row ~6px beyond --line, and the overflow accumulates message
  // by message — every subsequent body baseline drifts further off
  // the ruled grid. Collapsing label lineHeight shrinks its line-box
  // so Caveat's descent dominates and the row is exactly --line tall.
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
          lineHeight: 1,
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
});

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
  //
  // lineHeight:1 on the label: flex baseline alignment measures each
  // item's line-box ascent+descent. A mono label with lineHeight:var(--line)
  // has more leading below its baseline than Caveat body does, which
  // inflates the row ~6px past --line and drifts every subsequent
  // message off the ruled grid. Collapsing the label's line-box to its
  // text lets Caveat's descent win and the row stays exactly --line tall.
  //
  // translateY on the label: without it, the label's baseline sits flush
  // on the rule (shared with body baseline via flex), which reads as
  // "label glued to the rule". Compact mode gets ~6px of breathing
  // room for free because the label lives on its own line-box and its
  // baseline (mono, ~0.57 of --line) is above the rule (at 0.76). We
  // mimic that here by translating the label up by 0.19 × --line, the
  // same fractional offset. Body position is untouched; transform is
  // purely visual.
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
          transform: "translateY(calc(var(--line) * -0.19))",
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

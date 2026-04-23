"use client";

import { memo } from "react";
import { HandwrittenText } from "../primitives/HandwrittenText";

export type ChatRole = "user" | "assistant";

/**
 * Chat message with author label.
 *
 * Two static layouts selected by `compact`:
 *   - Home mode (wide chat): label INLINE to the left of the first text line.
 *     A fixed-width label column + flex text column keep baselines aligned.
 *   - Compact mode (narrow chat sidebar): label STACKED above the message.
 *     No horizontal room for inline labels at ~28% viewport width.
 *
 * Both layouts are fully static — no animation between them. Page navigations
 * swap whole pages via FlipStage, so a message is only ever rendered in one
 * of the two layouts during its lifetime.
 *
 * Wrapped in React.memo so streaming chat updates don't re-render previously
 * rendered messages on every token.
 */
export const NotebookMessage = memo(function NotebookMessage({
  text,
  role,
  compact = false,
  animated = true,
}: {
  text: string;
  role: ChatRole;
  idx: number;
  compact?: boolean;
  /** When false, the HandwrittenText body renders instantly at opacity 1
   *  instead of pen-writing. Used when this message has been seen in a
   *  prior render (e.g., sidebar remount after a page flip). */
  animated?: boolean;
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
    wordBreak: "normal",
    overflowWrap: "normal",
    maxWidth: compact ? "100%" : "clamp(560px, 50vw, 900px)",
  };

  const paddingLeft = compact
    ? "calc(12% + var(--pad-content-sm))"
    : "calc(12% + var(--pad-content))";
  const paddingRight = compact ? "6%" : "8%";

  if (compact) {
    return (
      <div style={{ paddingLeft, paddingRight }}>
        <div style={{ ...labelStyle, marginBottom: 0 }}>
          {isUser ? "you" : "sebbot"}
        </div>
        <div style={textStyle}>
          <HandwrittenText text={text} animated={animated} />
        </div>
      </div>
    );
  }

  // Home mode: label inline, fixed-width column; text fills the rest.
  //
  // lineHeight:1 on the label + translateY(-0.19 × --line) keep the row
  // exactly --line tall on the ruler grid while pushing the label off the
  // rule so it gets the same breathing room compact gets naturally from
  // being on its own line-box.
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

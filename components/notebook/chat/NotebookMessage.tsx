"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { HandwrittenText } from "../primitives/HandwrittenText";

// Shared spring so sender labels glide between inline-left and
// stacked-above with the same physics as the chat retract.
const LABEL_SPRING = {
  type: "spring" as const,
  stiffness: 140,
  damping: 24,
  mass: 0.8,
};

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
    // Single expression that naturally adapts to container width: caps
    // at 900px when there's room (home), shrinks to 100% of column in
    // split. No compact branching = no reflow snap at t=0.
    maxWidth: "min(900px, 100%)",
  };

  // Both modes place content just inside the red margin rule at 12%
  // of the chat column. Expressed in viewport units (vw) rather than
  // container %-units so the values are stable when Framer's `layout`
  // on the chat column snaps the DOM width at the start of a transition.
  //   compact column = 28vw → 12% of that = 3.36vw
  //   full column    = 100vw → 12% of that = 12vw
  // Same for paddingRight (6% / 8% of the column).
  const paddingLeft = compact
    ? "calc(3.36vw + var(--pad-content-sm))"
    : "calc(12vw + var(--pad-content))";
  const paddingRight = compact ? "1.68vw" : "8vw";

  // Unified single-JSX structure: `flexDirection` drives the inline-vs-stacked
  // layout. Framer's `layout` prop measures old/new positions on each child
  // div and animates the delta via transform (FLIP) — the sender label
  // visibly slides between its inline-left slot and the stacked-above slot,
  // matching the chat-retract spring for one cohesive motion.
  //
  // translateY on the label in full mode: see rationale below. In compact
  // mode it's cleared so the label sits naturally above the text. The
  // transform lives on an inner `<div>` (not the motion.div) because
  // Framer manages transform on the outer layer during layout animation.
  //
  // Full-mode label details:
  //   lineHeight:1 — flex baseline alignment measures each item's line-box
  //   ascent+descent; a mono label with lineHeight:var(--line) inflates the
  //   row ~6px and drifts messages off the ruled grid. lineHeight:1 keeps
  //   the row exactly --line tall.
  //   translateY(-0.19 × --line) — pushes the label off the rule so it has
  //   the same ~6px breathing room compact mode gets naturally from being
  //   on its own line-box.
  // Only the label div gets `layout` — that's the one element that
  // actually needs to *slide* between the inline-left slot (full) and
  // the stacked-above slot (compact). The outer container and the text
  // div do not use `layout`: they would each run their own independent
  // FLIP animation that fights the chat column's parent FLIP and causes
  // the text to visually overflow the column during the spring (the
  // "text extends past the margin" hitch). Without `layout`, the outer
  // and the text just ride the parent chat column's transform — their
  // DOM sizes snap at t=400ms when `compact` flips, but at that moment
  // the parent scale is still ~0.28, so the snapped DOM width visually
  // stays inside the chat column throughout the spring.
  return (
    <div
      style={{
        paddingLeft,
        paddingRight,
        display: "flex",
        flexDirection: compact ? "column" : "row",
        alignItems: compact ? "flex-start" : "baseline",
        gap: compact ? 0 : 12,
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
          willChange: "transform",
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
          {isUser ? "you" : "sebbot"}
        </div>
      </motion.div>
      <div
        style={{
          ...textStyle,
          flex: compact ? undefined : 1,
          minWidth: 0,
        }}
      >
        <HandwrittenText text={text} />
      </div>
    </div>
  );
});

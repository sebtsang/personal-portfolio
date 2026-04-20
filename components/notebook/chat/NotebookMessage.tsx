"use client";

import { HandwrittenText } from "../primitives/HandwrittenText";

export type ChatRole = "user" | "assistant";

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
  const color = isUser ? "var(--color-ink-soft)" : "var(--color-ink)";

  const fontSize = compact ? 20 : 26;
  // Always ride the 32px ruler grid so every wrapped line lands on a rule,
  // regardless of compact vs. full mode.
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
            color: isUser
              ? "color-mix(in srgb, var(--color-ink-soft) 50%, transparent)"
              : "color-mix(in srgb, var(--color-ink-soft) 65%, transparent)",
            lineHeight: "var(--line)",
            pointerEvents: "none",
          }}
        >
          {isUser ? "you" : "sebbot"}
        </span>
      )}
      <div
        style={{
          fontFamily: "var(--font-script)",
          fontSize,
          fontWeight: weight,
          color,
          lineHeight,
          // Wrap at word boundaries only — never split a word mid-line.
          wordBreak: "normal",
          overflowWrap: "normal",
          maxWidth: compact ? "100%" : 720,
        }}
      >
        <HandwrittenText text={text} />
      </div>
    </div>
  );
}

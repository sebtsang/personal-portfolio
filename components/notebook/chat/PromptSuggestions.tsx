"use client";

import { useMemo } from "react";

/**
 * Prompt suggestions shown under the chat input on the empty-chat state.
 * Picks 3 random prompts from the pool on mount (stable per render, new
 * shuffle on refresh — matches the journal metaphor where each "open"
 * is a new session).
 *
 * Click behavior: prefill the input (not auto-send) so the user can
 * edit or abandon. Consistent with the wider "always confirm before
 * doing" spirit of the chat.
 *
 * Visibility: only when no user messages exist yet. Parent (ChatPage)
 * computes this from the messages array and passes `showSuggestions`.
 */

const POOL = [
  "where has he worked",
  "how do I contact him",
  "show me his LinkedIn",
  "what's his deal",
  "what does he do on weekends",
  "why is this site a chatbot",
  "what tech is this built on",
  "tell me a joke",
];

/**
 * Small seeded shuffle — deterministic per seed so the component can
 * pick from Date.now() on mount and keep the picks stable across
 * re-renders without useState (parent can unmount/remount to reshuffle).
 */
function pickThree(seed: number): string[] {
  const arr = [...POOL];
  let s = Math.max(1, seed % 233280);
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, 3);
}

export function PromptSuggestions({
  onSelect,
  compact = false,
}: {
  onSelect: (text: string) => void;
  compact?: boolean;
}) {
  const picks = useMemo(() => pickThree(Date.now()), []);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: compact ? 6 : 10,
        marginBottom: 14,
        alignItems: "center",
      }}
    >
      {!compact && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color:
              "color-mix(in srgb, var(--color-ink-soft) 45%, transparent)",
            alignSelf: "center",
          }}
        >
          ask —
        </span>
      )}
      {picks.map((text) => (
        <button
          key={text}
          type="button"
          onClick={() => onSelect(text)}
          style={{
            background: "transparent",
            border:
              "1px dashed color-mix(in srgb, var(--color-ink-soft) 28%, transparent)",
            borderRadius: 999,
            padding: compact ? "2px 10px" : "3px 12px",
            cursor: "pointer",
            fontFamily: "var(--font-script)",
            fontSize: compact ? 15 : 17,
            color:
              "color-mix(in srgb, var(--color-ink-soft) 72%, transparent)",
            lineHeight: 1.3,
            transition:
              "color 160ms var(--ease-out-expo), border-color 160ms var(--ease-out-expo), background 160ms var(--ease-out-expo)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-ink)";
            e.currentTarget.style.borderColor = "var(--color-ink-soft)";
            e.currentTarget.style.background =
              "color-mix(in srgb, var(--color-ink-soft) 6%, transparent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color =
              "color-mix(in srgb, var(--color-ink-soft) 72%, transparent)";
            e.currentTarget.style.borderColor =
              "color-mix(in srgb, var(--color-ink-soft) 28%, transparent)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

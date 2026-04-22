"use client";

import { useEffect, useState } from "react";

/**
 * Prompt suggestions shown under the chat input on the empty-chat state.
 * Picks 3 random prompts from the pool on mount (stable per render, new
 * shuffle on refresh — matches the journal metaphor where each "open"
 * is a new session).
 *
 * SSR note: the seed is seeded from Date.now(), which differs between
 * the server render and the client hydration — Next.js flags that as a
 * Recoverable hydration-mismatch error. We sidestep it by rendering a
 * deterministic default (first three from POOL) on the server AND on
 * the initial client render, then swapping to a time-seeded shuffle in
 * a useEffect. The SSR and hydration trees match; the swap happens
 * post-hydration and React accepts it as a normal state update.
 *
 * Click behavior: fire the chip's text as a user message immediately
 * (no prefill step). The suggestions are only shown on the empty-chat
 * state, where they're meant as shortcuts — forcing an Enter press
 * after the click felt like friction for what's clearly a committed
 * intent.
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
  // Initial render (SSR + first client paint) uses the first three from
  // POOL so the two trees match. After mount we seed from Date.now()
  // and React updates the chips — no hydration warning, same
  // per-session randomness the component originally offered.
  const [picks, setPicks] = useState<string[]>(() => POOL.slice(0, 3));
  useEffect(() => {
    setPicks(pickThree(Date.now()));
  }, []);

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
            fontSize: "var(--fs-meta)",
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
            fontSize: "var(--fs-chip)",
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

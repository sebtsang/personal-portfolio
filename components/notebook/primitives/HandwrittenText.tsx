"use client";

import { memo } from "react";
import { usePaneReady } from "./PaneReadyContext";

/**
 * Renders text as per-character `<span>`s with a staggered opacity fade so
 * letters appear one at a time — the pen-writing feel — while preserving
 * native inline text flow. Critically: no `display: inline-block` per char,
 * which previously broke Caveat's kerning/connecting strokes and also let
 * the browser wrap mid-word. Each span is `display: inline`, so the
 * browser only breaks at whitespace and letters stay properly kerned.
 *
 * Streaming-friendly: spans are keyed by index, so appending tokens mounts
 * only the new spans (and animates them); existing letters stay at
 * opacity 1 via `animation-fill-mode: both`.
 */
export const HandwrittenText = memo(function HandwrittenText({
  text,
  charDelayMs = 10,
  durationMs = 180,
}: {
  text: string;
  charDelayMs?: number;
  durationMs?: number;
}) {
  const chars = Array.from(text);
  // When inside a not-yet-ready split pane, keep every char's animation
  // paused at its opening frame (opacity 0, via animation-fill-mode: both).
  // Flipping to "running" at paneReady=true resumes the CSS clock so each
  // char's delay starts counting from that moment — the full stagger plays
  // with the page flat, not behind the flip.
  const ready = usePaneReady();
  const playState: React.CSSProperties["animationPlayState"] = ready
    ? "running"
    : "paused";
  return (
    <>
      {chars.map((ch, i) => {
        if (ch === "\n") return <br key={`br-${i}`} />;
        // Spaces stay as plain whitespace so word-wrap works at boundaries.
        if (ch === " ") return " ";
        return (
          <span
            key={i}
            style={{
              opacity: 0,
              animation: `fadeInChar ${durationMs}ms ease-out ${
                i * charDelayMs
              }ms both`,
              animationPlayState: playState,
            }}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
});

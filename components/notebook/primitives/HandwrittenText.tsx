"use client";

import { memo } from "react";

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
  charDelayMs = 25,
  durationMs = 180,
}: {
  text: string;
  charDelayMs?: number;
  durationMs?: number;
}) {
  const chars = Array.from(text);
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
            }}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
});

"use client";

import { memo } from "react";
import { usePageAnimate } from "./PageAnimateContext";

/**
 * Renders text as per-character `<span>`s with a staggered opacity fade so
 * letters appear one at a time — the pen-writing feel — while preserving
 * native inline text flow.
 *
 * Gating semantics:
 *   - `animated={false}`: text has already been seen (seenMessages flagged
 *     it). Render at opacity 1, no animation ever. Used by ChatPage.
 *   - `animated={true}` + `pageAnimate=false`: first mount while the host
 *     page is holding its reveals (during a flip-in). Chars sit at opacity 0
 *     with the CSS animation paused at its opening frame. Flipping
 *     `pageAnimate` to `true` (via the host page's context) resumes each
 *     char's animation clock so the stagger plays.
 *   - `animated={true}` + `pageAnimate=true`: normal pen-write.
 */
export const HandwrittenText = memo(function HandwrittenText({
  text,
  charDelayMs = 10,
  durationMs = 180,
  animated = true,
}: {
  text: string;
  charDelayMs?: number;
  durationMs?: number;
  animated?: boolean;
}) {
  const chars = Array.from(text);
  const pageAnimate = usePageAnimate();
  const playState: React.CSSProperties["animationPlayState"] = pageAnimate
    ? "running"
    : "paused";
  return (
    <>
      {chars.map((ch, i) => {
        if (ch === "\n") return <br key={`br-${i}`} />;
        if (ch === " ") return " ";
        return (
          <span
            key={i}
            style={
              animated
                ? {
                    opacity: 0,
                    animation: `fadeInChar ${durationMs}ms ease-out ${
                      i * charDelayMs
                    }ms both`,
                    animationPlayState: playState,
                  }
                : { opacity: 1 }
            }
          >
            {ch}
          </span>
        );
      })}
    </>
  );
});

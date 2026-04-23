"use client";

import { memo } from "react";
import { usePageAnimate, usePageSessionKey } from "./PageAnimateContext";

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
  delayMs = 0,
}: {
  text: string;
  charDelayMs?: number;
  durationMs?: number;
  animated?: boolean;
  /** Overall start-delay offset added to every character's animation-delay.
   *  Lets multiple HandwrittenText instances participate in a timeline
   *  (e.g., one pen-write at 800ms, next at 1100ms). The pause/resume
   *  gating via PageAnimateContext still applies — while paused, the
   *  clock doesn't advance, so the delay begins counting from the moment
   *  the page becomes ready. */
  delayMs?: number;
}) {
  const chars = Array.from(text);
  const pageAnimate = usePageAnimate();
  const sessionKey = usePageSessionKey();
  const playState: React.CSSProperties["animationPlayState"] = pageAnimate
    ? "running"
    : "paused";
  return (
    <>
      {chars.map((ch, i) => {
        if (ch === "\n") return <br key={`br-${sessionKey}-${i}`} />;
        if (ch === " ") return " ";
        return (
          <span
            key={`${sessionKey}-${i}`}
            style={
              animated
                ? {
                    opacity: 0,
                    // Longhand animation props (not the `animation`
                    // shorthand) so animationPlayState can toggle without
                    // React warning about conflicting style updates.
                    animationName: "fadeInChar",
                    animationDuration: `${durationMs}ms`,
                    animationTimingFunction: "ease-out",
                    animationDelay: `${delayMs + i * charDelayMs}ms`,
                    animationFillMode: "both",
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

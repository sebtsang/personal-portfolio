"use client";

import { Fragment, useId } from "react";
import { usePageAnimate, usePageSessionKey } from "./PageAnimateContext";

type DrawnTextProps = {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
  fontStyle?: "normal" | "italic";
  letterSpacing?: number;
  color: string;
  duration?: number;
  fillAfter?: boolean;
  fillDelay?: number;
  strokeWidth?: number;
  erasing?: boolean;
  eraseDuration?: number;
};

/**
 * Reveals text as if being drawn: a transparent-fill, stroked outline
 * sweeps left → right via clip-path, then a filled copy sweeps in on top.
 * Supports `erasing` — the same sweep in reverse.
 */
export function DrawnText({
  text,
  fontFamily,
  fontSize,
  fontWeight = 400,
  fontStyle = "normal",
  letterSpacing = 0,
  color,
  duration = 1.6,
  fillAfter = false,
  fillDelay = 0.3,
  strokeWidth = 1,
  erasing = false,
  eraseDuration = 0.9,
}: DrawnTextProps) {
  const rawId = useId();
  const uid = `dt${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;
  // Host page holds the animation at its opening frame via
  // animationPlayState: "paused" until the flip-in lands. When
  // pageAnimate flips to true, the clock resumes and the draw/fill
  // sweep plays from the beginning.
  const pageAnimate = usePageAnimate();
  const sessionKey = usePageSessionKey();
  const playState: React.CSSProperties["animationPlayState"] = pageAnimate
    ? "running"
    : "paused";

  const sharedStyle: React.CSSProperties = {
    fontFamily: `"${fontFamily}", sans-serif`,
    fontSize: `${fontSize}px`,
    fontWeight,
    fontStyle,
    letterSpacing: `${letterSpacing}px`,
    lineHeight: 1,
    whiteSpace: "nowrap",
    display: "block",
  };

  // Animation properties are split into longhand fields below (not the
  // `animation` shorthand) so they can coexist with `animationPlayState`
  // without React warning about conflicting style updates on rerender.
  const strokeAnimProps: React.CSSProperties = {
    animationName: erasing ? `${uid}-erase` : `${uid}-draw`,
    animationDuration: erasing ? `${eraseDuration}s` : `${duration}s`,
    animationTimingFunction: "var(--ease-draw)",
    animationDelay: "0s",
    animationFillMode: "forwards",
    animationPlayState: playState,
  };
  const fillAnimProps: React.CSSProperties = {
    animationName: erasing ? `${uid}-erase` : `${uid}-draw`,
    animationDuration: erasing
      ? `${eraseDuration * 0.7}s`
      : `${duration}s`,
    animationTimingFunction: "var(--ease-draw)",
    animationDelay: erasing ? "0s" : `${fillDelay}s`,
    animationFillMode: "forwards",
    animationPlayState: playState,
  };

  return (
    <div
      style={{
        position: "relative",
        display: "inline-block",
        padding: `${fontSize * 0.15}px ${fontSize * 0.1}px`,
        maxWidth: "100%",
      }}
    >
      <style>{`
        @keyframes ${uid}-draw {
          from { clip-path: inset(-20% 100% -20% -20%); }
          to   { clip-path: inset(-20% -20% -20% -20%); }
        }
        @keyframes ${uid}-erase {
          from { clip-path: inset(-20% -20% -20% -20%); }
          to   { clip-path: inset(-20% -20% -20% 100%); }
        }
      `}</style>
      {/* Fragment keyed on sessionKey so the animated layers remount
          on every revisit — CSS animation restarts fresh. */}
      <Fragment key={sessionKey}>
        <div
          style={{
            ...sharedStyle,
            color: "transparent",
            WebkitTextStroke: `${strokeWidth}px ${color}`,
            clipPath: erasing
              ? "inset(-20% -20% -20% -20%)"
              : "inset(-20% 100% -20% -20%)",
            ...strokeAnimProps,
          }}
        >
          {text}
        </div>
        {fillAfter && (
          <div
            style={{
              ...sharedStyle,
              position: "absolute",
              top: `${fontSize * 0.15}px`,
              left: `${fontSize * 0.1}px`,
              color,
              clipPath: erasing
                ? "inset(-20% -20% -20% -20%)"
                : "inset(-20% 100% -20% -20%)",
              ...fillAnimProps,
            }}
          >
            {text}
          </div>
        )}
      </Fragment>
    </div>
  );
}

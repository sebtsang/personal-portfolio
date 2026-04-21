"use client";

import { useEffect, useState } from "react";

/**
 * Double-chevron pointing right, bobbing slightly left-right. Matches the
 * V3-stage1 chevron variant but rotated 90°, since the page now flips
 * forward (right-bound), not downward.
 */
export function ScrollCue({ delay = 3800 }: { delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), delay);
    return () => window.clearTimeout(t);
  }, [delay]);

  return (
    <div
      aria-hidden
      style={{
        opacity: show ? 1 : 0,
        transition: "opacity 0.6s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--fs-hint)",
          letterSpacing: "0.3em",
          color: "var(--color-ink-faint)",
          textTransform: "uppercase",
        }}
      >
        scroll
      </div>
      <svg
        width="28"
        height="20"
        viewBox="0 0 28 20"
        style={{ animation: "bobX 2s ease-in-out infinite" }}
      >
        {/* Two right-pointing chevrons, leading one darker */}
        <path
          d="M 4 2 L 12 10 L 4 18"
          stroke="var(--color-ink)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
        <path
          d="M 14 2 L 22 10 L 14 18"
          stroke="var(--color-ink)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
      </svg>
    </div>
  );
}

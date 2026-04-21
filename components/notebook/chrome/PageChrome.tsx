"use client";

import { useState } from "react";

/**
 * Paper edge shadow on the right + handwritten date top-left.
 * Sits above the paper but below interactive content.
 */
export function PageChrome({ showDate = true }: { showDate?: boolean }) {
  const [now] = useState(() => {
    const d = new Date();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  });

  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      {/* Right-edge shadow — makes the page feel like a sheet sitting on
          something. */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 40,
          background:
            "linear-gradient(to left, rgba(0,0,0,0.08), transparent)",
          opacity: 0.7,
        }}
      />

      {showDate && (
        <div
          style={{
            position: "absolute",
            top: 28,
            left: "max(90px, 8%)",
            fontFamily: "var(--font-script)",
            fontSize: "var(--fs-script)",
            color: "var(--color-ink)",
            opacity: 0.45,
            transform: "rotate(-2deg)",
            animation: "fadeIn 0.8s ease 0.6s both",
          }}
        >
          {now}
        </div>
      )}
    </div>
  );
}

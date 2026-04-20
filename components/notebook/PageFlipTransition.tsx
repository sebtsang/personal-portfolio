"use client";

import type { ReactNode } from "react";

/**
 * Right-bound book-page flip: the landing page rotates from right to left
 * around the left spine (rotateY, transform-origin at left-center), revealing
 * the next page beneath. 1.1s, cubic-bezier(0.76, 0, 0.24, 1).
 *
 * Uses plain CSS transitions (not framer-motion) so that onTransitionEnd
 * fires reliably — the shell uses it to drop the landing layer.
 *
 * The flipping element has two absolutely-positioned children: the FRONT
 * face (the landing itself, passed as children) and a BACK face with a
 * faint ghost of ruled lines to sell the paper's physicality.
 *
 * Spiral binding is rendered outside this component and does not animate.
 */
export function PageFlipTransition({
  flipping,
  onTransitionEnd,
  children,
}: {
  flipping: boolean;
  onTransitionEnd?: () => void;
  children: ReactNode;
}) {
  const progress = flipping ? 1 : 0;
  return (
    <div
      onTransitionEnd={(e) => {
        // Only the rotating layer's transform transition should count.
        if (e.propertyName !== "transform") return;
        onTransitionEnd?.();
      }}
      style={{
        position: "absolute",
        inset: 0,
        transformStyle: "preserve-3d",
        transformOrigin: "left center",
        transform: `rotateY(${progress * -180}deg)`,
        transition: "transform 1100ms cubic-bezier(0.76, 0, 0.24, 1)",
        filter:
          progress > 0 && progress < 1
            ? "drop-shadow(-20px 20px 40px rgba(0,0,0,0.25))"
            : "none",
        willChange: "transform",
        zIndex: 20,
      }}
    >
      {/* Front face — the landing content itself */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          background: "var(--color-paper)",
        }}
      >
        {children}
      </div>

      {/* Back face — blank back of the page with a faint ghost of ruled
          lines, visible briefly as the page flips past 90°. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          transform: "rotateY(180deg)",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.06) 0%, transparent 15%, transparent 100%), #f5f1e2",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.12,
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0, transparent 31px, #8a7a58 31px, #8a7a58 32px)",
          }}
        />
      </div>
    </div>
  );
}

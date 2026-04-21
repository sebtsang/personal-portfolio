"use client";

import type { ReactNode } from "react";

/**
 * Right-bound book-page flip: the landing page rotates around the left spine
 * (rotateY, transform-origin at left-center). 1.1s, cubic-bezier(0.76, 0, 0.24, 1).
 *
 * Uses plain CSS transitions (not framer-motion) so that onTransitionEnd
 * fires reliably — the shell uses it to drop the landing layer.
 *
 * Two directions:
 *   opening: 0° → -180°  (landing flips away, revealing chat beneath)
 *   closing: -180° → 0°  (back-face sweeps around, landing covers chat)
 *
 * Callers always transition `flipping` false → true to trigger the animation;
 * `direction` decides which angle pair that maps to. For closing, the
 * component therefore mounts with flipping=false and renders at -180° so
 * its ruled back-face sits over the chat; one frame later the caller sets
 * flipping=true and the CSS transition rotates it into view.
 *
 * The flipping element has two absolutely-positioned children: the FRONT
 * face (the landing itself, passed as children) and a BACK face with a
 * faint ghost of ruled lines to sell the paper's physicality.
 *
 * Spiral binding is rendered outside this component and does not animate.
 */
export function PageFlipTransition({
  flipping,
  direction = "opening",
  onTransitionEnd,
  children,
}: {
  flipping: boolean;
  direction?: "opening" | "closing";
  onTransitionEnd?: () => void;
  children: ReactNode;
}) {
  const angleDeg =
    direction === "closing"
      ? flipping
        ? 0
        : -180
      : flipping
        ? -180
        : 0;
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
        transform: `rotateY(${angleDeg}deg)`,
        transition: "transform 1100ms cubic-bezier(0.76, 0, 0.24, 1)",
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

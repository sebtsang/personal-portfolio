"use client";

import type { ReactNode } from "react";

/**
 * Right-bound book-page flip: a page rotates around the left spine
 * (rotateY, transform-origin at left-center).
 *
 * Two directions:
 *   opening: 0° → -180°   (page flips AWAY, revealing what's underneath)
 *   closing: -180° → 0°   (page rotates in from back, covering what's underneath)
 *
 * Default durations are tuned for the cover flip (opening = 1200ms eager,
 * closing = 1700ms settled), but any caller can override via `durationMs`.
 * FlipStage passes explicit values so forward content-nav = 1200ms (eager
 * reveal) and backward = 1700ms (deliberate) regardless of which direction
 * animates physically.
 *
 * Uses plain CSS transitions (not framer-motion) so that onTransitionEnd
 * fires reliably — the shell uses it to know when to drop the flip layer.
 *
 * Callers always transition `flipping` false → true to trigger the animation;
 * `direction` decides which angle pair that maps to.
 *
 * Two absolutely-positioned children inside: the FRONT face (the page
 * itself, passed as children) and a BACK face with a faint ghost of ruled
 * lines — what you see when the page rotates past 90°.
 */
export function PageFlipTransition({
  flipping,
  direction = "opening",
  durationMs,
  onTransitionEnd,
  children,
}: {
  flipping: boolean;
  direction?: "opening" | "closing";
  /** Override the default per-direction timing. */
  durationMs?: number;
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
  const ms =
    durationMs ?? (direction === "closing" ? 1700 : 1200);
  const easing =
    direction === "closing"
      ? "cubic-bezier(0.32, 0.72, 0.18, 1)"
      : "cubic-bezier(0.76, 0, 0.24, 1)";
  return (
    <div
      onTransitionEnd={(e) => {
        // Only the rotating layer's OWN transform transition should count.
        // Child transforms (Sticker tilts, RoleEntry reveals, etc.) also
        // bubble `transitionend` up to here and would otherwise fire
        // onTransitionEnd prematurely.
        if (e.target !== e.currentTarget) return;
        if (e.propertyName !== "transform") return;
        onTransitionEnd?.();
      }}
      style={{
        position: "absolute",
        inset: 0,
        transformStyle: "preserve-3d",
        transformOrigin: "left center",
        transform: `rotateY(${angleDeg}deg)`,
        transition: `transform ${ms}ms ${easing}`,
        willChange: "transform",
        zIndex: 20,
      }}
    >
      {/* Front face — the page content itself */}
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
          lines, visible briefly as the page rotates past 90°. */}
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

"use client";

/**
 * Vertical red margin rule at the chat-sidebar / content seam on content
 * pages. Double-rule styling (pair of thin red lines) matches the classic
 * notebook margin treatment on Paper. Spans the full viewport height.
 * Always visible — each content page is a static composition (no
 * sidebar-shrink animation to coordinate with), so no fade needed.
 */
export function SpreadMarginRule({
  leftPct,
}: {
  /** Horizontal position as a viewport percentage, e.g. 28. */
  leftPct: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: `calc(${leftPct}% - 4px)`,
        width: 4,
        pointerEvents: "none",
        zIndex: 3,
        backgroundImage: `linear-gradient(to right,
          rgba(220, 38, 38, 0.16) 0,
          rgba(220, 38, 38, 0.16) 1px,
          transparent 1px,
          transparent 3px,
          rgba(220, 38, 38, 0.32) 3px,
          rgba(220, 38, 38, 0.32) 4px)`,
      }}
    />
  );
}

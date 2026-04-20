"use client";

/**
 * Vertical red margin rule at the chat/content seam in split view.
 * Double-rule styling (pair of thin red lines) matches the classic
 * notebook margin treatment used by the standalone Paper component.
 * Spans the full viewport height; pointer-events: none.
 */
export function SpreadMarginRule({
  leftPct,
  visible,
}: {
  /** Horizontal position as a viewport percentage, e.g. 28. */
  leftPct: number;
  visible: boolean;
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
        opacity: visible ? 1 : 0,
        transition: "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)",
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

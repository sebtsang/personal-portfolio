"use client";

/**
 * Dog-eared bottom-right corner with the page number handwritten on the
 * fold. Reads as "this is a bookmarked page in a journal." Purely
 * decorative, pointer-events: none.
 */
export function PageCorner({
  pageNumber,
  size = 72,
}: {
  pageNumber: string;
  size?: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: size,
        height: size,
        pointerEvents: "none",
        zIndex: 4,
      }}
    >
      {/* Triangular "folded-over" corner. Using CSS borders so the edge
          is crisp and antialiased by the browser. */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          borderStyle: "solid",
          borderWidth: `0 0 ${size}px ${size}px`,
          borderColor: "transparent transparent #eae2cc transparent",
          filter: "drop-shadow(-1px -1px 2px rgba(0,0,0,0.12))",
        }}
      />
      {/* Subtle crease line along the diagonal where the fold hinges */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: size * 1.414,
          height: 1,
          background: "rgba(0,0,0,0.10)",
          transform: `translate(${-size * 0.207}px, ${-size * 0.5}px) rotate(-45deg)`,
          transformOrigin: "100% 50%",
        }}
      />
      {/* Page number handwritten on the fold, rotated to read along the
          diagonal. */}
      <div
        style={{
          position: "absolute",
          bottom: size * 0.18,
          right: size * 0.1,
          fontFamily: "var(--font-script)",
          fontSize: size * 0.24,
          color: "rgba(26, 26, 46, 0.55)",
          transform: "rotate(-45deg)",
          transformOrigin: "center",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        p.{pageNumber}
      </div>
    </div>
  );
}

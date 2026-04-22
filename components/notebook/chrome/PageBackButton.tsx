"use client";

/**
 * Top-left gutter button for closing a content page and returning to
 * the chat home. Handwritten "← home" followed by a small keyboard
 * badge hinting that `Esc` also works.
 */
export function PageBackButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Flip back to chat home (Escape)"
      style={{
        position: "absolute",
        // Baseline floats 0.19 × --line above rule 1 — matches the
        // sender-label offset in chat home. See CoverBackButton for
        // the full explanation.
        top: "calc(var(--line) * 1.57 - var(--fs-script) * 0.82)",
        left: "calc(3% + var(--pad-chrome))",
        background: "transparent",
        border: "none",
        padding: 0,
        display: "inline-flex",
        alignItems: "baseline",
        gap: 16,
        cursor: "pointer",
        lineHeight: 1,
        zIndex: 20,
      }}
      onMouseEnter={(e) => {
        const kbd = e.currentTarget.querySelector(
          "[data-kbd]",
        ) as HTMLElement | null;
        const label = e.currentTarget.querySelector(
          "[data-label]",
        ) as HTMLElement | null;
        if (label) label.style.opacity = "1";
        if (kbd) kbd.style.opacity = "0.9";
      }}
      onMouseLeave={(e) => {
        const kbd = e.currentTarget.querySelector(
          "[data-kbd]",
        ) as HTMLElement | null;
        const label = e.currentTarget.querySelector(
          "[data-label]",
        ) as HTMLElement | null;
        if (label) label.style.opacity = "0.7";
        if (kbd) kbd.style.opacity = "0.6";
      }}
    >
      {/* Handwritten "← home" */}
      <span
        data-label
        style={{
          fontFamily: "var(--font-script)",
          fontSize: "var(--fs-script)",
          color: "var(--color-ink-soft)",
          opacity: 0.7,
          transition: "opacity 180ms ease",
        }}
      >
        ← home
      </span>

      {/* kbd badge */}
      <span
        data-kbd
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--fs-kbd)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "var(--color-ink-faint)",
          opacity: 0.6,
          transition: "opacity 180ms ease",
          padding: "2px 6px",
          border: "1px solid color-mix(in srgb, var(--color-ink-faint) 40%, transparent)",
          borderRadius: 3,
          lineHeight: 1,
          transform: "translateY(-2px)",
        }}
      >
        esc
      </span>
    </button>
  );
}

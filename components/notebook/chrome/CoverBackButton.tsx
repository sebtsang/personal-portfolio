"use client";

export const CLOSE_JOURNAL_EVENT = "sebjournal:close-journal";

/**
 * Top-left back button for the chat home — returns the user to the
 * journal cover (landing). Mirrors PageBackButton's treatment so the
 * home page shares the chrome language of the content pages: handwritten
 * Caveat label, dashed underline affordance on hover.
 *
 * Dispatches a window event instead of navigating. NotebookShell listens
 * for it and plays the closing flip (-180° → 0°) in-place, then resets
 * chat state and pushState's the URL back to "/". Staying mounted keeps
 * the animation silky and avoids the Next router ↔ pushState desync risk
 * that previously forced a hard navigation.
 */
export function CoverBackButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(CLOSE_JOURNAL_EVENT));
        }
      }}
      aria-label="Close the journal and return to the cover"
      style={{
        position: "absolute",
        // Baseline floats 0.19 × --line above the rule below it — same
        // amount of breathing room the chat's SEBBOT / YOU sender labels
        // get (see NotebookMessage home-mode). Rule below the back button
        // sits at 1.76 × --line, so baseline target is 1.57 × --line.
        // With lineHeight:1, Caveat's baseline sits ~0.82 × fontSize
        // below the element's top.
        top: "calc(var(--line) * 1.57 - var(--fs-script) * 0.82)",
        // Sit just inside the red margin rule. Content pages use
        // `3% + 28px` because they're inside a narrower offset pane;
        // chat home is full-viewport, so we align with the chat-text
        // indent (12% + 20px) to land in the same visual column as
        // message text — which is also just to the right of the
        // vertical margin at ~12% viewport width.
        left: "calc(12% + var(--pad-content-lg))",
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
        const label = e.currentTarget.querySelector(
          "[data-label]",
        ) as HTMLElement | null;
        if (label) label.style.opacity = "1";
      }}
      onMouseLeave={(e) => {
        const label = e.currentTarget.querySelector(
          "[data-label]",
        ) as HTMLElement | null;
        if (label) label.style.opacity = "0.7";
      }}
    >
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
        ← cover
      </span>
    </button>
  );
}

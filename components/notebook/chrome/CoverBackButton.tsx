"use client";

/**
 * Top-left back button for the chat home — navigates to "/" (the
 * landing / journal cover). Mirrors PageBackButton's treatment so
 * the home page shares the chrome language of the content pages:
 * handwritten Caveat label, dashed underline affordance on hover.
 *
 * Uses window.location.href instead of Next router / <Link> because
 * the URL state on this app is maintained via a mix of Next's router
 * (palette + route changes) and raw window.history.pushState (the
 * URL-sync effect in NotebookShell, for smooth in-app transitions).
 * Those two can desync — Next thinks you're on /home while the URL
 * actually reads /contact — which makes Link navigation to "/"
 * intermittently not trigger. A hard navigation sidesteps all of
 * that: the browser unloads, / route loads fresh, landing plays.
 * Since we WANT the cover to be a full reset of the journal anyway,
 * the brief reload is semantically aligned with the metaphor.
 */
export function CoverBackButton() {
  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      }}
      aria-label="Go back to the journal cover"
      style={{
        position: "absolute",
        top: "calc(var(--line) * 1.25)",
        // Sit just inside the red margin rule. Content pages use
        // `3% + 28px` because they're inside a narrower offset pane;
        // chat home is full-viewport, so we align with the chat-text
        // indent (12% + 20px) to land in the same visual column as
        // message text — which is also just to the right of the
        // vertical margin at ~12% viewport width.
        left: "calc(12% + 20px)",
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

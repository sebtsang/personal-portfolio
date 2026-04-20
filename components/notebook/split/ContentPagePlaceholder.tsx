"use client";

import { useStageStore, type StageView } from "@/lib/store";
import { PageCorner } from "../chrome/PageCorner";
import { Paper } from "../chrome/Paper";

const LABELS: Record<StageView["kind"], string> = {
  empty: "",
  about: "about",
  experience: "experience",
  linkedin: "linkedin",
  contact: "contact",
};

// Page numbers for the dog-ear corner. Kept in narrative order.
const PAGE_NUMBERS: Record<StageView["kind"], string> = {
  empty: "",
  about: "01",
  experience: "02",
  linkedin: "03",
  contact: "04",
};

export function ContentPagePlaceholder({ onClose }: { onClose: () => void }) {
  const view = useStageStore((s) => s.view);
  const label = LABELS[view.kind] ?? "page";
  const pageNumber = PAGE_NUMBERS[view.kind] ?? "—";

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Paper ruled marginRule />

      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingTop: "calc(var(--line) * 3)",
          paddingBottom: "calc(var(--line) * 2)",
          paddingLeft: "calc(12% + 16px)",
          paddingRight: "8%",
          overflowY: "auto",
        }}
      >
        {/* Back button — top-left gutter, stacked above the page label */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Flip back to chat"
          style={{
            position: "absolute",
            top: "calc(var(--line) * 1.25)",
            left: "calc(3% + 28px)",
            background: "transparent",
            border: "none",
            fontFamily: "var(--font-script)",
            fontSize: 20,
            color: "var(--color-ink-soft)",
            opacity: 0.7,
            cursor: "pointer",
            padding: 0,
            lineHeight: 1,
            zIndex: 20,
            transition: "opacity 180ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
        >
          ← back
        </button>

        {/* Page label in the left gutter */}
        <div
          style={{
            position: "absolute",
            top: "calc(var(--line) * 2.5)",
            left: "calc(3% + 28px)",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color:
              "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
            lineHeight: "var(--line)",
          }}
        >
          journal · {label || "page"}
        </div>

        {/* Handwritten page title — clamp so it fits the narrow left pane */}
        <h1
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "clamp(48px, 9vw, 96px)",
            fontWeight: 500,
            color: "var(--color-ink)",
            margin: 0,
            lineHeight: "calc(var(--line) * 3)",
            wordBreak: "break-word",
          }}
        >
          {label}
        </h1>

        {/* Subline, handwritten */}
        <p
          style={{
            fontFamily: "var(--font-script)",
            fontSize: 26,
            fontWeight: 400,
            color: "var(--color-ink-soft)",
            opacity: 0.75,
            margin: 0,
            marginTop: "var(--line)",
            lineHeight: "var(--line)",
          }}
        >
          coming soon — Seb is still writing this page.
        </p>

        <p
          style={{
            fontFamily: "var(--font-script)",
            fontSize: 22,
            fontWeight: 400,
            color: "var(--color-ink-soft)",
            opacity: 0.55,
            margin: 0,
            marginTop: "calc(var(--line) * 2)",
            lineHeight: "var(--line)",
            maxWidth: 640,
          }}
        >
          ask more in the chat on the right, or hit{" "}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              opacity: 0.8,
            }}
          >
            esc
          </span>{" "}
          to close this page.
        </p>
      </div>

      {/* Dog-eared page bookmark in the bottom-right corner */}
      <PageCorner pageNumber={pageNumber} />
    </div>
  );
}

import Link from "next/link";

export const metadata = {
  title: "Page torn out — Sebastian Tsang",
  description: "This page is missing from the journal.",
};

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        background: "var(--color-paper)",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(to bottom, transparent 0, transparent 31px, color-mix(in srgb, var(--color-rule-navy) 18%, transparent) 31px, color-mix(in srgb, var(--color-rule-navy) 18%, transparent) 32px)",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "max(48px, 8vw)",
          top: 0,
          bottom: 0,
          width: 2,
          background: "var(--color-rule-red)",
          opacity: 0.45,
        }}
      />

      <article
        style={{
          position: "relative",
          maxWidth: 560,
          textAlign: "center",
          color: "var(--color-ink)",
          fontFamily: "var(--font-script)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--color-ink-faint)",
            marginBottom: 12,
          }}
        >
          404 · page torn out
        </p>
        <h1
          style={{
            fontSize: "clamp(48px, 8vw, 96px)",
            lineHeight: 1.05,
            margin: 0,
            color: "var(--color-ink)",
          }}
        >
          this page is missing from the journal
        </h1>
        <p
          style={{
            fontSize: "clamp(20px, 2.5vw, 28px)",
            lineHeight: 1.4,
            color: "var(--color-ink-soft)",
            marginTop: 24,
          }}
        >
          looks like someone tore it out. flip back to the cover and ask
          me anything instead.
        </p>
        <p style={{ marginTop: 32 }}>
          <Link
            href="/"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-rule-navy)",
              borderBottom: "1px solid var(--color-rule-navy)",
              paddingBottom: 2,
            }}
          >
            ← back to the cover
          </Link>
        </p>
      </article>
    </main>
  );
}

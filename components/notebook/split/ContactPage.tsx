"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { PageBackButton } from "../chrome/PageBackButton";
import { PageCorner } from "../chrome/PageCorner";
import { Paper } from "../chrome/Paper";

type ContactField = {
  label: string;
  display: string;
  href: string;
  icon: ReactNode;
};

const FIELDS: ContactField[] = [
  {
    label: "email",
    display: "sebrtsang@gmail.com",
    href: "mailto:sebrtsang@gmail.com",
    icon: <EnvelopeIcon />,
  },
  {
    label: "linkedin",
    display: "/in/sebtsang",
    href: "https://www.linkedin.com/in/sebtsang/",
    icon: <LinkedInIcon />,
  },
  {
    label: "github",
    display: "/sebtsang",
    href: "https://github.com/sebtsang",
    icon: <GitHubIcon />,
  },
  {
    label: "twitter / x",
    display: "@sebrtsang",
    href: "https://x.com/sebrtsang",
    icon: <XIcon />,
  },
];

export function ContactPage({ onClose }: { onClose: () => void }) {
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(null), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const onCopyEmail = async (e: React.MouseEvent) => {
    // Allow shift / meta clicks to still follow the mailto: link.
    if (e.shiftKey || e.metaKey || e.ctrlKey) return;
    try {
      await navigator.clipboard.writeText("sebrtsang@gmail.com");
      setCopied("email");
      e.preventDefault();
    } catch {
      // Fall through to the default mailto: link.
    }
  };

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Paper ruled marginRule={false} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingTop: "calc(var(--line) * 3)",
          paddingBottom: "calc(var(--line) * 3)",
          paddingLeft: "calc(12% + var(--pad-content))",
          paddingRight: "8%",
          overflowY: "auto",
        }}
      >
        <PageBackButton onClose={onClose} />

        {/* Page label */}
        <div
          style={{
            position: "absolute",
            top: "calc(var(--line) * 2.5)",
            left: "calc(3% + var(--pad-chrome))",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-meta)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color:
              "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
            lineHeight: "var(--line)",
          }}
        >
          journal · contact
        </div>

        {/* Page title */}
        <h1
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "var(--fs-display)",
            fontWeight: 500,
            color: "var(--color-ink)",
            margin: 0,
            lineHeight: "calc(var(--line) * 3)",
          }}
        >
          contact
        </h1>

        {/* Handwritten intro note */}
        <p
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "var(--fs-body)",
            fontWeight: 400,
            color: "var(--color-ink)",
            margin: 0,
            marginTop: "var(--line)",
            marginBottom: "calc(var(--line) * 2)",
            lineHeight: "var(--line)",
            maxWidth: 560,
          }}
        >
          easiest way to find me is email — I read everything that lands there.
          LinkedIn works too if that&apos;s your thing.
        </p>

        {/* Taped contact card */}
        <ContactCard fields={FIELDS} onEmailCopy={onCopyEmail} copied={copied} />

        {/* Signature */}
        <div
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "var(--fs-lg)",
            color: "var(--color-ink)",
            opacity: 0.85,
            marginTop: "calc(var(--line) * 2.5)",
            marginLeft: 12,
            transform: "rotate(-3deg)",
            display: "inline-block",
          }}
        >
          — seb
        </div>
      </div>

      <PageCorner pageNumber="04" />
    </div>
  );
}

// ── Contact card ──────────────────────────────────────────────────────

function ContactCard({
  fields,
  onEmailCopy,
  copied,
}: {
  fields: ContactField[];
  onEmailCopy: (e: React.MouseEvent) => void;
  copied: string | null;
}) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        maxWidth: 520,
        transform: `rotate(-1.5deg) scale(${hover ? 1.02 : 1})`,
        transition:
          "transform 320ms cubic-bezier(0.22, 1, 0.36, 1), filter 300ms ease",
        filter: hover
          ? "drop-shadow(5px 10px 18px rgba(0,0,0,0.22))"
          : "drop-shadow(3px 6px 12px rgba(0,0,0,0.16))",
      }}
    >
      {/* Card body — off-white index card */}
      <div
        style={{
          background: "#fbf7e9",
          padding: "28px 32px",
          border: "1px solid rgba(0,0,0,0.06)",
          position: "relative",
          // Faint index-card lines on the card itself
          backgroundImage:
            "linear-gradient(to bottom, transparent 27px, rgba(61,52,139,0.08) 28px, transparent 29px)",
          backgroundSize: "100% 30px",
        }}
      >
        {/* Header — small mono label + hand-drawn rule */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-meta)",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color:
              "color-mix(in srgb, var(--color-ink-soft) 60%, transparent)",
            marginBottom: 16,
          }}
        >
          get in touch
        </div>

        {/* Fields */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {fields.map((f) => (
            <FieldRow
              key={f.label}
              field={f}
              copyFeedback={copied === f.label ? "copied!" : null}
              onClick={f.label === "email" ? onEmailCopy : undefined}
            />
          ))}
        </div>
      </div>

      {/* Tape strips holding the card to the page */}
      <TapeStrip style={{ top: -10, left: "18%", transform: "rotate(-6deg)" }} />
      <TapeStrip style={{ top: -10, right: "15%", transform: "rotate(5deg)" }} />
    </div>
  );
}

function FieldRow({
  field,
  copyFeedback,
  onClick,
}: {
  field: ContactField;
  copyFeedback: string | null;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <a
      href={field.href}
      target={field.href.startsWith("http") ? "_blank" : undefined}
      rel={
        field.href.startsWith("http") ? "noopener noreferrer" : undefined
      }
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 16,
        padding: "6px 8px",
        margin: "-6px -8px",
        borderRadius: 4,
        textDecoration: "none",
        color: "inherit",
        transition: "background 180ms ease, transform 220ms ease",
        background: hover ? "rgba(26,26,46,0.04)" : "transparent",
        transform: hover ? "translateX(4px)" : "translateX(0)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          flexShrink: 0,
          width: 22,
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-ink-soft)",
          opacity: 0.8,
          transform: "translateY(3px)",
        }}
      >
        {field.icon}
      </div>

      {/* Label */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--fs-meta)",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color:
            "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
          minWidth: 90,
          transform: "translateY(-1px)",
        }}
      >
        {field.label}
      </div>

      {/* Value — handwritten */}
      <div
        style={{
          flex: 1,
          fontFamily: "var(--font-script)",
          fontSize: "var(--fs-body)",
          fontWeight: 500,
          color: "var(--color-ink)",
          lineHeight: 1.1,
          borderBottom: `1px dashed ${
            hover
              ? "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)"
              : "color-mix(in srgb, var(--color-ink-soft) 25%, transparent)"
          }`,
          paddingBottom: 2,
          transition: "border-color 180ms ease",
          wordBreak: "break-all",
        }}
      >
        {field.display}
      </div>

      {/* Copy feedback (only for email) */}
      {copyFeedback ? (
        <div
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "var(--fs-chip)",
            color: "var(--color-ink-soft)",
            opacity: 0.85,
            whiteSpace: "nowrap",
            animation: "fadeIn 0.25s ease both",
          }}
        >
          {copyFeedback}
        </div>
      ) : null}
    </a>
  );
}

function TapeStrip({ style }: { style: CSSProperties }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        width: 68,
        height: 20,
        background: "rgba(200, 230, 240, 0.55)",
        border: "1px solid rgba(0, 80, 120, 0.08)",
        backdropFilter: "blur(1px)",
        ...style,
      }}
    />
  );
}

// ── Icons ─────────────────────────────────────────────────────────────

function EnvelopeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <rect
        x="2"
        y="4.5"
        width="16"
        height="11"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M 2.5 5.5 L 10 11.5 L 17.5 5.5"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <rect
        x="2"
        y="2"
        width="16"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
      />
      <circle cx="6" cy="6.5" r="1" fill="currentColor" />
      <rect x="5.25" y="8.5" width="1.5" height="6" fill="currentColor" />
      <path
        d="M 9 8.5 L 9 14.5 M 9 10 Q 10.5 8.5 12 8.5 T 14.5 10.5 L 14.5 14.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <path
        d="M 10 2 C 5.6 2 2 5.6 2 10 c 0 3.5 2.3 6.5 5.5 7.5 0.4 0.1 0.5 -0.2 0.5 -0.4 l 0 -1.5 C 5.8 16.1 5.3 14.6 5.3 14.6 c -0.4 -0.9 -0.9 -1.1 -0.9 -1.1 c -0.7 -0.5 0.1 -0.5 0.1 -0.5 c 0.8 0.1 1.2 0.8 1.2 0.8 c 0.7 1.2 1.9 0.9 2.4 0.7 c 0.1 -0.5 0.3 -0.9 0.5 -1.1 c -1.8 -0.2 -3.6 -0.9 -3.6 -4 c 0 -0.9 0.3 -1.6 0.8 -2.2 c -0.1 -0.2 -0.4 -1 0.1 -2.1 c 0 0 0.7 -0.2 2.2 0.8 c 0.6 -0.2 1.3 -0.3 2 -0.3 s 1.4 0.1 2 0.3 c 1.5 -1 2.2 -0.8 2.2 -0.8 c 0.4 1.1 0.2 1.9 0.1 2.1 c 0.5 0.6 0.8 1.3 0.8 2.2 c 0 3.1 -1.9 3.8 -3.7 4 c 0.3 0.3 0.5 0.8 0.5 1.5 l 0 2.2 c 0 0.2 0.1 0.5 0.5 0.4 C 15.7 16.5 18 13.5 18 10 C 18 5.6 14.4 2 10 2 Z"
        fill="currentColor"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <path
        d="M 3 3 L 8.5 10.5 L 3 17 L 5 17 L 9.5 12 L 13 17 L 17 17 L 11 9.2 L 16.5 3 L 14.5 3 L 10.2 7.8 L 7 3 Z"
        fill="currentColor"
      />
    </svg>
  );
}

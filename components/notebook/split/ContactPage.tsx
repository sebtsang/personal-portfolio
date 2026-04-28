"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { PageBackButton } from "../chrome/PageBackButton";
import { PageCorner } from "../chrome/PageCorner";
import { Paper } from "../chrome/Paper";
import { HandwrittenText } from "../primitives/HandwrittenText";
import {
  PageAnimateContext,
  usePageAnimate,
} from "../primitives/PageAnimateContext";

type ContactField = {
  label: string;
  display: string;
  href: string;
  icon: ReactNode;
};

// Order matters — LinkedIn is Seb's preferred first-contact channel, so
// it sits at the top. Email is still available (click-to-copy kept for
// convenience) but lives at the bottom to subtly nudge visitors toward
// the DM path instead of cold-emailing gmail.
const FIELDS: ContactField[] = [
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
  {
    label: "email",
    display: "sebrtsang@gmail.com",
    href: "mailto:sebrtsang@gmail.com",
    icon: <EnvelopeIcon />,
  },
];

// Narrative timeline (t=0 = page is ready / flip-in complete).
// Card drop + tape → header pen-writes → field values pen-write
// staggered → signature pen-writes.
const CARD_PLACE_MS = 550;
const TAPE_POP_MS = 180;
const TAPE_1_DELAY = 550;
const TAPE_2_DELAY = 630;
const HEADER_DELAY = 900;
const FIELD_START_DELAY = 1050;
const FIELD_STAGGER = 200;
const SIGNATURE_DELAY = 1900;

export function ContactPage({
  onClose,
  animate = true,
  sessionKey = 0,
}: {
  onClose: () => void;
  animate?: boolean;
  sessionKey?: number;
}) {
  const isMobile = useIsMobile();
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
    <PageAnimateContext.Provider value={{ animate, sessionKey }}>
    <div style={{ position: "absolute", inset: 0 }}>
      <Paper ruled={false} marginRule={false} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingTop: "calc(var(--line) * 3)",
          paddingBottom: "calc(var(--line) * 3)",
          paddingLeft: isMobile
            ? "calc(var(--pad-content) + 44px)"
            : "calc(12% + var(--pad-content))",
          paddingRight: isMobile ? "var(--pad-content)" : "8%",
          overflowY: "auto",
          // Ruled lines travel with the content on scroll. background-
          // attachment: local binds the bg to the content so the rules
          // move together with the text — without it the bg sticks to
          // the scroll container and text drifts across fixed rules.
          backgroundImage: "var(--rule-background)",
          backgroundAttachment: "local",
        }}
      >
        <PageBackButton onClose={onClose} />

        {/* Page label */}
        <div
          style={{
            position: "absolute",
            // Baseline floats 0.19 × --line above rule 2.
            top: "calc(var(--line) * 2.57 - var(--fs-meta) * 0.86)",
            left: isMobile
              ? "calc(44px + var(--pad-content))"
              : "calc(3% + var(--pad-chrome))",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-meta)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color:
              "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
            lineHeight: 1,
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
          easiest way to reach me is LinkedIn DM — I read every one. email
          works too if that&apos;s your thing.
        </p>

        {/* Taped contact card */}
        <ContactCard
          key={sessionKey}
          fields={FIELDS}
          onEmailCopy={onCopyEmail}
          copied={copied}
        />

        {/* Signature — pen-writes last, after all fields have landed. */}
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
          <HandwrittenText text="— seb" delayMs={SIGNATURE_DELAY} />
        </div>
      </div>

      <PageCorner pageNumber="04" />
    </div>
    </PageAnimateContext.Provider>
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
  const isMobile = useIsMobile();
  const [hover, setHover] = useState(false);
  const pageAnimate = usePageAnimate();

  return (
    // Outer wrapper: plays the "placed onto the page" entry animation.
    // Keyframe fades in at the lifted starting pose (opacity 0→1 in the
    // first 20%) then settles onto the page with a slight overshoot on
    // the scale. Longhand animation properties rather than the `animation`
    // shorthand — mixing the shorthand with animationPlayState makes
    // React warn about conflicting style updates.
    <div
      style={{
        maxWidth: 520,
        animationName: "contactCardPlace",
        animationDuration: `${CARD_PLACE_MS}ms`,
        animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        animationDelay: "0ms",
        animationFillMode: "both",
        animationPlayState: pageAnimate ? "running" : "paused",
      }}
    >
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          position: "relative",
          transform: `scale(${hover ? 1.02 : 1})`,
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
            padding: isMobile ? "20px 16px" : "28px 32px",
            border: "1px solid rgba(0,0,0,0.06)",
            position: "relative",
            // Faint index-card lines on the card itself
            backgroundImage:
              "linear-gradient(to bottom, transparent 27px, rgba(61,52,139,0.08) 28px, transparent 29px)",
            backgroundSize: "100% 30px",
          }}
        >
          {/* Header — pen-writes after both tape strips land. */}
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
            <HandwrittenText text="get in touch" delayMs={HEADER_DELAY} />
          </div>

          {/* Fields — each value pen-writes, staggered row-by-row. */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {fields.map((f, i) => (
              <FieldRow
                key={f.label}
                field={f}
                valueDelayMs={FIELD_START_DELAY + i * FIELD_STAGGER}
                copyFeedback={copied === f.label ? "copied!" : null}
                onClick={f.label === "email" ? onEmailCopy : undefined}
              />
            ))}
          </div>
        </div>

        {/* Tape strips holding the card to the page — each pops on
            after the card lands, staggered 80ms so they affix one
            after the other. */}
        <TapeStrip
          style={{ top: -10, left: "18%" }}
          baseRotateDeg={-6}
          delayMs={TAPE_1_DELAY}
        />
        <TapeStrip
          style={{ top: -10, right: "15%" }}
          baseRotateDeg={5}
          delayMs={TAPE_2_DELAY}
        />
      </div>
    </div>
  );
}

function FieldRow({
  field,
  valueDelayMs,
  copyFeedback,
  onClick,
}: {
  field: ContactField;
  /** When this field's value (HandwrittenText) should start pen-writing. */
  valueDelayMs: number;
  copyFeedback: string | null;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const isMobile = useIsMobile();
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
        gap: isMobile ? 10 : 16,
        padding: isMobile ? "4px 4px" : "6px 8px",
        margin: isMobile ? "-4px -4px" : "-6px -8px",
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
          width: isMobile ? 18 : 22,
          height: isMobile ? 18 : 22,
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

      {/* Label — narrower on mobile so the value column has room for
          longer strings like the email address without breaking mid-word. */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--fs-meta)",
          letterSpacing: isMobile ? "0.18em" : "0.22em",
          textTransform: "uppercase",
          color:
            "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
          minWidth: isMobile ? 56 : 90,
          transform: "translateY(-1px)",
        }}
      >
        {field.label}
      </div>

      {/* Value — handwritten. overflowWrap: anywhere on mobile lets long
          values (the email) break at any point if they truly don't fit,
          but only as a last resort — break-all was forcing breaks even
          when the string would fit on one line. */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
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
          overflowWrap: "anywhere",
        }}
      >
        <HandwrittenText text={field.display} delayMs={valueDelayMs} />
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

function TapeStrip({
  style,
  baseRotateDeg,
  delayMs,
}: {
  style: CSSProperties;
  baseRotateDeg: number;
  delayMs: number;
}) {
  const pageAnimate = usePageAnimate();
  // Tape's baseline transform (`rotate(Xdeg)`) is exposed via a CSS
  // custom property so the pop keyframe can reference it in both
  // `from` and `to` states — the strip scales in while preserving its
  // tilt, rather than un-tilting during the animation.
  return (
    <div
      aria-hidden
      style={
        {
          position: "absolute",
          width: 68,
          height: 20,
          background: "rgba(200, 230, 240, 0.55)",
          border: "1px solid rgba(0, 80, 120, 0.08)",
          backdropFilter: "blur(1px)",
          ["--tape-base-transform" as string]: `rotate(${baseRotateDeg}deg)`,
          transform: `rotate(${baseRotateDeg}deg)`,
          animationName: "contactTapePop",
          animationDuration: `${TAPE_POP_MS}ms`,
          animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
          animationDelay: `${delayMs}ms`,
          animationFillMode: "both",
          animationPlayState: pageAnimate ? "running" : "paused",
          ...style,
        } as CSSProperties
      }
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

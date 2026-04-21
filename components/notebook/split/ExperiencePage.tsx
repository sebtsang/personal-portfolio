"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PageBackButton } from "../chrome/PageBackButton";
import { PageCorner } from "../chrome/PageCorner";
import { Paper } from "../chrome/Paper";

type Role = {
  company: string;
  title: string;
  dates: string;
  location?: string;
  logoSrc?: string;
  /** External URL the logo links to — the company's site. Optional so
   *  entries without a public link fall back to a non-interactive sticker. */
  companyUrl?: string;
  /** Fallback displayed in a sticker frame when no logo is available. */
  initials?: string;
  blurb: ReactNode;
  /** Rotation for the logo sticker, degrees. Tuned per role so the
   *  stickers don't all sit perfectly straight. */
  logoRotation: number;
  /** Background color for the sticker frame. Subtle variation per role. */
  stickerBg?: string;
};

/** Highlighted metric — same handwriting, slightly larger + heavier. */
function Metric({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: "1.18em",
        fontWeight: 600,
        color: "var(--color-ink)",
        letterSpacing: "-0.01em",
      }}
    >
      {children}
    </span>
  );
}

const ROLES: Role[] = [
  {
    company: "EY",
    title: "Incoming AI & Data Consultant",
    dates: "May 2026 – Sep 2026",
    location: "Toronto",
    logoSrc: "/logos/ey.jpeg",
    companyUrl: "https://www.ey.com/en_ca",
    logoRotation: -4,
    blurb: <>Incoming on the AI &amp; Data team.</>,
  },
  {
    company: "Polarity",
    title: "AI Engineer",
    dates: "Apr 2026 – Present",
    location: "Waterloo",
    logoSrc: "/logos/polarity.jpeg",
    companyUrl: "https://www.polarity.so/",
    logoRotation: 5,
    blurb: (
      <>
        Frontier AI QA research backed by Afore Capital — fellowship founding
        cohort.
      </>
    ),
  },
  {
    company: "BMO",
    title: "Data & AI Developer",
    dates: "Jan 2026 – Apr 2026",
    location: "Toronto",
    logoSrc: "/logos/bmo.jpeg",
    companyUrl: "https://www.bmo.com/en-ca/main/personal",
    logoRotation: -3,
    blurb: (
      <>
        Powering AI-ready data pipelines behind banking apps used by{" "}
        <Metric>millions</Metric>.
      </>
    ),
  },
  {
    company: "Stan",
    title: "Growth Fellow",
    dates: "Mar 2026 – Apr 2026",
    location: "Toronto",
    logoSrc: "/logos/stan.jpeg",
    companyUrl: "https://www.stan.store/",
    logoRotation: 6,
    stickerBg: "#efe8fb",
    blurb: (
      <>
        Creator platform backed by Gary Vee, Steven Bartlett, Forerunner —
        helping scale toward <Metric>$10M ARR</Metric>.
      </>
    ),
  },
  {
    company: "Interac",
    title: "Data Engineering Intern",
    dates: "May 2025 – Aug 2025",
    location: "Toronto",
    logoSrc: "/logos/interac.jpeg",
    companyUrl: "https://www.interac.ca/en/",
    logoRotation: -5,
    blurb: (
      <>
        Built pipelines powering Canada&apos;s payment rails — improved root
        cause analysis by <Metric>40%</Metric>.
      </>
    ),
  },
  {
    company: "Interac",
    title: "Data Analyst, IT Operations",
    dates: "Sep 2024 – Apr 2025",
    location: "Toronto",
    logoSrc: "/logos/interac.jpeg",
    companyUrl: "https://www.interac.ca/en/",
    logoRotation: 3,
    blurb: (
      <>
        Automated IT ops reporting — cut manual work by <Metric>80%</Metric>.
        First-ever Intern of the Quarter.
      </>
    ),
  },
  {
    company: "Toastmasters",
    title: "President",
    dates: "May 2024 – Apr 2025",
    location: "Guelph",
    logoSrc: "/logos/toastmasters.jpeg",
    companyUrl: "https://www.toastmasters.org/",
    logoRotation: -4,
    blurb: (
      <>
        Ran the UofG Toastmasters club — helping students who were terrified to
        present stop being terrified.
      </>
    ),
  },
  {
    company: "Spirit of Math",
    title: "Data Engineering Intern",
    dates: "May 2024 – Aug 2024",
    location: "Toronto",
    logoSrc: "/logos/spirit-of-math.jpeg",
    companyUrl: "https://spiritofmath.com/",
    logoRotation: 4,
    blurb: <>Built the data backbone for a new ERP — finance ops ran smoother for it.</>,
  },
  {
    company: "Spirit of Math",
    title: "Technical Analyst Intern",
    dates: "May 2023 – Aug 2023",
    location: "Toronto",
    logoSrc: "/logos/spirit-of-math.jpeg",
    companyUrl: "https://spiritofmath.com/",
    logoRotation: -6,
    blurb: (
      <>
        Designed a centralized access system — APIs and automation keeping IT
        processes simple.
      </>
    ),
  },
];

const ROLE_STAGGER_MS = 380;
const FIRST_ROLE_DELAY_MS = 400;

export function ExperiencePage({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Paper ruled marginRule={false} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingTop: "calc(var(--line) * 3)",
          paddingBottom: "calc(var(--line) * 3)",
          paddingLeft: "calc(12% + 16px)",
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
            left: "calc(3% + 28px)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-meta)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color:
              "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
            lineHeight: "var(--line)",
          }}
        >
          journal · experience
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
          experience
        </h1>

        {/* Vertical-spine timeline */}
        <div
          style={{
            position: "relative",
            marginTop: "var(--line)",
            paddingLeft: 56,
          }}
        >
          {/* Hand-drawn spine — a slightly wavy ink line down the left.
              Using SVG so it feels drawn rather than machined. */}
          <Spine />

          {ROLES.map((role, i) => (
            <RoleEntry
              key={`${role.company}-${role.title}`}
              role={role}
              delayMs={FIRST_ROLE_DELAY_MS + i * ROLE_STAGGER_MS}
            />
          ))}
        </div>
      </div>

      <PageCorner pageNumber="02" />
    </div>
  );
}

// ── Spine ─────────────────────────────────────────────────────────────

function Spine() {
  // A thin vertical line at x=20 with a subtle wobble so it reads as
  // hand-drawn rather than CSS. Uses CSS repeating-linear-gradient for
  // a pen-ink texture + a tiny horizontal wobble via clip-path curves.
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        left: 20,
        top: 0,
        bottom: 0,
        width: 2,
        background:
          "linear-gradient(to bottom, rgba(26,26,46,0) 0, rgba(26,26,46,0.28) 8px, rgba(26,26,46,0.28) calc(100% - 8px), rgba(26,26,46,0) 100%)",
      }}
    />
  );
}

// ── Role entry ────────────────────────────────────────────────────────

function RoleEntry({ role, delayMs }: { role: Role; delayMs: number }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShown(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs]);

  return (
    <div
      style={{
        position: "relative",
        marginBottom: "calc(var(--line) * 2.5)",
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(12px)",
        transition:
          "opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), transform 520ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      {/* Node dot on the spine */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: -43,
          top: "calc(var(--line) * 0.55)",
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: "var(--color-ink)",
          border: "2.5px solid var(--color-paper)",
          boxShadow: "0 0 0 1px rgba(26,26,46,0.25)",
        }}
      />

      {/* Header row: dates + company + logo sticker */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 4,
          minHeight: "calc(var(--line) * 2)",
        }}
      >
        <LogoSticker role={role} />
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Dates — small, mono, ink-faint */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--fs-hint)",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "var(--color-ink-faint)",
              lineHeight: "var(--line)",
            }}
          >
            {role.dates}
            {role.location ? (
              <span style={{ opacity: 0.6 }}> · {role.location}</span>
            ) : null}
          </div>
          {/* Company name — big handwriting */}
          <div
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "var(--fs-md)",
              fontWeight: 500,
              color: "var(--color-ink)",
              lineHeight: "var(--line)",
            }}
          >
            {role.company}
          </div>
          {/* Role title — italic Caveat, a shade softer */}
          <div
            style={{
              fontFamily: "var(--font-script)",
              fontSize: "var(--fs-script)",
              fontStyle: "italic",
              color: "var(--color-ink-soft)",
              lineHeight: "var(--line)",
            }}
          >
            {role.title}
          </div>
        </div>
      </div>

      {/* Blurb — sits on the ruled grid */}
      <div
        style={{
          fontFamily: "var(--font-script)",
          fontSize: "var(--fs-script)",
          fontWeight: 400,
          color: "var(--color-ink)",
          lineHeight: "var(--line)",
          maxWidth: 560,
          marginTop: 2,
        }}
      >
        {role.blurb}
      </div>
    </div>
  );
}

// ── Logo sticker ──────────────────────────────────────────────────────

function LogoSticker({ role }: { role: Role }) {
  const size = 64;
  const bg = role.stickerBg ?? "#fbfaf4";

  const inner = (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: bg,
        padding: 4,
        border: "1px solid rgba(0,0,0,0.06)",
        borderRadius: 6,
        overflow: "hidden",
      }}
    >
      {role.logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={role.logoSrc}
          alt={`${role.company} logo`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
          draggable={false}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-script)",
            fontSize: "var(--fs-body)",
            fontWeight: 500,
            color: "var(--color-ink)",
            opacity: 0.75,
          }}
        >
          {role.initials ?? role.company.slice(0, 2).toUpperCase()}
        </div>
      )}
    </div>
  );

  const baseStyle: React.CSSProperties = {
    display: "block",
    width: size,
    height: size,
    flexShrink: 0,
    transform: `rotate(${role.logoRotation}deg)`,
    filter: "drop-shadow(2px 3px 6px rgba(0,0,0,0.22))",
    transition:
      "transform 260ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease",
    cursor: role.companyUrl ? "pointer" : "default",
    textDecoration: "none",
    color: "inherit",
  };

  const onEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = `rotate(${role.logoRotation}deg) scale(1.06)`;
    e.currentTarget.style.filter =
      "drop-shadow(3px 5px 9px rgba(0,0,0,0.28))";
  };
  const onLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.transform = `rotate(${role.logoRotation}deg) scale(1)`;
    e.currentTarget.style.filter =
      "drop-shadow(2px 3px 6px rgba(0,0,0,0.22))";
  };

  // Wrap in an <a> when a companyUrl is present, otherwise fall back to a
  // non-interactive div so the sticker is a keyboard-accessible link only
  // when it has somewhere to go.
  if (role.companyUrl) {
    return (
      <a
        href={role.companyUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${role.company} website (opens in new tab)`}
        style={baseStyle}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        {inner}
      </a>
    );
  }

  return (
    <div style={baseStyle} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      {inner}
    </div>
  );
}

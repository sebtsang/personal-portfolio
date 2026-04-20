"use client";

import {
  useCallback,
  useEffect,
  useState,
  type CSSProperties,
} from "react";
import { PageBackButton } from "../chrome/PageBackButton";
import { PageCorner } from "../chrome/PageCorner";
import { Paper } from "../chrome/Paper";

type Post = {
  url: string;
  heroSrc: string;
  /** Short handwritten caption / pull-quote for the card. */
  caption: string;
  /** Rotation for the top-stack position, degrees. */
  rotation: number;
};

const POSTS: Post[] = [
  {
    url: "https://www.linkedin.com/posts/sebtsang_hey-linkedin-im-seb-and-i-almost-dropped-activity-7433329890743144448-4-b9",
    heroSrc: "/linkedin/post1.png",
    caption: "hey LinkedIn, I'm Seb",
    rotation: -3,
  },
  {
    url: "https://www.linkedin.com/posts/sebtsang_a-40-gpa-got-me-zero-interviews-for-two-activity-7437915141200957440-75-N",
    heroSrc: "/linkedin/post2.png",
    caption: "a 4.0 got me zero interviews",
    rotation: 4,
  },
  {
    url: "https://www.linkedin.com/posts/sebtsang_ai-is-gonna-take-your-job-so-i-spent-700-activity-7450181201467904000-oedN",
    heroSrc: "/linkedin/post3.png",
    caption: "$700 Mac mini vs AI",
    rotation: -2,
  },
  {
    url: "https://www.linkedin.com/posts/sebtsang_i-went-from-0-interviews-to-30-in-3-months-activity-7443285695604887552-x8in",
    heroSrc: "/linkedin/post4.png",
    caption: "0 → 30 interviews",
    rotation: 3,
  },
  {
    url: "https://www.linkedin.com/posts/sebtsang_i-stood-in-the-corner-of-a-networking-event-activity-7440751557433802752-UDCV",
    heroSrc: "/linkedin/post5.png",
    caption: "networking in the corner",
    rotation: -4,
  },
];

const CARD_WIDTH = 380;

export function LinkedInPage({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);

  const next = useCallback(
    () => setIndex((i) => (i + 1) % POSTS.length),
    [],
  );
  const prev = useCallback(
    () => setIndex((i) => (i - 1 + POSTS.length) % POSTS.length),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Paper ruled marginRule />

      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingTop: "calc(var(--line) * 3)",
          paddingBottom: "calc(var(--line) * 3)",
          paddingLeft: "calc(12% + 16px)",
          paddingRight: "8%",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
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
            fontSize: 10,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color:
              "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
            lineHeight: "var(--line)",
          }}
        >
          journal · linkedin
        </div>

        {/* Page title */}
        <h1
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "clamp(56px, 9vw, 96px)",
            fontWeight: 500,
            color: "var(--color-ink)",
            margin: 0,
            lineHeight: "calc(var(--line) * 3)",
          }}
        >
          linkedin
        </h1>

        {/* Subline */}
        <p
          style={{
            fontFamily: "var(--font-script)",
            fontSize: 22,
            color: "var(--color-ink-soft)",
            opacity: 0.75,
            margin: 0,
            marginTop: 2,
            marginBottom: "var(--line)",
            lineHeight: "var(--line)",
            maxWidth: 560,
          }}
        >
          a few favourites — click the card to open the full post.
        </p>

        {/* Stacked card carousel */}
        <div
          style={{
            position: "relative",
            flex: 1,
            minHeight: 480,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
          }}
        >
          <NavArrow direction="prev" onClick={prev} />

          <div
            style={{
              position: "relative",
              width: CARD_WIDTH,
              height: 440,
              perspective: "1800px",
            }}
          >
            {POSTS.map((post, i) => (
              <PostCard
                key={post.url}
                post={post}
                offset={computeOffset(i, index, POSTS.length)}
                onClick={() => {
                  // If clicking a non-top card, bring it to front rather
                  // than opening immediately — feels like "flipping to it."
                  if (i !== index) {
                    setIndex(i);
                    return false;
                  }
                  return true;
                }}
              />
            ))}
          </div>

          <NavArrow direction="next" onClick={next} />
        </div>

        {/* Position indicator */}
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color:
              "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
            textAlign: "center",
            marginTop: "var(--line)",
            lineHeight: "var(--line)",
          }}
        >
          {String(index + 1).padStart(2, "0")} / {String(POSTS.length).padStart(2, "0")}
          <span style={{ marginLeft: 16, opacity: 0.7 }}>
            ← → to flip
          </span>
        </div>
      </div>

      <PageCorner pageNumber="03" />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Signed offset from the current card. Positive = ahead of current;
 * negative = behind. Handles wraparound by preferring the shorter
 * direction, so the stack feels circular.
 */
function computeOffset(i: number, current: number, total: number): number {
  let d = i - current;
  if (d > total / 2) d -= total;
  if (d < -total / 2) d += total;
  return d;
}

// ── Post card ─────────────────────────────────────────────────────────

function PostCard({
  post,
  offset,
  onClick,
}: {
  post: Post;
  offset: number;
  /** Returns true to allow the link navigation, false to intercept. */
  onClick: () => boolean;
}) {
  const isActive = offset === 0;
  const absOff = Math.abs(offset);

  // Cards behind the active one peek out from underneath, rotated and
  // shifted. Anything more than 2 away hides (opacity 0) so the stack
  // doesn't feel bottomless.
  const translateX = offset * 28;
  const translateY = absOff * 8;
  const scale = 1 - absOff * 0.04;
  const rotation = isActive ? post.rotation : post.rotation + offset * 2;
  const opacity = absOff > 2 ? 0 : 1 - absOff * 0.18;

  const base: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    display: "block",
    textDecoration: "none",
    color: "inherit",
    transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg) scale(${scale})`,
    transformOrigin: "center center",
    opacity,
    transition:
      "transform 520ms cubic-bezier(0.22, 1, 0.36, 1), opacity 520ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease",
    filter: isActive
      ? "drop-shadow(6px 12px 22px rgba(0,0,0,0.26))"
      : "drop-shadow(3px 6px 14px rgba(0,0,0,0.18))",
    pointerEvents: opacity > 0 ? "auto" : "none",
    zIndex: 10 - absOff,
    cursor: "pointer",
  };

  return (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open LinkedIn post: ${post.caption}`}
      onClick={(e) => {
        const allowNav = onClick();
        if (!allowNav) e.preventDefault();
      }}
      style={base}
    >
      {/* Polaroid frame */}
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#fbfaf4",
          padding: "14px 14px 52px 14px",
          border: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
          position: "relative",
        }}
      >
        {/* Hero image — contain so full post preview is visible */}
        <div
          style={{
            flex: 1,
            position: "relative",
            background: "#e8e3d5",
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.heroSrc}
            alt={post.caption}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
            }}
            draggable={false}
          />
        </div>

        {/* Handwritten caption underneath */}
        <div
          style={{
            fontFamily: "var(--font-script)",
            fontSize: 22,
            lineHeight: 1.1,
            color: "var(--color-ink)",
            opacity: 0.85,
            textAlign: "center",
          }}
        >
          {post.caption}
        </div>

        {/* Tiny "open ↗" hint in the corner */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 12,
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color:
              "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
            pointerEvents: "none",
          }}
        >
          open ↗
        </div>
      </div>

      {/* Tape strip along the top */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -10,
          left: "50%",
          transform: "translateX(-50%) rotate(-4deg)",
          width: 80,
          height: 20,
          background: "rgba(200, 230, 240, 0.55)",
          border: "1px solid rgba(0, 80, 120, 0.08)",
          backdropFilter: "blur(1px)",
        }}
      />
    </a>
  );
}

// ── Nav arrow ─────────────────────────────────────────────────────────

function NavArrow({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "prev" ? "Previous post" : "Next post"}
      style={{
        flexShrink: 0,
        background: "transparent",
        border: "none",
        padding: 12,
        cursor: "pointer",
        fontFamily: "var(--font-script)",
        fontSize: 36,
        color: "var(--color-ink-soft)",
        opacity: 0.55,
        lineHeight: 1,
        transition: "opacity 180ms ease, transform 180ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "1";
        e.currentTarget.style.transform =
          direction === "prev" ? "translateX(-2px)" : "translateX(2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "0.55";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      {direction === "prev" ? "←" : "→"}
    </button>
  );
}

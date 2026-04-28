"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { PageBackButton } from "../chrome/PageBackButton";
import { PageCorner } from "../chrome/PageCorner";
import { Paper } from "../chrome/Paper";
import {
  PageAnimateContext,
  usePageAnimate,
} from "../primitives/PageAnimateContext";

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
    caption: "I spent $700 on a Mac Mini",
    rotation: -2,
  },
  {
    url: "https://www.linkedin.com/posts/sebtsang_i-went-from-0-interviews-to-30-in-3-months-activity-7443285695604887552-x8in",
    heroSrc: "/linkedin/post4.png",
    caption: "lessons from 30 interviews",
    rotation: 3,
  },
  {
    url: "https://www.linkedin.com/posts/sebtsang_i-stood-in-the-corner-of-a-networking-event-activity-7440751557433802752-UDCV",
    heroSrc: "/linkedin/post5.png",
    caption: "stood in the corner of a networking event",
    rotation: -4,
  },
];

const CARD_WIDTH = 400;
const CARD_HEIGHT = 460;
// Mobile: card sized to leave room for prev/next arrows + breathing room.
// 4:5-ish aspect mirrors desktop.
const MOBILE_CARD_WIDTH = 240;
const MOBILE_CARD_HEIGHT = 300;
const SWIPE_THRESHOLD_PX = 60;

// Fade-in choreography: each card appears in place, strictly one at a
// time, back-to-front with a left-then-right tiebreak within each depth.
// 5 slots × 150ms stagger + 400ms fade = ~1s total timeline.
const CARD_FADE_MS = 400;
const CARD_STAGGER_MS = 150;

function cardFadeDelay(offset: number): number {
  // Slot by depth (deepest first), with left (negative offset) before
  // right (positive offset) within the same depth:
  //   offset=-2 → 0ms      offset=+2 → 150ms
  //   offset=-1 → 300ms    offset=+1 → 450ms
  //   offset= 0 → 600ms
  const absOff = Math.abs(offset);
  const base = (2 - Math.min(absOff, 2)) * CARD_STAGGER_MS * 2;
  const sideBump = absOff > 0 && offset > 0 ? CARD_STAGGER_MS : 0;
  return base + sideBump;
}

export function LinkedInPage({
  onClose,
  animate = true,
  sessionKey = 0,
}: {
  onClose: () => void;
  animate?: boolean;
  sessionKey?: number;
}) {
  const isMobile = useIsMobile();
  const [index, setIndex] = useState(0);
  const cardWidth = isMobile ? MOBILE_CARD_WIDTH : CARD_WIDTH;
  const cardHeight = isMobile ? MOBILE_CARD_HEIGHT : CARD_HEIGHT;

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

  // Touch swipe — horizontal swipe past SWIPE_THRESHOLD_PX advances the
  // carousel. Mirrors the landing page's swipe pattern in NotebookShell.
  // Bound to the carousel container only so swipes outside don't trigger.
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    swipeStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0) next();
    else prev();
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
          display: "flex",
          flexDirection: "column",
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
          journal · linkedin
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
          linkedin
        </h1>

        {/* Subline */}
        <p
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "var(--fs-script)",
            color: "var(--color-ink-soft)",
            opacity: 0.75,
            margin: 0,
            marginBottom: "var(--line)",
            lineHeight: "var(--line)",
            maxWidth: 560,
          }}
        >
          a few favourites — click the card to open the full post.
        </p>

        {/* Stacked card carousel */}
        <div
          onTouchStart={isMobile ? onTouchStart : undefined}
          onTouchEnd={isMobile ? onTouchEnd : undefined}
          style={{
            position: "relative",
            // Snap to baseline grid so the indicator below lands on a
            // rule. Mobile: shorter container scaled to the 300px card.
            height: isMobile ? "calc(var(--line) * 13)" : "calc(var(--line) * 17)",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isMobile ? 8 : 60,
          }}
        >
          <NavArrow direction="prev" onClick={prev} compact={isMobile} />

          <div
            style={{
              position: "relative",
              width: cardWidth,
              height: cardHeight,
              perspective: "1800px",
              flexShrink: 0,
            }}
          >
            {POSTS.map((post, i) => {
              const offset = computeOffset(i, index, POSTS.length);
              const absOff = Math.abs(offset);
              const fadeDelay = cardFadeDelay(offset);
              // z-index lives on the wrapper (not on PostCard). The
              // wrapper's opacity animation creates a stacking context
              // while playing (opacity < 1), so without this the
              // PostCard's own z-index would be trapped inside and
              // siblings couldn't compete for stacking order.
              return (
                <CardFadeWrapper
                  key={`${sessionKey}-${post.url}`}
                  delayMs={fadeDelay}
                  zIndex={10 - absOff}
                >
                  <PostCard
                    post={post}
                    offset={offset}
                    compact={isMobile}
                    onClick={() => {
                      // If clicking a non-top card, bring it to front
                      // rather than opening immediately — feels like
                      // "flipping to it."
                      if (i !== index) {
                        setIndex(i);
                        return false;
                      }
                      return true;
                    }}
                  />
                </CardFadeWrapper>
              );
            })}
          </div>

          <NavArrow direction="next" onClick={next} compact={isMobile} />
        </div>

        {/* Position indicator */}
        <div
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "var(--fs-script)",
            color: "var(--color-ink-soft)",
            opacity: 0.75,
            textAlign: "center",
            marginTop: "var(--line)",
            lineHeight: "var(--line)",
          }}
        >
          {index + 1} / {POSTS.length}
          <span style={{ marginLeft: 16, opacity: 0.75 }}>
            {isMobile ? "swipe to flip" : "← → to flip"}
          </span>
        </div>
      </div>

      <PageCorner pageNumber="03" />
    </div>
    </PageAnimateContext.Provider>
  );
}

// ── Card fade wrapper ─────────────────────────────────────────────────

/** Absolute-positioned wrapper that fades a card in at its final stacked
 *  position on mount. Pauses while the host page is held via
 *  PageAnimateContext; resumes once the flip-in lands so the
 *  back-to-front stagger begins from a visible starting frame.
 *
 *  Animation properties are set as longhand (animationName, -Duration,
 *  etc.) rather than the `animation` shorthand, because mixing the
 *  shorthand with `animationPlayState` makes React warn about style
 *  conflicts — the shorthand resets animation-play-state on every
 *  render, which races with the longhand. */
function CardFadeWrapper({
  delayMs,
  zIndex,
  children,
}: {
  delayMs: number;
  zIndex: number;
  children: React.ReactNode;
}) {
  const pageAnimate = usePageAnimate();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex,
        animationName: "linkedinCardDrop",
        animationDuration: `${CARD_FADE_MS}ms`,
        animationTimingFunction: "ease-out",
        animationDelay: `${delayMs}ms`,
        animationFillMode: "both",
        animationPlayState: pageAnimate ? "running" : "paused",
      }}
    >
      {children}
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
  compact = false,
  onClick,
}: {
  post: Post;
  offset: number;
  /** Tighter sibling-card offsets when the card itself is small (mobile). */
  compact?: boolean;
  /** Returns true to allow the link navigation, false to intercept. */
  onClick: () => boolean;
}) {
  const isActive = offset === 0;
  const absOff = Math.abs(offset);

  // Cards behind the active one peek out from underneath, rotated and
  // shifted. Anything more than 2 away hides (opacity 0) so the stack
  // doesn't feel bottomless. Mobile uses smaller offsets to stay inside
  // the narrower card container.
  const translateX = offset * (compact ? 18 : 28);
  const translateY = absOff * (compact ? 6 : 8);
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
          padding: "var(--pad-chip-wide) var(--pad-chip-wide) 52px var(--pad-chip-wide)",
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
            fontSize: "var(--fs-script)",
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
            fontSize: "var(--fs-kbd)",
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

      {/* Tape strip along the top — static; opacity is inherited from the
          CardFadeWrapper's fade so it appears together with its card. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -10,
          left: "50%",
          width: 80,
          height: 20,
          background: "rgba(200, 230, 240, 0.55)",
          border: "1px solid rgba(0, 80, 120, 0.08)",
          backdropFilter: "blur(1px)",
          transform: "translateX(-50%) rotate(-4deg)",
        }}
      />
    </a>
  );
}

// ── Nav arrow ─────────────────────────────────────────────────────────

function NavArrow({
  direction,
  onClick,
  compact = false,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  compact?: boolean;
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
        padding: compact ? 6 : 12,
        cursor: "pointer",
        fontFamily: "var(--font-script)",
        fontSize: compact ? "var(--fs-md)" : "var(--fs-lg)",
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

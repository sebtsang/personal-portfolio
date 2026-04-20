"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PageCorner } from "../chrome/PageCorner";
import { Paper } from "../chrome/Paper";
import { DrawnText } from "../primitives/DrawnText";
import { HandwrittenText } from "../primitives/HandwrittenText";
import { Sticker } from "../primitives/Sticker";

const BODY_PARAGRAPHS = [
  "4th-year CS at the University of Guelph, Toronto-based. I spend way too much time building AI workflows that actually ship — the kind where you replace a manual process with something you only have to fix twice a year.",
  "Career path so far: data analyst → data engineer → AI developer → incoming AI consultant at EY. I kept picking the hardest piece of each role I could get away with, and somewhere along the way I stopped being the person writing the SQL and started being the person designing the thing that writes the SQL.",
  "Outside of that: basketball (90% chance I smoke you), too much coffee, and an unfortunate hobby of building overengineered side projects because they're \"fun.\" This site is the latest one. Claude Code, two evenings, aggressively overengineered. That's the feature.",
];

type Polaroid = {
  src: string;
  caption: string;
  rotation: number; // degrees
  top: number; // px from top of content
  right: number | string; // px or percentage from right of content area
  width: number;
};

// Right-side polaroids — positioned absolutely inside the content area so
// body text wraps in its own column to their left.
// Zig-zag scatter within the right gutter — varying top, right, and
// rotation so photos don't feel like a stacked column.
const POLAROIDS: Polaroid[] = [
  {
    src: "/photos/seb-1.jpg",
    caption: "garry point park",
    rotation: 4.5,
    top: 160,
    right: 40,
    width: 210,
  },
  {
    src: "/photos/seb-2.jpg",
    caption: "pool",
    rotation: -6,
    top: 560,
    right: 130,
    width: 200,
  },
  {
    src: "/photos/seb-3.jpg",
    caption: "cleveland dam",
    rotation: 2.5,
    top: 960,
    right: 30,
    width: 220,
  },
];

const MARGIN_NOTES: Array<{
  text: string;
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  delayMs: number;
}> = [
  {
    text: "coffee ratio:\n3 : 1 on a good day",
    top: "44%",
    left: "3.5%",
    rotate: -7,
    delayMs: 1800,
  },
  {
    text: "basketball:\n80-90% smoke rate",
    top: "68%",
    left: "4%",
    rotate: 5,
    delayMs: 2400,
  },
];

export function AboutPage({ onClose }: { onClose: () => void }) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Paper ruled marginRule />

      {/* Scrolling content area */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingTop: "calc(var(--line) * 3)",
          paddingBottom: "calc(var(--line) * 3)",
          paddingLeft: "calc(12% + 16px)",
          paddingRight: "8%",
          overflowY: "auto",
          // Ruled lines travel with the content (same trick as the chat)
          backgroundImage:
            "linear-gradient(to bottom, transparent 25px, rgba(61, 52, 139, 0.12) 26px, transparent 27px)",
          backgroundSize: "100% var(--line, 32px)",
          backgroundRepeat: "repeat-y",
        }}
      >
        {/* Page meta stacked in the top-left gutter: back button + page
            label. Keeps all page chrome on one side, out of the chat's way. */}
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
          page 01
        </div>

        {/* Handwritten page title */}
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
          about
        </h1>

        {/* Polaroids anchored to the right, body text flows on the left */}
        {POLAROIDS.map((p, i) => (
          <PolaroidFrame key={p.src} polaroid={p} delayMs={1200 + i * 200} />
        ))}

        {/* Drawn-in greeting. Height locked to 3× the ruler pitch (96px)
            + bottom margin = 32px so the grid stays clean. */}
        <div
          style={{
            height: "calc(var(--line) * 3)",
            marginBottom: "var(--line)",
            display: "flex",
            alignItems: "center",
            maxWidth: "calc(100% - 260px)",
          }}
        >
          <DrawnText
            text="hi — I'm Seb"
            fontFamily="Caveat"
            fontSize={56}
            fontWeight={500}
            color="var(--color-ink)"
            duration={1.4}
            fillAfter
            fillDelay={0.15}
            strokeWidth={1.1}
          />
        </div>

        {/* Body paragraphs — text wraps to the left of the absolute polaroids
            via max-width. Each paragraph stays on the 32px ruler grid. */}
        <div
          style={{
            // Leave ~360px on the right so the scattered polaroids (up to
            // right: 130 + width 200 = 330) never overlap body text.
            maxWidth: "calc(100% - 360px)",
            fontFamily: "var(--font-script)",
            fontSize: 24,
            fontWeight: 400,
            color: "var(--color-ink)",
            lineHeight: "var(--line)",
          }}
        >
          {BODY_PARAGRAPHS.map((text, i) => (
            <RevealOnMount key={i} delayMs={1400 + i * 600}>
              <p
                style={{
                  margin: 0,
                  marginBottom: "var(--line)",
                }}
              >
                <HandwrittenText text={text} charDelayMs={12} />
              </p>
            </RevealOnMount>
          ))}
        </div>

        {/* Margin notes — handwritten asides sitting in the left gutter */}
        {MARGIN_NOTES.map((note, i) => (
          <MarginNote key={i} {...note} />
        ))}

        {/* Stickers — small personal flair "stuck" to the page. Sit inside
            the scroll area so they travel with the paper as you scroll. */}
        <Sticker
          size={54}
          rotation={-10}
          top="41%"
          left="14%"
          delayMs={2200}
        >
          <CoffeeCupIcon />
        </Sticker>

        <Sticker
          size={56}
          rotation={8}
          top="66%"
          left="13%"
          background="#ffefd5"
          delayMs={2600}
        >
          <BasketballIcon />
        </Sticker>
      </div>

      {/* Dog-eared bottom-right corner — sits outside the scroll area so
          the page bookmark is always visible, not only at the bottom of
          the content. */}
      <PageCorner pageNumber="01" />
    </div>
  );
}

// ── Sticker icons ────────────────────────────────────────────────────

function CoffeeCupIcon() {
  return (
    <svg
      width="30"
      height="30"
      viewBox="0 0 30 30"
      aria-hidden
      style={{ display: "block" }}
    >
      {/* steam */}
      <path
        d="M 10 7 q 1.5 -2.5 0 -5"
        stroke="#8a7c5a"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M 15 7 q 1.5 -2.5 0 -5"
        stroke="#8a7c5a"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M 20 7 q 1.5 -2.5 0 -5"
        stroke="#8a7c5a"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* cup body */}
      <path
        d="M 6 11 L 7.5 22 Q 8 24.5 10.5 24.5 L 19.5 24.5 Q 22 24.5 22.5 22 L 24 11 Z"
        fill="#a86938"
        stroke="#4d2a14"
        strokeWidth="1"
        strokeLinejoin="round"
      />
      {/* handle */}
      <path
        d="M 24 13 Q 28 14 27 18 Q 26 21 22.5 20.5"
        stroke="#4d2a14"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* coffee surface */}
      <ellipse cx="15" cy="11" rx="8.5" ry="1.4" fill="#2b160a" />
    </svg>
  );
}

function BasketballIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      aria-hidden
      style={{ display: "block" }}
    >
      <circle
        cx="17"
        cy="17"
        r="13"
        fill="#e07a2b"
        stroke="#1a1a2e"
        strokeWidth="1.2"
      />
      {/* curved seams */}
      <path
        d="M 17 4 L 17 30"
        stroke="#1a1a2e"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M 4 17 L 30 17"
        stroke="#1a1a2e"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M 6 8 Q 17 17 6 26"
        stroke="#1a1a2e"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M 28 8 Q 17 17 28 26"
        stroke="#1a1a2e"
        strokeWidth="1.2"
        fill="none"
      />
    </svg>
  );
}

// ── Polaroid ─────────────────────────────────────────────────────────

function PolaroidFrame({
  polaroid,
  delayMs,
}: {
  polaroid: Polaroid;
  delayMs: number;
}) {
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  // Null until the user drags → then absolute (x, y) in the content
  // panel's coordinate space. Stays put on release; resets on reload.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const elRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (!elRef.current) return;
    e.preventDefault();
    const rect = elRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const parent = elRef.current?.offsetParent as HTMLElement | null;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      setPos({
        x: e.clientX - parentRect.left - offsetRef.current.x,
        y: e.clientY - parentRect.top - offsetRef.current.y,
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging]);

  const positionStyle: CSSProperties = pos
    ? { left: pos.x, top: pos.y, right: "auto" }
    : { top: polaroid.top, right: polaroid.right };

  return (
    <div
      ref={elRef}
      onPointerDown={onPointerDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        ...positionStyle,
        width: polaroid.width,
        transform: `rotate(${polaroid.rotation}deg) scale(${
          hover || dragging ? 1.03 : 1
        })`,
        // Kill the transform transition while dragging so the polaroid
        // tracks the cursor 1:1 instead of lagging.
        transition: dragging
          ? "filter 300ms ease"
          : "transform 340ms cubic-bezier(0.22, 1, 0.36, 1), filter 300ms ease",
        filter:
          hover || dragging
            ? "drop-shadow(8px 14px 22px rgba(0,0,0,0.28))"
            : "drop-shadow(3px 6px 10px rgba(0,0,0,0.18))",
        animation: `fadeIn 0.8s ease ${delayMs}ms both`,
        cursor: dragging ? "grabbing" : "grab",
        zIndex: dragging ? 10 : 3,
        userSelect: "none",
        touchAction: "none",
      }}
    >
      {/* White polaroid frame */}
      <div
        style={{
          background: "#fbfaf4",
          padding: "12px 12px 44px 12px",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {/* Photo */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "4 / 5",
            overflow: "hidden",
            background: "#e8e3d5",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={polaroid.src}
            alt={polaroid.caption}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            draggable={false}
          />
        </div>
        {/* Handwritten caption */}
        <div
          style={{
            fontFamily: "var(--font-script)",
            fontSize: 20,
            color: "var(--color-ink)",
            opacity: 0.75,
            textAlign: "center",
            marginTop: 8,
            lineHeight: 1.1,
          }}
        >
          {polaroid.caption}
        </div>
      </div>
      {/* Tape strip at top */}
      <TapeStrip
        style={{
          top: -10,
          left: "50%",
          transform: "translateX(-50%) rotate(-5deg)",
        }}
      />
    </div>
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
        background: "rgba(200, 230, 240, 0.5)",
        border: "1px solid rgba(0, 80, 120, 0.08)",
        backdropFilter: "blur(1px)",
        ...style,
      }}
    />
  );
}

// ── Margin note ──────────────────────────────────────────────────────

function MarginNote({
  text,
  top,
  left,
  right,
  rotate,
  delayMs,
}: {
  text: string;
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  delayMs: number;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        top,
        left,
        right,
        transform: `rotate(${rotate}deg)`,
        fontFamily: "var(--font-script)",
        fontSize: 17,
        color: "var(--color-ink)",
        opacity: 0.55,
        lineHeight: 1.15,
        whiteSpace: "pre-line",
        pointerEvents: "none",
        maxWidth: 120,
        animation: `fadeIn 0.9s ease ${delayMs}ms both`,
        zIndex: 2,
      }}
    >
      {text}
    </div>
  );
}

// ── RevealOnMount ────────────────────────────────────────────────────

/**
 * Defers rendering its child until `delayMs` has elapsed so paragraphs
 * start their HandwrittenText reveal sequentially instead of all at once.
 */
function RevealOnMount({
  delayMs,
  children,
}: {
  delayMs: number;
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(delayMs <= 0);

  useEffect(() => {
    if (shown) return;
    const t = window.setTimeout(() => setShown(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs, shown]);

  return <>{shown ? children : null}</>;
}

"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PageBackButton } from "../chrome/PageBackButton";
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

// Polaroids spread around the page — top-right next to the greeting,
// middle-right between paragraphs, bottom-center below all text. Varies
// enough to feel scattered while staying clear of the body text column.
const POLAROIDS: Polaroid[] = [
  {
    src: "/photos/seb-1.jpg",
    caption: "garry point park",
    rotation: 4.5,
    top: 180,
    right: 40,
    width: 205,
  },
  {
    src: "/photos/seb-2.jpg",
    caption: "pool",
    rotation: -7,
    top: 640,
    right: 180,
    width: 190,
  },
  {
    src: "/photos/seb-3.jpg",
    caption: "cleveland dam",
    rotation: 3,
    top: 1200,
    right: "30%",
    width: 215,
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
      <Paper ruled={false} marginRule={false} />

      {/* Scrolling content area */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          paddingTop: "calc(var(--line) * 3)",
          paddingBottom: "calc(var(--line) * 3)",
          paddingLeft: "calc(12% + var(--pad-content))",
          paddingRight: "8%",
          overflowY: "auto",
          // Ruled lines travel with the content as the user scrolls.
          // background-attachment: local binds the bg to the content, not
          // to the scroll container — without it the rules would stick to
          // the div while text moved past them, making the text drift
          // off-grid visually. Formula in globals.css keeps text baseline
          // on rule at every viewport.
          backgroundImage: "var(--rule-background)",
          backgroundAttachment: "local",
        }}
      >
        {/* Page meta stacked in the top-left gutter: back button + page
            label. Keeps all page chrome on one side, out of the chat's way. */}
        <PageBackButton onClose={onClose} />

        <div
          style={{
            position: "absolute",
            // Baseline floats 0.19 × --line above rule 2 — matches the
            // sender-label offset in chat home.
            top: "calc(var(--line) * 2.57 - var(--fs-meta) * 0.86)",
            left: "calc(3% + var(--pad-chrome))",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--fs-meta)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color:
              "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
            lineHeight: 1,
          }}
        >
          journal · about
        </div>

        {/* Handwritten page title */}
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
            fontSize: "var(--fs-body)",
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

        {/* Stickers — all draggable, placed in page whitespace so the
            initial positions never cover body text. Visitors can peel
            them up and stick them wherever. */}
        <Sticker
          size={54}
          rotation={-10}
          top={70}
          right={300}
          delayMs={2200}
        >
          <CoffeeCupIcon />
        </Sticker>

        <Sticker
          size={56}
          rotation={8}
          top={460}
          right={20}
          background="#ffefd5"
          delayMs={2400}
        >
          <BasketballIcon />
        </Sticker>

        <Sticker
          size={58}
          rotation={-6}
          top={880}
          right={280}
          background="#ffe1d4"
          delayMs={2600}
        >
          <LobsterIcon />
        </Sticker>

        <Sticker
          size={54}
          rotation={12}
          top={1380}
          left="2%"
          background="#0a0a0a"
          delayMs={2800}
        >
          <MonsterIcon />
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

function LobsterIcon() {
  // Stylized lobster — red body with two claws and antennae. Simple
  // enough to read inside a ~55px sticker.
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      aria-hidden
      style={{ display: "block" }}
    >
      {/* antennae */}
      <path
        d="M 14 9 Q 11 5 9 2"
        stroke="#7a1f0a"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 20 9 Q 23 5 25 2"
        stroke="#7a1f0a"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      {/* left claw */}
      <ellipse
        cx="7"
        cy="14"
        rx="3.5"
        ry="2.6"
        fill="#c83a1d"
        stroke="#7a1f0a"
        strokeWidth="0.8"
        transform="rotate(-20 7 14)"
      />
      <path
        d="M 5 12 Q 7.5 13 5 14.5"
        stroke="#7a1f0a"
        strokeWidth="0.7"
        fill="none"
      />
      {/* right claw */}
      <ellipse
        cx="27"
        cy="14"
        rx="3.5"
        ry="2.6"
        fill="#c83a1d"
        stroke="#7a1f0a"
        strokeWidth="0.8"
        transform="rotate(20 27 14)"
      />
      <path
        d="M 29 12 Q 26.5 13 29 14.5"
        stroke="#7a1f0a"
        strokeWidth="0.7"
        fill="none"
      />
      {/* head */}
      <circle
        cx="17"
        cy="13"
        r="4"
        fill="#c83a1d"
        stroke="#7a1f0a"
        strokeWidth="0.8"
      />
      {/* eyes */}
      <circle cx="15.5" cy="12" r="0.6" fill="#fff" />
      <circle cx="18.5" cy="12" r="0.6" fill="#fff" />
      {/* segmented tail */}
      <path
        d="M 13 17 Q 13 24 17 27 Q 21 24 21 17 Z"
        fill="#c83a1d"
        stroke="#7a1f0a"
        strokeWidth="0.8"
      />
      <path
        d="M 13.5 19.5 Q 17 20.5 20.5 19.5 M 14 22 Q 17 23 20 22 M 14.8 24.5 Q 17 25.2 19.2 24.5"
        stroke="#7a1f0a"
        strokeWidth="0.6"
        fill="none"
      />
    </svg>
  );
}

function MonsterIcon() {
  // Three claw slashes in Monster green on a black sticker face.
  // Not an exact brand mark — just the signature claw look.
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      aria-hidden
      style={{ display: "block" }}
    >
      {/* Three slashes — outer ones narrow-wide, middle one widest. */}
      <path
        d="M 8 7 L 10 27"
        stroke="#a4ff00"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M 15.5 5 L 17.5 29"
        stroke="#a4ff00"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 24 7 L 26 27"
        stroke="#a4ff00"
        strokeWidth="2.6"
        strokeLinecap="round"
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
          padding: "var(--pad-chip) var(--pad-chip) 44px var(--pad-chip)",
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
            fontSize: "var(--fs-script)",
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
        fontSize: "var(--fs-chip)",
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

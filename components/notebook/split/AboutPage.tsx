"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { PageBackButton } from "../chrome/PageBackButton";
import { PageCorner } from "../chrome/PageCorner";
import { Paper } from "../chrome/Paper";
import { DrawnText } from "../primitives/DrawnText";
import { HandwrittenText } from "../primitives/HandwrittenText";
import {
  PageAnimateContext,
  usePageAnimate,
} from "../primitives/PageAnimateContext";
import { Sticker } from "../primitives/Sticker";

const BODY_PARAGRAPHS = [
  "Obsessed with AI. In love with tech. Chronically online in the Claude and GPT corners of the internet. If I'm not building something I'm probably thinking about building it. 4th-year CS at the University of Guelph, Toronto-based.",
  "Career path so far:\n→ data analyst\n→ data engineer\n→ AI & data developer\n→ incoming AI consultant at EY\nI kept trying different things until one clicked. AI was the one.",
  "Outside of that: basketball (90% chance I smoke you), too much coffee, snowboarding, fantasy novels (The Name of the Wind is my favorite), and a cologne collection that's gotten out of hand. This site is also a side project. Claude Code, two evenings, aggressively overengineered.",
];

// Photos + slot positions split into two lists so the site can randomly
// assign any photo to any slot on page open — same layout each time,
// fresh placement every mount. After that, the user can drag them
// anywhere (PolaroidFrame owns drag state).
type Photo = { src: string; caption: string };
type PolaroidSlot = {
  top: number;
  right?: number | string;
  rotation: number;
  width: number;
};

const PHOTOS: Photo[] = [
  { src: "/photos/seb-1.jpg", caption: "garry point park" },
  { src: "/photos/seb-2.jpg", caption: "pool" },
  { src: "/photos/seb-3.jpg", caption: "cleveland dam" },
];

// Slots staggered horizontally (right values 325 / 120 / 220) so the
// polaroids don't align on a single vertical line — gives the "someone
// stuck these on the page by hand" feel rather than a neat column.
// Slot 0 is intentionally inset deep (right: 325) so the upper-right
// sticker slot sits at the page edge instead; body text reserves
// matching space on the right to keep clear of slot 0's width.
// Rotations alternate direction for the same reason.
// Vertical spacing ~400px between slots: first two visible on most
// desktops, third tucks below the fold and scrolls into view.
const POLAROID_SLOTS: PolaroidSlot[] = [
  { top: 30, right: 325, rotation: 3, width: 205 },
  { top: 500, right: 120, rotation: -6, width: 195 },
  { top: 900, right: 220, rotation: 4, width: 215 },
];

// Polaroid (Photo × Slot) combined shape used by PolaroidFrame. We
// keep it structurally compatible with the pre-refactor POLAROID
// shape so PolaroidFrame didn't need to change.
type Polaroid = Photo & PolaroidSlot;

// Stickers + slot positions, same split as polaroids: any sticker can
// land in any slot on mount. Each sticker keeps its own visual identity
// (size, rotation, background, icon) — the slot only provides position
// and animation delay.
type StickerData = {
  size: number;
  rotation: number;
  background?: string;
  icon: "coffee" | "basketball" | "lobster" | "monster";
};
type StickerSlot = {
  top: number;
  left?: number | string;
  right?: number | string;
  delayMs: number;
};

const STICKERS: StickerData[] = [
  { size: 54, rotation: -10, icon: "coffee" },
  { size: 56, rotation: 8, background: "#ffefd5", icon: "basketball" },
  { size: 58, rotation: -6, background: "#ffe1d4", icon: "lobster" },
  { size: 54, rotation: 12, background: "#0a0a0a", icon: "monster" },
];

// Sticker slots are positioned explicitly OUTSIDE every polaroid slot's
// bounding box — no overlap possible regardless of which photo lands
// where or which sticker lands where:
//   slot 0: top-left gutter (x=20-74) — left of body text column
//   slot 1: upper-right, to the LEFT of polaroid-slot-0 (right=290 vs
//           polaroid right=60+205=265 left edge)
//   slot 2: between polaroid-slot-1 (ends y=745) and polaroid-slot-2
//           (starts y=900), on the far right edge
//   slot 3: mid-left gutter, below the coffee margin note
const STICKER_SLOTS: StickerSlot[] = [
  { top: 130, left: 20, delayMs: 2200 },
  { top: 100, right: 80, delayMs: 2400 }, // far-right corner (swap target of polaroid slot 0's old position)
  { top: 790, right: 60, delayMs: 2600 },
  { top: 800, left: 40, delayMs: 2800 }, // mid-left, clears the basketball margin note
];

// Fisher-Yates over [0..n-1]. Used to randomize photo/sticker assignment
// on mount. Runs client-side only (via useEffect) so SSR and the first
// client paint agree on the deterministic identity order.
function shuffleIndexes(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Margin notes positioned in --line units (not viewport %) so the gap
// between them stays consistent across viewport heights. Previously at
// 44% / 68% of the scroll div height — at narrower windows those two
// percentages compressed and the notes overlapped.
const MARGIN_NOTES: Array<{
  text: string;
  top: string;
  left?: string;
  right?: string;
  rotate: number;
  delayMs: number;
}> = [
  {
    text: "coffee:\nminimum 3 cups per day",
    top: "calc(var(--line) * 7)",
    left: "3.5%",
    rotate: -7,
    delayMs: 1800,
  },
  {
    text: "basketball:\n80-90% smoke rate",
    top: "calc(var(--line) * 18)",
    left: "4%",
    rotate: 5,
    delayMs: 2400,
  },
];

// Mobile sticker positions — % offsets relative to the polaroid strip
// container. Calibrated so they cluster around the photo strip without
// covering polaroid faces.
const MOBILE_STICKER_OFFSETS: Array<{
  top: string;
  left?: string;
  right?: string;
  delayMs: number;
}> = [
  { top: "0", right: "8%", delayMs: 2200 },
  { top: "32%", left: "4%", delayMs: 2400 },
  { top: "62%", right: "12%", delayMs: 2600 },
  { top: "88%", left: "8%", delayMs: 2800 },
];

export function AboutPage({
  onClose,
  animate = true,
  sessionKey = 0,
}: {
  onClose: () => void;
  animate?: boolean;
  sessionKey?: number;
}) {
  const isMobile = useIsMobile();
  // Randomize photo → slot and sticker → slot assignment per page open.
  // SSR + initial client paint render the deterministic identity order
  // (photo i in slot i, sticker i in slot i) so hydration matches;
  // useEffect swaps in a Fisher-Yates shuffle post-mount. User drag
  // takes over after that (PolaroidFrame / Sticker own drag state).
  const [photoOrder, setPhotoOrder] = useState<number[]>(() =>
    PHOTOS.map((_, i) => i),
  );
  const [stickerOrder, setStickerOrder] = useState<number[]>(() =>
    STICKERS.map((_, i) => i),
  );
  useEffect(() => {
    setPhotoOrder(shuffleIndexes(PHOTOS.length));
    setStickerOrder(shuffleIndexes(STICKERS.length));
  }, []);

  return (
    <PageAnimateContext.Provider value={{ animate, sessionKey }}>
    <div style={{ position: "absolute", inset: 0 }}>
      <Paper ruled={false} marginRule={false} />

      {/* Scrolling content area */}
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

        {/* Polaroids anchored to the right (desktop only). On mobile, they
            move into a stacked strip below the body text. */}
        {!isMobile &&
          POLAROID_SLOTS.map((slot, slotIdx) => {
            const photo = PHOTOS[photoOrder[slotIdx]];
            return (
              <PolaroidFrame
                key={`${sessionKey}-${slotIdx}`}
                polaroid={{ ...photo, ...slot }}
                delayMs={1200 + slotIdx * 200}
              />
            );
          })}

        {/* Drawn-in greeting. Height locked to 3× the ruler pitch (96px)
            + bottom margin = 32px so the grid stays clean. maxWidth
            reserves space for polaroid slot 0 (right: 325 + width: 205
            = 530 from right) — dropped on mobile where polaroids stack
            below the body. */}
        <div
          style={{
            height: "calc(var(--line) * 3)",
            marginBottom: "var(--line)",
            display: "flex",
            alignItems: "center",
            maxWidth: isMobile ? "100%" : "calc(100% - 440px)",
          }}
        >
          <DrawnText
            text="hi — I'm Seb"
            fontFamily="Caveat"
            fontSize={isMobile ? 38 : 56}
            fontWeight={500}
            color="var(--color-ink)"
            duration={1.4}
            fillAfter
            fillDelay={0.15}
            strokeWidth={1.1}
          />
        </div>

        {/* Body paragraphs — text wraps to the left of the absolute polaroids
            via max-width on desktop; full-width on mobile. Each paragraph
            stays on the ruler grid. */}
        <div
          style={{
            // Reserve sized for the most-inset polaroid that shares a
            // vertical range with body text. Polaroid slot 0 sits at
            // top=30 (entirely above body text y=334), so it's ignored
            // here. Polaroid slot 2 at right=220 + width=215 = 435 from
            // right is the binding constraint — reserve 360 leaves a
            // small gap (rounded up). Mobile drops the reservation since
            // polaroids stack below.
            maxWidth: isMobile ? "100%" : "calc(100% - 360px)",
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

        {/* Mobile-only: polaroid strip below the body, stickers scattered
            around it. Both stay draggable — PolaroidFrame's pointer-event
            drag works on touch as-is. */}
        {isMobile && (
          <div
            style={{
              position: "relative",
              marginTop: "calc(var(--line) * 1.5)",
              marginBottom: "calc(var(--line) * 2)",
              minHeight: 540,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 32,
              }}
            >
              {POLAROID_SLOTS.map((slot, slotIdx) => {
                const photo = PHOTOS[photoOrder[slotIdx]];
                return (
                  <MobilePolaroidFrame
                    key={`${sessionKey}-mob-${slotIdx}`}
                    photo={photo}
                    rotation={slot.rotation}
                    delayMs={1200 + slotIdx * 200}
                  />
                );
              })}
            </div>

            {STICKER_SLOTS.map((_, slotIdx) => {
              const sticker = STICKERS[stickerOrder[slotIdx]];
              const offset = MOBILE_STICKER_OFFSETS[slotIdx];
              return (
                <Sticker
                  key={`${sessionKey}-mob-stk-${slotIdx}`}
                  size={sticker.size}
                  rotation={sticker.rotation}
                  background={sticker.background}
                  top={offset.top}
                  left={offset.left}
                  right={offset.right}
                  delayMs={offset.delayMs}
                >
                  {sticker.icon === "coffee" && <CoffeeCupIcon />}
                  {sticker.icon === "basketball" && <BasketballIcon />}
                  {sticker.icon === "lobster" && <LobsterIcon />}
                  {sticker.icon === "monster" && <MonsterIcon />}
                </Sticker>
              );
            })}
          </div>
        )}

        {/* Margin notes — handwritten asides sitting in the left gutter.
            Hidden on mobile since the gutter doesn't exist. */}
        {!isMobile &&
          MARGIN_NOTES.map((note, i) => (
            <MarginNote key={`${sessionKey}-${i}`} {...note} />
          ))}

        {/* Desktop stickers — all draggable, placed in whitespace so the
            initial positions never cover body text. */}
        {!isMobile &&
          STICKER_SLOTS.map((slot, slotIdx) => {
            const sticker = STICKERS[stickerOrder[slotIdx]];
            return (
              <Sticker
                // sessionKey in the key forces a fresh Sticker mount on
                // every revisit so its fade-in plays again (drag position
                // resets too — acceptable for a decorative element).
                key={`${sessionKey}-${slotIdx}`}
                size={sticker.size}
                rotation={sticker.rotation}
                background={sticker.background}
                top={slot.top}
                left={slot.left}
                right={slot.right}
                delayMs={slot.delayMs}
              >
                {sticker.icon === "coffee" && <CoffeeCupIcon />}
                {sticker.icon === "basketball" && <BasketballIcon />}
                {sticker.icon === "lobster" && <LobsterIcon />}
                {sticker.icon === "monster" && <MonsterIcon />}
              </Sticker>
            );
          })}
      </div>

      {/* Dog-eared bottom-right corner — sits outside the scroll area so
          the page bookmark is always visible, not only at the bottom of
          the content. */}
      <PageCorner pageNumber="01" />
    </div>
    </PageAnimateContext.Provider>
  );
}

// ── Mobile polaroid ──────────────────────────────────────────────────
// Same visual + drag behavior as the desktop PolaroidFrame, but flow-
// positioned (block) inside the mobile strip instead of absolutely
// pinned. Drag still teleports to absolute on first move so users can
// scatter them around the strip.
function MobilePolaroidFrame({
  photo,
  rotation,
  delayMs,
}: {
  photo: Photo;
  rotation: number;
  delayMs: number;
}) {
  const pageAnimate = usePageAnimate();
  const [dragging, setDragging] = useState(false);
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
        x: e.clientX - parentRect.left + parent.scrollLeft - offsetRef.current.x,
        y: e.clientY - parentRect.top + parent.scrollTop - offsetRef.current.y,
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
    ? { position: "absolute", left: pos.x, top: pos.y }
    : { position: "relative" };

  return (
    <div
      ref={elRef}
      onPointerDown={onPointerDown}
      style={{
        ...positionStyle,
        width: 200,
        transform: `rotate(${rotation}deg) scale(${dragging ? 1.03 : 1})`,
        transition: dragging
          ? "filter 300ms ease"
          : "transform 340ms cubic-bezier(0.22, 1, 0.36, 1), filter 300ms ease",
        filter: dragging
          ? "drop-shadow(8px 14px 22px rgba(0,0,0,0.28))"
          : "drop-shadow(3px 6px 10px rgba(0,0,0,0.18))",
        animationName: "fadeIn",
        animationDuration: "0.8s",
        animationTimingFunction: "ease",
        animationDelay: `${delayMs}ms`,
        animationFillMode: "both",
        animationPlayState: pageAnimate ? "running" : "paused",
        cursor: dragging ? "grabbing" : "grab",
        zIndex: dragging ? 10 : 3,
        userSelect: "none",
        touchAction: "none",
      }}
    >
      <div
        style={{
          background: "#fbfaf4",
          padding: "var(--pad-chip) var(--pad-chip) 36px var(--pad-chip)",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
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
            src={photo.src}
            alt={photo.caption}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
            draggable={false}
          />
        </div>
        <div
          style={{
            fontFamily: "var(--font-script)",
            fontSize: "var(--fs-script)",
            color: "var(--color-ink)",
            opacity: 0.75,
            textAlign: "center",
            marginTop: 6,
            lineHeight: 1.1,
          }}
        >
          {photo.caption}
        </div>
      </div>
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
  const pageAnimate = usePageAnimate();
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
      // e.clientX/Y are viewport coords; parentRect.left/top are the
      // scroll container's viewport position. Subtracting gives pointer
      // position inside the VISIBLE area of the container — but we're
      // about to write pos into CSS left/top, which is interpreted in
      // CONTENT coords (scroll-offset-aware). Add scrollLeft/scrollTop
      // to convert visible coords → content coords. Without this, a
      // polaroid picked up while the page is scrolled jumps up by
      // `scrollTop` pixels.
      const parentRect = parent.getBoundingClientRect();
      setPos({
        x: e.clientX - parentRect.left + parent.scrollLeft - offsetRef.current.x,
        y: e.clientY - parentRect.top + parent.scrollTop - offsetRef.current.y,
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
        // Longhand props so animationPlayState can gate the fade on
        // pageAnimate without mixing with the `animation` shorthand.
        animationName: "fadeIn",
        animationDuration: "0.8s",
        animationTimingFunction: "ease",
        animationDelay: `${delayMs}ms`,
        animationFillMode: "both",
        animationPlayState: pageAnimate ? "running" : "paused",
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
  const pageAnimate = usePageAnimate();
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
        animationName: "fadeIn",
        animationDuration: "0.9s",
        animationTimingFunction: "ease",
        animationDelay: `${delayMs}ms`,
        animationFillMode: "both",
        animationPlayState: pageAnimate ? "running" : "paused",
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
  // Hold at opening frame (don't render children) until the host page
  // is ready — i.e., its flip-in has landed. When `pageAnimate` flips
  // to true, start the delay timer and reveal. When it flips back to
  // false (user navigates away), reset so the next revisit plays the
  // reveal again from scratch.
  const pageAnimate = usePageAnimate();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!pageAnimate) {
      setShown(false);
      return;
    }
    if (shown) return;
    const t = window.setTimeout(() => setShown(true), delayMs);
    return () => window.clearTimeout(t);
  }, [delayMs, shown, pageAnimate]);

  return <>{shown ? children : null}</>;
}

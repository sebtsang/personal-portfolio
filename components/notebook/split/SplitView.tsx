"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useStageStore, type StageView } from "@/lib/store";
import { Paper } from "../chrome/Paper";
import { SpreadMarginRule } from "../chrome/SpreadMarginRule";
import { ChatPage, type ChatMessage } from "../chat/ChatPage";
import { PaneReadyContext } from "../primitives/PaneReadyContext";
import { AboutPage } from "./AboutPage";
import { ContactPage } from "./ContactPage";
import { ContentPagePlaceholder } from "./ContentPagePlaceholder";
import { ExperiencePage } from "./ExperiencePage";
import { LinkedInPage } from "./LinkedInPage";

const OPEN_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
// Open: chat retract is the first phase, page flip-in is the second.
// Spring stats match the overall "one physical motion" feel.
const CHAT_OPEN_SPRING = {
  type: "spring" as const,
  stiffness: 140,
  damping: 24,
  mass: 0.8,
};
const PAGE_OPEN_DELAY_S = 0.4;
const PAGE_OPEN_OPACITY_MS = 400;

// Close: reversed ceremony — page flips out first, then chat expands.
// Page spring is slightly softer than the open spring (stiffness 90 vs
// 110) so it reads as a gentler "settling back" rather than an eager
// reveal.  Chat expand is delayed so it only begins once the page has
// mostly swung out of view. Total close ≈ 1400ms, mirroring the open.
const PAGE_CLOSE_SPRING = {
  type: "spring" as const,
  stiffness: 90,
  damping: 18,
  mass: 0.9,
};
const PAGE_CLOSE_OPACITY_MS = 500;
const PAGE_CLOSE_OPACITY_DELAY_S = 0.15;
// Chat expand delay overlaps ~300ms with the end of the page flip-out
// (which settles ~700ms). Chat starts expanding while page is still at
// ~rotateY(80°), both phases running together for 300ms → total ~1050ms.
const CHAT_CLOSE_SPRING = {
  type: "spring" as const,
  stiffness: 140,
  damping: 24,
  mass: 0.8,
  delay: 0.4,
};

const SWITCH_MS = 300;

/** Viewport % where the chat's right edge sits (and where the seam
 *  margin rule is drawn) when split is open. Wide enough for chat
 *  messages to breathe; narrow enough to leave the content pane
 *  the majority of the spread. */
const SEAM_PCT = 28;

type NonEmptyKind = Exclude<StageView["kind"], "empty">;

/**
 * Two-pane layout. Chat is the "left page" of the spread, attached to
 * the spine. Content is the "right page" that flips in from the right
 * when open. A red vertical rule sits at the seam between them in
 * split mode — the spread's shared margin line.
 *
 * - Opening a page: two-phase sequence — chat retracts to 28% (spring,
 *   ~550ms), right page springs in on rotateY starting 400ms in. Subtle
 *   settle, no visible overshoot. Total ~1.3s.
 * - Switching between open pages: horizontal slide (300ms) — new page
 *   slides in from the right, old slides out to the left.
 * - Closing: reversed ceremony — right page springs out (~700ms),
 *   chat column expansion overlaps starting at 400ms (~300ms overlap).
 *   Total ~1.05s.
 */
export function SplitView({
  isSplit,
  messages,
  onSubmit,
  isWriting = false,
  onClose,
}: {
  isSplit: boolean;
  messages: ChatMessage[];
  onSubmit: (text: string) => void;
  isWriting?: boolean;
  onClose: () => void;
}) {
  const kind = useStageStore((s) => s.view.kind);

  // Preserve the last non-empty kind so the close animation keeps
  // showing the open page instead of flashing the fallback.
  const [displayKind, setDisplayKind] = useState<NonEmptyKind>(
    kind === "empty" ? "about" : kind,
  );
  useEffect(() => {
    if (kind !== "empty") setDisplayKind(kind);
  }, [kind]);

  // Hold reveal staggers until the right-pane flip completes. Content
  // stays rendered the whole time (so you actually see the page
  // flipping in) — the primitives inside it (HandwrittenText, RoleEntry,
  // RevealOnMount) read PaneReadyContext and keep their animations
  // paused/deferred while paneReady is false. When the rotateY spring
  // finishes, paneReady flips true and all staggers play with the page
  // flat and fully visible.
  const [paneReady, setPaneReady] = useState(isSplit);
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (isSplit) setPaneReady(false);
  }, [isSplit]);

  const contentWidth = `${100 - SEAM_PCT}%`;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        perspective: "2400px",
        perspectiveOrigin: `${SEAM_PCT}% 50%`,
      }}
    >
      {/* Chat — left page. Uses Framer `layout` (FLIP) instead of
          `animate={{ width }}`. Why: animating `width` per-frame forced
          text inside to re-wrap every frame as line-width changed (900px
          → 400px), producing the "up then down" reflow hitch. With
          `layout`, DOM width snaps to final at t=0, so text wraps at its
          final width throughout; Framer bridges the visual size change
          via GPU-composited scale transform. Text positions are stable,
          motion is pure transform, and the spring timing still controls
          the animation via `transition`. */}
      <motion.div
        layout
        transition={isSplit ? CHAT_OPEN_SPRING : CHAT_CLOSE_SPRING}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: isSplit ? `${SEAM_PCT}%` : "100%",
          overflow: "hidden",
          willChange: "transform",
          zIndex: 2,
        }}
      >
        <Paper ruled={false} marginRule={!isSplit} />
        <ChatPage
          messages={messages}
          onSubmit={onSubmit}
          isWriting={isWriting}
          compact={isSplit}
          autoFocus={false}
        />
      </motion.div>

      {/* Shared spread margin rule — sits exactly at the chat's right
          edge. Chat scrollbar (native) lives just to its left. */}
      <SpreadMarginRule leftPct={SEAM_PCT} visible={isSplit} />

      {/* Content — right page. Pivots on its left seam. */}
      <motion.div
        initial={false}
        animate={{
          rotateY: isSplit ? 0 : 95,
          opacity: isSplit ? 1 : 0,
        }}
        onAnimationComplete={() => {
          if (isSplit) setPaneReady(true);
        }}
        transition={
          isSplit
            ? {
                rotateY: {
                  type: "spring",
                  stiffness: 110,
                  damping: 18,
                  mass: 0.9,
                  delay: PAGE_OPEN_DELAY_S,
                },
                opacity: {
                  duration: PAGE_OPEN_OPACITY_MS / 1000,
                  delay: PAGE_OPEN_DELAY_S,
                  ease: [0.16, 1, 0.3, 1],
                },
              }
            : {
                rotateY: PAGE_CLOSE_SPRING,
                opacity: {
                  duration: PAGE_CLOSE_OPACITY_MS / 1000,
                  delay: PAGE_CLOSE_OPACITY_DELAY_S,
                  ease: [0.16, 1, 0.3, 1],
                },
              }
        }
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: contentWidth,
          overflow: "hidden",
          transformOrigin: "0% 50%",
          pointerEvents: isSplit ? "auto" : "none",
          willChange: "transform",
          boxShadow: isSplit
            ? "inset 10px 0 18px -12px rgba(0,0,0,0.22)"
            : undefined,
          zIndex: 1,
        }}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={displayKind}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{
              duration: SWITCH_MS / 1000,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              position: "absolute",
              inset: 0,
            }}
          >
            <PaneReadyContext.Provider value={paneReady}>
              <SplitContent kind={displayKind} onClose={onClose} />
            </PaneReadyContext.Provider>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

function SplitContent({
  kind,
  onClose,
}: {
  kind: NonEmptyKind;
  onClose: () => void;
}) {
  if (kind === "about") return <AboutPage onClose={onClose} />;
  if (kind === "experience") return <ExperiencePage onClose={onClose} />;
  if (kind === "linkedin") return <LinkedInPage onClose={onClose} />;
  if (kind === "contact") return <ContactPage onClose={onClose} />;
  return <ContentPagePlaceholder onClose={onClose} />;
}

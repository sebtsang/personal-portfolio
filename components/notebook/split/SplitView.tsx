"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useStageStore, type StageView } from "@/lib/store";
import { Paper } from "../chrome/Paper";
import { ChatPage, type ChatMessage } from "../chat/ChatPage";
import { AboutPage } from "./AboutPage";
import { ContactPage } from "./ContactPage";
import { ContentPagePlaceholder } from "./ContentPagePlaceholder";
import { ExperiencePage } from "./ExperiencePage";
import { LinkedInPage } from "./LinkedInPage";

const OPEN_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const OPEN_MS = 700;
const CHAT_WIDTH_MS = 700;
const SWITCH_FADE_MS = 250;

type NonEmptyKind = Exclude<StageView["kind"], "empty">;

/**
 * Two-pane layout for the split view: chat is the "left page" of the
 * spread (attached to the spine), content is the "right page" that
 * flips in from the right on open. Uses 3D rotateY around the inner
 * seam so opening feels like laying a fresh page onto the spread.
 * Switching between content pages (e.g. about → experience) cross-
 * fades so we're not stacking rotations back-to-back.
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

  // Keep the last non-empty kind around so the close animation keeps
  // showing the page that was open instead of briefly flashing the
  // fallback placeholder while the flip-out plays.
  const [displayKind, setDisplayKind] = useState<NonEmptyKind>(
    kind === "empty" ? "about" : kind,
  );
  useEffect(() => {
    if (kind !== "empty") setDisplayKind(kind);
  }, [kind]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        // Perspective on this container drives the 3D depth of the
        // content page's rotateY flip.
        perspective: "2400px",
        perspectiveOrigin: "20% 50%",
      }}
    >
      {/* Chat — left page of the spread. Attached to the spine on the
          left (the SpiralBinding is outside this view, on the viewport
          edge). Takes full width when no page is open; compresses to
          20% when a page is open. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: isSplit ? "20%" : "100%",
          overflow: "hidden",
          transition: `width ${CHAT_WIDTH_MS}ms ${OPEN_EASE}`,
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
        {/* Soft fold shadow on the chat's right edge — where the inner
            seam meets the content page. Reads as "something tucks in
            against this edge." */}
        {isSplit && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 24,
              pointerEvents: "none",
              background:
                "linear-gradient(to left, rgba(0,0,0,0.10), transparent)",
              zIndex: 4,
            }}
          />
        )}
      </div>

      {/* Content page — right side of the spread. Pivots around its
          LEFT edge (the inner seam next to the chat). Starts at 95° edge-
          on (invisible, "behind" the spread), rotates to 0° flat on
          open. Always mounted so the flip-in can play; pointer events
          gated to avoid clicks when closed. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: "80%",
          overflow: "hidden",
          transformOrigin: "0% 50%",
          transform: isSplit ? "rotateY(0deg)" : "rotateY(95deg)",
          opacity: isSplit ? 1 : 0,
          pointerEvents: isSplit ? "auto" : "none",
          willChange: "transform",
          transition:
            `transform ${OPEN_MS}ms ${OPEN_EASE}, ` +
            `opacity ${OPEN_MS}ms ${OPEN_EASE}`,
          // Faint shadow along the inner seam while open — sells depth.
          boxShadow: isSplit
            ? "inset 10px 0 18px -12px rgba(0,0,0,0.22)"
            : undefined,
          zIndex: 1,
        }}
      >
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={displayKind}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: SWITCH_FADE_MS / 1000, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
            }}
          >
            <SplitContent kind={displayKind} onClose={onClose} />
          </motion.div>
        </AnimatePresence>
      </div>
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

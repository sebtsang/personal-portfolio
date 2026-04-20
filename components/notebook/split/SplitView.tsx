"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useStageStore, type StageView } from "@/lib/store";
import { Paper } from "../chrome/Paper";
import { SpreadMarginRule } from "../chrome/SpreadMarginRule";
import { ChatPage, type ChatMessage } from "../chat/ChatPage";
import { AboutPage } from "./AboutPage";
import { ContactPage } from "./ContactPage";
import { ContentPagePlaceholder } from "./ContentPagePlaceholder";
import { ExperiencePage } from "./ExperiencePage";
import { LinkedInPage } from "./LinkedInPage";

const OPEN_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const OPEN_MS = 700;
const CHAT_WIDTH_MS = 700;
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
 * - Opening a page: rotateY flip-in (700ms, ease-out-expo)
 * - Switching between open pages: horizontal slide (300ms) — new page
 *   slides in from the right, old slides out to the left
 * - Closing: rotateY flip-out back to edge-on
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

  const chatWidth = isSplit ? `${SEAM_PCT}%` : "100%";
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
      {/* Chat — left page */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: chatWidth,
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
      </div>

      {/* Shared spread margin rule — sits exactly at the chat's right
          edge. Chat scrollbar (native) lives just to its left. */}
      <SpreadMarginRule leftPct={SEAM_PCT} visible={isSplit} />

      {/* Content — right page. Pivots on its left seam. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: contentWidth,
          overflow: "hidden",
          transformOrigin: "0% 50%",
          transform: isSplit ? "rotateY(0deg)" : "rotateY(95deg)",
          opacity: isSplit ? 1 : 0,
          pointerEvents: isSplit ? "auto" : "none",
          willChange: "transform",
          transition:
            `transform ${OPEN_MS}ms ${OPEN_EASE}, ` +
            `opacity ${OPEN_MS}ms ${OPEN_EASE}`,
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

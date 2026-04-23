"use client";

import type { StageView } from "@/lib/store";
import { SpreadMarginRule } from "../chrome/SpreadMarginRule";
import type { ChatMessage } from "../chat/ChatPage";
import { AboutPage } from "../split/AboutPage";
import { ContactPage } from "../split/ContactPage";
import { ContentPagePlaceholder } from "../split/ContentPagePlaceholder";
import { ExperiencePage } from "../split/ExperiencePage";
import { LinkedInPage } from "../split/LinkedInPage";
import { ChatSidebar, SIDEBAR_PCT } from "./ChatSidebar";

type NonEmptyKind = Exclude<StageView["kind"], "empty">;

/**
 * A content page: narrow chat sidebar on the left + page-specific body on
 * the right, with a red margin rule at the seam. Each content page stays
 * mounted once visited — `animate` controls whether its body's reveal
 * animations play (true on first visit once the flip-in lands; false
 * thereafter because the page persists in place).
 */
export function ContentPage({
  kind,
  messages,
  onSubmit,
  isWriting = false,
  onClose,
  animate = true,
}: {
  kind: NonEmptyKind;
  messages: ChatMessage[];
  onSubmit: (text: string) => void;
  isWriting?: boolean;
  onClose: () => void;
  /** When `false`, the body's reveal primitives hold at their opening
   *  frame via PageAnimateContext. Flips it to `true` once the page's
   *  flip-in lands (managed by NotebookShell's `readyKinds`). */
  animate?: boolean;
}) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Left 28%: chat sidebar */}
      <ChatSidebar
        messages={messages}
        onSubmit={onSubmit}
        isWriting={isWriting}
      />

      {/* Seam: red margin rule */}
      <SpreadMarginRule leftPct={SIDEBAR_PCT} />

      {/* Right 72%: content body */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: `${100 - SIDEBAR_PCT}%`,
          overflow: "hidden",
          // Inset shadow on the spine side sells the "right page of a
          // notebook spread" feel.
          boxShadow: "inset 10px 0 18px -12px rgba(0,0,0,0.22)",
          zIndex: 1,
        }}
      >
        <ContentBody kind={kind} onClose={onClose} animate={animate} />
      </div>
    </div>
  );
}

function ContentBody({
  kind,
  onClose,
  animate,
}: {
  kind: NonEmptyKind;
  onClose: () => void;
  animate: boolean;
}) {
  if (kind === "about") return <AboutPage onClose={onClose} animate={animate} />;
  if (kind === "experience")
    return <ExperiencePage onClose={onClose} animate={animate} />;
  if (kind === "linkedin") return <LinkedInPage onClose={onClose} />;
  if (kind === "contact") return <ContactPage onClose={onClose} />;
  return <ContentPagePlaceholder onClose={onClose} />;
}

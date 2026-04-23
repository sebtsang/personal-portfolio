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
 * mounted once visited; reveal animations are gated via `animate` and
 * re-fired on every revisit via `sessionKey` (see NotebookShell +
 * PageAnimateContext).
 */
export function ContentPage({
  kind,
  messages,
  onSubmit,
  isWriting = false,
  onClose,
  animate = true,
  sessionKey = 0,
}: {
  kind: NonEmptyKind;
  messages: ChatMessage[];
  onSubmit: (text: string) => void;
  isWriting?: boolean;
  onClose: () => void;
  animate?: boolean;
  /** Bumps on every revisit to this page. Animated primitives use it as
   *  a React `key` so CSS animations restart from scratch. */
  sessionKey?: number;
}) {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <ChatSidebar
        messages={messages}
        onSubmit={onSubmit}
        isWriting={isWriting}
      />

      <SpreadMarginRule leftPct={SIDEBAR_PCT} />

      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: `${100 - SIDEBAR_PCT}%`,
          overflow: "hidden",
          boxShadow: "inset 10px 0 18px -12px rgba(0,0,0,0.22)",
          zIndex: 1,
        }}
      >
        <ContentBody
          kind={kind}
          onClose={onClose}
          animate={animate}
          sessionKey={sessionKey}
        />
      </div>
    </div>
  );
}

function ContentBody({
  kind,
  onClose,
  animate,
  sessionKey,
}: {
  kind: NonEmptyKind;
  onClose: () => void;
  animate: boolean;
  sessionKey: number;
}) {
  if (kind === "about")
    return <AboutPage onClose={onClose} animate={animate} sessionKey={sessionKey} />;
  if (kind === "experience")
    return (
      <ExperiencePage onClose={onClose} animate={animate} sessionKey={sessionKey} />
    );
  if (kind === "linkedin")
    return <LinkedInPage onClose={onClose} animate={animate} sessionKey={sessionKey} />;
  if (kind === "contact")
    return <ContactPage onClose={onClose} animate={animate} sessionKey={sessionKey} />;
  return <ContentPagePlaceholder onClose={onClose} />;
}

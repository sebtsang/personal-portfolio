"use client";

import { ChatPage, type ChatMessage } from "../chat/ChatPage";
import { CoverBackButton } from "../chrome/CoverBackButton";
import { Paper } from "../chrome/Paper";

/**
 * /home page: full-viewport chat. The cover-back button, "journal · home"
 * label, and corner doodle are chrome specific to this page and are
 * passed into ChatPage as `headerContent` so they live INSIDE the
 * scrollable content — scrolling down in chat history moves them off
 * screen, matching how the back button + meta label behave on every
 * content page.
 */
export function HomePage({
  messages,
  onSubmit,
  isWriting = false,
  autoFocus = true,
}: {
  messages: ChatMessage[];
  onSubmit: (text: string) => void;
  isWriting?: boolean;
  autoFocus?: boolean;
}) {
  const headerContent = (
    <>
      <CoverBackButton />
      <div
        style={{
          position: "absolute",
          // Baseline floats 0.19 × --line above rule 2, matching the
          // sender-label offset in chat home.
          top: "calc(var(--line) * 2.57 - var(--fs-meta) * 0.86)",
          // 12% lands just inside the red margin on the full viewport.
          left: "calc(12% + var(--pad-content-lg))",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--fs-meta)",
          letterSpacing: "0.25em",
          textTransform: "uppercase",
          color:
            "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
          lineHeight: 1,
          pointerEvents: "none",
        }}
      >
        journal · home
      </div>
      <svg
        aria-hidden
        style={{
          position: "absolute",
          top: "calc(var(--line) * 0.6)",
          right: 40,
          width: 80,
          height: 60,
          opacity: 0.3,
          pointerEvents: "none",
        }}
        viewBox="0 0 80 60"
      >
        <path
          d="M 10 30 Q 25 10, 40 30 T 70 30"
          stroke="var(--color-ink-soft)"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="70" cy="30" r="2" fill="var(--color-ink-soft)" />
      </svg>
    </>
  );

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Paper ruled={false} marginRule={true} />
      <ChatPage
        messages={messages}
        onSubmit={onSubmit}
        isWriting={isWriting}
        compact={false}
        autoFocus={autoFocus}
        headerContent={headerContent}
      />
    </div>
  );
}

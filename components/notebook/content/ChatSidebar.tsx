"use client";

import { ChatPage, type ChatMessage } from "../chat/ChatPage";
import { Paper } from "../chrome/Paper";

/** Width of the chat sidebar as a viewport %. */
export const SIDEBAR_PCT = 28;

/**
 * Narrow chat sidebar for content pages. Wraps the shared ChatPage in a
 * fixed-width 28%-viewport column on the left. Static layout — the
 * sidebar is only ever this width, no morphing to or from full-screen.
 */
export function ChatSidebar({
  messages,
  onSubmit,
  isWriting = false,
}: {
  messages: ChatMessage[];
  onSubmit: (text: string) => void;
  isWriting?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: 0,
        width: `${SIDEBAR_PCT}%`,
        overflow: "hidden",
        zIndex: 2,
      }}
    >
      <Paper ruled={false} marginRule={false} />
      <ChatPage
        messages={messages}
        onSubmit={onSubmit}
        isWriting={isWriting}
        compact={true}
        autoFocus={false}
      />
    </div>
  );
}

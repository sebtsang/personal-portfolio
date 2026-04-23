"use client";

import { useDeferredValue, useEffect, useRef, type ReactNode } from "react";
import { NotebookInput } from "./NotebookInput";
import { NotebookMessage, type ChatRole } from "./NotebookMessage";
import { WritingIndicator } from "./WritingIndicator";
import { hasSeenMessage, markMessagesSeen } from "./seenMessages";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

/**
 * Scrollable chat body: messages list + writing indicator + input.
 *
 * Fully static layout — `compact` selects between the wide (home) and
 * narrow (sidebar) visual modes and does not animate between them.
 *
 * `headerContent`: optional chrome rendered INSIDE the scroll content
 * div at the top, so it scrolls with the messages. Used by HomePage for
 * the cover-back button + "journal · home" label + corner doodle — they
 * need to scroll away when the user scrolls down through chat history,
 * just like content pages' back-button + meta label do.
 */
export function ChatPage({
  messages,
  onSubmit,
  isWriting = false,
  compact = false,
  autoFocus = true,
  headerContent,
}: {
  messages: ChatMessage[];
  onSubmit: (text: string) => void;
  isWriting?: boolean;
  compact?: boolean;
  autoFocus?: boolean;
  headerContent?: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Deferred render for the messages list. When useChat streams in
  // tokens (arriving 20-100/s), React would normally re-render the
  // whole list on every token — which can cause page-flip / layout
  // animations to stutter. useDeferredValue lets React keep the old
  // list painted while higher-priority work (animations, input
  // handling) is pending; the new list catches up during idle time.
  const deferredMessages = useDeferredValue(messages);

  // Snapshot which message IDs have been seen *before* this render so we
  // know which to animate. After the render commits, add all IDs to the
  // seen set so the next render (and future mounts on other pages) skip
  // re-animation.
  const seenSnapshot = new Set<string>(
    deferredMessages.filter((m) => hasSeenMessage(m.id)).map((m) => m.id),
  );
  useEffect(() => {
    markMessagesSeen(deferredMessages.map((m) => m.id));
  }, [deferredMessages]);

  // Follow-to-bottom auto-scroll. Pins the viewport on newest content
  // when the user is already near the bottom; honors manual scroll-up
  // to read history. ResizeObserver catches message additions AND
  // streaming token growth AND writing-indicator toggles uniformly.
  useEffect(() => {
    const outer = scrollRef.current;
    const inner = contentRef.current;
    if (!outer || !inner) return;

    const NEAR_BOTTOM_PX = 120;
    const isNearBottom = () =>
      outer.scrollHeight - outer.scrollTop - outer.clientHeight <
      NEAR_BOTTOM_PX;

    let pinned = true;
    let ignoreNextScroll = false;
    const onScroll = () => {
      if (ignoreNextScroll) {
        ignoreNextScroll = false;
        return;
      }
      pinned = isNearBottom();
    };
    outer.addEventListener("scroll", onScroll, { passive: true });

    const snap = () => {
      if (!pinned) return;
      ignoreNextScroll = true;
      outer.scrollTop = outer.scrollHeight;
    };

    snap();

    const obs = new ResizeObserver(snap);
    obs.observe(inner);
    return () => {
      obs.disconnect();
      outer.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      <div
        ref={scrollRef}
        style={{
          position: "absolute",
          inset: 0,
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        <div
          ref={contentRef}
          style={{
            position: "relative",
            minHeight: "100%",
            // Home's extra top padding reserves space for the chrome
            // row (back button + journal label + breathing gap). Compact
            // has no such chrome so uses a tighter value.
            paddingTop: compact
              ? "calc(var(--line) * 3)"
              : "calc(var(--line) * 5)",
            paddingBottom: compact ? 240 : 280,
            // Ruled lines tile across the full scroll height so they
            // travel with the content on scroll.
            backgroundImage: "var(--rule-background)",
          }}
        >
          {headerContent}
          {deferredMessages.map((m, i) => (
            <div key={m.id}>
              {i > 0 && <div style={{ height: "var(--line)" }} />}
              <NotebookMessage
                text={m.text}
                role={m.role}
                idx={i}
                compact={compact}
                animated={!seenSnapshot.has(m.id)}
              />
            </div>
          ))}

          {isWriting && (
            <>
              {messages.length > 0 && (
                <div style={{ height: "var(--line)" }} />
              )}
              <WritingIndicator compact={compact} />
            </>
          )}
        </div>
      </div>

      <NotebookInput
        onSubmit={onSubmit}
        compact={compact}
        autoFocus={autoFocus}
        // Prompt chips only on the empty-chat state.
        showSuggestions={!messages.some((m) => m.role === "user")}
      />
    </div>
  );
}

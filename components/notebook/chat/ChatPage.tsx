"use client";

import { useDeferredValue, useEffect, useRef } from "react";
import { CoverBackButton } from "../chrome/CoverBackButton";
import { NotebookInput } from "./NotebookInput";
import { NotebookMessage, type ChatRole } from "./NotebookMessage";
import { WritingIndicator } from "./WritingIndicator";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
};

export function ChatPage({
  messages,
  onSubmit,
  isWriting = false,
  compact = false,
  autoFocus = true,
}: {
  messages: ChatMessage[];
  onSubmit: (text: string) => void;
  isWriting?: boolean;
  compact?: boolean;
  autoFocus?: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Deferred render for the messages list. When useChat streams in
  // tokens (arriving 20-100/s), React would normally re-render the
  // whole list on every token — which can cause page-flip / layout
  // animations to stutter. useDeferredValue lets React keep the old
  // list painted while higher-priority work (animations, input
  // handling) is pending; the new list catches up during idle time.
  // Perceived chat latency is unchanged; smoothness of concurrent
  // animations improves meaningfully.
  const deferredMessages = useDeferredValue(messages);

  // Auto-scroll to bottom when a new message arrives. Drive off the
  // RAW messages (not the deferred value) so scrolling feels
  // instantaneous even while the list paints a frame behind.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      {/* Scrolling paper interior. The ruled lines live on the inner
          content div (not the Paper chrome), so when the user scrolls,
          paper + lines + text all move together — text stays on a rule
          instead of drifting between rules. */}
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
          style={{
            position: "relative",
            minHeight: "100%",
            // Full mode needs space for two stacked chrome rows (back
            // button at line 1.25, meta label at line 2.5) plus a
            // one-line breathing gap before messages begin. Compact
            // mode has no chrome here (split view owns its back
            // button), so a tighter top padding is fine.
            paddingTop: compact
              ? "calc(var(--line) * 3)"
              : "calc(var(--line) * 4.5)",
            paddingBottom: compact ? 240 : 280,
            // Ruled lines tile across the full scroll height so they
            // travel with the content. Line at y=26px of each 32px row.
            backgroundImage:
              "linear-gradient(to bottom, transparent 25px, rgba(61, 52, 139, 0.12) 26px, transparent 27px)",
            backgroundSize: "100% var(--line, 32px)",
            backgroundRepeat: "repeat-y",
          }}
        >
          {/* Chat home chrome — matches the content-page pattern:
              back button on its own row at the top, meta label below.
              Only shows in full mode; compact (split view) has its own
              PageBackButton inside SplitView. */}
          {!compact && <CoverBackButton />}
          {!compact && (
            <div
              style={{
                position: "absolute",
                top: "calc(var(--line) * 2.5)",
                // Aligned with CoverBackButton above; same reasoning
                // as in CoverBackButton — 12% lands just inside the
                // red margin on the full-viewport chat home.
                left: "calc(12% + 20px)",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
                lineHeight: "var(--line)",
              }}
            >
              journal · home
            </div>
          )}

          {/* Corner doodle — a small curve in the top right */}
          {!compact && (
            <svg
              aria-hidden
              style={{
                position: "absolute",
                top: "calc(var(--line) * 0.6)",
                right: 40,
                width: 80,
                height: 60,
                opacity: 0.3,
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
          )}

          {deferredMessages.map((m, i) => (
            <div key={m.id}>
              {i > 0 && <div style={{ height: "var(--line)" }} />}
              <NotebookMessage
                text={m.text}
                role={m.role}
                idx={i}
                compact={compact}
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
        // Show the prompt chips only on the empty-chat state
        // (before any user message). After that, they'd compete with
        // the conversation for attention.
        showSuggestions={!messages.some((m) => m.role === "user")}
      />
    </div>
  );
}

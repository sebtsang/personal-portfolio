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
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Deferred render for the messages list. When useChat streams in
  // tokens (arriving 20-100/s), React would normally re-render the
  // whole list on every token — which can cause page-flip / layout
  // animations to stutter. useDeferredValue lets React keep the old
  // list painted while higher-priority work (animations, input
  // handling) is pending; the new list catches up during idle time.
  // Perceived chat latency is unchanged; smoothness of concurrent
  // animations improves meaningfully.
  const deferredMessages = useDeferredValue(messages);

  // Follow-to-bottom auto-scroll. Three events need to pin the
  // viewport on the newest content:
  //   1. user sends a message        (messages.length grows)
  //   2. writing indicator appears   (isWriting flips true)
  //   3. bot streams tokens          (last message text grows; same length)
  // The old implementation only covered #1. A ResizeObserver on the
  // content container catches all three (and the indicator's removal
  // when the stream ends too), because every one of them changes the
  // inner div's height.
  //
  // We only auto-follow if the user is *already* near the bottom — a
  // `pinned` flag tracks their scroll position so manual scroll-up to
  // read history isn't hijacked by a fresh streaming reply. Compact
  // mode (split-view chat) shows a small slice of the log, so the
  // follow behavior matters most there; home mode benefits too but
  // with a taller viewport, users are more likely to scroll up.
  useEffect(() => {
    const outer = scrollRef.current;
    const inner = contentRef.current;
    if (!outer || !inner) return;

    const NEAR_BOTTOM_PX = 120; // within this of the floor = "follow me"
    const isNearBottom = () =>
      outer.scrollHeight - outer.scrollTop - outer.clientHeight <
      NEAR_BOTTOM_PX;

    let pinned = true;
    // Ignore one scroll event immediately after we programmatically
    // set scrollTop — otherwise the self-triggered scroll would be
    // read as user intent and flip `pinned` erroneously.
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

    // Initial state: user hasn't scrolled yet → pinned to bottom.
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
          ref={contentRef}
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
              : "calc(var(--line) * 5)",
            paddingBottom: compact ? 240 : 280,
            // Ruled lines tile across the full scroll height so they
            // travel with the content. Formula from globals.css so every
            // ruled surface shares one baseline-anchored offset.
            backgroundImage: "var(--rule-background)",
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
                // Label baseline at midpoint of the slot between rule 1
                // and rule 2 — floats between rules for breathing room.
                top: "calc(var(--line) * 2.26 - var(--fs-meta) * 0.86)",
                // Aligned with CoverBackButton above; same reasoning
                // as in CoverBackButton — 12% lands just inside the
                // red margin on the full-viewport chat home.
                left: "calc(12% + var(--pad-content-lg))",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-meta)",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
                lineHeight: 1,
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

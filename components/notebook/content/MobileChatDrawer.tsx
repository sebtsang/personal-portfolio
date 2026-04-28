"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChatPage, type ChatMessage } from "../chat/ChatPage";
import { Paper } from "../chrome/Paper";

const SHEET_HEIGHT_VH = 85;

/**
 * Mobile-only chat drawer. Floating chat button pinned to the bottom-right;
 * tapping opens a bottom-sheet that slides up and contains the same
 * `<ChatPage compact>` the desktop sidebar uses. Backdrop tap or
 * downward swipe closes the sheet.
 *
 * Reuses `<ChatPage>` directly — every chat behavior (intent matching,
 * message reveals, writing indicator, input) stays identical to desktop.
 *
 * `viewKind` is passed in (rather than read from the zustand store
 * directly) so this component doesn't subscribe to store updates that
 * happen mid-render in NotebookShell's first-paint store sync —
 * subscribing here would cause "Cannot update component while rendering"
 * warnings on every mount.
 *
 * Auto-closes when viewKind changes (navigation triggered from inside
 * the drawer). Without this, the drawer keeps covering the newly-
 * flipped-in page.
 */
export function MobileChatDrawer({
  messages,
  onSubmit,
  isWriting = false,
  viewKind,
}: {
  messages: ChatMessage[];
  onSubmit: (text: string) => void;
  isWriting?: boolean;
  viewKind: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [viewKind]);

  const close = () => setOpen(false);

  return (
    <>
      {/* Floating chat button — sits above the page chrome and stays put
          while the underlying page scrolls. Hidden when the drawer is
          open since the sheet itself + backdrop are how you dismiss.
          Pinned to the LEFT (clear of the spiral-binding rail) so it
          mirrors the desktop layout where the chat lives on the left
          side, and stays clear of the bottom-right page-number corner. */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          style={{
            position: "fixed",
            // 44px clears the 36px spiral binding with an 8px gap so the
            // button doesn't visually overlap the coils.
            left: 44,
            bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
            zIndex: 70,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--color-paper-warm)",
            border: "1px solid color-mix(in srgb, var(--color-rule-navy) 25%, transparent)",
            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--color-ink)",
            padding: 0,
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 26 26"
            aria-hidden
            style={{ display: "block" }}
          >
            {/* Speech-bubble glyph in handwritten ink color */}
            <path
              d="M 4 6 Q 4 4 6 4 L 20 4 Q 22 4 22 6 L 22 16 Q 22 18 20 18 L 11 18 L 7 22 L 7 18 L 6 18 Q 4 18 4 16 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="11" r="1.1" fill="currentColor" />
            <circle cx="13" cy="11" r="1.1" fill="currentColor" />
            <circle cx="17" cy="11" r="1.1" fill="currentColor" />
          </svg>
        </button>
      )}

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — tap to dismiss */}
            <motion.div
              key="chat-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={close}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.32)",
                zIndex: 80,
              }}
            />

            {/* Sheet — slides up from the bottom edge. drag="y" with a
                downward velocity / offset threshold dismisses on swipe. */}
            <motion.div
              key="chat-drawer-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.4 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 600) close();
              }}
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                bottom: 0,
                height: `${SHEET_HEIGHT_VH}vh`,
                zIndex: 90,
                background: "var(--color-paper)",
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                boxShadow: "0 -8px 28px rgba(0,0,0,0.25)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                touchAction: "pan-y",
              }}
            >
              {/* Drag handle pill */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: 8,
                  paddingBottom: 4,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 5,
                    borderRadius: 3,
                    background: "color-mix(in srgb, var(--color-ink-soft) 28%, transparent)",
                  }}
                />
              </div>

              {/* Chat surface */}
              <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
                <Paper ruled={false} marginRule={false} />
                <ChatPage
                  messages={messages}
                  onSubmit={onSubmit}
                  isWriting={isWriting}
                  compact={true}
                  autoFocus={true}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

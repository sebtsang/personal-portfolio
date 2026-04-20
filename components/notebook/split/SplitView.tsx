"use client";

import { useEffect, useState } from "react";
import { useStageStore } from "@/lib/store";
import { Paper } from "../chrome/Paper";
import { ChatPage, type ChatMessage } from "../chat/ChatPage";
import { AboutPage } from "./AboutPage";
import { ContentPagePlaceholder } from "./ContentPagePlaceholder";

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const DURATION = 420; // ms

/**
 * Two-pane layout: content page on the left (80%), chat on the right (20%).
 * Uses plain CSS transitions on `width` for a guaranteed 80/20 split
 * (framer-motion's width animation didn't reliably settle on the target).
 * The spiral binding is rendered outside this component and is unaffected.
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
  // Delay unmount of the content page until its exit transition finishes.
  const [contentMounted, setContentMounted] = useState(isSplit);
  useEffect(() => {
    if (isSplit) {
      setContentMounted(true);
      return;
    }
    const t = window.setTimeout(() => setContentMounted(false), DURATION);
    return () => window.clearTimeout(t);
  }, [isSplit]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
      }}
    >
      {contentMounted && (
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: isSplit ? "80%" : "0%",
            opacity: isSplit ? 1 : 0,
            overflow: "hidden",
            transition: `width ${DURATION}ms ${EASE}, opacity ${DURATION}ms ease`,
          }}
        >
          <SplitContent onClose={onClose} />
        </div>
      )}

      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          right: 0,
          width: isSplit ? "20%" : "100%",
          overflow: "hidden",
          transition: `width ${DURATION}ms ${EASE}`,
        }}
      >
        {/* Chat paints its own ruled lines inside the scroll area so
            text + lines scroll together. Paper just supplies the cream
            surface and (optionally) the red margin rule. */}
        <Paper ruled={false} marginRule={!isSplit} />
        <ChatPage
          messages={messages}
          onSubmit={onSubmit}
          isWriting={isWriting}
          compact={isSplit}
          autoFocus={false}
        />
        {isSplit && (
          <div
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 24,
              pointerEvents: "none",
              background:
                "linear-gradient(to right, rgba(0,0,0,0.10), transparent)",
              zIndex: 4,
            }}
          />
        )}
      </div>
    </div>
  );
}

function SplitContent({ onClose }: { onClose: () => void }) {
  const kind = useStageStore((s) => s.view.kind);
  if (kind === "about") return <AboutPage onClose={onClose} />;
  return <ContentPagePlaceholder onClose={onClose} />;
}

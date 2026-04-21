"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { matchIntent } from "@/lib/intents";
import { useStageStore, type StageView } from "@/lib/store";
import type { ToolName } from "@/lib/tools";
import { Paper } from "./chrome/Paper";
import { PageChrome } from "./chrome/PageChrome";
import { SpiralBinding } from "./chrome/SpiralBinding";
import { PageFlipTransition } from "./PageFlipTransition";
import { LandingPage } from "./landing/LandingPage";
import type { ChatMessage } from "./chat/ChatPage";
import { SplitView } from "./split/SplitView";

const WELCOME_BUBBLES = [
  "You've opened Seb's journal. I'm SebBot — handling the easy questions while he ships.",
  "Ask anything about him, try the slash commands below, or hit ⌘K (Ctrl+K) for the full command menu.",
];

/**
 * Match "open the menu / palette / commands" style phrases including
 * the shortcut slash commands /menu /cmd /palette /commands. Handled in
 * handleSubmit BEFORE matchIntent because this dispatches a window
 * event to open the palette instead of opening a content page.
 */
const PALETTE_INTENT =
  /^\/(menu|cmd|commands?|palette)\s*$|^(open|show)\s+(the\s+)?(menu|command\s+menu|palette|commands?)\s*\??$/i;

/**
 * Default one-liner to inject when the LLM emits a tool call with no
 * preceding text. Per-tool because the blank-bubble UX is most jarring
 * when the page opens silently — a one-word acknowledgment keeps the
 * conversation readable. Kept short so it doesn't fight the model's
 * own text when the model actually does produce some.
 */
const TOOL_FALLBACK_REPLY: Record<ToolName, string> = {
  showAbout: "Here's the about page.",
  showExperience: "Pulling up the timeline.",
  showContact: "Contact page — on it.",
  showLinkedIn: "Flipping through the posts.",
};

/**
 * Detect a 429 from /api/chat (whose body is `{ error: "rate-limited",
 * retryAfter, which }`) and translate it into a journal-voice bot reply.
 * Returns null for any other failure so the caller falls back to a console
 * log instead of pretending the bot said something.
 */
function rateLimitReply(err: unknown): string | null {
  const msg = err instanceof Error ? err.message : String(err);
  const jsonStart = msg.indexOf("{");
  if (jsonStart < 0) return null;
  try {
    const body = JSON.parse(msg.slice(jsonStart)) as {
      error?: string;
      retryAfter?: number;
      which?: "burst" | "hourly";
    };
    if (body.error !== "rate-limited") return null;
    if (body.which === "hourly") {
      const mins = Math.max(1, Math.round((body.retryAfter ?? 60) / 60));
      return `ok i need a coffee break — too many questions in an hour. try me again in ~${mins} min.`;
    }
    return "easy there — you're typing faster than i can write. give me a sec and try again.";
  } catch {
    return null;
  }
}

const FLIP_MS = 1100;
// Must match HandwrittenText defaults so seed 2 starts after seed 1 finishes.
// Faster per-char pacing keeps the pen-writing feel but lands total welcome
// time at ~3.6s instead of the previous ~7s.
const CHAR_DELAY_MS = 10;
const CHAR_DURATION_MS = 180;
const SEED_GAP_MS = 300;

export function NotebookShell({
  initialView,
  skipLanding = false,
}: {
  /**
   * If set to a non-empty view, skip the landing flip entirely and open
   * straight into the chat + split with that view mounted. Used for
   * deep-link routes like /about.
   */
  initialView?: StageView;
  /**
   * Skip the landing flip and mount the chat directly (no split view).
   * Seeds still stagger in — this is the "you opened the journal to the
   * home page" entry used by the /home route and by the palette's
   * "Home" item. Ignored when `initialView` is set (deep-link wins).
   */
  skipLanding?: boolean;
} = {}) {
  const view = useStageStore((s) => s.view);
  const setView = useStageStore((s) => s.setView);
  const dispatchTool = useStageStore((s) => s.dispatchTool);
  const isSplit = view.kind !== "empty";

  const deepLink = !!initialView && initialView.kind !== "empty";
  // Chat-only entry (/home): same "no landing flip" behavior as deep-link,
  // but seeds still animate in since there's no split content competing
  // for attention.
  const chatOnly = !deepLink && skipLanding;
  const entersWithChatMounted = deepLink || chatOnly;

  const [showLanding, setShowLanding] = useState(!entersWithChatMounted);
  const [flipping, setFlipping] = useState(false);
  const [chatMounted, setChatMounted] = useState(entersWithChatMounted);
  const [seedPhase, setSeedPhase] = useState(
    // Deep-link jumps seeds to completion (user came for the split, not
    // to read the intro). /home animates them in.
    deepLink ? WELCOME_BUBBLES.length : 0,
  );

  // Deep-link: push the initial view into the store on mount so the
  // split view opens with the right content.
  useEffect(() => {
    if (deepLink && initialView) setView(initialView);
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // /home entry: seeds animate in on mount (same timing as the normal
  // post-landing flow, but without the flip). Deep-link skips this
  // because seedPhase is pre-set to full, and normal landing skips it
  // because advance() is the trigger there.
  useEffect(() => {
    if (!chatOnly) return;
    let cumulative = 80;
    const timers: number[] = [];
    WELCOME_BUBBLES.forEach((text, i) => {
      const mountAt = cumulative;
      timers.push(
        window.setTimeout(
          () => setSeedPhase((p) => Math.max(p, i + 1)),
          mountAt,
        ),
      );
      cumulative +=
        text.length * CHAR_DELAY_MS + CHAR_DURATION_MS + SEED_GAP_MS;
    });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
    // Run once on mount; constants above are module-level.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL ↔ view sync. Two directions:
  //
  //   (a) View → URL: whenever `view` or `showLanding` changes, pushState
  //       the matching path. Uses window.history.pushState (not the Next
  //       router) so the same NotebookShell instance stays mounted and
  //       in-flight animations (page flip, split-to-split slide) don't
  //       restart on URL updates.
  //
  //   (b) URL → view: listen for `popstate` (browser back/forward) and
  //       update the store to match the new URL. Keeps the spread in
  //       sync with browser history without the user noticing.
  //
  // The landing page (path "/") is intentionally NOT tracked by this
  // effect — it has its own mounted state (showLanding=true) that would
  // be lost if we just pushState'd. The palette's "Landing page" item
  // uses router.push("/") for a full route change to get back there.
  //
  // Skip the very first effect run (urlSyncMounted ref) so deep-link
  // mounts don't briefly push "/home" before the separate setView
  // effect catches up to initialView on the next render.
  const urlSyncMounted = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!urlSyncMounted.current) {
      urlSyncMounted.current = true;
      return;
    }
    if (showLanding) return; // landing visible: don't touch URL
    const targetPath =
      view.kind === "empty" ? "/home" : `/${view.kind}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
  }, [view, showLanding]);

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      // "/" (landing) triggers a full Next route change — handled by
      // the framework re-rendering app/page.tsx, not by us.
      if (path === "/") return;
      // Map URL to view.
      const kind =
        path === "/home"
          ? ("empty" as const)
          : (path.slice(1) as StageView["kind"]);
      const validKinds: StageView["kind"][] = [
        "empty",
        "about",
        "experience",
        "linkedin",
        "contact",
      ];
      if (!validKinds.includes(kind)) return;
      // Make sure we're out of the landing state (popstate can arrive
      // before the re-render if the user rapidly back/forwards).
      if (showLanding) setShowLanding(false);
      if (!chatMounted) setChatMounted(true);
      setSeedPhase(WELCOME_BUBBLES.length);
      setView({ kind } as StageView);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [setView, showLanding, chatMounted]);

  const {
    messages: aiMessages,
    append,
    setMessages,
    isLoading,
  } = useChat({
    api: "/api/chat",
    onToolCall: ({ toolCall }) => {
      dispatchTool(
        toolCall.toolName as ToolName,
        toolCall.args as Record<string, unknown>,
      );
      // Safety net: if the LLM called a tool with no preceding text,
      // the user sees a blank SEBBOT bubble. voice.ts has a hard rule
      // against this, but models occasionally skip it anyway. Inject a
      // default one-liner onto the current assistant message so the
      // transition reads naturally regardless.
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const last = prev[prev.length - 1];
        if (last.role !== "assistant") return prev;
        if (last.content && last.content.trim().length > 0) return prev;
        const fallback = TOOL_FALLBACK_REPLY[toolCall.toolName as ToolName]
          ?? "Pulling that up.";
        return [
          ...prev.slice(0, -1),
          { ...last, content: fallback },
        ];
      });
    },
    onError: (err) => {
      console.error("[chat] request failed:", err);
      const reply = rateLimitReply(err);
      if (!reply) return;
      setMessages((prev) => [
        ...prev,
        {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `b-${Date.now()}`,
          role: "assistant",
          content: reply,
        },
      ]);
    },
  });

  const advance = useCallback(() => {
    if (!showLanding || flipping) return;
    setChatMounted(true);
    setFlipping(true);
    window.setTimeout(() => {
      setShowLanding(false);
      setFlipping(false);
    }, FLIP_MS);
    // Stagger seed mount so bubble 2 starts drawing only after bubble 1
    // finishes. Each bubble's draw time = chars × CHAR_DELAY + CHAR_DURATION.
    let cumulative = FLIP_MS + 80;
    WELCOME_BUBBLES.forEach((text, i) => {
      const mountAt = cumulative;
      window.setTimeout(
        () => setSeedPhase((p) => Math.max(p, i + 1)),
        mountAt,
      );
      cumulative += text.length * CHAR_DELAY_MS + CHAR_DURATION_MS + SEED_GAP_MS;
    });
  }, [flipping, showLanding]);

  // Landing-advance triggers: any non-trivial scroll (wheel or trackpad, any
  // direction), any arrow key / Space / Enter / PageUp / PageDown, or any
  // meaningful swipe. Intentionally direction-agnostic so mouse users
  // without horizontal scroll and readers coming from any gesture habit
  // can still flip forward. Escape remains reserved for closing the split.
  useEffect(() => {
    const WHEEL_THRESHOLD = 30;
    const TOUCH_THRESHOLD = 50;
    const ADVANCE_KEYS = new Set([
      "ArrowDown",
      "ArrowUp",
      "ArrowRight",
      "ArrowLeft",
      " ",
      "Enter",
      "PageDown",
      "PageUp",
    ]);

    const onWheel = (e: WheelEvent) => {
      if (!showLanding || flipping) return;
      const magnitude = Math.max(Math.abs(e.deltaX), Math.abs(e.deltaY));
      if (magnitude < WHEEL_THRESHOLD) return;
      advance();
    };

    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "Escape" && isSplit) {
        setView({ kind: "empty" });
        return;
      }
      if (showLanding && !flipping && ADVANCE_KEYS.has(e.key)) {
        e.preventDefault();
        advance();
      }
    };

    let touchStartX = 0;
    let touchStartY = 0;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStartX = t?.clientX ?? 0;
      touchStartY = t?.clientY ?? 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!showLanding || flipping) return;
      const t = e.changedTouches[0];
      const dx = (t?.clientX ?? 0) - touchStartX;
      const dy = (t?.clientY ?? 0) - touchStartY;
      if (Math.hypot(dx, dy) > TOUCH_THRESHOLD) advance();
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [advance, flipping, isSplit, setView, showLanding]);

  const closeSplit = useCallback(() => {
    setView({ kind: "empty" });
  }, [setView]);

  // One message stream: seeds first, then everything else in insertion
  // order from useChat. Intent-matched slash commands and LLM-streamed
  // exchanges live in the same list so they stay in chronological order.
  const messages: ChatMessage[] = useMemo(() => {
    const seed: ChatMessage[] = WELCOME_BUBBLES.slice(0, seedPhase).map(
      (text, i) => ({
        id: `seed-${i}`,
        role: "assistant",
        text,
      }),
    );
    const ai: ChatMessage[] = aiMessages
      .filter(
        (m) =>
          m.role !== "assistant" ||
          (m.content && m.content.length > 0) ||
          (m.toolInvocations && m.toolInvocations.length > 0),
      )
      .map((m) => ({
        id: m.id,
        role: m.role === "user" ? "user" : "assistant",
        text: m.content || "",
      }));
    return [...seed, ...ai];
  }, [aiMessages, seedPhase]);

  const handleSubmit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      // If the user sends before all seed bubbles have mounted, snap them
      // all in so their message doesn't get inserted between seeds.
      setSeedPhase(WELCOME_BUBBLES.length);

      // /menu, /cmd, /palette, "open the menu" — open the command
      // palette instead of appending to the chat. Handled before
      // matchIntent because there's no tool for this; it dispatches
      // the same window event the ⌘K hint chip uses.
      if (PALETTE_INTENT.test(trimmed)) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("sebjournal:open-palette"));
        }
        return;
      }

      const intent = matchIntent(trimmed);
      if (intent) {
        const userId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `u-${Date.now()}`;
        const botId =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `b-${Date.now()}`;
        // Append intent-matched exchange to the same useChat message list
        // as streamed responses, so chronological order is preserved when
        // the user interleaves slash commands and free-text questions.
        setMessages((prev) => [
          ...prev,
          { id: userId, role: "user", content: trimmed },
          { id: botId, role: "assistant", content: intent.reply },
        ]);
        // Delay the tool dispatch (= split view opening) so the user's
        // message + SebBot's one-liner both have a moment to land
        // visually before the page flip kicks in. 140ms was too fast —
        // the user-message bubble didn't breathe before the content
        // pane rotated in and competed for attention. 320ms lets the
        // handwritten reply read as a beat, then the page turns.
        window.setTimeout(
          () => dispatchTool(intent.tool, intent.args),
          320,
        );
        return;
      }

      append({ role: "user", content: trimmed });
    },
    [append, dispatchTool, setMessages],
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        perspective: "2400px",
        perspectiveOrigin: "50% 50%",
        backgroundColor: "#e8e3d5",
      }}
    >
      {/* Chat + split layer — mounts at start of flip, cross-fades in. */}
      <AnimatePresence initial={false}>
        {chatMounted && (
          <motion.div
            key="chat-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
            }}
          >
            {/* SplitView renders Paper per-pane internally, so we don't
                stack a shell-wide Paper here. */}
            <SplitView
              isSplit={isSplit}
              messages={messages}
              onSubmit={handleSubmit}
              isWriting={
                !!isLoading &&
                (() => {
                  const last = messages[messages.length - 1];
                  // Show indicator while the request is in flight AND no
                  // assistant tokens have streamed yet (i.e. the tail is
                  // either nothing, a user message, or an empty bot bubble).
                  return !last || last.role === "user" || !last.text;
                })()
              }
              onClose={closeSplit}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Landing — stays mounted until flip completes. Paper spans the full
          viewport; the spiral binding sits on top at left 0. */}
      {showLanding && (
        <PageFlipTransition flipping={flipping}>
          <div
            style={{
              position: "absolute",
              inset: 0,
            }}
          >
            <Paper ruled={false} marginRule={false} />
            <PageChrome />
            <LandingPage onAdvance={advance} />
          </div>
        </PageFlipTransition>
      )}

      {/* Spiral binding — pinned, always above, never rotates. */}
      <SpiralBinding />
    </div>
  );
}

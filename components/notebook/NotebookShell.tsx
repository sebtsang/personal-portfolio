"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useChat } from "@ai-sdk/react";
import { matchIntent } from "@/lib/intents";
import { useIsMobile } from "@/lib/hooks/useIsMobile";
import { useStageStore, type StageView } from "@/lib/store";
import type { ToolName } from "@/lib/tools";
import { Paper } from "./chrome/Paper";
import { PageChrome } from "./chrome/PageChrome";
import { SpiralBinding } from "./chrome/SpiralBinding";
import { CLOSE_JOURNAL_EVENT } from "./chrome/CoverBackButton";
import { PageFlipTransition } from "./PageFlipTransition";
import { PAGE_ORDER, type PageKey, orderOf } from "./pageOrder";
import { LandingPage } from "./landing/LandingPage";
import type { ChatMessage } from "./chat/ChatPage";
import { HomePage } from "./home/HomePage";
import { ContentPage } from "./content/ContentPage";

const WELCOME_BUBBLES = [
  "You've opened Seb's journal. I'm SebBot — handling the easy questions while he ships.",
  "Ask anything about him, or try the slash commands below.",
];

const TOOL_FALLBACK_REPLY: Record<ToolName, string> = {
  showAbout: "Here's the about page.",
  showExperience: "Pulling up the timeline.",
  showContact: "Contact page — on it.",
  showLinkedIn: "Flipping through the posts.",
};

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

const COVER_OPEN_MS = 1200;
const COVER_CLOSE_MS = 1700;
// Navigation model: pages are non-sequential sections. Every nav EXCEPT
// returning to home uses the "opening" flip (current page flips away,
// destination revealed). Returning to home uses the "closing" flip
// (home flips in from behind, covers current). 1500ms each — equally
// deliberate.
const FLIP_OPENING_MS = 1500;
const FLIP_OPENING_EASE = "cubic-bezier(0.76, 0, 0.24, 1)";
const FLIP_CLOSING_MS = 1500;
const FLIP_CLOSING_EASE = "cubic-bezier(0.32, 0.72, 0.18, 1)";
// Per-char welcome-seed pacing.
const CHAR_DELAY_MS = 10;
const CHAR_DURATION_MS = 180;
const SEED_GAP_MS = 300;

function kindToPageKey(kind: StageView["kind"]): PageKey {
  return kind === "empty" ? "home" : (kind as PageKey);
}

// Z-index stack: home on top (closest to cover), contact at the bottom.
// The stack order matches the journal metaphor — each forward nav flips
// the currently-visible page away to reveal the next one.
const Z_FOR_KIND: Record<PageKey, number> = {
  home: 5,
  about: 4,
  experience: 3,
  linkedin: 2,
  contact: 1,
};

export function NotebookShell({
  initialView,
  skipLanding = false,
}: {
  initialView?: StageView;
  skipLanding?: boolean;
} = {}) {
  // Sync the zustand store to `initialView` SYNCHRONOUSLY during render,
  // before anyone reads `view` below. Previously this sync lived in a
  // useEffect, which ran after first paint — that left a window where
  // `view.kind` was still the default {kind:"empty"} while `currentKind`
  // had already been initialized from `initialView`. The view-change
  // effect's first pass saw the mismatch and triggered a spurious flip
  // (e.g., /about → home → /about). Doing the sync in render — gated by
  // a ref so it only runs once per mount — makes the store match the
  // route's intended state by the time the view-change effect first
  // evaluates.
  const storeSyncedRef = useRef(false);
  if (!storeSyncedRef.current) {
    storeSyncedRef.current = true;
    const boot = initialView ?? { kind: "empty" };
    if (useStageStore.getState().view.kind !== boot.kind) {
      useStageStore.setState({ view: boot });
    }
  }

  const view = useStageStore((s) => s.view);
  const setView = useStageStore((s) => s.setView);
  const dispatchTool = useStageStore((s) => s.dispatchTool);
  const isMobile = useIsMobile();

  const deepLink = !!initialView && initialView.kind !== "empty";
  // Layer 2 safety net — belt for Layer 1's in-render store sync. Consumed
  // on the view-change effect's first invocation; prevents a spurious
  // flip if Layer 1 somehow doesn't land before the effect fires. See
  // the effect body for the guard that reads this.
  const firstRunRef = useRef(true);
  const chatOnly = !deepLink && skipLanding;
  const entersWithChatMounted = deepLink || chatOnly;

  // Cover-flip state (unchanged from before).
  const [showLanding, setShowLanding] = useState(!entersWithChatMounted);
  const [coverFlipping, setCoverFlipping] = useState(false);
  const [chatMounted, setChatMounted] = useState(entersWithChatMounted);
  const [coverClosing, setCoverClosing] = useState(false);
  const coverClosingRef = useRef(false);

  const [seedPhase, setSeedPhase] = useState(
    deepLink ? WELCOME_BUBBLES.length : 0,
  );

  // ── All-mounted page state ──────────────────────────────────────────
  // `currentKind`: the page the user is viewing (committed).
  // `mountedKinds`: every page ever visited in this session. Pages stay
  //   mounted so their state + images + rendered reveals persist across
  //   navigations — no remount means no re-animation.
  // `rotations`: each mounted page's current rotateY value (0° face-on
  //   or -180° flipped away). When a flip completes, the source page
  //   ends up at -180° and the destination at 0°.
  // `pendingKind`: non-null during a flip. The destination being navigated to.
  // `flippingKind`: the specific page whose div has CSS transition
  //   enabled during the flip (forward: source; backward: destination).
  // `flipTransition`: the `transition` CSS value to apply to flippingKind's
  //   div. Null means no transition. We toggle this in two rAF steps so
  //   the browser paints at the start rotation before the end rotation
  //   triggers the animation.
  // `readyKinds`: pages whose reveal animations are allowed to play. A
  //   page is "ready" once its flip-in has landed. Fresh mounts during a
  //   flip start as NOT ready — reveal primitives (DrawnText,
  //   RevealOnMount, Sticker, HandwrittenText) hold at their opening
  //   frame via `PageAnimateContext`.
  const initialKind: PageKey = deepLink
    ? (initialView!.kind as PageKey)
    : "home";
  const [currentKind, setCurrentKind] = useState<PageKey>(initialKind);
  const [pendingKind, setPendingKind] = useState<PageKey | null>(null);
  const [mountedKinds, setMountedKinds] = useState<Set<PageKey>>(
    () => new Set([initialKind]),
  );
  const [rotations, setRotations] = useState<Record<string, number>>({
    [initialKind]: 0,
  });
  const [flippingKind, setFlippingKind] = useState<PageKey | null>(null);
  const [flipTransition, setFlipTransition] = useState<string | null>(null);
  const [readyKinds, setReadyKinds] = useState<Set<PageKey>>(
    () => new Set([initialKind]),
  );
  // Per-page session counter. Bumps each time a page becomes currentKind
  // (first visit OR revisit after navigating away). Passed into each
  // page's PageAnimateContext so reveal primitives can use it as a
  // React key to force-remount their animated elements and replay the
  // CSS animations on revisits.
  const [sessionKeys, setSessionKeys] = useState<Record<string, number>>({
    [initialKind]: 0,
  });

  // /home fresh entry: seeds animate in from mount.
  useEffect(() => {
    if (!chatOnly) return;
    let cumulative = 80;
    const timers: number[] = [];
    WELCOME_BUBBLES.forEach((text, i) => {
      timers.push(
        window.setTimeout(
          () => setSeedPhase((p) => Math.max(p, i + 1)),
          cumulative,
        ),
      );
      cumulative +=
        text.length * CHAR_DELAY_MS + CHAR_DURATION_MS + SEED_GAP_MS;
    });
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // URL ↔ view sync.
  const urlSyncMounted = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!urlSyncMounted.current) {
      urlSyncMounted.current = true;
      return;
    }
    if (showLanding) return;
    const targetPath = currentKind === "home" ? "/home" : `/${currentKind}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, "", targetPath);
    }
  }, [currentKind, showLanding]);

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      if (path === "/") return;
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
      // Just dispatch the navigation. The empty-content fallback used to
      // be patched into the last assistant message here, but in streaming
      // useChat the assistant message often hasn't been appended yet at
      // this point — so the patch silently no-op'd and the user saw an
      // empty SEBBOT bubble next to the navigated page. The display-text
      // computation in the `messages` useMemo below now handles the
      // fallback deterministically based on toolInvocations.
      dispatchTool(
        toolCall.toolName as ToolName,
        toolCall.args as Record<string, unknown>,
      );
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

  // Cover flip: unchanged.
  const advance = useCallback(() => {
    if (!showLanding || coverFlipping || coverClosing) return;
    setChatMounted(true);
    setCoverFlipping(true);
    window.setTimeout(() => {
      setShowLanding(false);
      setCoverFlipping(false);
    }, COVER_OPEN_MS);
    let cumulative = COVER_OPEN_MS + 80;
    WELCOME_BUBBLES.forEach((text, i) => {
      window.setTimeout(
        () => setSeedPhase((p) => Math.max(p, i + 1)),
        cumulative,
      );
      cumulative +=
        text.length * CHAR_DELAY_MS + CHAR_DURATION_MS + SEED_GAP_MS;
    });
  }, [coverFlipping, showLanding, coverClosing]);

  const handleCoverClose = useCallback(() => {
    if (coverClosingRef.current) return;
    if (currentKind !== "home") return;
    coverClosingRef.current = true;
    setShowLanding(true);
    setCoverFlipping(false);
    setCoverClosing(true);
  }, [currentKind]);

  useEffect(() => {
    const onClose = () => handleCoverClose();
    window.addEventListener(CLOSE_JOURNAL_EVENT, onClose);
    return () => window.removeEventListener(CLOSE_JOURNAL_EVENT, onClose);
  }, [handleCoverClose]);

  useEffect(() => {
    if (!coverClosing) return;
    setCoverFlipping(true);
    const id = window.setTimeout(() => {
      setCoverClosing(false);
      setCoverFlipping(false);
      setChatMounted(false);
      setSeedPhase(0);
      // Reset the session on cover close — next time the cover opens,
      // the user gets a fresh chat, fresh page stack, no history of
      // prior navigation.
      setMessages([]);
      setView({ kind: "empty" });
      setCurrentKind("home");
      setPendingKind(null);
      setMountedKinds(new Set(["home"]));
      setRotations({ home: 0 });
      setFlippingKind(null);
      setFlipTransition(null);
      setReadyKinds(new Set(["home"]));
      coverClosingRef.current = false;
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", "/");
      }
    }, COVER_CLOSE_MS);
    return () => window.clearTimeout(id);
  }, [coverClosing, setMessages, setView]);

  // Landing-advance triggers: unchanged.
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
      if (!showLanding || coverFlipping) return;
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
      if (e.key === "Escape" && currentKind !== "home") {
        setView({ kind: "empty" });
        return;
      }
      if (showLanding && !coverFlipping && ADVANCE_KEYS.has(e.key)) {
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
      if (!showLanding || coverFlipping) return;
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
  }, [advance, coverFlipping, currentKind, setView, showLanding]);

  const closeContentPage = useCallback(() => {
    setView({ kind: "empty" });
  }, [setView]);

  // ── View-change → page flip trigger ────────────────────────────────
  // When `view.kind` changes, compare to committed `currentKind`. If
  // different and no flip is in flight, set up the flip:
  //   1. Mark destination mounted if not already; set its initial rotation
  //      (0° for forward nav = underneath source; -180° for backward =
  //      will flip in).
  //   2. Mark the flipping page (source on forward, destination on backward).
  //   3. Double-rAF: first paint at start rotations with no transition;
  //      second paint sets transition + end rotation so CSS animates.
  //   4. transitionend handler commits currentKind = destination and
  //      marks destination as ready (reveal animations can play).
  useEffect(() => {
    const firstRun = firstRunRef.current;
    firstRunRef.current = false;

    if (!chatMounted) return;
    if (showLanding) return;
    if (pendingKind !== null) return;
    const targetKind = kindToPageKey(view.kind);
    if (targetKind === currentKind) return;

    // Deep-link bootstrap guard. On a deep-link mount, the zustand store
    // may still hold its default {kind:"empty"} on the very first pass of
    // this effect — even with Layer 1's in-render sync, subtle React
    // timing (strict-mode double-render, concurrent tearing, a future
    // refactor that moves the sync) could leave a stale view.kind in
    // this effect's closure for one tick. In that tick, view.kind would
    // read as "empty" while currentKind is already the destination page,
    // and a spurious flip would fire. The guard skips exactly that one
    // pass — Layer 1's setView (or the removed Effect 1 analogue, now
    // covered by setView in popstate / dispatchTool) triggers a re-run
    // of this effect with correct state a tick later, which will hit
    // the targetKind === currentKind match above and return cleanly.
    if (firstRun && deepLink) return;

    // Flip direction rule (Option B — content pages are peers, not a
    // sequence): the ONLY meaningful distinction is "am I returning to
    // home?" Everything else uses the same opening flip.
    //   - returningToHome (target === "home"): closing flip. Home flips
    //     in from -180° → 0°, covering the current content page.
    //   - else: opening flip. Current page flips 0° → -180° away,
    //     destination revealed underneath. Same regardless of whether
    //     the destination's canonical index is above or below the source.
    const returningToHome = targetKind === "home";
    const flipPage: PageKey = returningToHome ? targetKind : currentKind;
    const destinationStart = returningToHome ? -180 : 0;

    setPendingKind(targetKind);

    // Bump the destination's session counter NOW (before the flip paints),
    // not at flip-end. The destination is already mounted with its
    // polaroids/stickers at the opacity-1 end-state of its previous visit.
    // Once we snap it to 0° for the forward flip, those stale elements
    // would show through — the user sees them appear, then disappear when
    // the (previously flip-end) remount resets them to opacity 0, then
    // fade back in. Bumping here makes the remount happen before paint:
    // destination becomes visible at opacity 0 already, no leak-through.
    // Combined with animate=false until readyKinds updates at flip-end,
    // gated reveal primitives (Sticker, HandwrittenText, DrawnText, plus
    // PolaroidFrame / MarginNote with the same gating) stay held at the
    // opening frame throughout the flip, then cascade in at flip-end.
    setSessionKeys((prev) => ({
      ...prev,
      [targetKind]: (prev[targetKind] ?? 0) + 1,
    }));

    // Ensure destination is mounted.
    setMountedKinds((prev) => {
      if (prev.has(targetKind)) return prev;
      const next = new Set(prev);
      next.add(targetKind);
      return next;
    });

    // Snap rotations to flip-start state. Critical fix: previously we
    // kept already-mounted pages at their last rotation, which caused
    // two bugs:
    //   1. Forward revisit to a page at -180° (flipped away previously):
    //      destination stayed hidden; source flipped away to reveal…
    //      whatever random page happened to be at 0°.
    //   2. Forward skip-jump (e.g. home → contact) past pages left at
    //      0° from earlier visits: those intermediate pages covered
    //      the destination because they had higher z-index.
    // The correct state for ANY flip:
    //   - Source stays at 0° (visible, will animate).
    //   - Destination at `destinationStart` (0° fwd / -180° bwd).
    //   - Every OTHER mounted page snaps to -180° so nothing
    //     interferes visually.
    setRotations((prev) => {
      const next: Record<string, number> = {};
      const kinds = new Set<string>([
        ...Object.keys(prev),
        targetKind,
        currentKind,
      ]);
      for (const kind of kinds) {
        if (kind === currentKind) next[kind] = 0;
        else if (kind === targetKind) next[kind] = destinationStart;
        else next[kind] = -180;
      }
      return next;
    });

    // Set up the flip. First render: flippingKind set, transition NULL
    // so React paints at start rotation with no animation. Second rAF:
    // set transition + end rotation so the CSS transition fires.
    setFlippingKind(flipPage);
    setFlipTransition(null);

    // No cleanup cancelling the rAF: the effect re-runs the moment we
    // setPendingKind (pendingKind is in the dep array), and a cleanup
    // would cancel raf1 before raf2 ever schedules, leaving the flip
    // stuck at its start frame and pendingKind stuck non-null forever.
    // Letting the rAFs run to completion is correct.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const ms = returningToHome ? FLIP_CLOSING_MS : FLIP_OPENING_MS;
        const easing = returningToHome
          ? FLIP_CLOSING_EASE
          : FLIP_OPENING_EASE;
        setFlipTransition(`transform ${ms}ms ${easing}`);
        setRotations((prev) => ({
          ...prev,
          // Opening: source flips to -180°. Closing: destination flips to 0°.
          [flipPage]: returningToHome ? 0 : -180,
        }));
      });
    });
  }, [view.kind, currentKind, pendingKind, chatMounted, showLanding]);

  // transitionend on the flipping page — commits the new currentKind and
  // marks the destination as ready so its reveal animations can play.
  const commitFlipEnd = useCallback(() => {
    if (pendingKind === null) return;
    const dest = pendingKind;
    setCurrentKind(dest);
    setPendingKind(null);
    setFlippingKind(null);
    setFlipTransition(null);
    setReadyKinds((prev) => {
      if (prev.has(dest)) return prev;
      const next = new Set(prev);
      next.add(dest);
      return next;
    });
    // Session counter is bumped at flip-start (in the view-change
    // effect), not here. Bumping at flip-end left a visible frame of
    // stale (opacity 1) polaroids / stickers from the previous visit
    // while the flip was in progress, which would then "disappear"
    // at flip-end and fade back in.
  }, [pendingKind]);

  const handlePageFlipEnd = useCallback(
    (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) return;
      if (e.propertyName !== "transform") return;
      commitFlipEnd();
    },
    [commitFlipEnd],
  );

  // Fallback: if the transitionend event doesn't reach React (observed on
  // mobile when the chat drawer's framer-motion AnimatePresence is mid-
  // exit during a flip — events get filtered or interrupted somewhere
  // upstream), commit the flip-end state at the expected animation end
  // time. Slightly longer than the longest flip duration to avoid racing
  // a real transitionend.
  useEffect(() => {
    if (pendingKind === null) return;
    const id = window.setTimeout(commitFlipEnd, FLIP_OPENING_MS + 200);
    return () => window.clearTimeout(id);
  }, [pendingKind, commitFlipEnd]);

  // One message stream: seeds + AI messages.
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
      .map((m) => {
        // Display-text resolution for assistant messages:
        //   1. If the assistant streamed text, use that as-is.
        //   2. Otherwise, if the message has a tool invocation, substitute
        //      the matching fallback reply so the navigation isn't paired
        //      with an empty bubble.
        //   3. Final fallback: empty string (kept for type safety; the
        //      filter above prevents this branch from rendering).
        let text = m.content || "";
        if (
          m.role === "assistant" &&
          text.trim().length === 0 &&
          m.toolInvocations &&
          m.toolInvocations.length > 0
        ) {
          const toolName = m.toolInvocations[0].toolName as ToolName;
          text = TOOL_FALLBACK_REPLY[toolName] ?? "Pulling that up.";
        }
        return {
          id: m.id,
          role: m.role === "user" ? ("user" as const) : ("assistant" as const),
          text,
        };
      });
    return [...seed, ...ai];
  }, [aiMessages, seedPhase]);

  const writingIndicator = useMemo(() => {
    if (!isLoading) return false;
    const last = messages[messages.length - 1];
    return !last || last.role === "user" || !last.text;
  }, [isLoading, messages]);

  const handleSubmit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setSeedPhase(WELCOME_BUBBLES.length);

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
        setMessages((prev) => [
          ...prev,
          { id: userId, role: "user", content: trimmed },
          { id: botId, role: "assistant", content: intent.reply },
        ]);
        // Delay the tool dispatch until the bot's reply finishes
        // pen-writing so the in-flight animation doesn't get disrupted
        // when the flip reshuffles state.
        const penWriteMs =
          intent.reply.length * CHAR_DELAY_MS + CHAR_DURATION_MS + 120;
        window.setTimeout(
          () => dispatchTool(intent.tool, intent.args),
          penWriteMs,
        );
        return;
      }

      append({ role: "user", content: trimmed });
    },
    [append, dispatchTool, setMessages],
  );

  // Render a page given its kind. `animate` controls whether reveal
  // primitives inside fire their animations (passed down via
  // PageAnimateContext inside each page component).
  const renderPage = useCallback(
    (kind: PageKey, animate: boolean) => {
      const sessionKey = sessionKeys[kind] ?? 0;
      if (kind === "home") {
        return (
          <HomePage
            messages={messages}
            onSubmit={handleSubmit}
            isWriting={writingIndicator}
            autoFocus={
              animate && currentKind === "home" && !coverFlipping && !showLanding
            }
          />
        );
      }
      return (
        <ContentPage
          kind={kind}
          activeViewKind={view.kind}
          messages={messages}
          onSubmit={handleSubmit}
          isWriting={writingIndicator}
          onClose={closeContentPage}
          animate={animate}
          sessionKey={sessionKey}
        />
      );
    },
    [
      messages,
      handleSubmit,
      writingIndicator,
      closeContentPage,
      currentKind,
      sessionKeys,
      coverFlipping,
      showLanding,
      view.kind,
    ],
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        // Tighter perspective on mobile so the rotateY page-flip reads
        // as a 3D flip on a portrait viewport instead of a flat squeeze.
        // 2400px on a 375px-wide screen makes the rotation barely visible
        // because the camera is too far back relative to the page width;
        // 1400px gives the flip the depth it needs.
        perspective: isMobile ? "1400px" : "2400px",
        perspectiveOrigin: "50% 50%",
        backgroundColor: "#e8e3d5",
      }}
    >
      {/* Chat/content layer. Every visited page is mounted as a sibling
          with its own rotateY. Navigation animates one page's rotation;
          all other pages stay put at their current rotation and retain
          all their state, images, and revealed content. */}
      <AnimatePresence initial={false}>
        {chatMounted && (
          <motion.div
            key="chat-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            style={{ position: "absolute", inset: 0, zIndex: 10 }}
          >
            {PAGE_ORDER.filter((kind) => mountedKinds.has(kind)).map((kind) => {
              const rotation = rotations[kind] ?? 0;
              const isFlipping = flippingKind === kind;
              // Animate ONLY the currently-visible page with no flip
              // in progress. This toggles true/false as the user navigates
              // away and back, which — combined with the per-page
              // sessionKey — makes reveal animations replay on every
              // revisit.
              const animate =
                kind === currentKind &&
                pendingKind === null &&
                readyKinds.has(kind);
              // Flipping page gets a high z-index during the animation
              // so it sits on top regardless of canonical stack order.
              // Opening flip: source needs to be on top (so it covers
              //   destination at 0° before flipping away). Without the
              //   bump, a content-to-content nav where destination has
              //   higher canonical z (e.g., /contact → /about) would
              //   have destination covering source at flip start.
              // Closing flip: destination (home) needs to be on top as
              //   it rotates in and lands covering source. Home's
              //   canonical z=5 is already highest, but the bump is
              //   harmless here.
              const zIndex = isFlipping ? 50 : Z_FOR_KIND[kind];
              return (
                <div
                  key={kind}
                  onTransitionEnd={isFlipping ? handlePageFlipEnd : undefined}
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex,
                    transformOrigin: "left center",
                    transform: `rotateY(${rotation}deg)`,
                    transition: isFlipping && flipTransition ? flipTransition : "none",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    willChange: isFlipping ? "transform" : undefined,
                  }}
                >
                  {renderPage(kind, animate)}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Landing / cover flip — unchanged. */}
      {showLanding && (
        <PageFlipTransition
          flipping={coverFlipping}
          direction={coverClosing ? "closing" : "opening"}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            <Paper ruled={false} marginRule={false} />
            <PageChrome />
            <LandingPage onAdvance={advance} />
          </div>
        </PageFlipTransition>
      )}

      <SpiralBinding />
    </div>
  );
}

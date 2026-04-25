"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlashCommandRow } from "./SlashCommandRow";
import { PromptSuggestions } from "./PromptSuggestions";

/**
 * Fixed-bottom chat input. Two static layouts by `compact`:
 *   - Home: "you —" label inline beside the input, fuller padding, paper-plane
 *     send button at the right edge (always visible, scaled 18px).
 *   - Sidebar: no sender label, tighter padding, compact placeholder, smaller
 *     paper-plane send button (14px).
 *
 * `AnimatePresence` kept on the prompt-suggestion chip row only — that one
 * fades out smoothly when the user sends their first message (within the same
 * rendered page). Everything else is static; whole-page flips handle
 * compact↔full transitions via FlipStage.
 */
export function NotebookInput({
  onSubmit,
  compact = false,
  autoFocus = true,
  showSuggestions = false,
}: {
  onSubmit: (text: string) => void;
  compact?: boolean;
  autoFocus?: boolean;
  /** Show the random-prompt chip row above the slash commands — only on empty-chat state. */
  showSuggestions?: boolean;
}) {
  const [val, setVal] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const t = setTimeout(() => inputRef.current?.focus(), 200);
    return () => clearTimeout(t);
  }, [autoFocus]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setVal("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit(val);
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        background:
          "linear-gradient(to bottom, rgba(250, 247, 240, 0) 0, rgba(250, 247, 240, 1) 32px, rgba(250, 247, 240, 1) 100%)",
        paddingTop: 40,
        paddingBottom: 28,
        pointerEvents: "none",
        zIndex: 10,
      }}
    >
      <div
        style={{
          paddingLeft: compact
            ? "calc(12% + var(--pad-content-sm))"
            : "calc(12% + var(--pad-content))",
          // Home: right gutter is ~40px larger than the left gutter
          // (12% − 48px) so the page reads visually balanced with a
          // slight bias for breathing room. Sidebar keeps its tighter 6%.
          paddingRight: compact ? "6%" : "calc(12% - 8px)",
          pointerEvents: "auto",
        }}
      >
        {/* Prompt suggestion chips fade + slide away when user sends first
            message. Stays as AnimatePresence because it's an intra-page
            mount/unmount, not a page-mode transition. */}
        <AnimatePresence initial={false}>
          {showSuggestions && (
            <motion.div
              key="prompt-suggestions"
              initial={{ opacity: 0, y: -4, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: 6, height: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{ overflow: "hidden" }}
            >
              <PromptSuggestions onSelect={submit} compact={compact} />
            </motion.div>
          )}
        </AnimatePresence>

        <SlashCommandRow onDispatch={submit} compact={compact} />

        {/* Input row layout matches the SlashCommandRow / PromptSuggestions
            rows directly above it (natural label width, gap 18) so the
            three rows form a clean visual rhythm. NotebookMessage's
            label column (width 64) is intentionally not mirrored here —
            chat history scrolls separately so the slight misalignment
            is invisible, and matching it would create a visibly wider
            label-to-content gap on this row vs the chip rows. */}
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "baseline",
            gap: 18,
          }}
        >
          {!compact && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-meta)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color:
                  "color-mix(in srgb, var(--color-ink-soft) 50%, transparent)",
                flexShrink: 0,
                lineHeight: "var(--line)",
              }}
            >
              you —
            </span>
          )}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              position: "relative",
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={
                compact
                  ? "ask anything"
                  : "ask anything, or type a slash command"
              }
              style={{
                width: "100%",
                padding: 0,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-input)",
                color: "var(--color-ink)",
                caretColor: "var(--color-ink-soft)",
                lineHeight: "var(--line)",
                borderBottom: `1px ${focused ? "solid" : "dashed"} color-mix(in srgb, var(--color-ink-soft) ${
                  focused ? 50 : 22
                }%, transparent)`,
                transition: "border-color 0.2s",
              }}
            />
          </div>
          <SendButton
            onClick={() => submit(val)}
            disabled={val.trim().length === 0}
            size={compact ? 14 : 18}
          />
        </div>
      </div>
    </div>
  );
}

// ── Send button ───────────────────────────────────────────────────────

/** Paper-plane send button. Permanent affordance at the right edge of the
 *  input row. Disabled when the input is empty (faded + not-allowed
 *  cursor). On hover with text: full ink + drop-shadow lift, matching the
 *  polaroid/sticker hover language. */
function SendButton({
  onClick,
  disabled,
  size,
}: {
  onClick: () => void;
  disabled: boolean;
  size: number;
}) {
  const [hover, setHover] = useState(false);
  const [active, setActive] = useState(false);

  const opacity = disabled ? 0.3 : hover ? 1 : 0.7;
  const scale = active && !disabled ? 0.92 : hover && !disabled ? 1.06 : 1;
  const shadow =
    hover && !disabled
      ? "drop-shadow(2px 3px 5px rgba(0,0,0,0.18))"
      : "none";

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setActive(false);
      }}
      onMouseDown={() => setActive(true)}
      onMouseUp={() => setActive(false)}
      title={disabled ? "type a message first" : "send (↵)"}
      aria-label="Send message"
      disabled={disabled}
      style={{
        background: "transparent",
        border: "none",
        // Keep the click area generous (padding) without bloating visual size.
        padding: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        color: "var(--color-ink)",
        opacity,
        transform: `scale(${scale})`,
        transition:
          "opacity 180ms ease, transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 200ms ease",
        filter: shadow,
        flexShrink: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        // Drop the button slightly so its visual centre aligns with the
        // input's typographic baseline.
        alignSelf: "flex-end",
        // Tiny offset so the icon sits flush with the input underline.
        marginBottom: 2,
      }}
    >
      <PaperPlaneIcon size={size} />
    </button>
  );
}

function PaperPlaneIcon({ size }: { size: number }) {
  // Hand-drawn-feeling paper plane: stroked outline with rounded joins,
  // slightly tilted up-and-forward as if mid-throw. Single triangular
  // body with a centre fold line.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: "rotate(5deg)", display: "block" }}
      aria-hidden
    >
      <path d="M2.5 11.5 L21.5 3 L16.5 21 L10.5 13 Z" />
      <path d="M10.5 13 L21.5 3" />
      <path d="M2.5 11.5 L10.5 13" />
    </svg>
  );
}

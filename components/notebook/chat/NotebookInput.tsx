"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SlashCommandRow } from "./SlashCommandRow";
import { PromptSuggestions } from "./PromptSuggestions";

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

  const prefill = (text: string) => {
    setVal(text);
    // Focus the input so the caret lands ready for the user to edit/hit enter.
    inputRef.current?.focus();
  };

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
        // Short fade at the very top (so messages visually slip under the
        // input edge), then fully opaque paper everywhere below. Using
        // pixel-valued stops instead of % so the opaque zone doesn't
        // shrink in compact mode where the stacked slash commands make
        // this container tall.
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
          paddingLeft: compact ? "calc(12% + var(--pad-content-sm))" : "calc(12% + var(--pad-content))",
          paddingRight: compact ? "6%" : "8%",
          pointerEvents: "auto",
        }}
      >
        {/* Prompt suggestion chips fade + slide away smoothly when the
            user sends their first message, instead of popping out and
            letting the slash row jump into their slot. */}
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
              <PromptSuggestions onSelect={prefill} compact={compact} />
            </motion.div>
          )}
        </AnimatePresence>

        <SlashCommandRow onDispatch={submit} compact={compact} />

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "baseline",
            gap: 0,
          }}
        >
          {!compact && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--fs-meta)",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "color-mix(in srgb, var(--color-ink-soft) 50%, transparent)",
                minWidth: 44,
                lineHeight: "var(--line)",
              }}
            >
              you —
            </span>
          )}
          <div style={{ flex: 1, position: "relative" }}>
            <input
              ref={inputRef}
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={
                compact ? "ask anything" : "ask anything, or type a slash command"
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
            {!compact && focused && val === "" && (
              <span
                style={{
                  position: "absolute",
                  right: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--fs-meta)",
                  letterSpacing: "0.15em",
                  color:
                    "color-mix(in srgb, var(--color-ink-soft) 40%, transparent)",
                  textTransform: "uppercase",
                  pointerEvents: "none",
                }}
              >
                ↵ send
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { ArrowUp, Command, Square } from "lucide-react";
import { useRef, useEffect, type ChangeEvent, type KeyboardEvent } from "react";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  onOpenPalette,
  onStop,
  compact = false,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (value: string) => void;
  isLoading: boolean;
  onOpenPalette: () => void;
  onStop?: () => void;
  compact?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) onSubmit(value);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(value);
      }}
      className={
        compact
          ? "flex items-end gap-2 px-4 pb-4 pt-2 md:px-5"
          : "mx-auto flex w-full max-w-2xl items-end gap-2 px-6 pb-8 pt-2 md:px-8"
      }
    >
      <div
        className={
          "relative flex flex-1 items-end rounded-2xl border border-[color-mix(in_srgb,var(--color-line)_75%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] focus-within:border-[color:var(--color-accent)] " +
          (compact ? "px-4 py-2.5" : "px-5 py-3")
        }
      >
        <textarea
          ref={ref}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder={
            compact ? "Keep chatting..." : "Ask anything — or try /projects"
          }
          rows={1}
          className={
            "max-h-40 flex-1 resize-none bg-transparent font-mono text-[color:var(--color-ink)] placeholder:text-[color:color-mix(in_srgb,var(--color-muted)_80%,transparent)] focus:outline-none " +
            (compact ? "text-[0.9rem]" : "text-[0.95rem]")
          }
        />
        <button
          type="button"
          onClick={onOpenPalette}
          title="Open command palette (⌘K)"
          aria-label="Open command palette"
          className="mb-0.5 ml-2 flex h-8 items-center gap-1 rounded-md border border-[color-mix(in_srgb,var(--color-line)_75%,transparent)] bg-[color-mix(in_srgb,var(--color-paper)_85%,transparent)] px-2 font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
        >
          <Command className="h-3 w-3" strokeWidth={2} />K
        </button>
      </div>
      {isLoading && onStop ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop generating"
          title="Stop generating"
          className={
            "flex shrink-0 items-center justify-center rounded-full text-white transition-colors " +
            (compact ? "h-11 w-11" : "h-12 w-12")
          }
          style={{ background: "var(--color-ink)" }}
        >
          <Square
            className={compact ? "h-3.5 w-3.5" : "h-4 w-4"}
            strokeWidth={2.5}
            fill="currentColor"
          />
        </button>
      ) : (
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          aria-label="Send message"
          className={
            "flex shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40 " +
            (compact ? "h-11 w-11" : "h-12 w-12")
          }
          style={{ background: "var(--color-accent)" }}
        >
          <ArrowUp
            className={compact ? "h-4 w-4" : "h-5 w-5"}
            strokeWidth={2.5}
          />
        </button>
      )}
    </form>
  );
}

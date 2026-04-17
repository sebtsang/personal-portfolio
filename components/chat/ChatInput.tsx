"use client";

import { ArrowUp, Command } from "lucide-react";
import { useRef, useEffect, type ChangeEvent, type KeyboardEvent } from "react";

export function ChatInput({
  value,
  onChange,
  onSubmit,
  isLoading,
  onOpenPalette,
}: {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (value: string) => void;
  isLoading: boolean;
  onOpenPalette: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Auto-resize
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [value]);

  // Autofocus on mount
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
      className="flex items-end gap-2 px-4 pb-4 pt-2 md:px-6"
    >
      <div className="relative flex flex-1 items-end rounded-2xl border border-[color-mix(in_srgb,var(--color-line)_75%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-4 py-2.5 focus-within:border-[color:var(--color-accent)]">
        <textarea
          ref={ref}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything — or try /projects"
          rows={1}
          className="max-h-40 flex-1 resize-none bg-transparent font-mono text-[0.9rem] text-[color:var(--color-ink)] placeholder:text-[color:color-mix(in_srgb,var(--color-muted)_80%,transparent)] focus:outline-none"
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
      <button
        type="submit"
        disabled={isLoading || !value.trim()}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
        style={{ background: "var(--color-accent)" }}
      >
        <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </form>
  );
}

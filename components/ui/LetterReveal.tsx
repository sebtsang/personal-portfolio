"use client";

/**
 * Letter-by-letter text reveal using requestAnimationFrame.
 * Inspired by Caleb Wu's hero title ("sweating the visual details.")
 * where each character pops in with a tight 35ms stagger.
 *
 * Whitespace is always visible (no reveal per space) so multi-word
 * strings feel like words assembling, not dashes of characters.
 *
 * Respects prefers-reduced-motion: shows the full string immediately.
 */
import { useEffect, useRef, useState } from "react";

export function LetterReveal({
  text,
  delay = 0,
  step = 35,
  className,
  as: Tag = "span",
}: {
  text: string;
  /** Milliseconds to wait before starting the reveal. */
  delay?: number;
  /** Milliseconds between characters. */
  step?: number;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  const startedAt = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Respect reduced motion — show everything immediately.
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisibleCount(text.length);
      return;
    }

    const tick = (t: number) => {
      if (startedAt.current === null) startedAt.current = t;
      const elapsed = t - startedAt.current - delay;
      if (elapsed < 0) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const n = Math.min(text.length, Math.floor(elapsed / step));
      setVisibleCount(n);
      if (n < text.length) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [text, delay, step]);

  const chars = Array.from(text);
  // Invisible-but-reserved element for layout stability + assistive reading.
  const Elem = Tag as React.ElementType;
  return (
    <Elem className={className} aria-label={text}>
      {chars.map((ch, i) => {
        const visible = i < visibleCount;
        const isSpace = ch === " " || ch === "\u00A0";
        return (
          <span
            key={i}
            aria-hidden="true"
            style={{
              display: "inline-block",
              opacity: visible || isSpace ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(0.3em)",
              transition:
                "opacity 220ms var(--ease-fast), transform 260ms var(--ease-fast)",
              whiteSpace: "pre",
            }}
          >
            {ch}
          </span>
        );
      })}
    </Elem>
  );
}

"use client";

/**
 * Lenis-powered smooth scroll, scoped to a specific scroll container
 * via the `wrapper`/`content` options. Used on the stage area only —
 * the chat panel keeps native scroll (instant scroll-to-bottom for
 * new messages is more important than buttery smooth there).
 *
 * Respects prefers-reduced-motion: bails out immediately.
 */
import { useEffect, useRef } from "react";
import Lenis from "lenis";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return;
    if (!wrapperRef.current || !contentRef.current) return;

    const lenis = new Lenis({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      lerp: 0.12,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="scroll-thin relative h-full overflow-y-auto"
    >
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

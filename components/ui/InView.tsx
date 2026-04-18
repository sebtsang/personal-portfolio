"use client";

/**
 * Reveal wrapper — children fade + translate in once when they first
 * enter the viewport. Uses IntersectionObserver, so this works with
 * Lenis smooth scroll and native scroll equivalently.
 *
 * Designed for stage content (project cards, timeline rows, resume
 * panels) — each row picks up its own entry animation the moment it
 * scrolls into view rather than all-at-once on mount.
 *
 * Respects prefers-reduced-motion: shows immediately, no animation.
 */

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const EASE = [0.62, 0.61, 0.02, 1] as const;

export function InView({
  children,
  delay = 0,
  duration = 0.55,
  y = 24,
  /** How much of the element must be visible before triggering. 0-1. */
  threshold = 0.12,
  /** Only animate the first time it enters view. */
  once = true,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefers = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    setReduced(prefers);
  }, []);

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) obs.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold, once, reduced]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

"use client";

/**
 * Custom cursor — fine-pointer only, hides on touch devices.
 *
 * Design (inspired by Caleb Wu):
 * - Small solid dot that follows exactly
 * - Outer ring that lags slightly (spring-like feel)
 * - Contextual tooltip next to the ring that appears on specific hover
 *   targets:
 *     [data-cursor="card"]     → "Click to open"
 *     [data-cursor="link"]     → "Follow"
 *     [data-cursor="back"]     → "Back"
 *     [data-cursor="tooltip"]  + [data-cursor-label="..."] → custom label
 *
 * Hides the native OS cursor on pointer-fine via a global rule injected
 * from this component (so reduced-motion users still get their native
 * cursor — see guard below).
 *
 * Reduced motion / coarse pointer: renders nothing.
 */
import { useEffect, useRef, useState } from "react";

type HoverKind = null | "card" | "link" | "back" | "tooltip";

export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [hoverKind, setHoverKind] = useState<HoverKind>(null);
  const [customLabel, setCustomLabel] = useState<string | null>(null);
  const [clicking, setClicking] = useState(false);
  const [hidden, setHidden] = useState(true); // hide until first movement

  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLDivElement>(null);

  // Animated position, updated inside a rAF loop for smooth ring lag.
  const mouse = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    if (!fine || reduced) return;

    setEnabled(true);

    // Hide native cursor globally while custom one is active.
    const style = document.createElement("style");
    style.id = "__custom-cursor-hide-native";
    style.textContent =
      "@media (pointer: fine) { *, *::before, *::after { cursor: none !important; } }";
    document.head.appendChild(style);

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (hidden) setHidden(false);

      // Move dot immediately — no lag.
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }

      // Detect contextual hover via [data-cursor] ancestor lookup.
      const target = e.target as HTMLElement | null;
      const cursorEl = target?.closest?.("[data-cursor]") as HTMLElement | null;
      if (cursorEl) {
        const kind = cursorEl.getAttribute("data-cursor") as HoverKind;
        const label = cursorEl.getAttribute("data-cursor-label");
        setHoverKind(kind);
        setCustomLabel(label);
      } else {
        setHoverKind(null);
        setCustomLabel(null);
      }
    };

    const onDown = () => setClicking(true);
    const onUp = () => setClicking(false);
    const onLeave = () => setHidden(true);
    const onEnter = () => setHidden(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    document.addEventListener("mouseleave", onLeave);
    document.addEventListener("mouseenter", onEnter);

    // rAF loop for the ring + label — lags smoothly behind the dot.
    let raf = 0;
    const loop = () => {
      const dx = mouse.current.x - ringPos.current.x;
      const dy = mouse.current.y - ringPos.current.y;
      ringPos.current.x += dx * 0.18;
      ringPos.current.y += dy * 0.18;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringPos.current.x}px, ${ringPos.current.y}px, 0)`;
      }
      if (labelRef.current) {
        // Offset a bit down-right from the ring.
        labelRef.current.style.transform = `translate3d(${ringPos.current.x + 22}px, ${ringPos.current.y + 18}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(raf);
      document.getElementById("__custom-cursor-hide-native")?.remove();
    };
  }, [hidden]);

  if (!enabled) return null;

  const hoverLabel =
    customLabel ??
    (hoverKind === "card"
      ? "Click to open"
      : hoverKind === "link"
        ? "Follow →"
        : hoverKind === "back"
          ? "← Back"
          : null);

  const hovering = hoverKind !== null;

  // Using inline styles instead of classes so we can animate the
  // transform property via rAF without fighting Tailwind's classes.
  const dotSize = clicking ? 5 : 7;
  const ringSize = hovering ? 44 : 28;

  return (
    <>
      {/* Dot — follows immediately */}
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: dotSize,
          height: dotSize,
          marginLeft: -dotSize / 2,
          marginTop: -dotSize / 2,
          borderRadius: "50%",
          background: "var(--color-accent)",
          pointerEvents: "none",
          zIndex: 9999,
          opacity: hidden ? 0 : 1,
          transition:
            "width 120ms var(--ease-fast), height 120ms var(--ease-fast), opacity 180ms var(--ease-fast)",
          willChange: "transform",
        }}
      />
      {/* Ring — lags slightly, grows on hover */}
      <div
        ref={ringRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: ringSize,
          height: ringSize,
          marginLeft: -ringSize / 2,
          marginTop: -ringSize / 2,
          borderRadius: hovering ? "0.5rem" : "50%",
          border: `1.5px solid color-mix(in srgb, var(--color-accent) ${hovering ? 60 : 45}%, transparent)`,
          pointerEvents: "none",
          zIndex: 9998,
          opacity: hidden ? 0 : hovering ? 0.8 : 0.55,
          background: hovering
            ? "color-mix(in srgb, var(--color-accent) 10%, transparent)"
            : "transparent",
          transition:
            "width 240ms var(--ease-fast), height 240ms var(--ease-fast), opacity 180ms var(--ease-fast), border-radius 240ms var(--ease-fast), background 200ms var(--ease-fast)",
          willChange: "transform",
        }}
      />
      {/* Contextual tooltip */}
      {hoverLabel && (
        <div
          ref={labelRef}
          aria-hidden
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 9998,
            padding: "4px 8px",
            borderRadius: "9999px",
            background: "var(--color-ink)",
            color: "var(--color-paper)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.68rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            opacity: hidden ? 0 : 1,
            transform: "translate3d(0,0,0)",
            transition: "opacity 180ms var(--ease-fast)",
            willChange: "transform",
          }}
        >
          {hoverLabel}
        </div>
      )}
    </>
  );
}

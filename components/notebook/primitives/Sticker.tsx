"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { usePageAnimate } from "./PageAnimateContext";

/**
 * Round sticker with drag + a "peel" animation on pickup. Starts at
 * `top`/`left`/`right`/`bottom`; once the user drags, local pos takes
 * over (absolute `left`/`top`), resetting on reload. Hover gives a
 * subtle lift; pressing down lifts higher and tilts, like a corner
 * starting to peel. Release springs back to rest with a bouncy tween.
 */
export function Sticker({
  size = 56,
  rotation = 0,
  top,
  left,
  right,
  bottom,
  background = "#fbfaf4",
  delayMs = 0,
  children,
}: {
  size?: number;
  rotation?: number;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  background?: string;
  delayMs?: number;
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pageAnimate = usePageAnimate();

  // Null = use the configured top/left/right/bottom. Non-null = dragged
  // coordinates in the positioned-ancestor coordinate space.
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const elRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef({ x: 0, y: 0 });

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (!elRef.current) return;
    e.preventDefault();
    const rect = elRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const parent = elRef.current?.offsetParent as HTMLElement | null;
      if (!parent) return;
      const parentRect = parent.getBoundingClientRect();
      setPos({
        x: e.clientX - parentRect.left - offsetRef.current.x,
        y: e.clientY - parentRect.top - offsetRef.current.y,
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragging]);

  // Position — drag position overrides the initial props.
  const positionStyle: CSSProperties = pos
    ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
    : { top, left, right, bottom };

  // Peel visuals: dragging is the most pronounced state. The "tilt" adds
  // to the base rotation so it reads as "one corner lifted up."
  const peelScale = dragging ? 1.2 : hover ? 1.08 : 1;
  const peelRotation = dragging ? rotation + 7 : rotation;
  const shadow = dragging
    ? "drop-shadow(5px 9px 14px rgba(0,0,0,0.38))"
    : hover
      ? "drop-shadow(3px 5px 9px rgba(0,0,0,0.3))"
      : "drop-shadow(2px 3px 5px rgba(0,0,0,0.22))";

  // Bouncy spring on release for the "place back on the page" feel.
  const transition = dragging
    ? "filter 140ms ease"
    : "transform 420ms cubic-bezier(0.34, 1.56, 0.64, 1), filter 260ms ease";

  return (
    <div
      ref={elRef}
      onPointerDown={onPointerDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        width: size,
        height: size,
        transform: `rotate(${peelRotation}deg) scale(${peelScale})`,
        transition,
        filter: shadow,
        animationName: "fadeIn",
        animationDuration: "0.7s",
        animationTimingFunction: "ease",
        animationDelay: `${delayMs}ms`,
        animationFillMode: "both",
        animationPlayState: pageAnimate ? "running" : "paused",
        zIndex: dragging ? 12 : 4,
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none",
        ...positionStyle,
      }}
    >
      {/* White sticker base */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background,
          border: "1px solid rgba(0,0,0,0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </div>
    </div>
  );
}

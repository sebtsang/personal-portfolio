"use client";

import { useState, type CSSProperties, type ReactNode } from "react";

/**
 * A round sticker with a white border and a drop shadow, like one you
 * peeled off a pad and stuck to the page. Hovering lifts it slightly.
 * Children should be an SVG or simple centered content.
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

  const baseShadow =
    "drop-shadow(2px 3px 5px rgba(0,0,0,0.22))";
  const hoverShadow =
    "drop-shadow(3px 5px 9px rgba(0,0,0,0.3))";

  const positionStyle: CSSProperties = {
    top,
    left,
    right,
    bottom,
  };

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "absolute",
        width: size,
        height: size,
        transform: `rotate(${rotation}deg) scale(${hover ? 1.08 : 1})`,
        transition:
          "transform 260ms cubic-bezier(0.22, 1, 0.36, 1), filter 260ms ease",
        filter: hover ? hoverShadow : baseShadow,
        animation: `fadeIn 0.7s ease ${delayMs}ms both`,
        zIndex: 4,
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

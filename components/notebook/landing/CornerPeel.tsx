"use client";

import { useId, useState } from "react";

/**
 * Triangular paper peel in the bottom-right corner. Grows on hover,
 * reveals a "next →" hint, and fires `onClick` to flip the page.
 */
export function CornerPeel({
  onClick,
  visible = true,
}: {
  onClick: () => void;
  visible?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  const shadowId = `cornerShadow-${uid}`;
  const gradId = `peelGrad-${uid}`;

  if (!visible) return null;

  const size = hover ? 120 : 64;
  const paperColor = "#f5f1e2";
  const shadowColor = "rgba(0,0,0,0.22)";
  const edgeColor = "#d9d2bf";

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="Flip to next page"
      title="flip to next page  ·  →"
      style={{
        position: "absolute",
        right: 0,
        bottom: 0,
        width: size + 32,
        height: size + 32,
        cursor: "pointer",
        zIndex: 30,
        transition:
          "width 0.35s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)",
      }}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${size + 32} ${size + 32}`}
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          <filter
            id={shadowId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur
              in="SourceAlpha"
              stdDeviation={hover ? 4 : 2}
            />
            <feOffset
              dx={hover ? -3 : -1}
              dy={hover ? 2 : 0.5}
              result="off"
            />
            <feFlood floodColor={shadowColor} />
            <feComposite in2="off" operator="in" />
            <feComponentTransfer>
              <feFuncA type="linear" slope={hover ? 0.9 : 0.6} />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id={gradId} x1="100%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={edgeColor} />
            <stop offset="40%" stopColor={paperColor} />
            <stop offset="100%" stopColor={paperColor} />
          </linearGradient>
        </defs>
        {/* Triangle peel — hinges on its diagonal top-right → bottom-left */}
        <polygon
          points={`${size + 32},${32} ${size + 32},${size + 32} ${32},${size + 32}`}
          fill={`url(#${gradId})`}
          filter={`url(#${shadowId})`}
          style={{ transition: "all 0.35s cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        />
        <line
          x1={size + 32}
          y1={32}
          x2={32}
          y2={size + 32}
          stroke="rgba(26,24,20,0.22)"
          strokeWidth="1"
        />
        {hover && (
          <text
            x={size + 32 - 16}
            y={size + 32 - 14}
            fontFamily='"Caveat", cursive'
            fontSize="18"
            fill="#5a5446"
            textAnchor="end"
            opacity="0.7"
            style={{ transition: "opacity 0.2s" }}
          >
            next →
          </text>
        )}
      </svg>
    </div>
  );
}

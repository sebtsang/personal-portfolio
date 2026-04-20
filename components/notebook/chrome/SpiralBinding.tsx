"use client";

/**
 * Metal spiral coils down the left edge of the viewport.
 * Pinned (fixed) so it never animates with page turns.
 */
export function SpiralBinding({ coils = 22 }: { coils?: number }) {
  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        width: 48,
        pointerEvents: "none",
        zIndex: 60,
      }}
    >
      {Array.from({ length: coils }).map((_, i) => {
        const t = (i + 0.5) / coils;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: -8,
              top: `${t * 100}%`,
              width: 38,
              height: 26,
              transform: "translateY(-50%)",
            }}
          >
            <svg width="38" height="26" viewBox="0 0 38 26">
              <defs>
                <linearGradient id={`coil-${i}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#d4d4d8" />
                  <stop offset="40%" stopColor="#71717a" />
                  <stop offset="70%" stopColor="#3f3f46" />
                  <stop offset="100%" stopColor="#18181b" />
                </linearGradient>
              </defs>
              {/* Coil — loops over the page's left edge. */}
              <path
                d="M 6 13 C 6 3, 20 3, 24 8 C 28 13, 28 18, 20 22 C 14 24, 6 22, 6 13 Z"
                fill="none"
                stroke={`url(#coil-${i})`}
                strokeWidth="2.4"
                strokeLinecap="round"
              />
              {/* Soft shadow cast onto the paper to the right. */}
              <ellipse
                cx="22"
                cy="15"
                rx="10"
                ry="3"
                fill="rgba(0,0,0,0.12)"
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
}

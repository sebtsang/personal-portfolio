"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * Background of faint, hand-drawn short lines that pulse in and out.
 * Ambient noise behind the landing — not structural, just texture.
 */
export function AmbientLines({
  stroke = "var(--color-ink)",
  count = 14,
  opacity = 0.4,
}: {
  stroke?: string;
  count?: number;
  opacity?: number;
}) {
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const measure = () =>
      setDims({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const lines = useMemo(() => {
    if (!dims.w || !dims.h) return [];
    const arr = [];
    for (let i = 0; i < count; i++) {
      const x1 = Math.random() * dims.w;
      const y1 = Math.random() * dims.h;
      const angle = Math.random() * Math.PI * 2;
      const len = 80 + Math.random() * 180;
      const x2 = x1 + Math.cos(angle) * len;
      const y2 = y1 + Math.sin(angle) * len;
      arr.push({
        x1,
        y1,
        x2,
        y2,
        len: Math.hypot(x2 - x1, y2 - y1),
        delay: Math.random() * 4,
        dur: 6 + Math.random() * 5,
      });
    }
    return arr;
  }, [dims.w, dims.h, count]);

  if (!dims.w) return null;

  return (
    <svg
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity,
      }}
    >
      {lines.map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke={stroke}
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeDasharray={l.len}
          strokeDashoffset={l.len}
          style={{
            animation: `ambient ${l.dur}s ease-in-out ${l.delay}s infinite`,
          }}
        />
      ))}
    </svg>
  );
}

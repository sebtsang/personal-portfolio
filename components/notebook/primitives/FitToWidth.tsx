"use client";

import { useLayoutEffect, useRef, useState } from "react";

/**
 * Scales a child down (never up) so it fits inside the parent's width.
 * Uses ResizeObserver on both wrapper and inner so we re-measure when
 * fonts settle or the window resizes. Also listens to document.fonts.ready
 * to catch the layout shift when web fonts replace the fallback.
 */
export function FitToWidth({
  children,
  maxScale = 1,
}: {
  children: React.ReactNode;
  maxScale?: number;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;

    const measure = () => {
      const wrapW = wrap.clientWidth;
      const innerW = inner.scrollWidth;
      if (innerW === 0 || wrapW === 0) return;
      const s = Math.min(maxScale, wrapW / innerW);
      setScale(s);
    };

    measure();

    const ro = new ResizeObserver(() => measure());
    ro.observe(wrap);
    ro.observe(inner);

    let cancelled = false;
    const whenFontsReady = async () => {
      if (!("fonts" in document)) return;
      try {
        await document.fonts.ready;
      } catch {
        return;
      }
      if (!cancelled) measure();
    };
    whenFontsReady();

    // A couple of re-measures catch late style/layout shifts (e.g. the
    // DrawnText clip-path animation completing, or async font faces).
    const t1 = window.setTimeout(measure, 250);
    const t2 = window.setTimeout(measure, 1200);

    return () => {
      cancelled = true;
      ro.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [maxScale]);

  return (
    <div
      ref={wrapRef}
      style={{ width: "100%", display: "flex", justifyContent: "center" }}
    >
      <div
        ref={innerRef}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          display: "inline-block",
        }}
      >
        {children}
      </div>
    </div>
  );
}

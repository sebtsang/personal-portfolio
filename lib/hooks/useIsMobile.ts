"use client";

import { useEffect, useState } from "react";

const MOBILE_QUERY = "(max-width: 768px)";

/**
 * Returns true on viewports ≤ 768px (phones + iPad portrait).
 *
 * Initializes to `false` on the server and on the first client render so
 * SSR + hydration agree — the desktop layout renders, then we swap to
 * mobile after mount if the media query matches. A one-frame flash on
 * mobile loads is the cost; a hydration mismatch warning would be worse.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const sync = () => setIsMobile(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  return isMobile;
}

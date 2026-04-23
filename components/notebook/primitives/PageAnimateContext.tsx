"use client";

import { createContext, useContext } from "react";

/**
 * Signals whether the page's reveal animations should play. `true` on a
 * page's first visit in the session; `false` on every subsequent visit
 * (including remounts caused by FlipStage). Set by each content page
 * (AboutPage, ExperiencePage, etc.) based on `hasSeenPage(kind)`.
 *
 * Default `true` so primitives used outside a content page (chat
 * bubbles) animate normally.
 */
export const PageAnimateContext = createContext<boolean>(true);

export function usePageAnimate(): boolean {
  return useContext(PageAnimateContext);
}

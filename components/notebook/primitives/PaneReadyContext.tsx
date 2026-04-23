"use client";

import { createContext, useContext } from "react";

/**
 * Signals whether the right-pane flip-in has completed. Reveal primitives
 * inside SplitContent (HandwrittenText, RevealOnMount, RoleEntry) read
 * this to hold their staggers until the pane is flat — so users see the
 * reveals play instead of catching them mid-flip behind an invisible
 * page. Default is `true` so the same primitives used outside the split
 * context (e.g., chat bubbles) animate immediately.
 */
export const PaneReadyContext = createContext<boolean>(true);

export function usePaneReady(): boolean {
  return useContext(PaneReadyContext);
}

"use client";

import { createContext, useContext } from "react";

/**
 * Per-page animation state passed via context.
 *
 * - `animate`: whether reveal primitives on this page should play right
 *   now. True when the page is currentKind AND no flip is in progress.
 *   False during a flip (animations held at opening frame via
 *   animationPlayState: paused or state-based reset) and when the page
 *   is not current.
 *
 * - `sessionKey`: bumps each time the page becomes currentKind. Primitives
 *   use it as a React `key` on their animated elements so CSS animations
 *   restart from scratch on every revisit — user asked for this. State
 *   outside the keyed animated element (polaroid drag positions, hover,
 *   scroll position, etc.) persists because only the animated leaves are
 *   remounted.
 */
export type PageAnimateState = {
  animate: boolean;
  sessionKey: number;
};

const DEFAULT_STATE: PageAnimateState = { animate: true, sessionKey: 0 };

export const PageAnimateContext = createContext<PageAnimateState>(DEFAULT_STATE);

export function usePageAnimate(): boolean {
  return useContext(PageAnimateContext).animate;
}

export function usePageSessionKey(): number {
  return useContext(PageAnimateContext).sessionKey;
}

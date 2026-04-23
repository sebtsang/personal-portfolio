/** Canonical page order. Pages stack shallow-to-deep: `home` is the
 *  first page (just inside the cover), `contact` is the deepest. Each
 *  page physically sits *on top of* the next one — going forward means
 *  flipping the current (shallower) page away to reveal the deeper
 *  page underneath. */
export const PAGE_ORDER = [
  "home",
  "about",
  "experience",
  "linkedin",
  "contact",
] as const;

export type PageKey = (typeof PAGE_ORDER)[number];

export function orderOf(kind: PageKey): number {
  return PAGE_ORDER.indexOf(kind);
}

/**
 * Module-level set of chat message IDs that have already been rendered
 * (and therefore animated) in this session. Survives React component
 * mount/unmount cycles, so when a page flip remounts the chat sidebar
 * on a new page, already-seen messages render at opacity 1 instantly
 * rather than re-playing their per-character HandwrittenText animation.
 *
 * Cleared on page reload; the chat state itself is also reset on reload
 * (useChat starts empty), so the two stay in sync.
 */
const SEEN_IDS = new Set<string>();

export function hasSeenMessage(id: string): boolean {
  return SEEN_IDS.has(id);
}

export function markMessagesSeen(ids: Iterable<string>): void {
  for (const id of ids) SEEN_IDS.add(id);
}

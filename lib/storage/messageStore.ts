/**
 * SCAFFOLD (plan §5, deferred wire-up).
 *
 * Persists useChat messages to localStorage so refreshing the tab
 * doesn't wipe the conversation.
 *
 * Full implementation below — safe to import and use. Wiring into
 * ChatShell.tsx (initialMessages + onFinish) is deferred until the
 * chat UI redesign stabilizes.
 *
 * Integration sketch (for when we're ready):
 *
 *   // components/chat/ChatShell.tsx
 *   import { loadMessages, saveMessages } from "@/lib/storage/messageStore";
 *
 *   const [initial, setInitial] = useState<Message[] | null>(null);
 *   useEffect(() => setInitial(loadMessages()), []);
 *
 *   const { messages, ... } = useChat({
 *     api: "/api/chat",
 *     initialMessages: initial ?? [],
 *     onFinish: () => saveMessages(messages),
 *   });
 *
 *   // Don't render until client hydration completes to avoid SSR
 *   // mismatch: if (initial === null) return null;
 *
 * Version key (STORAGE_KEY): bump the suffix if the Message shape
 * changes. Old data stays on disk but is filtered out by isValid.
 */

const STORAGE_KEY = "seb.chat.v1";
export const MAX_MESSAGES = 50;

/**
 * Minimal shape we persist. Keep decoupled from `useChat`'s full
 * Message type so a library version bump doesn't break persistence.
 */
export type StoredMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: number;
};

function isValid(m: unknown): m is StoredMessage {
  if (!m || typeof m !== "object") return false;
  const obj = m as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    (obj.role === "user" || obj.role === "assistant") &&
    typeof obj.content === "string"
  );
}

/**
 * Load persisted messages. Safe on SSR (returns [] if no window).
 * Corruption → clear + return [].
 */
export function loadMessages(): StoredMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(isValid);
    // Cap stored count on the load side too, in case of manual edits.
    return valid.slice(-MAX_MESSAGES);
  } catch {
    // Corrupted JSON or localStorage error — reset.
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* some browsers throw on removeItem in private mode */
    }
    return [];
  }
}

/**
 * Persist messages. Caps at MAX_MESSAGES (evicts oldest). On
 * QuotaExceededError, halves the count and tries again; if still
 * failing, gives up silently (memory stays in React state).
 */
export function saveMessages(messages: StoredMessage[]): void {
  if (typeof window === "undefined") return;

  // Trim to the newest MAX_MESSAGES entries.
  const trimmed = messages.slice(-MAX_MESSAGES);
  const toSave = trimmed.map(toStored);

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return;
  } catch (err) {
    // QuotaExceededError — try again with half as many messages.
    const halved = toSave.slice(-Math.floor(MAX_MESSAGES / 2));
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(halved));
    } catch {
      // Give up. React state keeps the full list; we just can't persist.
      console.warn("[messageStore] Failed to persist, giving up:", err);
    }
  }
}

/**
 * Clear persisted messages. Used by a "Clear conversation" command.
 */
export function clearMessages(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode — fine */
  }
}

/** Narrow an arbitrary useChat Message to the persisted shape. */
function toStored(m: unknown): StoredMessage {
  const obj = m as StoredMessage;
  return {
    id: obj.id,
    role: obj.role,
    content: obj.content,
    createdAt: obj.createdAt,
  };
}

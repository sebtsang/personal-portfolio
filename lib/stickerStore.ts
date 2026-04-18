"use client";

import { create } from "zustand";
import {
  loadStickers,
  saveStickers,
  STICKERS,
  type StickerId,
} from "./stickers";

type StickerStore = {
  unlocked: StickerId[];
  hydrated: boolean;
  /** The most recently awarded sticker — shown as a dropping toast */
  recentDrop: StickerId | null;
  /** Load from localStorage (called once on mount) */
  hydrate: () => void;
  /** Award a sticker if not already unlocked */
  award: (id: StickerId) => void;
  /** Dismiss the drop toast */
  dismissDrop: () => void;
  /** Clear the collection (for testing — used by the top-bar reset) */
  reset: () => void;
};

export const useStickerStore = create<StickerStore>((set, get) => ({
  unlocked: [],
  hydrated: false,
  recentDrop: null,
  hydrate: () => {
    if (get().hydrated) return;
    set({ unlocked: loadStickers(), hydrated: true });
  },
  award: (id) => {
    const { unlocked } = get();
    if (unlocked.includes(id)) return;
    const next = [...unlocked, id];
    saveStickers(next);
    set({ unlocked: next, recentDrop: id });
    // Auto-dismiss the drop after 3.2s
    setTimeout(() => {
      if (get().recentDrop === id) set({ recentDrop: null });
    }, 3200);
  },
  dismissDrop: () => set({ recentDrop: null }),
  reset: () => {
    saveStickers([]);
    set({ unlocked: [], recentDrop: null });
  },
}));

export { STICKERS };

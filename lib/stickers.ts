/**
 * Sticker easter egg. Visiting each major stage view awards a sticker.
 * Persisted to localStorage so you keep your collection across visits.
 *
 * A sticker is awarded the first time each StageView.kind is entered.
 * The collection panel in the top bar shows all unlocked stickers and
 * how many are left to discover.
 */

export type StickerId =
  | "projects"
  | "experience"
  | "resume"
  | "contact"
  | "linkedin"
  | "project-detail";

export type Sticker = {
  id: StickerId;
  emoji: string; // a unicode glyph stand-in; consider swapping for SVG later
  label: string;
  phrase: string;
  color: string;
};

export const STICKERS: Record<StickerId, Sticker> = {
  projects: {
    id: "projects",
    emoji: "◆",
    label: "Curator",
    phrase: "You found the work.",
    color: "rgb(100 181 246)", // blue
  },
  "project-detail": {
    id: "project-detail",
    emoji: "◎",
    label: "Deep reader",
    phrase: "You clicked through. Respect.",
    color: "rgb(129 199 132)", // green
  },
  experience: {
    id: "experience",
    emoji: "▲",
    label: "Time traveller",
    phrase: "You walked the timeline.",
    color: "rgb(255 183 77)", // amber
  },
  resume: {
    id: "resume",
    emoji: "■",
    label: "Recruiter-coded",
    phrase: "Straight to the docs.",
    color: "rgb(244 143 177)", // pink
  },
  linkedin: {
    id: "linkedin",
    emoji: "✦",
    label: "Post reader",
    phrase: "You like public writing.",
    color: "rgb(149 117 205)", // purple
  },
  contact: {
    id: "contact",
    emoji: "★",
    label: "Bold mover",
    phrase: "Looking for a way in.",
    color: "rgb(229 115 115)", // red
  },
};

export const STICKER_ORDER: StickerId[] = [
  "projects",
  "project-detail",
  "experience",
  "linkedin",
  "resume",
  "contact",
];

const STORAGE_KEY = "seb.stickers.v1";

export function loadStickers(): StickerId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StickerId[]) : [];
  } catch {
    return [];
  }
}

export function saveStickers(ids: StickerId[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* quota / private-browsing — fail silent */
  }
}

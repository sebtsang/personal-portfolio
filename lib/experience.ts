/**
 * Facts about the timeline — the ONE place dates, titles, current-ness and
 * the internship count live. The prose (blurbs in ExperiencePage, the
 * corpus .md files) is still hand-written, but `scripts/check-corpus.ts`
 * fails when it drifts from this list.
 *
 * Update flow when a role starts/ends: edit this file, update the blurbs
 * and corpus prose, run `npm run corpus:check`.
 */

export type RoleKind = "internship" | "fellowship" | "leadership" | "other";

export type RoleFact = {
  key: string;
  company: string;
  title: string;
  /** Display range, e.g. "May 2026 – Aug 2026". */
  dates: string;
  /** true → still ongoing; must render as "Present". */
  current: boolean;
  kind: RoleKind;
  /** How many internship terms this entry counts as (Interac's Sep 2024 –
   *  Apr 2025 entry was a back-to-back double co-op term). */
  terms?: number;
};

/** Newest first — same order as the experience page. */
export const TIMELINE: RoleFact[] = [
  {
    key: "friedmannai",
    company: "FriedmannAI",
    title: "AI Engineer",
    dates: "Sep 2026 – Present",
    current: true,
    kind: "internship",
  },
  {
    key: "ey",
    company: "EY",
    title: "AI & Data Consultant",
    dates: "May 2026 – Aug 2026",
    current: false,
    kind: "internship",
  },
  {
    key: "polarity",
    company: "Polarity",
    title: "AI Engineer",
    dates: "Apr 2026 – Present",
    current: true,
    kind: "fellowship",
  },
  {
    key: "bmo",
    company: "BMO",
    title: "Data & AI Developer",
    dates: "Jan 2026 – Apr 2026",
    current: false,
    kind: "internship",
  },
  {
    key: "stan",
    company: "Stan",
    title: "Growth",
    dates: "Mar 2026 – Apr 2026",
    current: false,
    kind: "other",
  },
  {
    key: "interac-de",
    company: "Interac",
    title: "Data Engineering Intern",
    dates: "May 2025 – Aug 2025",
    current: false,
    kind: "internship",
  },
  {
    key: "interac-da",
    company: "Interac",
    title: "Data Analyst, IT Operations",
    dates: "Sep 2024 – Apr 2025",
    current: false,
    kind: "internship",
    terms: 2,
  },
  {
    key: "toastmasters",
    company: "Toastmasters",
    title: "President",
    dates: "May 2024 – Apr 2025",
    current: false,
    kind: "leadership",
  },
  {
    key: "spirit-of-math-de",
    company: "Spirit of Math",
    title: "Data Engineering Intern",
    dates: "May 2024 – Aug 2024",
    current: false,
    kind: "internship",
  },
  {
    key: "spirit-of-math-ta",
    company: "Spirit of Math",
    title: "Technical Analyst Intern",
    dates: "May 2023 – Aug 2023",
    current: false,
    kind: "internship",
  },
];

export const roleFact = (key: string): RoleFact => {
  const fact = TIMELINE.find((r) => r.key === key);
  if (!fact) throw new Error(`[experience] unknown role key: ${key}`);
  return fact;
};

/** Internship terms (fellowships/leadership excluded) — currently 8. */
export const INTERNSHIP_COUNT = TIMELINE.filter(
  (r) => r.kind === "internship"
).reduce((n, r) => n + (r.terms ?? 1), 0);

/** Distinct companies with an internship (Spirit of Math, Interac, BMO, EY, FriedmannAI). */
export const INTERNSHIP_COMPANY_COUNT = new Set(
  TIMELINE.filter((r) => r.kind === "internship").map((r) => r.company)
).size;

const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve",
];
/** "eight" — for prose that prefers words over digits. */
export const INTERNSHIP_COUNT_WORD =
  NUMBER_WORDS[INTERNSHIP_COUNT] ?? String(INTERNSHIP_COUNT);

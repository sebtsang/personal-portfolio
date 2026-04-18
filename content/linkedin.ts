/**
 * Your favorite LinkedIn posts, shown as a stacked-deck flashcard
 * carousel (front: hook, back: full body). Paste in ~5-8 best posts.
 *
 * Find them at https://www.linkedin.com/in/sebtsang/recent-activity/all/
 *
 * Fields:
 * - id           — unique slug, stable url-safe string
 * - hook         — the first 1-2 lines; what appears on the card front
 * - body         — the full post body (markdown-ish; newlines preserved)
 * - date         — ISO date string "YYYY-MM-DD"
 * - reactions    — approx count (optional); shown as "· 142 reactions"
 * - comments     — approx count (optional)
 * - url          — permalink to the post on LinkedIn
 * - accent       — Tailwind gradient classes applied to the card
 *                  (e.g. "from-blue-500/20 to-cyan-500/10")
 */

export type LinkedInPost = {
  id: string;
  hook: string;
  body: string;
  date: string;
  reactions?: number;
  comments?: number;
  url: string;
  accent?: string;
};

export const linkedinPosts: LinkedInPost[] = [
  // ─────────────────────────────────────────────────────────────
  // Placeholder examples — replace with your real favorite posts.
  // Keep the `hook` to 1-2 lines (punchy; this is what recruiters
  // read in 6 seconds). The `body` can be the full post.
  // ─────────────────────────────────────────────────────────────
  {
    id: "placeholder-1",
    hook: "Shipped something I'm actually proud of this week.",
    body: `Placeholder — swap this with a real post from your LinkedIn.

The hook (above) is what shows on the card front. This body shows on the back when someone clicks to flip.

Keep a few of your highest-signal posts here — the ones a recruiter would want to read in full.`,
    date: "2026-03-15",
    reactions: 142,
    comments: 18,
    url: "https://www.linkedin.com/in/sebtsang/",
    accent: "from-blue-500/20 to-cyan-500/10",
  },
  {
    id: "placeholder-2",
    hook: "Everyone says 'AI is the future' like it's one thing.",
    body: `Placeholder — swap with a real post.

A thread about how 'AI' is an umbrella for at least five distinct disciplines and why treating them as one thing leads to bad hiring decisions.`,
    date: "2026-02-10",
    reactions: 89,
    comments: 12,
    url: "https://www.linkedin.com/in/sebtsang/",
    accent: "from-emerald-500/20 to-teal-500/10",
  },
  {
    id: "placeholder-3",
    hook: "My first Interac internship taught me more than my first year of CS.",
    body: `Placeholder — swap with a real post.

Reflection on what you learned at Interac that school didn't teach.`,
    date: "2025-12-01",
    reactions: 203,
    comments: 24,
    url: "https://www.linkedin.com/in/sebtsang/",
    accent: "from-amber-500/20 to-orange-500/10",
  },
  {
    id: "placeholder-4",
    hook: "I built a chatbot portfolio. Yes, the entire site is the bot.",
    body: `Placeholder — swap with a real post.

Story of building this very site with Claude Code in a weekend.`,
    date: "2026-04-17",
    reactions: 67,
    comments: 9,
    url: "https://www.linkedin.com/in/sebtsang/",
    accent: "from-purple-500/20 to-pink-500/10",
  },
];

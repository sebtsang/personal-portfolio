/**
 * A deck of one-line facts about Seb. Each request gets one at random
 * (see factForThisReply), so curveballs and jokes vary between visitors.
 * The bot keeps no history, so without this every visitor gets the same
 * most-likely reply.
 *
 * `source` is text copied exactly from content/corpus/<file>. The
 * `npm run corpus:check` script fails if a source stops appearing in its
 * file, so editing the corpus can't leave a stale fact behind.
 */

export type Fact = { fact: string; file: string; source: string };

export const FACTS: Fact[] = [
  { fact: "Played AAA rep basketball through high school.", file: "quirks.md", source: "Played **AAA rep** through high school" },
  { fact: "Travelled for basketball tournaments in Vegas, Victoria, Calgary and Toronto.", file: "quirks.md", source: "**Vegas, Victoria, Calgary, Toronto.**" },
  { fact: "Plays guard as a shooter, with a dangerous first step.", file: "quirks.md", source: "dangerous first step" },
  { fact: "Has done eight internships: Spirit of Math, Interac, BMO, EY and FriedmannAI.", file: "experience.md", source: "**Eight internships** — 2 Spirit of Math, 3 Interac, 1 BMO, 1 EY, 1 FriedmannAI" },
  { fact: "Wrote content that reached 500k+ impressions during his growth stint at Stan.", file: "experience.md", source: "500k+ impressions" },
  { fact: "Built this whole site with Claude Code in a couple of evenings.", file: "taste.md", source: "Built this entire site with it in a couple of evenings" },
  { fact: "Calls Claude Code the greatest coding agent tool of all time.", file: "taste.md", source: "greatest coding agent tool of all time" },
  { fact: "Switched to the Helium browser because Arc is dead.", file: "taste.md", source: "**Helium browser.** His browser now. Arc is dead." },
  { fact: "Is a big fan of T3 Code.", file: "taste.md", source: "**T3 Code.** Seb is a big fan." },
  { fact: "Thinks heyclicky is one of the coolest tools he's ever tried.", file: "taste.md", source: "**heyclicky.** One of the coolest tools he's ever tried." },
  { fact: "Still uses a four-year-old M1 14-inch MacBook Pro, with no plans to upgrade.", file: "taste.md", source: "four years in, no plans to upgrade" },
  { fact: "Takes his coffee black. Only black.", file: "quirks.md", source: "**Coffee is black.** Only black." },
  { fact: "Refuses to grind leetcode.", file: "quirks.md", source: "**Refuses to leetcode.**" },
  { fact: "Posts on LinkedIn daily and still thinks its UI is horrible.", file: "quirks.md", source: "**LinkedIn has a horrible UI.**" },
  { fact: "Reads a lot of fantasy; The Name of the Wind is his favourite.", file: "quirks.md", source: "*The Name of the Wind* is his favourite" },
  { fact: "His cologne collection has gotten out of hand.", file: "quirks.md", source: "gotten out of hand" },
  { fact: "Snowboards, as a real hobby, not resume filler.", file: "quirks.md", source: "**Snowboarding.** Already on the resume under interests. Real hobby, not filler." },
  { fact: "Watches every single Will Tennyson video.", file: "quirks.md", source: "Watches every single one" },
  { fact: "Loves the show Suits.", file: "quirks.md", source: "**Suits.** The show. Loves it." },
  { fact: "Listens to Dominic Fike.", file: "quirks.md", source: "**Dominic Fike.**" },
  { fact: "His go-to podcast is Modern Wisdom.", file: "taste.md", source: "*Modern Wisdom* is Seb's go-to podcast" },
  { fact: "Spends Saturdays at Toronto or Waterloo tech events, not at brunch.", file: "quirks.md", source: "At an event in **Toronto or Waterloo**" },
];

/**
 * Inserted just before SCOPE_REMINDER on each request (see
 * buildSystemPrompt), so the long shared prompt before it stays
 * byte-identical across requests and the scope check still comes last.
 */
export function factForThisReply(): string {
  const { fact } = FACTS[Math.floor(Math.random() * FACTS.length)];
  return `# FACT FOR THIS REPLY
If this reply is a curveball or a joke, build it around this fact about Seb: ${fact}
It never changes what is in scope. Ignore it for every other kind of reply.`;
}

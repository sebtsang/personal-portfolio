/**
 * Fails when the hand-written prose drifts from lib/experience.ts.
 *   npm run corpus:check
 *
 * Checks:
 *   1. every role's date range appears in experience.md (and bio.md for
 *      internships/fellowships), so ending a role means updating the prose
 *   2. "Present" shows up in those files only next to current roles
 *   3. "<number-word> internships" always matches INTERNSHIP_COUNT
 *   4. ExperiencePage lists roles in the same order as TIMELINE
 */
import fs from "node:fs";
import path from "node:path";
import {
  INTERNSHIP_COUNT,
  INTERNSHIP_COUNT_WORD,
  TIMELINE,
} from "../lib/experience";

const root = path.join(__dirname, "..");
const read = (rel: string) => fs.readFileSync(path.join(root, rel), "utf8");

const experienceMd = read("content/corpus/experience.md");
const bioMd = read("content/corpus/bio.md");
const page = read("components/notebook/split/ExperiencePage.tsx");

const errors: string[] = [];

for (const role of TIMELINE) {
  const label = `${role.company} (${role.title})`;
  const files: [string, string][] = [["experience.md", experienceMd]];
  if (role.kind !== "leadership") files.push(["bio.md", bioMd]);
  for (const [name, text] of files) {
    if (!text.includes(role.dates)) {
      errors.push(`${name}: missing "${role.dates}" for ${label}`);
    }
  }
  if (!role.current && role.dates.includes("Present")) {
    errors.push(`${label}: dates say Present but current is false`);
  }
}

// Any "– Present" range in the prose must belong to a current role.
const currentRanges = new Set(
  TIMELINE.filter((r) => r.current).map((r) => r.dates)
);
for (const [name, text] of [
  ["experience.md", experienceMd],
  ["bio.md", bioMd],
] as const) {
  for (const m of text.matchAll(/[A-Z][a-z]{2} \d{4} – Present/g)) {
    if (!currentRanges.has(m[0])) {
      errors.push(`${name}: "${m[0]}" is not a current role in lib/experience.ts`);
    }
  }
}

const WORDS = [
  "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve",
];
for (const [name, text] of [
  ["experience.md", experienceMd],
  ["bio.md", bioMd],
] as const) {
  for (const m of text.matchAll(/\b(\w+) internships\b/gi)) {
    const w = m[1].toLowerCase();
    if (WORDS.includes(w) && w !== INTERNSHIP_COUNT_WORD) {
      errors.push(
        `${name}: says "${m[0]}" but INTERNSHIP_COUNT is ${INTERNSHIP_COUNT} (${INTERNSHIP_COUNT_WORD})`
      );
    }
  }
}

const pageKeys = [...page.matchAll(/roleFact\("([^"]+)"\)/g)].map((m) => m[1]);
const timelineKeys = TIMELINE.map((r) => r.key);
if (pageKeys.join() !== timelineKeys.join()) {
  errors.push(
    `ExperiencePage ROLES order [${pageKeys.join(", ")}] != TIMELINE [${timelineKeys.join(", ")}]`
  );
}

if (errors.length) {
  console.error("corpus:check FAILED\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log(
  `corpus:check ok — ${TIMELINE.length} roles, ${INTERNSHIP_COUNT} internships`
);

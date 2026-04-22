import type { ToolName } from "./tools";

type Intent = {
  tool: ToolName;
  args?: Record<string, unknown>;
  reply: string;
};

/**
 * Client-side intent matcher. If a user message matches one of these
 * patterns, dispatch the tool locally without hitting the LLM. This
 * covers the recruiter "6 second" path for free and — more importantly
 * — skips the class of LLM bug where tool calls land without any text
 * content (empty SEBBOT bubble, user sees the page open but no reply).
 *
 * Patterns are split into:
 *   - EXACT/SHORT patterns     (slash commands, bare nouns, "tell me X")
 *   - NAV_PHRASE + TOPIC combo (matches any "can I see experience" /
 *                               "i want to view his work" / "show me
 *                               his career" style phrasing)
 *
 * The NAV_PHRASE list is intentionally permissive — false positives
 * (e.g. matching "I want to see his experience" when the user meant
 * something conversational) just open a view that's safe to show.
 * False negatives (letter the LLM through for a simple nav request)
 * are worse because the LLM sometimes omits the text one-liner and
 * the user sees a blank bubble.
 */

// Phrases that signal "I want to navigate to / see a page". Anchored to
// message start so "I don't want to see X" doesn't spuriously match.
// "tell" is listed as a valid verb after "can you" so "can you tell me
// about seb" routes (same intent as "tell me about seb"). The final
// alternation `what\s+\w+\s+(has|did|does|do)\s+(he|seb|you)` catches
// object-fronted questions like "what companies has he worked at" or
// "what posts has he written".
const NAV_PHRASE =
  /^\s*(\/?(show|see|view|read|open|pull\s+up|take\s+me\s+to|go\s+to)\s+(me\s+|us\s+)?|(can|could|will|would)\s+(i|you|we)\s+(see|show|view|look\s+at|check|read|pull\s+up|open|contact|reach|email|message|dm|tell)\s+(me\s+|us\s+)?|(let|lemme)\s+me?\s+(see|view|check|read|look\s+at)\s+|(i|we)('?ll|\s+will|\s+would\s+like|\s+want|\s+wanna|\s+need|'?d\s+like)(\s+to)?\s+(see|view|look\s+at|check|read|know(\s+about)?|contact|reach|email|message|dm)\s+|(how\s+(do|can|should|would|to)\s+(i|you|we|one)?\s*)|tell\s+me(\s+about)?\s+|what'?s\s+(your|his)\s+|what\s+(is|are)\s+(your|his)\s+|what\s+has\s+(he|seb)\s+|what\s+(did|does|do)\s+(he|seb|you)\s+|what\s+\w+\s+(has|did|does|do)\s+(he|seb|you)\s+|where\s+has\s+(he|seb)\s+)/i;

const TOPIC_PATTERNS: Record<Exclude<ToolName, "showProjects" | "showProject">, RegExp> = {
  showAbout:
    /\b(about\s+(yourself|seb|you)|who\s+(are|is)\s+(you|seb|he)|your\s+story|his\s+story|bio|who\s+he\s+is|who\s+you\s+are)\b/i,
  // Object-fronted "what has he done" in addition to the existing
  // "what seb has done" — both mean the same thing.
  showExperience:
    /\b(experience|work(\s+history|ed)?|jobs?|companies|career|background|roles?|what\s+(he'?s|seb\s+has|seb'?s|you'?ve)\s+(done|built|worked\s+on)|what\s+has\s+(he|seb)\s+(done|built|worked\s+on)|his\s+jobs?|his\s+career|his\s+work|internships?)\b/i,
  showContact:
    /\b(contact|email|reach(\s+out|\s+him|\s+seb)?|get\s+in\s+touch|dm|message\s+(him|seb)|how\s+to\s+reach)\b/i,
  // Object-fronted "what has he written" in addition to "what he's written".
  showLinkedIn:
    /\b(linkedin|posts?|writing|articles?|(what|things)\s+(he'?s|you'?ve)\s+written|what\s+has\s+(he|seb)\s+written)\b/i,
};

// Short/exact patterns that should match even without a nav phrase.
// Includes the specific prompt-suggestion chip texts so clicking a chip
// always routes deterministically — without these entries the LLM would
// be asked to infer navigation from phrasings like "what's his deal",
// which it sometimes describes ("Pulling up the about page…") without
// actually emitting the tool call, and the page fails to open.
// Also covers bare topic phrases that aren't navigational questions
// per se but read as "I want this page" — "internships", "dm",
// "get in touch", "his work history", "who is he".
const EXACT_PATTERNS: Record<
  Exclude<ToolName, "showProjects" | "showProject">,
  RegExp
> = {
  showAbout:
    /^\/about$|^(about|your\s+story|who\s+are\s+you|who\s+is\s+(he|seb)|what'?s\s+his\s+deal|what\s+does\s+he\s+do\s+on\s+weekends)\??$/i,
  showExperience:
    /^\/experience$|^(experience|jobs?|companies|career|resume|internships?|his\s+(work(\s+history)?|jobs?|career|experience|internships?))\??$/i,
  showContact:
    /^\/contact$|^(contact|email|dm|get\s+in\s+touch|message\s+(him|seb))\??$/i,
  showLinkedIn:
    /^\/(linkedin|posts|writing)$|^(linkedin|posts?|writing)\??$/i,
};

const REPLIES: Record<
  Exclude<ToolName, "showProjects" | "showProject">,
  string
> = {
  showAbout: "Cool — pulling up the about page.",
  showExperience: "Pulling up the timeline now.",
  showContact: "Easiest way: email. Here's everything.",
  showLinkedIn:
    "Flipping through the greatest hits. Click a card to see the full post.",
};

const TOOL_ORDER: Array<Exclude<ToolName, "showProjects" | "showProject">> = [
  // Order matters: check more-specific topics first if a message hits
  // multiple. LinkedIn and contact are narrower than experience/about,
  // so they go first.
  "showLinkedIn",
  "showContact",
  "showExperience",
  "showAbout",
];

export function matchIntent(message: string): Intent | null {
  const trimmed = message.trim();

  // 1. Exact/short patterns — match even without a nav phrase.
  for (const tool of TOOL_ORDER) {
    if (EXACT_PATTERNS[tool].test(trimmed)) {
      return { tool, reply: REPLIES[tool] };
    }
  }

  // 2. Nav phrase + topic keyword combo.
  if (NAV_PHRASE.test(trimmed)) {
    for (const tool of TOOL_ORDER) {
      if (TOPIC_PATTERNS[tool].test(trimmed)) {
        return { tool, reply: REPLIES[tool] };
      }
    }
  }

  return null;
}

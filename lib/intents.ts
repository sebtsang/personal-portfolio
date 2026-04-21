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
const NAV_PHRASE =
  /^\s*(\/?(show|see|view|read|open|pull\s+up|take\s+me\s+to|go\s+to)\s+(me\s+|us\s+)?|(can|could|will|would)\s+(i|you|we)\s+(see|show|view|look\s+at|check|read|pull\s+up|open|contact|reach|email|message|dm)\s+(me\s+|us\s+)?|(let|lemme)\s+me?\s+(see|view|check|read|look\s+at)\s+|(i|we)('?ll|\s+will|\s+would\s+like|\s+want|\s+wanna|\s+need|'?d\s+like)(\s+to)?\s+(see|view|look\s+at|check|read|know(\s+about)?|contact|reach|email|message|dm)\s+|(how\s+(do|can|should|would|to)\s+(i|you|we|one)?\s*)|tell\s+me(\s+about)?\s+|what'?s\s+(your|his)\s+|what\s+(is|are)\s+(your|his)\s+|what\s+has\s+(he|seb)\s+|what\s+(did|does|do)\s+(he|seb|you)\s+|where\s+has\s+(he|seb)\s+)/i;

const TOPIC_PATTERNS: Record<Exclude<ToolName, "showProjects" | "showProject">, RegExp> = {
  showAbout:
    /\b(about\s+(yourself|seb|you)|who\s+(are|is)\s+(you|seb)|your\s+story|his\s+story|bio|who\s+he\s+is|who\s+you\s+are)\b/i,
  showExperience:
    /\b(experience|work(\s+history|ed)?|jobs?|companies|career|background|roles?|what\s+(he'?s|seb\s+has|seb'?s|you'?ve)\s+(done|built|worked\s+on)|his\s+jobs?|his\s+career|his\s+work|internships?)\b/i,
  showContact:
    /\b(contact|email|reach(\s+out|\s+him|\s+seb)?|get\s+in\s+touch|dm|message\s+(him|seb)|how\s+to\s+reach)\b/i,
  showLinkedIn:
    /\b(linkedin|posts?|writing|articles?|(what|things)\s+(he'?s|you'?ve)\s+written)\b/i,
};

// Short/exact patterns that should match even without a nav phrase.
const EXACT_PATTERNS: Record<
  Exclude<ToolName, "showProjects" | "showProject">,
  RegExp
> = {
  showAbout:
    /^\/about$|^(about|your\s+story|who\s+are\s+you|who\s+is\s+seb)\??$/i,
  showExperience: /^\/experience$|^(experience|jobs?|companies|career|resume)\??$/i,
  showContact: /^\/contact$|^(contact|email)\??$/i,
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

import type { ToolName } from "./tools";

type Intent = {
  match: RegExp;
  tool: ToolName;
  args?: Record<string, unknown>;
  reply: string;
};

/**
 * Client-side intent matcher. If a user message matches one of these patterns,
 * dispatch the tool locally without hitting the LLM. This covers the recruiter
 * "6 second" path for free.
 */
const STATIC_INTENTS: Intent[] = [
  {
    match: /^\/about$|^(tell me about (yourself|seb|you)|who are you|what'?s your story|about( seb)?)\??$/i,
    tool: "showAbout",
    reply: "Cool — pulling up the about page.",
  },
  {
    match: /^\/experience$|^(show|see|view).*(experience|jobs?|companies|work history)$|^(experience|jobs?|companies)$/i,
    tool: "showExperience",
    reply: "Pulling up the timeline now.",
  },
  {
    match: /^\/contact$|^(show|how|get).*(contact|email|reach).*$|^(contact|email)$/i,
    tool: "showContact",
    reply: "Easiest way: email. Here's everything.",
  },
  {
    match: /^\/(linkedin|posts|writing)$|^(show|see|view).*(linkedin|posts?|writing)$|^(linkedin|posts?|writing)$/i,
    tool: "showLinkedIn",
    reply: "Flipping through the greatest hits. Click a card to see the full post.",
  },
];

export function matchIntent(message: string): Intent | null {
  const trimmed = message.trim();
  for (const intent of STATIC_INTENTS) {
    if (intent.match.test(trimmed)) return intent;
  }
  return null;
}

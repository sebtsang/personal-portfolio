import type { ToolName } from "./tools";
import { projects } from "@/content/projects";

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
    match: /^\/projects?$|^(show|see|view).*(projects?|work|portfolio)$|^(projects?|work|portfolio)$/i,
    tool: "showProjects",
    reply: "Here's the full grid. Click anything that catches your eye.",
  },
  {
    match: /^\/experience$|^(show|see|view).*(experience|jobs?|companies|work history)$|^(experience|jobs?|companies)$/i,
    tool: "showExperience",
    reply: "Pulling up the timeline now.",
  },
  {
    match: /^\/resume$|^(show|see|view|get).*(resume|cv)$|^(resume|cv)$/i,
    tool: "showResume",
    reply: "One full resume, coming up. You can download it too.",
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

  // Project-specific matches (e.g. "tell me about openclaw")
  for (const project of projects) {
    const titleWords = project.title.toLowerCase().split(/\s+/);
    const firstWord = titleWords[0];
    const re = new RegExp(
      `\\b(${project.id}|${firstWord})\\b`,
      "i"
    );
    if (re.test(trimmed) && /\b(tell|show|about|details?|more|explain)\b/i.test(trimmed)) {
      return {
        match: re,
        tool: "showProject",
        args: { id: project.id },
        reply: `Pulling up ${project.title}.`,
      };
    }
  }

  // Static intents
  for (const intent of STATIC_INTENTS) {
    if (intent.match.test(trimmed)) return intent;
  }

  return null;
}

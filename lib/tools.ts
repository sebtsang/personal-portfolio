import { z } from "zod";

export const toolSchemas = {
  showAbout: {
    description:
      "Display Seb's personal About page. Call this when the user asks an open-ended 'tell me about yourself' / 'who are you' / 'what's your story' style question, or when they explicitly ask for /about. Prefer this over a text bio.",
    parameters: z.object({}),
  },
  showExperience: {
    description:
      "Display an animated timeline of Sebastian's work experience. Call this when the user asks about jobs, companies, where he's worked.",
    parameters: z.object({}),
  },
  showContact: {
    description:
      "Display contact information. Call this when the user wants to reach out.",
    parameters: z.object({}),
  },
  showLinkedIn: {
    description:
      "Display a stacked-deck flashcard carousel of Sebastian's favorite LinkedIn posts. Call this when the user asks about LinkedIn, posts, writing, or wants to see his public writing.",
    parameters: z.object({}),
  },
} as const;

export type ToolName = keyof typeof toolSchemas;

export const toolNames = Object.keys(toolSchemas) as ToolName[];

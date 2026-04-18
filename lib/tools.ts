import { z } from "zod";
import { projects } from "@/content/projects";

const projectIds = projects.map((p) => p.id) as [string, ...string[]];

export const toolSchemas = {
  showProjects: {
    description:
      "Display a grid of all Sebastian's projects on the stage. Call this when the user asks to see projects, work, portfolio, or anything similar.",
    parameters: z.object({}),
  },
  showProject: {
    description:
      "Display the detail view for a single project on the stage. Call this when the user asks about a specific project by name.",
    parameters: z.object({
      id: z
        .enum(projectIds)
        .describe("The project id. Valid: " + projectIds.join(", ")),
    }),
  },
  showExperience: {
    description:
      "Display an animated timeline of Sebastian's work experience. Call this when the user asks about jobs, companies, where he's worked.",
    parameters: z.object({}),
  },
  showResume: {
    description:
      "Display a full formatted resume view. Call this when the user asks for a resume or CV.",
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

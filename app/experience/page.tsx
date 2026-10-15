import { NotebookShell } from "@/components/notebook/NotebookShell";
import {
  INTERNSHIP_COMPANY_COUNT,
  INTERNSHIP_COUNT_WORD,
} from "@/lib/experience";

export const metadata = {
  title: "Sebastian Tsang — Experience",
  description:
    `${INTERNSHIP_COUNT_WORD[0].toUpperCase()}${INTERNSHIP_COUNT_WORD.slice(1)} internships across ${INTERNSHIP_COMPANY_COUNT} companies (Spirit of Math, Interac, BMO, EY, FriedmannAI). Tap any role for the real story.`,
};

export default function ExperienceRoute() {
  // Deep-link: skip the landing flip and open the notebook with the
  // Experience timeline already in the split view.
  return <NotebookShell initialView={{ kind: "experience" }} />;
}

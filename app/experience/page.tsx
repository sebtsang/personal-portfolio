import { NotebookShell } from "@/components/notebook/NotebookShell";

export const metadata = {
  title: "Sebastian Tsang — Experience",
  description:
    "Seven internships across four companies (Spirit of Math, Interac, BMO, EY). Tap any role for the real story.",
};

export default function ExperienceRoute() {
  // Deep-link: skip the landing flip and open the notebook with the
  // Experience timeline already in the split view.
  return <NotebookShell initialView={{ kind: "experience" }} />;
}

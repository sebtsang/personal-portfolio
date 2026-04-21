import { NotebookShell } from "@/components/notebook/NotebookShell";

export const metadata = {
  title: "Sebastian Tsang — LinkedIn",
  description:
    "Sebastian's favorite LinkedIn posts as a stacked-polaroid deck. Building in public, one post at a time.",
};

export default function LinkedInRoute() {
  // Deep-link: skip the landing flip and open the notebook with the
  // LinkedIn post carousel already in the split view.
  return <NotebookShell initialView={{ kind: "linkedin" }} />;
}

import { NotebookShell } from "@/components/notebook/NotebookShell";

export const metadata = {
  title: "Sebastian Tsang — About",
};

export default function AboutRoute() {
  // Deep-link: skip the landing flip and open the notebook with the
  // About page already in the split view.
  return <NotebookShell initialView={{ kind: "about" }} />;
}

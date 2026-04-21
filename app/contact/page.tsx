import { NotebookShell } from "@/components/notebook/NotebookShell";

export const metadata = {
  title: "Sebastian Tsang — Contact",
  description:
    "Get in touch with Sebastian. Email or LinkedIn — both work, LinkedIn DM is usually faster.",
};

export default function ContactRoute() {
  // Deep-link: skip the landing flip and open the notebook with the
  // Contact page already in the split view.
  return <NotebookShell initialView={{ kind: "contact" }} />;
}

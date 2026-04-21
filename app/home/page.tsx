import { NotebookShell } from "@/components/notebook/NotebookShell";

export const metadata = {
  title: "Sebastian Tsang — Home",
  description:
    "Sebastian's chat home. Ask anything about him, or use the slash commands to jump to a page.",
};

export default function HomeRoute() {
  // `/` is the landing (drawn name + scraps). `/home` skips the
  // landing flip and lands directly on the chat home — used by the
  // command palette's "Home" item and shareable as a direct URL.
  return <NotebookShell skipLanding />;
}

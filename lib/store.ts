import { create } from "zustand";
import type { ToolName } from "./tools";

export type StageView =
  | { kind: "empty" }
  | { kind: "about" }
  | { kind: "experience" }
  | { kind: "contact" }
  | { kind: "linkedin" };

type StageStore = {
  view: StageView;
  setView: (view: StageView) => void;
  dispatchTool: (name: ToolName, args?: Record<string, unknown>) => void;
};

export const useStageStore = create<StageStore>((set) => ({
  view: { kind: "empty" },
  setView: (view) => set({ view }),
  dispatchTool: (name) => {
    switch (name) {
      case "showAbout":
        set({ view: { kind: "about" } });
        break;
      case "showExperience":
        set({ view: { kind: "experience" } });
        break;
      case "showContact":
        set({ view: { kind: "contact" } });
        break;
      case "showLinkedIn":
        set({ view: { kind: "linkedin" } });
        break;
    }
  },
}));

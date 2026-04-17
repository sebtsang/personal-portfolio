import { create } from "zustand";
import type { ToolName } from "./tools";

export type StageView =
  | { kind: "empty" }
  | { kind: "projects" }
  | { kind: "project"; id: string }
  | { kind: "experience" }
  | { kind: "resume" }
  | { kind: "contact" };

type StageStore = {
  view: StageView;
  setView: (view: StageView) => void;
  dispatchTool: (name: ToolName, args?: Record<string, unknown>) => void;
};

export const useStageStore = create<StageStore>((set) => ({
  view: { kind: "empty" },
  setView: (view) => set({ view }),
  dispatchTool: (name, args) => {
    switch (name) {
      case "showProjects":
        set({ view: { kind: "projects" } });
        break;
      case "showProject": {
        const id = typeof args?.id === "string" ? args.id : "";
        if (id) set({ view: { kind: "project", id } });
        break;
      }
      case "showExperience":
        set({ view: { kind: "experience" } });
        break;
      case "showResume":
        set({ view: { kind: "resume" } });
        break;
      case "showContact":
        set({ view: { kind: "contact" } });
        break;
    }
  },
}));

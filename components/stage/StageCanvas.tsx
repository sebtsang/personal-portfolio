"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useStageStore } from "@/lib/store";
import { StageEmpty } from "./StageEmpty";
import { ProjectGrid } from "./ProjectGrid";
import { ProjectDetail } from "./ProjectDetail";
import { ExperienceTimeline } from "./ExperienceTimeline";
import { ResumeView } from "./ResumeView";
import { ContactCard } from "./ContactCard";

export function StageCanvas() {
  const view = useStageStore((s) => s.view);

  return (
    <div className="scroll-thin relative h-full overflow-y-auto">
      <div className="grid-noise" aria-hidden />
      <div className="relative z-[1] flex min-h-full items-stretch">
        <div className="flex w-full flex-col p-6 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={stageKey(view)}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex h-full w-full flex-col"
            >
              {renderStage(view)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function stageKey(view: ReturnType<typeof useStageStore.getState>["view"]) {
  if (view.kind === "project") return `project:${view.id}`;
  return view.kind;
}

function renderStage(view: ReturnType<typeof useStageStore.getState>["view"]) {
  switch (view.kind) {
    case "empty":
      return <StageEmpty />;
    case "projects":
      return <ProjectGrid />;
    case "project":
      return <ProjectDetail id={view.id} />;
    case "experience":
      return <ExperienceTimeline />;
    case "resume":
      return <ResumeView />;
    case "contact":
      return <ContactCard />;
  }
}

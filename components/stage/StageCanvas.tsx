"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useStageStore } from "@/lib/store";
import { ProjectGrid } from "./ProjectGrid";
import { ProjectDetail } from "./ProjectDetail";
import { ExperienceTimeline } from "./ExperienceTimeline";
import { ResumeView } from "./ResumeView";
import { ContactCard } from "./ContactCard";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

export function StageCanvas() {
  const view = useStageStore((s) => s.view);

  return (
    <SmoothScroll>
      <div className="relative min-h-full">
        <div className="grid-noise" aria-hidden />
        <div className="relative z-[1] flex min-h-full items-stretch">
          <div className="flex w-full flex-col p-6 md:p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={stageKey(view)}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: [0.62, 0.61, 0.02, 1] }}
                className="flex h-full w-full flex-col"
              >
                {renderStage(view)}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </SmoothScroll>
  );
}

function stageKey(view: ReturnType<typeof useStageStore.getState>["view"]) {
  if (view.kind === "project") return `project:${view.id}`;
  return view.kind;
}

function renderStage(view: ReturnType<typeof useStageStore.getState>["view"]) {
  switch (view.kind) {
    case "empty":
      return null; // home handled by HomeHero in chat panel
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

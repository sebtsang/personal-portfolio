"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useStageStore } from "@/lib/store";
import { projects } from "@/content/projects";
import { StageCanvas } from "./StageCanvas";

const EASE = [0.22, 1, 0.36, 1] as const;

export function StageFrame({ onHome }: { onHome: () => void }) {
  const view = useStageStore((s) => s.view);
  const setView = useStageStore((s) => s.setView);

  const { label, canGoBack, goBack } = useBreadcrumb(view, setView);

  return (
    <div className="relative flex h-full flex-col">
      {/* Page top bar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25, ease: EASE }}
        className="flex shrink-0 items-center gap-3 border-b border-[color-mix(in_srgb,var(--color-line)_55%,transparent)] px-5 py-3 md:px-8"
      >
        <button
          type="button"
          onClick={canGoBack ? goBack : onHome}
          data-cursor="back"
          className="chip-morph group flex items-center gap-2 border border-[color-mix(in_srgb,var(--color-line)_70%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_85%,transparent)] px-3 py-1.5 font-mono text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
          title={canGoBack ? "Back" : "Home (Esc)"}
        >
          <ArrowLeft
            className="h-3 w-3 transition-transform group-hover:-translate-x-0.5"
            strokeWidth={2.25}
          />
          {canGoBack ? "Back" : "Home"}
        </button>

        <Breadcrumb label={label} />

        <span className="ml-auto font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[color:color-mix(in_srgb,var(--color-muted)_75%,transparent)]">
          Esc to close
        </span>
      </motion.div>

      {/* Stage content */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <StageCanvas />
      </div>
    </div>
  );
}

function useBreadcrumb(
  view: ReturnType<typeof useStageStore.getState>["view"],
  setView: (v: ReturnType<typeof useStageStore.getState>["view"]) => void
) {
  if (view.kind === "projects") {
    return {
      label: "Projects",
      canGoBack: false,
      goBack: () => {},
    };
  }
  if (view.kind === "project") {
    const p = projects.find((x) => x.id === view.id);
    return {
      label: `Projects · ${p?.title ?? view.id}`,
      canGoBack: true,
      goBack: () => setView({ kind: "projects" }),
    };
  }
  if (view.kind === "experience") {
    return { label: "Experience", canGoBack: false, goBack: () => {} };
  }
  if (view.kind === "resume") {
    return { label: "Resume", canGoBack: false, goBack: () => {} };
  }
  if (view.kind === "contact") {
    return { label: "Contact", canGoBack: false, goBack: () => {} };
  }
  return { label: "", canGoBack: false, goBack: () => {} };
}

function Breadcrumb({ label }: { label: string }) {
  if (!label) return null;
  return (
    <motion.span
      key={label}
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[color:var(--color-ink)]"
    >
      {label}
    </motion.span>
  );
}

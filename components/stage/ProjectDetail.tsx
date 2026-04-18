"use client";

import { motion } from "framer-motion";
import { projects } from "@/content/projects";
import { Overline } from "@/components/ui/Overline";
import { ArrowList } from "@/components/ui/ArrowList";

export function ProjectDetail({ id }: { id: string }) {
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="font-mono text-sm text-[color:var(--color-muted)]">
        Project not found.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.62, 0.61, 0.02, 1] }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3">
        <span className="chip chip--accent chip-morph w-fit !text-[0.66rem]">
          {project.category}
        </span>
        <h2 className="font-serif text-4xl leading-[1.05] md:text-5xl">
          {project.title}
        </h2>
        <Overline>{project.subtitle}</Overline>
      </div>

      <p className="max-w-2xl text-[1rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_82%,transparent)]">
        {project.description}
      </p>

      <div className="stage-card">
        <Overline className="mb-4">Highlights</Overline>
        <ArrowList items={project.highlights} />
      </div>

      <div className="flex flex-col gap-2">
        <Overline>Stack</Overline>
        <div className="flex flex-wrap gap-2">
          {project.techStack.map((t) => (
            <span
              key={t}
              className="rounded-md border border-[color-mix(in_srgb,var(--color-line)_70%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_80%,transparent)] px-2.5 py-1 font-mono text-[0.72rem] text-[color:var(--color-ink)]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

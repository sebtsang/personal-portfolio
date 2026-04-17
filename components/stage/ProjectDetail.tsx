"use client";

import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { projects } from "@/content/projects";

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
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-3">
        <span className="chip chip--accent w-fit !text-[0.66rem]">
          {project.category}
        </span>
        <h2 className="font-serif text-4xl leading-tight md:text-5xl">
          {project.title}
        </h2>
        <p className="font-mono text-[0.78rem] uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
          {project.subtitle}
        </p>
      </div>

      <p className="max-w-2xl text-[1rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_82%,transparent)]">
        {project.description}
      </p>

      <div className="stage-card">
        <h3 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Highlights
        </h3>
        <ul className="flex flex-col gap-3">
          {project.highlights.map((h, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
              className="flex items-start gap-2.5 text-[0.95rem] leading-relaxed"
            >
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-accent)]"
                strokeWidth={2}
              />
              <span>{h}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        {project.techStack.map((t) => (
          <span
            key={t}
            className="rounded-md border border-[color-mix(in_srgb,var(--color-line)_70%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_80%,transparent)] px-2.5 py-1 font-mono text-[0.7rem] text-[color:var(--color-ink)]"
          >
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/content/projects";
import { useStageStore } from "@/lib/store";

export function ProjectGrid() {
  const setView = useStageStore((s) => s.setView);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Selected work — {projects.length} projects
        </span>
        <h2 className="font-serif text-3xl md:text-4xl">Things I&apos;ve built.</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects.map((p, i) => (
          <motion.button
            key={p.id}
            type="button"
            onClick={() => setView({ kind: "project", id: p.id })}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              duration: 0.5,
              delay: i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -3 }}
            className="stage-card group relative text-left transition-shadow hover:shadow-[var(--shadow-stage)]"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${p.accent ?? ""}`}
              aria-hidden
            />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <span className="chip chip--accent !text-[0.66rem]">
                  {p.category}
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-[color:var(--color-muted)] transition-colors group-hover:text-[color:var(--color-accent)]"
                  strokeWidth={1.75}
                />
              </div>
              <div>
                <h3 className="font-serif text-xl leading-snug text-[color:var(--color-ink)]">
                  {p.title}
                </h3>
                <p className="mt-1 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                  {p.subtitle}
                </p>
              </div>
              <p className="text-[0.92rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_78%,transparent)]">
                {p.description}
              </p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {p.techStack.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-[color-mix(in_srgb,var(--color-line)_60%,transparent)] px-2 py-0.5 font-mono text-[0.66rem] text-[color:var(--color-muted)]"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

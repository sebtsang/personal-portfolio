"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { projects } from "@/content/projects";
import { useStageStore } from "@/lib/store";
import { NumberedHeading } from "@/components/ui/NumberedHeading";
import { Overline } from "@/components/ui/Overline";
import { InView } from "@/components/ui/InView";

export function ProjectGrid() {
  const setView = useStageStore((s) => s.setView);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Overline>
          Selected work · {String(projects.length).padStart(2, "0")} projects
        </Overline>
        <NumberedHeading num="02">Things I&apos;ve built.</NumberedHeading>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {projects.map((p, i) => (
          <InView key={p.id} delay={i * 0.08} y={18} threshold={0.1}>
          <motion.button
            type="button"
            onClick={() => setView({ kind: "project", id: p.id })}
            data-cursor="card"
            whileHover={{ y: -3 }}
            className="stage-card group relative text-left transition-shadow hover:shadow-[var(--shadow-stage)] w-full"
          >
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${p.accent ?? ""}`}
              aria-hidden
            />
            <div className="relative flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <span className="chip chip--accent chip-morph !text-[0.66rem]">
                  {p.category}
                </span>
                <ArrowUpRight
                  className="h-4 w-4 text-[color:var(--color-muted)] transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[color:var(--color-accent)]"
                  strokeWidth={1.75}
                />
              </div>
              <div>
                <h3 className="font-serif text-[var(--fz-xxl)] leading-snug text-[color:var(--color-ink)]">
                  {p.title}
                </h3>
                <Overline className="mt-1 !text-[0.68rem]">
                  {p.subtitle}
                </Overline>
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
          </InView>
        ))}
      </div>
    </div>
  );
}

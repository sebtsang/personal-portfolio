"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { experience } from "@/content/site";

export function ExperienceTimeline() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Work history — {experience.length} roles
        </span>
        <h2 className="font-serif text-3xl md:text-4xl">Where I&apos;ve been.</h2>
      </div>

      <div className="relative">
        <div
          className="absolute left-[1.9rem] top-0 bottom-0 w-px"
          style={{
            background:
              "linear-gradient(to bottom, color-mix(in srgb, var(--color-accent) 50%, transparent), color-mix(in srgb, var(--color-line) 70%, transparent))",
          }}
          aria-hidden
        />
        <div className="flex flex-col gap-5">
          {experience.map((e, i) => (
            <motion.div
              key={`${e.company}-${e.period}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.45,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="relative flex items-start gap-5"
            >
              <div
                className="relative z-[1] flex h-[3.75rem] w-[3.75rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border p-2"
                style={{
                  borderColor:
                    "color-mix(in srgb, var(--color-line) 75%, transparent)",
                  background: "var(--color-surface)",
                }}
              >
                <Image
                  src={e.logo}
                  alt={e.logoAlt}
                  width={44}
                  height={44}
                  className="h-full w-full rounded-lg object-contain"
                />
              </div>
              <div className="flex-1 pt-1">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="font-serif text-lg text-[color:var(--color-ink)]">
                    {e.role}
                  </h3>
                  <span className="text-sm text-[color:var(--color-muted)]">
                    @ {e.company}
                  </span>
                </div>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  {e.period}
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {e.highlights.map((h, k) => (
                    <li
                      key={k}
                      className="text-[0.9rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_80%,transparent)]"
                    >
                      — {h}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

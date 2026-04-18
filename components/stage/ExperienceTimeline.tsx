"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { experience } from "@/content/site";
import { NumberedHeading } from "@/components/ui/NumberedHeading";
import { Overline } from "@/components/ui/Overline";

export function ExperienceTimeline() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Overline>
          Work history · {String(experience.length).padStart(2, "0")} roles
        </Overline>
        <NumberedHeading num="03">Where I&apos;ve been.</NumberedHeading>
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
        <div className="flex flex-col gap-6">
          {experience.map((e, i) => (
            <motion.div
              key={`${e.company}-${e.period}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: i * 0.08,
                ease: [0.62, 0.61, 0.02, 1],
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
                  <h3 className="font-serif text-[var(--fz-xl)] leading-tight text-[color:var(--color-ink)]">
                    {e.role}
                  </h3>
                  <a
                    href="#"
                    className="link-underline text-[color:var(--color-accent)] font-serif text-[var(--fz-xl)]"
                  >
                    @ {e.company}
                  </a>
                </div>
                <Overline className="mt-1">{e.period}</Overline>
                <ul className="mt-3 arrow-list">
                  {e.highlights.map((h, k) => (
                    <li key={k} className="text-[0.92rem]">
                      {h}
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

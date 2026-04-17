"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { experience, profile, currentFocus } from "@/content/site";

export function ResumeView() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            Resume — printable
          </span>
          <h2 className="font-serif text-4xl">{profile.name}</h2>
          <p className="text-[0.92rem] text-[color:var(--color-muted)]">
            {profile.headline}
          </p>
        </div>
        <div
          className="flex h-20 w-20 shrink-0 overflow-hidden rounded-2xl border md:h-24 md:w-24"
          style={{
            borderColor:
              "color-mix(in srgb, var(--color-line) 75%, transparent)",
          }}
        >
          <Image
            src={profile.photo}
            alt={profile.photoAlt}
            width={96}
            height={96}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="stage-card"
      >
        <h3 className="mb-3 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Contact
        </h3>
        <dl className="grid grid-cols-1 gap-2 text-[0.9rem] md:grid-cols-2">
          <ContactRow label="Email" value={profile.email} href={`mailto:${profile.email}`} />
          <ContactRow label="LinkedIn" value="/in/sebtsang" href={profile.linkedin} />
          <ContactRow label="GitHub" value="@sebtsang" href={profile.github} />
          <ContactRow label="Location" value="Toronto, ON · Remote" />
        </dl>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="stage-card"
      >
        <h3 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Experience
        </h3>
        <div className="flex flex-col divide-y divide-[color-mix(in_srgb,var(--color-line)_55%,transparent)]">
          {experience.map((e) => (
            <div key={`${e.company}-${e.period}`} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <div className="flex flex-wrap items-baseline gap-x-3">
                  <span className="font-serif text-[1.05rem]">{e.role}</span>
                  <span className="text-[0.85rem] text-[color:var(--color-muted)]">
                    @ {e.company}
                  </span>
                </div>
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                  {e.period}
                </span>
              </div>
              <ul className="mt-1.5 flex flex-col gap-1">
                {e.highlights.map((h, k) => (
                  <li
                    key={k}
                    className="text-[0.85rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_78%,transparent)]"
                  >
                    — {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="stage-card"
      >
        <h3 className="mb-4 font-mono text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          Current focus
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {currentFocus.map((f) => (
            <div key={f.title}>
              <p className="font-serif text-[1rem] text-[color:var(--color-ink)]">
                {f.title}
              </p>
              <p className="text-[0.85rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_75%,transparent)]">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function ContactRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[0.66rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
        {label}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[0.88rem] text-[color:var(--color-ink)] hover:text-[color:var(--color-accent)]"
        >
          {value}
        </a>
      ) : (
        <span className="text-[0.88rem] text-[color:var(--color-ink)]">
          {value}
        </span>
      )}
    </div>
  );
}

"use client";

import Image from "next/image";
import { experience, profile, currentFocus } from "@/content/site";
import { NumberedHeading } from "@/components/ui/NumberedHeading";
import { Overline } from "@/components/ui/Overline";
import { InView } from "@/components/ui/InView";

export function ResumeView() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <Overline>Resume · printable</Overline>
          <NumberedHeading num="04">{profile.name}</NumberedHeading>
          <p className="text-[0.95rem] text-[color:var(--color-muted)]">
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

      <InView threshold={0.15} className="stage-card">
        <Overline className="mb-3">Contact</Overline>
        <dl className="grid grid-cols-1 gap-2 text-[0.9rem] md:grid-cols-2">
          <ContactRow
            label="Email"
            value={profile.email}
            href={`mailto:${profile.email}`}
          />
          <ContactRow
            label="LinkedIn"
            value="/in/sebtsang"
            href={profile.linkedin}
          />
          <ContactRow label="GitHub" value="@sebtsang" href={profile.github} />
          <ContactRow label="Location" value="Toronto, ON · Remote" />
        </dl>
      </InView>

      <InView threshold={0.15} className="stage-card">
        <Overline className="mb-4">Experience</Overline>
        <div className="flex flex-col divide-y divide-[color-mix(in_srgb,var(--color-line)_55%,transparent)]">
          {experience.map((e) => (
            <div
              key={`${e.company}-${e.period}`}
              className="py-4 first:pt-0 last:pb-0"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-serif text-[var(--fz-lg)]">
                    {e.role}
                  </span>
                  <span className="text-[0.88rem] text-[color:var(--color-accent)]">
                    @ {e.company}
                  </span>
                </div>
                <Overline>{e.period}</Overline>
              </div>
              <ul className="mt-2 arrow-list">
                {e.highlights.map((h, k) => (
                  <li key={k} className="text-[0.88rem]">
                    {h}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </InView>

      <InView threshold={0.15} className="stage-card">
        <Overline className="mb-4">Current focus</Overline>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {currentFocus.map((f) => (
            <div key={f.title}>
              <p className="font-serif text-[var(--fz-md)] text-[color:var(--color-ink)]">
                {f.title}
              </p>
              <p className="mt-1 text-[0.88rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_75%,transparent)]">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </InView>
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
          className="link-underline text-[0.9rem] text-[color:var(--color-ink)]"
        >
          {value}
        </a>
      ) : (
        <span className="text-[0.9rem] text-[color:var(--color-ink)]">
          {value}
        </span>
      )}
    </div>
  );
}

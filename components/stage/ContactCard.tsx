"use client";

import { motion } from "framer-motion";
import { Github, Instagram, Linkedin, Mail, Twitter } from "lucide-react";
import { profile } from "@/content/site";
import { NumberedHeading } from "@/components/ui/NumberedHeading";
import { Overline } from "@/components/ui/Overline";

const links = [
  {
    icon: Mail,
    label: "Email",
    value: profile.email,
    href: `mailto:${profile.email}`,
    primary: true,
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    value: "/in/sebtsang",
    href: profile.linkedin,
  },
  { icon: Github, label: "GitHub", value: "@sebtsang", href: profile.github },
  { icon: Twitter, label: "X", value: "@sebrtsang", href: profile.x },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@sebtsang_",
    href: profile.instagram,
  },
];

export function ContactCard() {
  return (
    <div className="flex h-full flex-col justify-center gap-8">
      <div className="flex flex-col gap-3">
        <Overline>Get in touch</Overline>
        <NumberedHeading num="06">Let&apos;s talk.</NumberedHeading>
        <p className="max-w-md text-[0.95rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_78%,transparent)]">
          Email is easiest. I check everything. If you&apos;re a recruiter, lead
          with the role and I&apos;ll reply same-day.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {links.map((l, i) => {
          const Icon = l.icon;
          return (
            <motion.a
              key={l.label}
              href={l.href}
              target={l.href.startsWith("mailto:") ? undefined : "_blank"}
              rel="noopener noreferrer"
              data-cursor="link"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: i * 0.06,
                ease: [0.62, 0.61, 0.02, 1],
              }}
              whileHover={{ x: 2 }}
              className={`group stage-card flex items-center gap-4 transition-shadow hover:shadow-[var(--shadow-stage)] ${l.primary ? "border-[color:var(--color-accent)]" : ""}`}
              style={
                l.primary
                  ? {
                      background:
                        "color-mix(in srgb, var(--color-accent-soft) 80%, transparent)",
                    }
                  : undefined
              }
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: l.primary
                    ? "var(--color-accent)"
                    : "color-mix(in srgb, var(--color-surface) 85%, transparent)",
                  color: l.primary ? "white" : "var(--color-accent)",
                }}
              >
                <Icon className="h-4 w-4" strokeWidth={2} />
              </div>
              <div className="flex flex-1 flex-col">
                <Overline>{l.label}</Overline>
                <span className="text-[0.95rem] text-[color:var(--color-ink)]">
                  {l.value}
                </span>
              </div>
              <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-[color:var(--color-muted)] transition-all duration-300 group-hover:translate-x-1 group-hover:text-[color:var(--color-accent)]">
                →
              </span>
            </motion.a>
          );
        })}
      </div>
    </div>
  );
}

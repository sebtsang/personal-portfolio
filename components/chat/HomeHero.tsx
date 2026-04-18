"use client";

import { motion } from "framer-motion";
import { profile } from "@/content/site";
import { LetterReveal } from "@/components/ui/LetterReveal";

export function HomeHero({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "px-6 pb-4 pt-6" : "px-6 pb-4 pt-10 md:pt-14"}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.62, 0.61, 0.02, 1] }}
        className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center"
      >
        <SignatureMark />

        <div className="flex flex-col gap-2">
          <LetterReveal
            as="h1"
            text={profile.name}
            delay={220}
            step={38}
            className="font-serif text-4xl leading-tight text-[color:var(--color-ink)] md:text-5xl"
          />
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.5,
              // Kick in after the name finishes revealing
              // (profile.name.length * 38ms + 220ms delay + tail buffer).
              delay: 0.22 + (profile.name.length * 0.038) + 0.15,
            }}
            className="font-mono text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--color-muted)]"
          >
            {profile.headline}
          </motion.p>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.22 + (profile.name.length * 0.038) + 0.32,
          }}
          className="max-w-md text-[0.95rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_72%,transparent)]"
        >
          {profile.intro}
        </motion.p>
      </motion.div>
    </div>
  );
}

function SignatureMark() {
  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 70%)",
        }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="relative flex h-14 w-14 items-center justify-center rounded-full border font-serif text-xl font-semibold"
        style={{
          borderColor:
            "color-mix(in srgb, var(--color-accent) 45%, transparent)",
          background: "var(--color-surface)",
          color: "var(--color-accent)",
        }}
      >
        s.
      </div>
    </div>
  );
}

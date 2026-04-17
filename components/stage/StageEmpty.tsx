"use client";

import { motion } from "framer-motion";
import { profile } from "@/content/site";

export function StageEmpty() {
  return (
    <div className="flex h-full min-h-[40svh] flex-col items-center justify-center text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-6"
      >
        {/* Animated signature mark */}
        <div className="relative flex h-24 w-24 items-center justify-center">
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
            className="relative flex h-16 w-16 items-center justify-center rounded-full border font-serif text-2xl font-semibold"
            style={{
              borderColor: "color-mix(in srgb, var(--color-accent) 45%, transparent)",
              background: "var(--color-surface)",
              color: "var(--color-accent)",
            }}
          >
            s.
          </div>
        </div>

        <div className="max-w-md space-y-3">
          <h1 className="font-serif text-3xl leading-tight text-[color:var(--color-ink)] md:text-4xl">
            {profile.name}
          </h1>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            {profile.headline}
          </p>
          <p className="text-[0.95rem] leading-relaxed text-[color:color-mix(in_srgb,var(--color-ink)_75%,transparent)]">
            {profile.intro}
          </p>
        </div>

        <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
          <span className="prompt-cursor">Chat loaded — ask anything</span>
        </p>
      </motion.div>
    </div>
  );
}

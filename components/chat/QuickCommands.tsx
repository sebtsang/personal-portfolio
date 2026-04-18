"use client";

import { motion } from "framer-motion";
import {
  Briefcase,
  FileText,
  FolderKanban,
  Linkedin,
  Mail,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const COMMANDS: { label: string; prompt: string; icon: LucideIcon }[] = [
  { label: "Projects", prompt: "/projects", icon: FolderKanban },
  { label: "Experience", prompt: "/experience", icon: Briefcase },
  { label: "LinkedIn", prompt: "/linkedin", icon: Linkedin },
  { label: "Resume", prompt: "/resume", icon: FileText },
  { label: "Contact", prompt: "/contact", icon: Mail },
];

export function QuickCommands({
  onSelect,
  compact = false,
}: {
  onSelect: (prompt: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "scroll-thin flex shrink-0 items-center gap-2 overflow-x-auto px-4 pb-2 pt-3 md:px-5"
          : "scroll-thin mx-auto flex w-full max-w-2xl shrink-0 flex-wrap items-center justify-center gap-2 px-6 pb-3 pt-4 md:px-8"
      }
    >
      {COMMANDS.map((c, i) => {
        const Icon = c.icon;
        return (
          <motion.button
            key={c.label}
            type="button"
            onClick={() => onSelect(c.prompt)}
            data-cursor="link"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: 0.6 + i * 0.06,
              ease: [0.62, 0.61, 0.02, 1],
            }}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="chip chip-morph shrink-0"
          >
            <Icon className="h-3 w-3" strokeWidth={2} />
            <span>{c.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

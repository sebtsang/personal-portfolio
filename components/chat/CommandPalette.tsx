"use client";

import { Command } from "cmdk";
import { motion } from "framer-motion";
import {
  Briefcase,
  FileText,
  FolderKanban,
  Mail,
  Sparkles,
} from "lucide-react";
import { projects } from "@/content/projects";

export function CommandPalette({
  onClose,
  onDispatch,
}: {
  onClose: () => void;
  onDispatch: (prompt: string) => void;
}) {
  const handle = (prompt: string) => {
    onDispatch(prompt);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-[16vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.97 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--color-line)_80%,transparent)] bg-[color:var(--color-surface)] shadow-[var(--shadow-stage)]"
      >
        <Command
          loop
          label="Command Palette"
          className="flex flex-col"
        >
          <Command.Input
            autoFocus
            placeholder="Type a command or search..."
            className="w-full border-b border-[color-mix(in_srgb,var(--color-line)_70%,transparent)] bg-transparent px-4 py-3.5 font-mono text-sm text-[color:var(--color-ink)] placeholder:text-[color:var(--color-muted)] focus:outline-none"
          />
          <Command.List className="scroll-thin max-h-[50vh] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center font-mono text-xs text-[color:var(--color-muted)]">
              No matching commands.
            </Command.Empty>

            <Command.Group heading="Quick" className="palette-group">
              <PaletteItem
                icon={FolderKanban}
                label="Show Projects"
                hint="/projects"
                onSelect={() => handle("/projects")}
              />
              <PaletteItem
                icon={Briefcase}
                label="Show Experience"
                hint="/experience"
                onSelect={() => handle("/experience")}
              />
              <PaletteItem
                icon={FileText}
                label="Show Resume"
                hint="/resume"
                onSelect={() => handle("/resume")}
              />
              <PaletteItem
                icon={Mail}
                label="Contact Sebastian"
                hint="/contact"
                onSelect={() => handle("/contact")}
              />
            </Command.Group>

            <Command.Group heading="Projects" className="palette-group">
              {projects.map((p) => (
                <PaletteItem
                  key={p.id}
                  icon={Sparkles}
                  label={p.title}
                  hint={p.category}
                  onSelect={() => handle(`tell me about ${p.id}`)}
                />
              ))}
            </Command.Group>
          </Command.List>
        </Command>
        <style jsx global>{`
          [cmdk-group-heading] {
            padding: 8px 12px 4px;
            font-family: var(--font-mono);
            font-size: 10px;
            letter-spacing: 0.18em;
            text-transform: uppercase;
            color: var(--color-muted);
          }
          [cmdk-item] {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            color: var(--color-ink);
          }
          [cmdk-item][data-selected="true"] {
            background: color-mix(
              in srgb,
              var(--color-accent-soft) 85%,
              transparent
            );
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}

function PaletteItem({
  icon: Icon,
  label,
  hint,
  onSelect,
}: {
  icon: typeof FolderKanban;
  label: string;
  hint?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item value={label} onSelect={onSelect}>
      <Icon className="h-4 w-4 text-[color:var(--color-accent)]" strokeWidth={2} />
      <span className="flex-1">{label}</span>
      {hint && (
        <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
          {hint}
        </span>
      )}
    </Command.Item>
  );
}

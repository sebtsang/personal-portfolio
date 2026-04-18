"use client";

/**
 * A small sticker collection indicator shown in the top bar plus a
 * drop toast that appears when a new sticker is awarded.
 *
 * The drop uses --ease-overshoot for a satisfying scale pop.
 */
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { STICKERS, STICKER_ORDER, type StickerId } from "@/lib/stickers";
import { useStickerStore } from "@/lib/stickerStore";

export function StickerCollection() {
  const hydrated = useStickerStore((s) => s.hydrated);
  const hydrate = useStickerStore((s) => s.hydrate);
  const unlocked = useStickerStore((s) => s.unlocked);
  const recentDrop = useStickerStore((s) => s.recentDrop);
  const reset = useStickerStore((s) => s.reset);

  const [open, setOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!hydrated) return null;

  const totalCount = STICKER_ORDER.length;
  const unlockedCount = unlocked.length;

  return (
    <>
      {/* Indicator in the top bar */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          data-cursor="tooltip"
          data-cursor-label={
            unlockedCount === 0
              ? "Explore to earn stickers"
              : `${unlockedCount}/${totalCount} stickers`
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--color-line)_75%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_85%,transparent)] px-2.5 py-1 font-mono text-[0.66rem] uppercase tracking-[0.14em] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
          aria-label="Sticker collection"
        >
          <span
            className="inline-block h-2 w-2 rounded-sm"
            style={{
              background:
                unlockedCount > 0 ? "var(--color-accent)" : "var(--color-line)",
              transition: "background 200ms var(--ease-fast)",
            }}
          />
          <span>
            {String(unlockedCount).padStart(2, "0")}/
            {String(totalCount).padStart(2, "0")}
          </span>
        </button>

        <AnimatePresence>
          {open && (
            <>
              <div
                className="fixed inset-0 z-[60]"
                onClick={() => setOpen(false)}
                aria-hidden
              />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.25, ease: [0.62, 0.61, 0.02, 1] }}
                className="absolute right-0 top-full z-[70] mt-2 w-72 overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--color-line)_80%,transparent)] bg-[color:var(--color-surface)] p-4 shadow-[var(--shadow-stage)] backdrop-blur-md"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                    Sticker collection
                  </span>
                  <span className="font-mono text-[0.66rem] text-[color:var(--color-accent)]">
                    {unlockedCount}/{totalCount}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {STICKER_ORDER.map((id) => (
                    <StickerCell
                      key={id}
                      id={id}
                      unlocked={unlocked.includes(id)}
                    />
                  ))}
                </div>
                {unlockedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Clear all stickers?")) reset();
                    }}
                    className="mt-3 block w-full text-center font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)] transition-colors hover:text-[color:var(--color-accent)]"
                  >
                    Reset collection
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Drop toast */}
      <StickerDrop id={recentDrop} />
    </>
  );
}

function StickerCell({
  id,
  unlocked,
}: {
  id: StickerId;
  unlocked: boolean;
}) {
  const s = STICKERS[id];
  return (
    <div
      className="group flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border text-center transition-all"
      style={{
        borderColor: unlocked
          ? "color-mix(in srgb, var(--color-accent) 50%, transparent)"
          : "color-mix(in srgb, var(--color-line) 60%, transparent)",
        background: unlocked
          ? "color-mix(in srgb, var(--color-accent-soft) 70%, transparent)"
          : "color-mix(in srgb, var(--color-paper) 85%, transparent)",
      }}
      title={unlocked ? s.phrase : "Locked — keep exploring"}
    >
      <span
        className="text-lg leading-none"
        style={{
          color: unlocked
            ? s.color
            : "color-mix(in srgb, var(--color-muted) 45%, transparent)",
          filter: unlocked ? "none" : "grayscale(1)",
        }}
      >
        {s.emoji}
      </span>
      <span
        className="font-mono text-[0.58rem] uppercase tracking-[0.14em]"
        style={{
          color: unlocked
            ? "var(--color-ink)"
            : "color-mix(in srgb, var(--color-muted) 65%, transparent)",
        }}
      >
        {unlocked ? s.label : "???"}
      </span>
    </div>
  );
}

function StickerDrop({ id }: { id: StickerId | null }) {
  const dismiss = useStickerStore((s) => s.dismissDrop);
  const sticker = id ? STICKERS[id] : null;
  return (
    <AnimatePresence>
      {sticker && (
        <motion.button
          type="button"
          onClick={dismiss}
          initial={{ opacity: 0, scale: 0.4, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{
            duration: 0.6,
            ease: [0.34, 1.56, 0.64, 1], // overshoot
          }}
          className="fixed bottom-6 right-6 z-[80] flex items-center gap-3 rounded-2xl border px-4 py-3 text-left backdrop-blur-md"
          style={{
            borderColor:
              "color-mix(in srgb, var(--color-accent) 45%, transparent)",
            background:
              "color-mix(in srgb, var(--color-surface) 92%, transparent)",
            boxShadow: "var(--shadow-stage)",
          }}
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
            style={{
              color: sticker.color,
              background:
                "color-mix(in srgb, var(--color-accent-soft) 80%, transparent)",
            }}
          >
            {sticker.emoji}
          </span>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-[color:var(--color-accent)]">
              Sticker unlocked
            </span>
            <span className="font-serif text-[0.95rem] text-[color:var(--color-ink)]">
              {sticker.label}
            </span>
            <span className="text-[0.78rem] text-[color:var(--color-muted)]">
              {sticker.phrase}
            </span>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useStageStore } from "@/lib/store";
import { profile } from "@/content/site";

/**
 * Journal-themed command palette. Mounted in app/layout.tsx so it's
 * available on every route. Opens with ⌘K / Ctrl+K, closes with Esc
 * or clicking the backdrop. Items cover:
 *
 *   - Navigation between the four content pages + home
 *   - "Close page" when a split view is open (resets store)
 *   - External actions (copy email, open LinkedIn / GitHub)
 *
 * Keeps state local — cmdk handles search/filter + keyboard nav; we
 * just own the open/close flag and the item handlers.
 */
export function CommandPalette() {
  const router = useRouter();
  const view = useStageStore((s) => s.view);
  const setView = useStageStore((s) => s.setView);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Global key handler: ⌘K / Ctrl+K toggles the palette; Esc closes it
  // when open. Both use the CAPTURE phase + stopImmediatePropagation so
  // that when the palette is open, Esc closes the palette without also
  // reaching NotebookShell's Escape-closes-split listener on window
  // (both would otherwise fire since both are window-level).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen((o) => !o);
        return;
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(false);
        return;
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKey, { capture: true });
  }, [open]);

  // Custom event for non-keyboard triggers (e.g. the ⌘K hint chip in
  // SlashCommandRow, used for mobile and click-first users).
  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener("sebjournal:open-palette", onOpen);
    return () =>
      window.removeEventListener("sebjournal:open-palette", onOpen);
  }, []);

  const closeAnd = useCallback(
    (fn: () => void) => () => {
      setOpen(false);
      // Small delay so the exit animation can play before the action
      // fires (which may trigger a page nav or view change).
      window.setTimeout(fn, 120);
    },
    [],
  );

  const navigate = useCallback(
    (path: string) => closeAnd(() => router.push(path)),
    [closeAnd, router],
  );

  const closeSplit = useCallback(
    () => closeAnd(() => setView({ kind: "empty" })),
    [closeAnd, setView],
  );

  const copyEmail = useCallback(
    () =>
      closeAnd(() => {
        navigator.clipboard?.writeText(profile.email).then(
          () => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2200);
          },
          () => {
            /* clipboard failure — silent, user can hit /contact */
          },
        );
      }),
    [closeAnd],
  );

  const externalLink = useCallback(
    (url: string) =>
      closeAnd(() => {
        window.open(url, "_blank", "noopener,noreferrer");
      }),
    [closeAnd],
  );

  const isSplitOpen = view.kind !== "empty";

  const copiedToast = useMemo(
    () =>
      copied ? (
        <div
          key="copied-toast"
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10000,
            background: "rgba(61, 52, 139, 0.92)",
            color: "#f7f4ee",
            fontFamily: "var(--font-script)",
            fontSize: 16,
            padding: "8px 18px",
            borderRadius: 999,
            boxShadow: "0 6px 18px rgba(0, 0, 0, 0.15)",
            pointerEvents: "none",
          }}
        >
          email copied — {profile.email}
        </div>
      ) : null,
    [copied],
  );

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="palette-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(23, 23, 23, 0.35)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              zIndex: 1000,
            }}
          />
        )}
        {open && (
          // Outer wrapper owns the center-of-viewport positioning
          // (translate -50% both axes). The inner motion.div owns the
          // small y/scale entry animation — separating them keeps
          // framer motion from overriding the centering transform.
          <div
            key="palette-wrapper"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "min(560px, 92vw)",
              zIndex: 1001,
              pointerEvents: "none",
            }}
          >
            <motion.div
              key="palette"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              style={{
                width: "100%",
                background: "#faf7f0",
                border:
                  "1px solid color-mix(in srgb, var(--color-ink-soft) 32%, transparent)",
                borderRadius: 10,
                boxShadow:
                  "0 14px 50px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.06)",
                overflow: "hidden",
                fontFamily: "var(--font-mono)",
                pointerEvents: "auto",
              }}
            >
            <Command label="Sebastian's journal — command palette">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 18px",
                  borderBottom:
                    "1px dashed color-mix(in srgb, var(--color-ink-soft) 22%, transparent)",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color:
                      "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
                  }}
                >
                  ⌘ —
                </span>
                <Command.Input
                  autoFocus
                  placeholder="jump to a page, close, copy email…"
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "var(--color-ink)",
                    caretColor: "var(--color-ink-soft)",
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color:
                      "color-mix(in srgb, var(--color-ink-soft) 40%, transparent)",
                  }}
                >
                  esc ✕
                </span>
              </div>

              <Command.List
                style={{
                  maxHeight: "min(52vh, 420px)",
                  overflowY: "auto",
                  padding: "8px 0",
                }}
              >
                <Command.Empty
                  style={{
                    padding: "18px 22px",
                    fontSize: 13,
                    color:
                      "color-mix(in srgb, var(--color-ink-soft) 65%, transparent)",
                    fontStyle: "italic",
                  }}
                >
                  Nothing here. Try "about", "linkedin", "email"…
                </Command.Empty>

                <PaletteGroup heading="Navigate">
                  <PaletteItem
                    label="Landing page"
                    shortcut="/"
                    onSelect={navigate("/")}
                  />
                  <PaletteItem
                    label="Home — chat"
                    shortcut="/home"
                    onSelect={navigate("/home")}
                  />
                  <PaletteItem
                    label="About"
                    shortcut="/about"
                    onSelect={navigate("/about")}
                  />
                  <PaletteItem
                    label="Experience"
                    shortcut="/experience"
                    onSelect={navigate("/experience")}
                  />
                  <PaletteItem
                    label="LinkedIn posts"
                    shortcut="/linkedin"
                    onSelect={navigate("/linkedin")}
                  />
                  <PaletteItem
                    label="Contact"
                    shortcut="/contact"
                    onSelect={navigate("/contact")}
                  />
                </PaletteGroup>

                {isSplitOpen && (
                  <PaletteGroup heading="Page">
                    <PaletteItem
                      label="Close this page"
                      shortcut="esc"
                      onSelect={closeSplit}
                    />
                  </PaletteGroup>
                )}

                <PaletteGroup heading="Contact">
                  <PaletteItem
                    label="Copy email address"
                    shortcut={profile.email}
                    onSelect={copyEmail}
                  />
                  <PaletteItem
                    label="Open LinkedIn profile"
                    shortcut="linkedin.com/in/sebtsang"
                    onSelect={externalLink(profile.linkedin)}
                  />
                  <PaletteItem
                    label="Open GitHub"
                    shortcut="github.com/sebtsang"
                    onSelect={externalLink(profile.github)}
                  />
                </PaletteGroup>
              </Command.List>
            </Command>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {copiedToast}
    </>
  );
}

function PaletteGroup({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <Command.Group
      heading={heading}
      style={
        {
          // cmdk renders [cmdk-group-heading] as a child node we can style
          // via a data-slot selector in globals.css; inline the baseline
          // sizing here so it works without extra CSS.
          fontSize: 10,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color:
            "color-mix(in srgb, var(--color-ink-soft) 50%, transparent)",
          paddingLeft: 22,
          paddingRight: 22,
          paddingTop: 10,
          paddingBottom: 4,
        } as React.CSSProperties
      }
    >
      {children}
    </Command.Group>
  );
}

function PaletteItem({
  label,
  shortcut,
  onSelect,
}: {
  label: string;
  shortcut: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 22px",
        cursor: "pointer",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        color: "var(--color-ink)",
        transition: "background 140ms ease, color 140ms ease",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background =
          "color-mix(in srgb, var(--color-ink-soft) 8%, transparent)")
      }
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <span>{label}</span>
      <span
        style={{
          fontSize: 11,
          color:
            "color-mix(in srgb, var(--color-ink-soft) 55%, transparent)",
          fontFamily: "var(--font-mono)",
        }}
      >
        {shortcut}
      </span>
    </Command.Item>
  );
}

"use client";

const COMMANDS = [
  "/about",
  "/experience",
  "/linkedin",
  "/contact",
] as const;

/**
 * Fire the custom event CommandPalette listens for. Lets this row open
 * the palette without a prop chain back through ChatPage / NotebookShell.
 * Safe on SSR — the handler only runs from a click, which is client-only.
 */
function openPalette() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("sebjournal:open-palette"));
}

export function SlashCommandRow({
  onDispatch,
  compact = false,
}: {
  onDispatch: (cmd: string) => void;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: compact ? "column" : "row",
        flexWrap: "wrap",
        gap: compact ? 6 : 18,
        marginBottom: 14,
        alignItems: compact ? "flex-start" : "center",
      }}
    >
      {!compact && (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "color-mix(in srgb, var(--color-ink-soft) 45%, transparent)",
            alignSelf: "center",
          }}
        >
          try —
        </span>
      )}
      {COMMANDS.map((cmd) => (
        <button
          key={cmd}
          type="button"
          onClick={() => onDispatch(cmd)}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontFamily: "var(--font-script)",
            fontSize: compact ? 18 : 22,
            color: "color-mix(in srgb, var(--color-ink-soft) 70%, transparent)",
            borderBottom:
              "1px dashed color-mix(in srgb, var(--color-ink-soft) 30%, transparent)",
            lineHeight: 1.1,
            transition: "color 160ms var(--ease-out-expo), border-color 160ms var(--ease-out-expo)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "var(--color-ink-soft)";
            e.currentTarget.style.borderBottomColor =
              "var(--color-ink-soft)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color =
              "color-mix(in srgb, var(--color-ink-soft) 70%, transparent)";
            e.currentTarget.style.borderBottomColor =
              "color-mix(in srgb, var(--color-ink-soft) 30%, transparent)";
          }}
        >
          {cmd}
        </button>
      ))}

      {/* Shortcut hint — visually distinct from the slash commands
          (mono font, not script) so it reads as "keyboard shortcut"
          not "command." Clickable for mobile users who can't ⌘K. */}
      <button
        type="button"
        onClick={openPalette}
        aria-label="Open command menu"
        title="Open command menu"
        style={{
          background: "transparent",
          border:
            "1px dashed color-mix(in srgb, var(--color-ink-soft) 28%, transparent)",
          borderRadius: 6,
          padding: compact ? "2px 8px" : "3px 10px",
          cursor: "pointer",
          fontFamily: "var(--font-mono)",
          fontSize: compact ? 10 : 11,
          letterSpacing: "0.08em",
          color: "color-mix(in srgb, var(--color-ink-soft) 60%, transparent)",
          lineHeight: 1.2,
          marginLeft: compact ? 0 : "auto",
          transition:
            "color 160ms var(--ease-out-expo), border-color 160ms var(--ease-out-expo), background 160ms var(--ease-out-expo)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--color-ink)";
          e.currentTarget.style.borderColor = "var(--color-ink-soft)";
          e.currentTarget.style.background =
            "color-mix(in srgb, var(--color-ink-soft) 6%, transparent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color =
            "color-mix(in srgb, var(--color-ink-soft) 60%, transparent)";
          e.currentTarget.style.borderColor =
            "color-mix(in srgb, var(--color-ink-soft) 28%, transparent)";
          e.currentTarget.style.background = "transparent";
        }}
      >
        ⌘K · menu
      </button>
    </div>
  );
}

"use client";

const COMMANDS = [
  "/about",
  "/experience",
  "/linkedin",
  "/contact",
] as const;

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
            fontSize: "var(--fs-meta)",
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
            fontSize: compact ? "var(--fs-chip)" : "var(--fs-script)",
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
    </div>
  );
}

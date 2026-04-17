"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setMounted(true);
    const current =
      (document.documentElement.getAttribute("data-theme") as
        | "light"
        | "dark"
        | null) || "light";
    setTheme(current);
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
    setTheme(next);
  };

  if (!mounted) {
    return <div className="h-8 w-8" aria-hidden />;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="flex h-8 w-8 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--color-line)_75%,transparent)] bg-[color-mix(in_srgb,var(--color-surface)_85%,transparent)] text-[color:var(--color-muted)] transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
    >
      {theme === "light" ? (
        <Moon className="h-3.5 w-3.5" strokeWidth={2} />
      ) : (
        <Sun className="h-3.5 w-3.5" strokeWidth={2} />
      )}
    </button>
  );
}

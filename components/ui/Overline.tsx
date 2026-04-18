/**
 * Small mono overline: uppercase tracked-out label used above headings
 * or as section metadata. Matches v4-sandy's rhythm — mono for
 * metadata, serif/sans for content.
 *
 *     SELECTED WORK · 4 PROJECTS
 */
import { cn } from "@/lib/utils";

export function Overline({
  children,
  className,
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  return (
    <p
      className={cn(
        "font-mono text-[0.7rem] uppercase tracking-[0.18em]",
        accent
          ? "text-[color:var(--color-accent)]"
          : "text-[color:var(--color-muted)]",
        className
      )}
    >
      {children}
    </p>
  );
}

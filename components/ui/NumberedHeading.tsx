/**
 * v4-sandy's signature section heading:
 *
 *     01.  Selected work  ─────────────────────────
 *
 * Mono number prefix + serif heading + trailing rule.
 * The trailing rule is a pseudo-element, so the component accepts
 * anything as children (string, span with accent, etc).
 */
import { cn } from "@/lib/utils";

export function NumberedHeading({
  num,
  children,
  className,
}: {
  /** e.g. "01", "02" — we append the period */
  num: string | number;
  children: React.ReactNode;
  className?: string;
}) {
  const formatted = typeof num === "number" ? String(num).padStart(2, "0") : num;
  return (
    <h2 className={cn("numbered-heading", className)}>
      <span className="numbered-heading__num">{formatted}.</span>
      <span>{children}</span>
    </h2>
  );
}

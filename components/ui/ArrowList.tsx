/**
 * v4-sandy bullet list with `▹` marker in accent color.
 * Pass either an array of strings or children (for richer bullets).
 */
import { cn } from "@/lib/utils";

export function ArrowList({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <ul className={cn("arrow-list", className)}>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

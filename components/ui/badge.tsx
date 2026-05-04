import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone =
  | "neutral"
  | "accent"
  | "positive"
  | "warning"
  | "negative";

const toneClasses: Record<BadgeTone, string> = {
  neutral:
    "border-[var(--color-border-strong)] text-[var(--color-muted)] bg-[var(--color-surface-2)]",
  accent: "border-[var(--color-accent-soft)] text-[var(--color-accent)] bg-[var(--color-accent-soft)]/30",
  positive:
    "border-[var(--color-positive-soft)] text-[var(--color-positive)] bg-[var(--color-positive-soft)]/40",
  warning:
    "border-[var(--color-warning-soft)] text-[var(--color-warning)] bg-[var(--color-warning-soft)]/30",
  negative:
    "border-[var(--color-negative-soft)] text-[var(--color-negative)] bg-[var(--color-negative-soft)]/40",
};

export function Badge({
  className,
  tone = "neutral",
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide",
        toneClasses[tone],
        className
      )}
      {...rest}
    />
  );
}

import { cn } from "@/lib/utils";
import { Sparkline } from "./sparkline";

type Tone = "neutral" | "positive" | "negative" | "warning" | "accent";

const toneText: Record<Tone, string> = {
  neutral: "text-[var(--color-foreground)]",
  positive: "text-[var(--color-positive)]",
  negative: "text-[var(--color-negative)]",
  warning: "text-[var(--color-warning)]",
  accent: "text-[var(--color-accent)]",
};

export function KpiTile({
  label,
  value,
  delta,
  trend,
  tone = "neutral",
  hint,
  className,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: number[];
  tone?: Tone;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-col gap-2 min-w-0",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] truncate">
          {label}
        </span>
        {delta && (
          <span className={cn("text-[11px] font-medium tabular", toneText[tone])}>
            {delta}
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3 min-w-0">
        <span className="text-2xl font-semibold tracking-tight tabular truncate">
          {value}
        </span>
        {trend && trend.length > 0 && (
          <Sparkline
            values={trend}
            width={72}
            height={22}
            stroke={
              tone === "negative"
                ? "var(--color-negative)"
                : tone === "positive"
                  ? "var(--color-positive)"
                  : tone === "warning"
                    ? "var(--color-warning)"
                    : "var(--color-accent)"
            }
            fill={
              tone === "negative"
                ? "color-mix(in oklab, var(--color-negative) 18%, transparent)"
                : tone === "positive"
                  ? "color-mix(in oklab, var(--color-positive) 18%, transparent)"
                  : tone === "warning"
                    ? "color-mix(in oklab, var(--color-warning) 18%, transparent)"
                    : "color-mix(in oklab, var(--color-accent) 18%, transparent)"
            }
          />
        )}
      </div>
      {hint && <p className="text-[11px] text-[var(--color-subtle)]">{hint}</p>}
    </div>
  );
}

import Link from "next/link";
import { Badge } from "./ui/badge";
import { Sparkline } from "./sparkline";
import { fmt } from "@/lib/format";
import { StoreSnapshot } from "@/lib/data";
import { cn } from "@/lib/utils";

function unitsTone(actual: number, target: number) {
  if (target <= 0) return "neutral" as const;
  const r = actual / target;
  if (r >= 1.05) return "positive" as const;
  if (r >= 0.95) return "accent" as const;
  if (r >= 0.85) return "warning" as const;
  return "negative" as const;
}

export function StoreCard({ snapshot }: { snapshot: StoreSnapshot }) {
  const { store, yesterday, history } = snapshot;
  const unitsActual = yesterday.newUnitsSold + yesterday.usedUnitsSold;
  const unitsTarget = yesterday.newUnitsTarget + yesterday.usedUnitsTarget;
  const tone = unitsTone(unitsActual, unitsTarget);
  const trend = history.map((d) => d.newUnitsSold + d.usedUnitsSold);

  return (
    <Link
      href={`/briefings/${store.id}`}
      className="group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-4 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge tone="neutral" className="font-mono">
              {store.id}
            </Badge>
            <span className="text-[11px] text-[var(--color-muted)] uppercase tracking-wider">
              {store.brand}
            </span>
          </div>
          <h3 className="mt-2 font-semibold tracking-tight text-[15px] truncate">
            {store.name}
          </h3>
          <p className="text-xs text-[var(--color-muted)] mt-0.5 truncate">
            {store.city}, {store.state} · GM {store.gm.name}
          </p>
        </div>
        <Sparkline values={trend} width={88} height={32} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Units" value={fmt.int(unitsActual)} sub={`/ ${fmt.int(unitsTarget)}`} tone={tone} />
        <Stat label="Total gross" value={fmt.money(yesterday.totalFrontGross + yesterday.totalBackGross)} />
        <Stat
          label="CSI"
          value={yesterday.csiScore.toFixed(1)}
          tone={yesterday.csiScore >= 90 ? "positive" : yesterday.csiScore < 85 ? "negative" : "neutral"}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--color-muted)]">View briefing</span>
        <span className="text-[var(--color-accent)] group-hover:translate-x-0.5 transition-transform">
          →
        </span>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "positive" | "negative" | "warning" | "accent";
}) {
  const cls = {
    neutral: "text-[var(--color-foreground)]",
    positive: "text-[var(--color-positive)]",
    negative: "text-[var(--color-negative)]",
    warning: "text-[var(--color-warning)]",
    accent: "text-[var(--color-accent)]",
  }[tone];
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
      <span className={cn("text-sm font-semibold tabular truncate", cls)}>
        {value}
        {sub && (
          <span className="font-normal text-[var(--color-subtle)] ml-1">{sub}</span>
        )}
      </span>
    </div>
  );
}

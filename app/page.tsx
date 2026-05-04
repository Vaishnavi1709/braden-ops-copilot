import Link from "next/link";
import { GroupRollups } from "@/components/group-rollups";
import { StoreCard } from "@/components/store-card";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/lib/format";
import { getAllSnapshots, DEMO_TODAY } from "@/lib/data";

export default function Home() {
  const snapshots = getAllSnapshots();

  // Pre-rank stores so the worst-performing-yesterday float to the top of
  // operations' attention. The grid below sorts by units delta vs target.
  const ranked = [...snapshots].sort((a, b) => {
    const deltaA =
      a.yesterday.newUnitsTarget > 0
        ? (a.yesterday.newUnitsSold + a.yesterday.usedUnitsSold) /
          (a.yesterday.newUnitsTarget + a.yesterday.usedUnitsTarget)
        : 1;
    const deltaB =
      b.yesterday.newUnitsTarget > 0
        ? (b.yesterday.newUnitsSold + b.yesterday.usedUnitsSold) /
          (b.yesterday.newUnitsTarget + b.yesterday.usedUnitsTarget)
        : 1;
    return deltaA - deltaB;
  });

  return (
    <div className="flex-1 ring-grid">
      <section className="border-b border-[var(--color-border)] dotgrid">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
          <div className="flex flex-col gap-4 max-w-3xl">
            <div className="flex items-center gap-2">
              <Badge tone="accent">AI Daily Briefings · Live</Badge>
              <span className="text-xs text-[var(--color-muted)]">
                {fmt.date(DEMO_TODAY)}
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">
              Good morning, ops team.
            </h1>
            <p className="text-[var(--color-muted)] text-base lg:text-lg leading-relaxed">
              Twelve stores, one command center. Each morning Claude reads
              yesterday&apos;s KPIs against a 7-day baseline, surfaces what
              changed and why, and writes a personalized briefing for every GM
              with three concrete actions for today.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Link
                href={`/briefings/${ranked[0].store.id}`}
                className="inline-flex h-10 px-4 items-center gap-2 rounded-lg bg-gradient-to-b from-[var(--color-accent)] to-[#1d8fc4] text-[var(--color-background)] text-sm font-medium hover:brightness-110 shadow-[0_0_0_1px_rgba(56,189,248,0.4),0_4px_20px_-6px_rgba(56,189,248,0.5)]"
              >
                Open today&apos;s most-urgent briefing
                <span className="text-xs font-mono opacity-70">{ranked[0].store.id}</span>
              </Link>
              <Link
                href="/about"
                className="inline-flex h-10 px-4 items-center gap-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] text-sm font-medium hover:bg-[var(--color-surface)]/70"
              >
                How it works
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 flex flex-col gap-10">
        <div className="flex flex-col gap-4">
          <header className="flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Group rollup · yesterday
              </h2>
              <p className="text-xs text-[var(--color-subtle)] mt-1">
                Aggregated across all 12 stores. Sparklines show the last 7 days.
              </p>
            </div>
          </header>
          <GroupRollups snapshots={snapshots} />
        </div>

        <div className="flex flex-col gap-4">
          <header className="flex items-baseline justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-muted)]">
                Stores · ranked by attention needed
              </h2>
              <p className="text-xs text-[var(--color-subtle)] mt-1">
                Sorted by yesterday&apos;s units vs target. Click any store to
                generate its AI briefing.
              </p>
            </div>
            <span className="text-xs text-[var(--color-subtle)] tabular">
              {snapshots.length} stores
            </span>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ranked.map((s) => (
              <StoreCard key={s.store.id} snapshot={s} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

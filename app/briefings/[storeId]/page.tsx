// Briefing detail page. The shell renders synchronously; the LLM-backed
// briefing streams in via Suspense so navigation feels instant.

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { BriefingSkeleton } from "@/components/briefing-skeleton";
import { BriefingView } from "@/components/briefing-view";
import { StoreKpiGrid } from "@/components/store-kpi-grid";
import { Badge } from "@/components/ui/badge";
import { computeSignals } from "@/lib/briefing/compute";
import { generateBriefing } from "@/lib/briefing/generate";
import { fmt } from "@/lib/format";
import { getStoreSnapshot } from "@/lib/data";

type RouteParams = { storeId: string };

// Forced dynamic so the LLM briefing runs per-request (with the user's
// runtime API key) instead of being baked into the build. The data layer
// is still deterministic, so the only thing that varies request-to-request
// is the Claude generation itself.
export const dynamic = "force-dynamic";

// Vercel default for serverless functions is 10s; bump to 30s so a slow
// Claude call (cold start + reasoning) doesn't trip the timeout. The mock
// fallback fires below this anyway, but being explicit avoids surprises.
export const maxDuration = 30;

export default async function BriefingPage({
  params,
}: {
  params: Promise<RouteParams>;
}) {
  const { storeId } = await params;
  const snapshot = getStoreSnapshot(storeId);
  if (!snapshot) notFound();

  const { store, yesterday } = snapshot;

  return (
    <div className="flex-1 ring-grid">
      <section className="border-b border-[var(--color-border)] dotgrid">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Link
            href="/"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-foreground)] inline-flex items-center gap-1"
          >
            ← Command Center
          </Link>
          <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Badge tone="neutral" className="font-mono">
                  {store.id}
                </Badge>
                <span className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
                  {store.brand} · {store.persona}
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">
                {store.name}
              </h1>
              <p className="text-sm text-[var(--color-muted)]">
                {store.city}, {store.state} · GM {store.gm.name} · Briefing for{" "}
                {fmt.date(yesterday.date)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 grid lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <Suspense fallback={<BriefingSkeleton />}>
            <BriefingPanel storeId={storeId} />
          </Suspense>
        </div>
        <aside className="flex flex-col gap-4">
          <header>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">
              Yesterday at a glance
            </h2>
            <p className="text-[11px] text-[var(--color-subtle)] mt-1">
              The same numbers Claude reads. Sparklines = last 7 days.
            </p>
          </header>
          <StoreKpiGrid snapshot={snapshot} />
        </aside>
      </section>
    </div>
  );
}

async function BriefingPanel({ storeId }: { storeId: string }) {
  const snapshot = getStoreSnapshot(storeId)!;
  const signals = computeSignals(snapshot);
  const result = await generateBriefing(signals);
  return (
    <BriefingView
      storeId={storeId}
      initialBriefing={result.briefing}
      initialSource={result.source}
      initialModelId={result.modelId}
      initialError={result.error}
    />
  );
}

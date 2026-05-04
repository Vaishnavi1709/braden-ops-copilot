// Streaming skeleton for the briefing panel — keeps the page laid out while
// the LLM call resolves so there's no layout shift.

export function BriefingSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden animate-pulse">
      <div className="p-6 lg:p-8 border-b border-[var(--color-border)]">
        <div className="h-5 w-40 rounded bg-[var(--color-surface-2)]" />
        <div className="h-8 w-3/4 mt-5 rounded bg-[var(--color-surface-2)]" />
        <div className="h-4 w-full mt-3 rounded bg-[var(--color-surface-2)]" />
        <div className="h-4 w-5/6 mt-2 rounded bg-[var(--color-surface-2)]" />
      </div>
      <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-border)]">
        {[0, 1].map((c) => (
          <div key={c} className="p-6 lg:p-7 flex flex-col gap-3">
            <div className="h-3 w-24 rounded bg-[var(--color-surface-2)]" />
            <div className="h-20 w-full rounded bg-[var(--color-surface-2)]" />
            <div className="h-20 w-full rounded bg-[var(--color-surface-2)]" />
          </div>
        ))}
      </div>
      <div className="p-6 lg:p-7 flex flex-col gap-3">
        <div className="h-3 w-32 rounded bg-[var(--color-surface-2)]" />
        <div className="h-24 w-full rounded bg-[var(--color-surface-2)]" />
        <div className="h-24 w-full rounded bg-[var(--color-surface-2)]" />
      </div>
    </div>
  );
}

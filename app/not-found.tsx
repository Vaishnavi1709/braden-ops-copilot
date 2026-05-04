import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20">
      <p className="text-xs uppercase tracking-widest text-[var(--color-muted)]">
        404 · not found
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        That store isn&apos;t in the group.
      </h1>
      <p className="mt-2 text-[var(--color-muted)] max-w-md">
        The Braden Auto Group has 12 stores. Head back to the command center to
        pick one.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 px-4 items-center gap-2 rounded-lg bg-gradient-to-b from-[var(--color-accent)] to-[#1d8fc4] text-[var(--color-background)] text-sm font-medium"
      >
        ← Command Center
      </Link>
    </div>
  );
}

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, CardSubtitle, CardTitle } from "@/components/ui/card";

export default function AboutPage() {
  return (
    <div className="flex-1">
      <section className="border-b border-[var(--color-border)] dotgrid">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <Badge tone="accent">How it works</Badge>
          <h1 className="mt-4 text-3xl lg:text-4xl font-semibold tracking-tight">
            What I built — and why I picked it.
          </h1>
          <p className="mt-3 text-[var(--color-muted)] text-base lg:text-lg leading-relaxed">
            Braden Auto Group&apos;s existing dashboard is a great
            command-center surface for raw KPIs. The gap is the second-order
            question every GM has at 7:00 AM: <em>what should I actually do
            today?</em> This feature closes that gap with personalized,
            AI-generated daily briefings — one per store, every morning.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10 flex flex-col gap-8">
        <Card>
          <CardHeader>
            <CardTitle>The pitch in one paragraph</CardTitle>
            <CardSubtitle>Why this is the right next move</CardSubtitle>
          </CardHeader>
          <CardBody className="text-[15px] leading-relaxed text-[var(--color-muted)]">
            <p>
              A 12-store dealer group already has the data. The problem is
              that 12 GMs each spend 30+ minutes every morning translating
              spreadsheets into a plan for the day. That&apos;s 60+ hours a
              week of leadership time spent on a task an AI can do in 6
              seconds — and do <em>more consistently</em>, with the same
              statistical rigor across every store. The briefing gives
              ownership a single, comparable view of how every GM is starting
              their day. That&apos;s the kind of leverage an AI Operations
              Builder is hired to ship.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Architecture</CardTitle>
            <CardSubtitle>Why the math is in code, not the prompt</CardSubtitle>
          </CardHeader>
          <CardBody>
            <ol className="flex flex-col gap-4 text-[15px] leading-relaxed text-[var(--color-muted)]">
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Data layer.
                </strong>{" "}
                Deterministic mock generator (Mulberry32-seeded) produces 14
                days of realistic KPIs per store. Same seed → same numbers,
                so screen recordings are stable. In production this swaps for
                a DMS / data warehouse adapter — the rest of the stack
                doesn&apos;t care.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Signal computation.
                </strong>{" "}
                Pure TypeScript reads each KPI, computes z-score vs the 7-day
                baseline, ranks by severity, and builds a typed{" "}
                <code className="font-mono text-xs bg-[var(--color-surface-2)] px-1 py-0.5 rounded">
                  Signals
                </code>{" "}
                bundle. Unit-tested. The LLM never does arithmetic — that&apos;s
                where it&apos;s least reliable.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Claude tool-use.
                </strong>{" "}
                Signals are formatted into a prompt and sent to Claude with a
                strict JSON tool schema (
                <code className="font-mono text-xs bg-[var(--color-surface-2)] px-1 py-0.5 rounded">
                  submit_briefing
                </code>
                ). Claude&apos;s job is purely <em>narration</em> — pick a
                headline, write three sentences, propose three actions. The
                response goes through Zod validation before reaching the UI.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Graceful fallback.
                </strong>{" "}
                If there&apos;s no API key, or the LLM call fails, or its
                output fails schema validation, a deterministic templated
                briefing built from the same signals takes over. The demo is
                <em> never</em> broken.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Streaming UI.
                </strong>{" "}
                The page shell renders synchronously with the store profile
                and KPI grid. The briefing streams in via React Suspense so
                navigation is instant — the LLM latency is hidden.
              </li>
            </ol>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What I&apos;d build next</CardTitle>
            <CardSubtitle>Two-week roadmap if this becomes the foundation</CardSubtitle>
          </CardHeader>
          <CardBody>
            <ul className="flex flex-col gap-3 text-[15px] leading-relaxed text-[var(--color-muted)] list-disc pl-5">
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Role-aware briefings.
                </strong>{" "}
                Same engine, different personas — Sales Manager gets desk
                actions; Service Manager gets bay/RO actions; F&I Manager
                gets product-penetration coaching.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Slack / email delivery.
                </strong>{" "}
                Ship the briefing to each GM at 6:30 AM via their preferred
                channel; one-click acknowledge → tracked in the dashboard.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Action follow-through tracking.
                </strong>{" "}
                Did yesterday&apos;s actions actually move the metric? Loop the
                outcome back into next morning&apos;s briefing as
                accountability and as RLHF-style training data.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Group-level briefing.
                </strong>{" "}
                One paragraph for ownership: which 3 stores to call today and
                why.
              </li>
            </ul>
          </CardBody>
        </Card>

        <div className="text-center">
          <Link
            href="/"
            className="inline-flex h-10 px-4 items-center gap-2 rounded-lg bg-gradient-to-b from-[var(--color-accent)] to-[#1d8fc4] text-[var(--color-background)] text-sm font-medium hover:brightness-110"
          >
            ← Back to the command center
          </Link>
        </div>
      </section>
    </div>
  );
}

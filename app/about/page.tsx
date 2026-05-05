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
            <CardTitle>Make.com / n8n delivery</CardTitle>
            <CardSubtitle>The dashboard isn&apos;t where GMs read briefings — their phones are</CardSubtitle>
          </CardHeader>
          <CardBody className="text-[15px] leading-relaxed text-[var(--color-muted)] flex flex-col gap-3">
            <p>
              The JD&apos;s example is &ldquo;GM daily scorecard delivered to every
              GM&apos;s phone every morning automatically&rdquo; — not a website
              GMs have to navigate to. So the engine ships with a webhook
              endpoint built for Make.com / n8n.
            </p>
            <p>
              <code className="font-mono text-xs bg-[var(--color-surface-2)] px-1 py-0.5 rounded">
                GET /api/morning-broadcast
              </code>{" "}
              returns all 12 generated briefings <em>plus</em> ready-to-send
              email (subject + HTML body) and Slack (mrkdwn blocks) payloads,
              addressed to each GM and pre-ranked by attention needed. A
              Make.com scenario is six modules: cron → HTTP → iterator →
              Gmail + Slack. Wire it once, it runs every weekday at 6:30 AM.
              Scenario blueprint and an importable n8n workflow are in{" "}
              <code className="font-mono text-xs bg-[var(--color-surface-2)] px-1 py-0.5 rounded">
                automations/
              </code>
              .
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What I&apos;d build next</CardTitle>
            <CardSubtitle>The same engine, the JD&apos;s other named tools</CardSubtitle>
          </CardHeader>
          <CardBody>
            <p className="text-[15px] leading-relaxed text-[var(--color-muted)] mb-4">
              The morning briefing is the kernel. Same Signal pipeline, same
              tool-use + Zod pattern, different narrator and delivery target —
              every other tool the JD calls out is a fork of this one.
            </p>
            <ul className="flex flex-col gap-3 text-[15px] leading-relaxed text-[var(--color-muted)] list-disc pl-5">
              <li>
                <strong className="text-[var(--color-foreground)]">
                  BDC response bot.
                </strong>{" "}
                Lead-arrival webhook → Claude drafts a personalized reply →
                CRM API in under 60 seconds. The 52% → 80%+ contact-rate move
                the JD is targeting.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Inventory intelligence agent.
                </strong>{" "}
                Aged units + days-supply signals → Claude proposes price drops
                → Dealertrack feed. Chad stops managing the spreadsheet.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Vendor invoice monitor.
                </strong>{" "}
                PDF/email ingest → extract → compare to contracted rates →
                flag overcharges in Slack. Catches the Dealertrack
                double-billing before two years pass.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Acquisition underwriter.
                </strong>{" "}
                Deal-data form → IRR / payback / go-no-go memo → emailed to
                ownership in under five minutes.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Platform Manager financial briefing.
                </strong>{" "}
                The same broadcast endpoint, group-rolled-up + bottom-three,
                delivered at 7 AM.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Role-aware briefings.
                </strong>{" "}
                Sales Manager gets desk actions, Service Manager gets bay/RO
                actions, F&I Manager gets product-penetration coaching — one
                signal pipeline, three prompts.
              </li>
              <li>
                <strong className="text-[var(--color-foreground)]">
                  Action follow-through tracking.
                </strong>{" "}
                Did yesterday&apos;s actions move the metric? Loop the outcome
                into tomorrow&apos;s briefing as accountability — and as
                RLHF-style training data for the engine itself.
              </li>
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Why this is also a GOAT OPS kernel</CardTitle>
            <CardSubtitle>
              The pattern that makes this a $3M ARR conversation in 18 months
            </CardSubtitle>
          </CardHeader>
          <CardBody className="text-[15px] leading-relaxed text-[var(--color-muted)] flex flex-col gap-3">
            <p>
              Every dealer group in the country has the same problem at 7 AM
              — and is buying the same dashboards that don&apos;t solve it.
              The architecture here (deterministic data adapter → pure-TS
              signal compute → Claude tool-use narrator → multi-channel
              delivery) is brand-, DMS-, and group-agnostic.
            </p>
            <p>
              Swap the data adapter for a different DMS, swap the store
              roster, swap the brand colors. The compute, the prompt
              scaffolding, the Make.com / n8n delivery, the
              fallback-never-breaks demo discipline — all of that is the
              product. Each net-new tool (BDC bot, inventory agent, invoice
              monitor) ships on the same kernel and licenses on the same
              contract.
            </p>
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

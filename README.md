# Braden Ops Co-Pilot

> An AI Daily Briefing engine for the Braden Auto Group. Built as a job-application
> submission for the AI Operations Builder role (Option C in the test).

Twelve stores, one command center. Each morning Claude reads yesterday's KPIs against a
seven-day baseline, surfaces what changed and why it matters, and writes a personalized
briefing for every GM with three concrete actions for today.

## Why I picked this feature

The existing dashboard is great at one thing: showing a GM the numbers. The problem
every multi-store group has at 7:00 AM is the *second-order question* the dashboard
can't answer for them: **what should I do today, and why?**

Right now, twelve GMs each spend thirty-plus minutes every morning translating
spreadsheets into a plan. That's sixty-plus hours a week of senior leadership time
spent on a task an LLM does in six seconds — and does *more consistently*, with the
same statistical rigor across every store, so ownership gets a single comparable view
of how every store is starting its day.

That's the kind of leverage the role description ("dashboards, bots, automations,
scorecards, AI agents, data pipelines, and tools that improve real dealership KPIs")
is asking for — not a prettier chart, but a workflow that compresses a real,
recurring management task.

## What's in the demo

- **Command Center** (`/`) — group-wide rollups for yesterday and twelve store cards
  ranked by attention needed (worst-vs-target first), each with a 14-day units
  sparkline.
- **Store Briefing** (`/briefings/BRD-01` … `BRD-12`) — the generated AI briefing for
  one store: headline, summary, wins, concerns (severity-tagged), and **three
  actions for today** with assigned owner and estimated impact. Yesterday's KPI
  grid sits in the sidebar so a reader can verify what the AI is referencing.
- **About** (`/about`) — the pitch, the architecture, and the two-week roadmap.

## Architecture

The math is in code. The LLM only narrates.

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Mock data       │ →  │  Signal compute  │ →  │  Claude          │
│  (DMS-shaped)    │    │  (z-scores,      │    │  tool-use        │
│                  │    │   ranking, pure  │    │  + Zod parse     │
│                  │    │   TS)            │    │                  │
└──────────────────┘    └──────────────────┘    └──────────────────┘
                                  │                       │
                                  ▼                       ▼
                              unit-tested          deterministic
                                                   mock fallback
                                                   on failure
```

Why this split:

1. **LLMs are unreliable arithmeticians.** The KPI deltas, z-scores, severity
   ranking, and target comparisons all run in `lib/briefing/compute.ts` and are
   unit-tested. Claude receives ranked, formatted signals — not raw rows.
2. **Strict schema or fallback.** The Claude call uses tool-use with a JSON
   schema (`submit_briefing`), then Zod-validates the output. If the network
   fails, the schema fails, or there's no API key, a deterministic templated
   briefing built from the same signals takes over. **The demo is never
   broken.**
3. **Streaming UI.** The page shell renders synchronously with the store
   profile and KPI grid. The briefing streams in via React Suspense so
   navigation feels instant — the LLM latency is hidden.
4. **Deterministic data layer.** The mock generator is seeded by
   `(storeId, date)` so the same screen always shows the same numbers — every
   demo recording is reproducible.

### Repo layout

```
app/
  page.tsx                        # Command center
  about/page.tsx                  # Pitch + architecture
  briefings/[storeId]/page.tsx    # Briefing detail (Suspense-streamed)
  api/briefing/route.ts           # POST endpoint for "regenerate"

lib/
  data/                           # Stores roster + deterministic KPI generator
  briefing/
    compute.ts                    # Pure TS — z-scores, ranking, signals
    prompt.ts                     # Builds the Claude prompt from signals
    types.ts                      # Zod schema + tool input_schema mirror
    generate.ts                   # Anthropic SDK + Zod parse + fallback
    mock.ts                       # Deterministic templated fallback briefing
  format.ts                       # Pinned en-US formatters (no locale drift)
  utils.ts                        # cn() helper

components/                       # KPI tile, store card, briefing view, etc.
tests/                            # Vitest — kpis, compute, briefing
```

## Run it locally

```bash
npm install
npm run dev          # http://localhost:3000
```

To turn on real Claude generation:

```bash
cp .env.example .env.local
# add your ANTHROPIC_API_KEY
```

Without a key, the app runs in **demo mode** with deterministic templated briefings
built from the same signal pipeline — useful for screen recordings without
exposing a key.

### Other commands

```bash
npm test             # Vitest — 13 tests, ~400ms
npm run typecheck    # tsc --noEmit
npm run build        # Next.js production build
```

## What I'd build next

This is the foundation. With another two weeks I would ship:

- **Role-aware briefings.** Same engine, different personas — Sales Manager gets
  desk actions; Service Manager gets bay/RO actions; F&I Manager gets
  product-penetration coaching.
- **Slack and email delivery.** Push the briefing to each GM at 6:30 AM via their
  preferred channel. One-click acknowledgment goes back to the dashboard.
- **Action follow-through tracking.** Did yesterday's actions actually move the
  metric? Loop the outcome back into next morning's briefing for accountability,
  and use it as RLHF-style training data to improve action ranking.
- **Group-level briefing.** One paragraph for ownership: which three stores need a
  call today and why.

## Tech

- Next.js 16 (App Router, React 19, Turbopack)
- TypeScript (strict)
- Tailwind 4
- Anthropic TypeScript SDK with tool-use + Zod validation
- Vitest

---

Built by **Vaishnavi Ekbote** for Braden Auto Group's AI Operations Builder application.

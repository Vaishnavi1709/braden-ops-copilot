# Braden Ops Co-Pilot

> An AI Daily Briefing engine for the Braden Auto Group — twelve Ohio stores,
> one command center. Submitted as the application test (Option C) for the AI
> Operations Builder role.

**Live demo: [braden-ops-copilot.vercel.app](https://braden-ops-copilot.vercel.app/)**

A good place to start: open [BRD-08 — Braden GMC Washington Court House](https://braden-ops-copilot.vercel.app/briefings/BRD-08), the highest-attention store yesterday, and read the briefing.

> **Note on the public deploy.** It runs in *deterministic mode*: the same signal pipeline narrates briefings through a templated narrator instead of calling Claude. This is a deliberate production choice — public-facing demos should not expose API keys (key exposure = financial risk + abuse risk). Set `ANTHROPIC_API_KEY` locally (see [Run it locally](#run-it-locally)) to switch to live Claude generation; the architecture is identical, only the narrator changes.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FVaishnavi1709%2Fbraden-ops-copilot&env=ANTHROPIC_API_KEY&envDescription=Optional.%20If%20unset%2C%20the%20app%20renders%20deterministic%20templated%20briefings%20instead%20of%20calling%20Claude.)

Each morning Claude reads yesterday's KPIs against a seven-day baseline,
surfaces what changed and why it matters, and writes a personalized briefing
for every GM with three concrete actions for today.

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
- **About** (`/about`) — the pitch, the architecture, and the roadmap (BDC bot,
  inventory agent, vendor invoice monitor, acquisition underwriter — same kernel).
- **Morning broadcast webhook** (`/api/morning-broadcast`) — one HTTP call returns
  all 12 briefings plus ready-to-send email + Slack payloads. Designed for
  Make.com / n8n cron-driven delivery to every GM at 6:30 AM. See
  [`automations/README.md`](./automations/README.md) for the importable
  Make.com blueprint and the n8n workflow.
- **Health endpoint** (`/api/health`) — three synthetic checks (data, signal
  compute, schema), 200 / 503 for uptime monitors. Reports active narrator
  and webhook config in the response body.

## Make.com / n8n morning automation

The dashboard isn't where GMs read briefings. Their phones are. So the engine
ships with a webhook designed for Make.com (or n8n) to fan out at 6:30 AM
every weekday.

```
[Schedule 6:30 AM ET] → [HTTP GET /api/morning-broadcast?secret=...]
                          → [Iterator over stores[]]
                            → [Gmail · Send to GM (HTML body included)]
                            → [Slack · Post to #store-brd-NN (blocks included)]
```

The endpoint returns 12 briefings *plus* ready-to-send delivery payloads (email
subject + HTML, Slack mrkdwn blocks, GM email addresses, deep-link URLs),
pre-ranked so a "top-3 only" filter to ownership is one node. Make.com just
iterates and dispatches — no extra logic in the scenario.

Full scenario blueprint, an importable n8n workflow JSON, and the auth model
are in [`automations/README.md`](./automations/README.md).

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
                                  │                       │
                                  └───────────┬───────────┘
                                              ▼
                                  ┌──────────────────────┐
                                  │ /api/morning-broadcast│
                                  │   12 briefings +      │
                                  │   email + Slack       │
                                  │   payloads            │
                                  └──────────────────────┘
                                              ▼
                                       Make.com / n8n
                                       (cron 6:30 AM ET)
                                              ▼
                                    Every GM's inbox + Slack
```

Why this split:

1. **LLMs are unreliable arithmeticians.** The KPI deltas, z-scores, severity
   ranking, and target comparisons all run in `lib/briefing/compute.ts` and are
   unit-tested. Claude receives ranked, formatted signals — not raw rows.
2. **Two narrators, one signal pipeline.** Both the live-Claude path
   (tool-use + Zod-validated `submit_briefing`) and the deterministic
   templated narrator read the *same* ranked signals. Switching between
   them is one env var (`ANTHROPIC_API_KEY`). This makes the public deploy
   safe to ship without an exposed key, and means the LLM path can never
   produce a structurally-different output than the fallback — the schema
   and content shape are identical. The demo is never broken.
3. **Streaming UI.** The page shell renders synchronously with the store
   profile and KPI grid. The briefing streams in via React Suspense so
   navigation feels instant — the LLM latency is hidden.
4. **Deterministic data layer.** The mock generator is seeded by
   `(storeId, date)` so the same screen always shows the same numbers — every
   demo recording is reproducible.
5. **Built for delivery, not pull.** The morning-broadcast endpoint runs all
   twelve generations in `Promise.all`, returning one payload Make.com /
   n8n can iterate. One HTTP call, one cron, twelve GMs notified.

### Repo layout

```
app/
  page.tsx                              # Command center
  about/page.tsx                        # Pitch + architecture + roadmap
  briefings/[storeId]/page.tsx          # Briefing detail (Suspense-streamed)
  api/briefing/route.ts                 # POST one briefing
  api/morning-broadcast/route.ts        # GET all 12 + delivery payloads (Make/n8n)

lib/
  data/                                 # Stores roster + deterministic KPI generator
  briefing/
    compute.ts                          # Pure TS — z-scores, ranking, signals
    prompt.ts                           # Builds the Claude prompt from signals
    types.ts                            # Zod schema + tool input_schema mirror
    generate.ts                         # Anthropic SDK + Zod parse + fallback
    mock.ts                             # Deterministic templated fallback briefing
  format.ts                             # Pinned en-US formatters (no locale drift)
  utils.ts                              # cn() helper

components/                             # KPI tile, store card, briefing view, etc.
tests/                                  # Vitest — kpis, compute, briefing
automations/
  README.md                             # Make.com scenario blueprint
  n8n-morning-broadcast.json            # Importable n8n workflow
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
# (optional) add BRADEN_WEBHOOK_SECRET to lock /api/morning-broadcast
```

Without a key, the app runs in **deterministic mode** — briefings are narrated
by a templated function reading the same ranked signal pipeline. This is also
the mode the public Vercel deploy runs in, so a recruiter can see a working
demo without me exposing a billable key. Set the env var locally to switch on
live Claude generation; the badge on each briefing tells you which mode is
active.

### Other commands

```bash
npm test             # Vitest — passes the full suite in ~400ms
npm run typecheck    # tsc --noEmit
npm run build        # Next.js production build
```

### Hit the broadcast endpoint

```bash
# Public demo — no secret required, deterministic narrator
curl https://braden-ops-copilot.vercel.app/api/morning-broadcast | jq '.stores[0].briefing.headline'

# Local with Claude
curl "http://localhost:3000/api/morning-broadcast" | jq '.stores | length'
```

## Tech

- Next.js 16 (App Router, React 19, Turbopack)
- TypeScript (strict)
- Tailwind 4
- Anthropic TypeScript SDK with tool-use + Zod validation
- Vitest

---

Built by **Vaishnavi Kale** for Braden Auto Group's AI Operations Builder application.

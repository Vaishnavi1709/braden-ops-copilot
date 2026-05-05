# Make.com / n8n morning automation

This is the wiring the JD asks for: cron → webhook → fan-out delivery to every
GM, every morning. The dashboard isn't where GMs read briefings. Their phones
are. This doc is the recipe.

## The endpoint

```
GET https://braden-ops-copilot.vercel.app/api/morning-broadcast?secret=$BRADEN_WEBHOOK_SECRET
```

One call. Returns 12 generated briefings AND ready-to-send delivery payloads
(email subject + HTML body, Slack mrkdwn blocks, GM emails, deep-link URLs).
Stores are pre-ranked by attention needed so a downstream "top-3 only" filter
is one node.

### Auth

Set `BRADEN_WEBHOOK_SECRET` in Vercel env. The endpoint requires
`?secret=...` to match. If unset (the public demo), the endpoint is open so a
recruiter can inspect the payload shape — switch the secret on for production.

### Response shape (truncated)

```json
{
  "generatedAt": "2026-05-04T11:00:00.000Z",
  "forDate": "2026-05-04",
  "storeCount": 12,
  "stores": [
    {
      "storeId": "BRD-08",
      "storeName": "Braden GMC Washington Court House",
      "city": "Washington Court House",
      "state": "OH",
      "gm": { "name": "Kyle Henderson", "email": "kyle.henderson@bradenauto.com" },
      "date": "2026-05-03",
      "briefingUrl": "https://braden-ops-copilot.vercel.app/briefings/BRD-08",
      "rollups": { ... },
      "briefing": { "headline": "...", "summary": "...", "wins": [...], "concerns": [...], "actions": [...] },
      "source": "claude",
      "modelId": "claude-sonnet-4-6",
      "delivery": {
        "email": { "to": "kyle.henderson@bradenauto.com", "subject": "[BRD-08] ...", "html": "<!doctype...>", "text": "..." },
        "slack": { "channelHint": "#store-brd-08", "text": "...", "blocks": [...] }
      }
    },
    ...
  ]
}
```

## Make.com scenario — one-click import

A real Make blueprint lives at
[`make-morning-broadcast.json`](./make-morning-broadcast.json). To use it:

1. In Make, open **Scenarios → Create a new scenario**.
2. From the right-hand menu, choose **More → Import Blueprint**.
3. Upload `make-morning-broadcast.json`.
4. Open the Gmail and Slack modules; reconnect them to your team's
   credentials (Make exports never include connection IDs — that's by
   design).
5. Add `BRADEN_WEBHOOK_SECRET` to your Make team variables, or hardcode it
   into the HTTP module's URL query.
6. Activate the scenario. It runs every weekday at 6:30 AM Eastern.

## Make.com scenario — wired by hand

If you'd rather wire it from scratch, six modules, fifteen minutes. Same
behavior as the imported blueprint:

```
[1] Schedule
    ├─ Run: every weekday at 06:30 America/New_York
    │
[2] HTTP · Make a request
    ├─ Method: GET
    ├─ URL: https://braden-ops-copilot.vercel.app/api/morning-broadcast
    ├─ Query parameter: secret = {{env.BRADEN_WEBHOOK_SECRET}}
    ├─ Parse response: Yes
    │
[3] Iterator
    ├─ Array: {{2.stores[]}}
    │
[4] Router (two paths in parallel per iteration)
    │
    ├─ Path A · Gmail · Send an email
    │   ├─ To: {{4.delivery.email.to}}
    │   ├─ Cc: rbraden@bradenauto.com   (ownership cc)
    │   ├─ Subject: {{4.delivery.email.subject}}
    │   ├─ Content: {{4.delivery.email.html}}
    │   └─ Content type: HTML
    │
    └─ Path B · Slack · Create a message
        ├─ Channel: {{4.delivery.slack.channelHint}}
        ├─ Text: {{4.delivery.slack.text}}
        └─ Blocks (JSON): {{4.delivery.slack.blocks}}
```

Want only the worst three stores escalated to ownership? Add a filter between
Iterator and Router: only continue when the store's index in the iteration is
less than 3 (the API returns them pre-ranked).

```
[Filter between 3 and 4]
  Condition: {{3.bundle.position}} less than 4
```

## n8n equivalent

If the team is on n8n instead, the same shape — six nodes, same webhook:

```
[Cron]            cron expression: 30 6 * * 1-5  (TZ: America/New_York)
   │
[HTTP Request]    GET, queryParam secret={{ $env.BRADEN_WEBHOOK_SECRET }}
   │
[Item Lists]      Split out into items, on field: stores
   │
[Switch]          (optional: keep top 3 by index)
   │
   ├─[Gmail · Send]      to/subject/htmlBody from $json.delivery.email
   └─[Slack · Send]      channel from $json.delivery.slack.channelHint, blocks JSON
```

A ready-to-import skeleton lives at [`n8n-morning-broadcast.json`](./n8n-morning-broadcast.json).

## Test the webhook locally

```bash
# unauth (public demo, deterministic narrator)
curl https://braden-ops-copilot.vercel.app/api/morning-broadcast | jq '.stores[0]'

# auth + live Claude (your local dev with ANTHROPIC_API_KEY set)
curl "http://localhost:3000/api/morning-broadcast?secret=$BRADEN_WEBHOOK_SECRET" | jq '.stores[0].briefing.headline'
```

## Why one endpoint, not 12

A naive automation would loop store IDs in Make.com and call `/api/briefing`
twelve times. That's fine — but it's twelve cold starts, twelve auth round
trips, and twelve places a transient failure breaks the morning.

`/api/morning-broadcast` runs all twelve generations in `Promise.all` server-side, in one
function invocation, and returns a single payload. Make.com then only iterates;
it doesn't generate. The error surface is one HTTP call.

## Health check

`/api/health` runs three synthetic checks (data load, signal compute,
schema validation), reports the active narrator (Claude vs deterministic),
and returns 200 / 503. Wire it to whatever uptime monitor your team uses
(Better Uptime, Pingdom, Healthchecks.io, or a Make scheduler that pings
it and pages on non-200):

```bash
curl https://braden-ops-copilot.vercel.app/api/health | jq
```

## What deploys with this

| Piece | Where | Status |
|---|---|---|
| Webhook endpoint | `app/api/morning-broadcast/route.ts` | shipped |
| Per-store endpoint | `app/api/briefing/route.ts` | shipped |
| Health endpoint | `app/api/health/route.ts` | shipped |
| Make.com blueprint | [`make-morning-broadcast.json`](./make-morning-broadcast.json) | importable |
| n8n workflow JSON | [`n8n-morning-broadcast.json`](./n8n-morning-broadcast.json) | importable |
| Webhook auth | `BRADEN_WEBHOOK_SECRET` env var | set in Vercel |

## Extending the same engine

Once the morning broadcast is live, the same Signal pipeline plugs into every
other tool the JD called out — same compute layer, different narrator and
delivery target:

- **BDC response bot.** Lead-response signals → Claude → reply draft → CRM
  webhook within 60 seconds of a lead arriving.
- **Inventory intelligence agent.** Aged-inventory + days-supply signals →
  Claude → price-drop recommendations → Dealertrack via the same endpoint pattern.
- **Vendor invoice monitor.** Document-extraction → contract-rate signals →
  Claude flags overcharges → Slack to Chad.
- **Acquisition underwriter.** Deal inputs → financial signals → Claude
  narrates the IRR/payback memo → email to ownership.
- **Platform Manager financial briefing.** This same endpoint, filtered to
  group-level rollups + the bottom-three stores, delivered at 7 AM.

The engine isn't just a daily briefing — it's the pattern.

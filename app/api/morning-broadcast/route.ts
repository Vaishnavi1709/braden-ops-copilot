// GET /api/morning-broadcast — the Make.com / n8n entry point.
//
// One HTTP call returns 12 generated briefings AND ready-to-send delivery
// payloads (email subject + HTML body, Slack mrkdwn) for every store. The
// downstream automation just iterates the array and dispatches — no extra
// logic needed in Make.com or n8n.
//
// Auth: ?secret=... must match BRADEN_WEBHOOK_SECRET in env. We avoid
// header-based auth because Make.com's HTTP module makes query params the
// path of least resistance for non-developer operators wiring scenarios.
//
// See automations/README.md for the Make.com scenario blueprint and an
// equivalent n8n workflow.

import { NextRequest, NextResponse } from "next/server";
import { computeSignals } from "@/lib/briefing/compute";
import { generateBriefing, BriefingResult } from "@/lib/briefing/generate";
import { getAllSnapshots, DEMO_TODAY } from "@/lib/data";
import { Briefing } from "@/lib/briefing/types";
import { Store } from "@/lib/data";
import { fmt } from "@/lib/format";

export const runtime = "nodejs";
// 12 stores × Claude generation in parallel; bump above the per-briefing
// route's 30s ceiling because the slowest single call paces the whole batch.
export const maxDuration = 60;

type StorePayload = {
  storeId: string;
  storeName: string;
  city: string;
  state: string;
  gm: { name: string; email: string };
  date: string;
  briefingUrl: string;
  rollups: {
    yesterdayUnitsSold: number;
    yesterdayUnitsTarget: number;
    yesterdayTotalGross: number;
    leadResponseRate: number;
    appointmentShowRate: number;
  };
  briefing: Briefing;
  source: BriefingResult["source"];
  modelId?: string;
  delivery: {
    email: { to: string; subject: string; html: string; text: string };
    slack: { channelHint: string; text: string; blocks: SlackBlock[] };
  };
};

type SlackBlock =
  | { type: "header"; text: { type: "plain_text"; text: string } }
  | {
      type: "section";
      text: { type: "mrkdwn"; text: string };
    }
  | { type: "divider" };

function originFromRequest(req: NextRequest): string {
  // Prefer the deployment's public URL when set (Vercel), otherwise the
  // request origin. Used to embed deep-links into briefings on email/Slack.
  const envBase = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (envBase) {
    return envBase.startsWith("http") ? envBase : `https://${envBase}`;
  }
  return req.nextUrl.origin;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmail(
  store: Store,
  briefing: Briefing,
  briefingUrl: string,
  date: string
): { subject: string; html: string; text: string } {
  const subject = `[${store.id}] ${store.name} — ${briefing.headline}`;

  const wins = briefing.wins
    .map(
      (w) =>
        `<li><strong>${escapeHtml(w.title)}</strong><br/><span style="color:#475569">${escapeHtml(w.detail)}</span></li>`
    )
    .join("");
  const concerns = briefing.concerns
    .map(
      (c) =>
        `<li><strong>[${c.severity.toUpperCase()}] ${escapeHtml(c.title)}</strong><br/><span style="color:#475569">${escapeHtml(c.detail)}</span></li>`
    )
    .join("");
  const actions = briefing.actions
    .map(
      (a, i) =>
        `<li><strong>${i + 1}. ${escapeHtml(a.title)}</strong> &nbsp;<span style="color:#0369a1;font-size:11px;text-transform:uppercase">${escapeHtml(a.owner)}</span><br/><span style="color:#475569">${escapeHtml(a.why)}</span><br/><span style="color:#0369a1;font-size:12px">Estimated impact: ${escapeHtml(a.estimatedImpact)}</span></li>`
    )
    .join("");

  const html = `<!doctype html>
<html><body style="font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;color:#0f172a;background:#f8fafc;padding:24px;margin:0">
<div style="max-width:640px;margin:0 auto;background:white;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
  <div style="padding:24px;border-bottom:1px solid #e2e8f0">
    <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b">${escapeHtml(store.id)} · ${escapeHtml(store.brand)} · ${escapeHtml(fmt.date(date))}</p>
    <h1 style="margin:6px 0 0;font-size:22px;line-height:1.25">${escapeHtml(briefing.headline)}</h1>
    <p style="margin:10px 0 0;color:#334155;line-height:1.55">${escapeHtml(briefing.summary)}</p>
  </div>
  ${
    briefing.wins.length
      ? `<div style="padding:20px 24px;border-bottom:1px solid #e2e8f0"><h2 style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#15803d">Wins</h2><ul style="margin:0;padding-left:18px;line-height:1.6">${wins}</ul></div>`
      : ""
  }
  ${
    briefing.concerns.length
      ? `<div style="padding:20px 24px;border-bottom:1px solid #e2e8f0"><h2 style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#b91c1c">Concerns</h2><ul style="margin:0;padding-left:18px;line-height:1.6">${concerns}</ul></div>`
      : ""
  }
  <div style="padding:20px 24px"><h2 style="margin:0 0 10px;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#0369a1">Actions for today</h2><ol style="margin:0;padding-left:18px;line-height:1.6">${actions}</ol></div>
  <div style="padding:16px 24px;background:#f1f5f9;font-size:12px;color:#64748b">
    Open the full briefing: <a href="${briefingUrl}" style="color:#0369a1">${escapeHtml(briefingUrl)}</a><br/>
    Generated by Braden Ops Co-Pilot.
  </div>
</div>
</body></html>`;

  const text = [
    `${store.name} — ${briefing.headline}`,
    "",
    briefing.summary,
    "",
    briefing.wins.length ? "WINS" : "",
    ...briefing.wins.map((w) => `  • ${w.title} — ${w.detail}`),
    "",
    briefing.concerns.length ? "CONCERNS" : "",
    ...briefing.concerns.map(
      (c) => `  • [${c.severity.toUpperCase()}] ${c.title} — ${c.detail}`
    ),
    "",
    "ACTIONS FOR TODAY",
    ...briefing.actions.map(
      (a, i) =>
        `  ${i + 1}. [${a.owner}] ${a.title}\n      Why: ${a.why}\n      Impact: ${a.estimatedImpact}`
    ),
    "",
    `Full briefing: ${briefingUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

function buildSlack(
  store: Store,
  briefing: Briefing,
  briefingUrl: string,
  date: string
): { channelHint: string; text: string; blocks: SlackBlock[] } {
  const channelHint = `#store-${store.id.toLowerCase()}`;
  const text = `${store.name} — ${briefing.headline}`;

  const winsLine = briefing.wins.length
    ? briefing.wins.map((w) => `• *${w.title}* — ${w.detail}`).join("\n")
    : "_No standout wins yesterday._";
  const concernsLine = briefing.concerns.length
    ? briefing.concerns
        .map((c) => `• *[${c.severity.toUpperCase()}] ${c.title}* — ${c.detail}`)
        .join("\n")
    : "_No concerns surfaced._";
  const actionsLine = briefing.actions
    .map(
      (a, i) =>
        `*${i + 1}. ${a.title}*  _(${a.owner})_\n${a.why}\n_Estimated impact: ${a.estimatedImpact}_`
    )
    .join("\n\n");

  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `${store.id} · ${briefing.headline}` },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${store.name}* — ${store.brand} · ${fmt.date(date)}\n${briefing.summary}`,
      },
    },
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Wins*\n${winsLine}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Concerns*\n${concernsLine}` },
    },
    { type: "divider" },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*Actions for today*\n${actionsLine}` },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `<${briefingUrl}|Open full briefing →>` },
    },
  ];

  return { channelHint, text, blocks };
}

export async function GET(req: NextRequest) {
  const expected = process.env.BRADEN_WEBHOOK_SECRET;
  const provided = req.nextUrl.searchParams.get("secret");

  // If a secret is configured, require it. If none is configured (e.g. the
  // public demo deploy), allow the call through so a recruiter can hit the
  // URL and see the payload shape that Make.com would consume.
  if (expected && provided !== expected) {
    return NextResponse.json(
      { error: "Forbidden — missing or incorrect secret" },
      { status: 403 }
    );
  }

  const origin = originFromRequest(req);
  const snapshots = getAllSnapshots();

  const stores: StorePayload[] = await Promise.all(
    snapshots.map(async (snap) => {
      const signals = computeSignals(snap);
      const result = await generateBriefing(signals);
      const briefingUrl = `${origin}/briefings/${snap.store.id}`;
      const email = buildEmail(snap.store, result.briefing, briefingUrl, signals.date);
      const slack = buildSlack(snap.store, result.briefing, briefingUrl, signals.date);
      return {
        storeId: snap.store.id,
        storeName: snap.store.name,
        city: snap.store.city,
        state: snap.store.state,
        gm: snap.store.gm,
        date: signals.date,
        briefingUrl,
        rollups: signals.rollups,
        briefing: result.briefing,
        source: result.source,
        modelId: result.modelId,
        delivery: {
          email: { to: snap.store.gm.email, ...email },
          slack,
        },
      };
    })
  );

  // Stores ranked by attention needed — Make.com / n8n can iterate
  // top-down, route the worst three to ownership, and skip the rest.
  stores.sort((a, b) => {
    const ra =
      a.rollups.yesterdayUnitsTarget > 0
        ? a.rollups.yesterdayUnitsSold / a.rollups.yesterdayUnitsTarget
        : 1;
    const rb =
      b.rollups.yesterdayUnitsTarget > 0
        ? b.rollups.yesterdayUnitsSold / b.rollups.yesterdayUnitsTarget
        : 1;
    return ra - rb;
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    forDate: DEMO_TODAY,
    storeCount: stores.length,
    stores,
  });
}

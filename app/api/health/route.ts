// GET /api/health — cheap monitoring ping for Make.com / n8n / uptime checks.
//
// Runs three synthetic checks against the engine without calling Claude:
//   1. data layer returns the expected store count
//   2. signal compute produces a valid rollup for one store
//   3. the deterministic mock briefing passes Zod validation
//
// Returns 200 when all three pass, 503 when any fails. Also reports the
// active narrator (claude vs deterministic), the configured model, and
// whether the webhook secret is set — so an operator can see at a glance
// what the deployment is wired for.
//
// Open by design — no auth — so an external monitor can poll it.

import { NextResponse } from "next/server";
import { computeSignals } from "@/lib/briefing/compute";
import { buildMockBriefing } from "@/lib/briefing/mock";
import { BriefingSchema } from "@/lib/briefing/types";
import { getAllSnapshots, DEMO_TODAY, STORES } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckResult = "ok" | { error: string };

function runCheck(fn: () => void): CheckResult {
  try {
    fn();
    return "ok";
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET() {
  const checkedAt = new Date().toISOString();

  const dataCheck = runCheck(() => {
    const snaps = getAllSnapshots();
    if (snaps.length !== STORES.length) {
      throw new Error(`expected ${STORES.length} snapshots, got ${snaps.length}`);
    }
  });

  const signalsCheck = runCheck(() => {
    const snap = getAllSnapshots()[0];
    const signals = computeSignals(snap);
    if (!signals.rollups || signals.rollups.yesterdayUnitsSold < 0) {
      throw new Error("signals rollup invalid");
    }
  });

  const schemaCheck = runCheck(() => {
    const snap = getAllSnapshots()[0];
    const signals = computeSignals(snap);
    const briefing = buildMockBriefing(signals);
    const result = BriefingSchema.safeParse(briefing);
    if (!result.success) throw new Error(result.error.message);
  });

  const allOk =
    dataCheck === "ok" && signalsCheck === "ok" && schemaCheck === "ok";

  const body = {
    status: allOk ? "ok" : "degraded",
    service: "braden-ops-copilot",
    version: "0.1.0",
    checkedAt,
    forDate: DEMO_TODAY,
    storeCount: STORES.length,
    config: {
      narrator: process.env.ANTHROPIC_API_KEY ? "claude" : "deterministic",
      modelId: process.env.ANTHROPIC_API_KEY
        ? process.env.ANTHROPIC_MODEL_ID ?? "claude-sonnet-4-6"
        : null,
      webhookSecretConfigured: !!process.env.BRADEN_WEBHOOK_SECRET,
    },
    checks: {
      data: dataCheck,
      signals: signalsCheck,
      schema: schemaCheck,
    },
  };

  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}

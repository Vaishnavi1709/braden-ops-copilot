// POST /api/briefing — generate (or fetch the mock fallback for) a daily
// briefing. The request body is just `{ storeId }` because the data layer
// derives everything else from the deterministic snapshot.

import { NextRequest, NextResponse } from "next/server";
import { computeSignals } from "@/lib/briefing/compute";
import { generateBriefing } from "@/lib/briefing/generate";
import { getStoreSnapshot } from "@/lib/data";

export const runtime = "nodejs";
export const maxDuration = 30;

type RequestBody = { storeId?: unknown };

function isStoreId(v: unknown): v is string {
  return typeof v === "string" && /^BRD-\d{2}$/.test(v);
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isStoreId(body.storeId)) {
    return NextResponse.json(
      { error: "Missing or invalid storeId (expected format: BRD-NN)" },
      { status: 400 }
    );
  }

  const snap = getStoreSnapshot(body.storeId);
  if (!snap) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const signals = computeSignals(snap);
  const result = await generateBriefing(signals);

  return NextResponse.json({
    storeId: snap.store.id,
    date: signals.date,
    rollups: signals.rollups,
    briefing: result.briefing,
    source: result.source,
    modelId: result.modelId,
    error: result.error,
  });
}

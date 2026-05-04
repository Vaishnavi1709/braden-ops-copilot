import { describe, expect, it } from "vitest";
import { computeSignals } from "@/lib/briefing/compute";
import { buildMockBriefing } from "@/lib/briefing/mock";
import {
  BRIEFING_TOOL_INPUT_SCHEMA,
  BriefingSchema,
} from "@/lib/briefing/types";
import { getStoreSnapshot, STORES } from "@/lib/data";

describe("mock briefing", () => {
  it("produces a Zod-valid briefing for every store", () => {
    for (const store of STORES) {
      const snap = getStoreSnapshot(store.id)!;
      const signals = computeSignals(snap);
      const briefing = buildMockBriefing(signals);
      const result = BriefingSchema.safeParse(briefing);
      if (!result.success) {
        throw new Error(
          `Mock briefing for ${store.id} failed validation: ${result.error.message}`
        );
      }
    }
  });

  it("always emits at least one action", () => {
    for (const store of STORES) {
      const snap = getStoreSnapshot(store.id)!;
      const signals = computeSignals(snap);
      const briefing = buildMockBriefing(signals);
      expect(briefing.actions.length).toBeGreaterThanOrEqual(1);
      expect(briefing.actions.length).toBeLessThanOrEqual(3);
    }
  });

  it("never references metrics that aren't in the signals", () => {
    const snap = getStoreSnapshot(STORES[0].id)!;
    const signals = computeSignals(snap);
    const briefing = buildMockBriefing(signals);
    const validMetrics = new Set([
      ...signals.positives.map((s) => s.metric),
      ...signals.negatives.map((s) => s.metric),
    ]);
    for (const w of briefing.wins) {
      if (w.metric) expect(validMetrics.has(w.metric)).toBe(true);
    }
    for (const c of briefing.concerns) {
      if (c.metric) expect(validMetrics.has(c.metric)).toBe(true);
    }
  });
});

describe("briefing tool schema", () => {
  it("declares every Zod field in the JSON Schema mirror", () => {
    const required = BRIEFING_TOOL_INPUT_SCHEMA.required;
    const zodKeys = Object.keys(BriefingSchema.shape);
    for (const key of zodKeys) expect(required).toContain(key);
  });
});

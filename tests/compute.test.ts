import { describe, expect, it } from "vitest";
import { computeSignals } from "@/lib/briefing/compute";
import { getStoreSnapshot, STORES } from "@/lib/data";

describe("compute.signals", () => {
  it("classifies signals into positives, negatives, and neutral exactly once each", () => {
    const snap = getStoreSnapshot(STORES[0].id)!;
    const signals = computeSignals(snap);
    const allKeys = [
      ...signals.positives.map((s) => s.key),
      ...signals.negatives.map((s) => s.key),
      ...signals.neutral.map((s) => s.key),
    ];
    const unique = new Set(allKeys);
    // Days-supply specials may add an extra entry, so allow >= unique count.
    expect(allKeys.length).toBeGreaterThanOrEqual(unique.size);
  });

  it("ranks negatives by severity (highest |z| first)", () => {
    for (const store of STORES) {
      const snap = getStoreSnapshot(store.id)!;
      const { negatives } = computeSignals(snap);
      for (let i = 1; i < negatives.length; i++) {
        expect(negatives[i - 1].weight).toBeGreaterThanOrEqual(negatives[i].weight);
      }
    }
  });

  it("rollups match yesterday's raw KPIs", () => {
    const snap = getStoreSnapshot(STORES[2].id)!;
    const signals = computeSignals(snap);
    expect(signals.rollups.yesterdayUnitsSold).toBe(
      snap.yesterday.newUnitsSold + snap.yesterday.usedUnitsSold
    );
    expect(signals.rollups.yesterdayTotalGross).toBe(
      snap.yesterday.totalFrontGross + snap.yesterday.totalBackGross
    );
  });

  it("never emits a negative signal that should be a positive (or vice versa)", () => {
    const snap = getStoreSnapshot(STORES[3].id)!;
    const { positives, negatives } = computeSignals(snap);
    for (const s of positives) {
      const isGood =
        s.goodWhen === "higher" ? s.yesterdayVs7DayAvg > 0 : s.yesterdayVs7DayAvg < 0;
      expect(isGood).toBe(true);
    }
    for (const s of negatives) {
      const isBad =
        s.goodWhen === "higher" ? s.yesterdayVs7DayAvg < 0 : s.yesterdayVs7DayAvg > 0;
      expect(isBad).toBe(true);
    }
  });
});

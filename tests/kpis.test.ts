import { describe, expect, it } from "vitest";
import { generateDay, generateHistory } from "@/lib/data/kpis";
import { STORES } from "@/lib/data/stores";

describe("KPI generator", () => {
  it("is deterministic — same store + date returns identical numbers", () => {
    const a = generateDay(STORES[0], "2026-05-03");
    const b = generateDay(STORES[0], "2026-05-03");
    expect(a).toEqual(b);
  });

  it("differs across stores for the same date", () => {
    const a = generateDay(STORES[0], "2026-05-03");
    const b = generateDay(STORES[1], "2026-05-03");
    expect(a).not.toEqual(b);
  });

  it("respects realistic bounds for each KPI", () => {
    for (const store of STORES) {
      const k = generateDay(store, "2026-05-03");
      expect(k.csiScore).toBeGreaterThanOrEqual(70);
      expect(k.csiScore).toBeLessThanOrEqual(100);
      expect(k.bayUtilization).toBeGreaterThanOrEqual(0.35);
      expect(k.bayUtilization).toBeLessThanOrEqual(0.99);
      expect(k.frontGrossPerUnit).toBeGreaterThan(0);
      expect(k.backGrossPerUnit).toBeGreaterThan(0);
      expect(k.webLeadsResponded15min).toBeLessThanOrEqual(k.webLeadsReceived);
      expect(k.appointmentsShown).toBeLessThanOrEqual(k.appointmentsSet);
      expect(k.roClosed).toBeLessThanOrEqual(k.roOpened);
      expect(k.agedInventoryUnits).toBeLessThanOrEqual(k.inventoryUnits);
    }
  });

  it("returns history in chronological order with the right length", () => {
    const history = generateHistory(STORES[0], "2026-05-04", 14);
    expect(history).toHaveLength(14);
    for (let i = 1; i < history.length; i++) {
      expect(history[i].date > history[i - 1].date).toBe(true);
    }
    // The most recent day should be one before "today".
    expect(history[history.length - 1].date).toBe("2026-05-03");
  });

  it("luxury stores produce higher per-unit gross than mass-market stores", () => {
    const lexus = STORES.find((s) => s.persona === "luxury")!;
    const honda = STORES.find((s) => s.id === "BRD-04")!;
    let lexAvg = 0;
    let hondaAvg = 0;
    for (let i = 1; i <= 30; i++) {
      const iso = `2026-04-${String(i).padStart(2, "0")}`;
      lexAvg += generateDay(lexus, iso).frontGrossPerUnit;
      hondaAvg += generateDay(honda, iso).frontGrossPerUnit;
    }
    expect(lexAvg / 30).toBeGreaterThan(hondaAvg / 30);
  });
});

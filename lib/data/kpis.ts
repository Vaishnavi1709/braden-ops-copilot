// Daily KPI snapshot generator. Produces 14 days of deterministic, realistic
// daily snapshots per store. The most-recent day is "yesterday" relative to
// the demo's frozen `today` so the briefing has a stable target to summarize.
//
// All randomness is seeded by (storeId, date) so the same store on the same
// date always produces the same numbers — important for screen-recordings.

import { Store } from "./stores";
import { clamp, intRound, normal, rngForKey } from "./random";

export type DailyKPIs = {
  storeId: string;
  date: string; // YYYY-MM-DD
  // Sales
  newUnitsSold: number;
  usedUnitsSold: number;
  newUnitsTarget: number;
  usedUnitsTarget: number;
  frontGrossPerUnit: number;
  backGrossPerUnit: number;
  totalFrontGross: number;
  totalBackGross: number;
  // Leads
  webLeadsReceived: number;
  webLeadsResponded15min: number;
  appointmentsSet: number;
  appointmentsShown: number;
  // Service
  roOpened: number;
  roClosed: number;
  bayUtilization: number; // 0..1
  csiScore: number; // 0..100
  serviceRevenue: number;
  // Inventory
  inventoryUnits: number;
  inventoryDaysSupply: number;
  agedInventoryUnits: number; // > 60 days on lot
  // Finance & Insurance
  fniProductsPerDeal: number;
  fniReservePerDeal: number;
};

// Demo "today" — frozen so the screen recording is stable. Update before demos
// if you want a different week to be highlighted.
export const DEMO_TODAY = "2026-05-04";

export function isoOffsetDays(iso: string, offset: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function lastNDates(today: string, n: number): string[] {
  const out: string[] = [];
  // Most-recent first; we reverse later for chronological order.
  for (let i = 1; i <= n; i++) out.push(isoOffsetDays(today, -i));
  return out.reverse();
}

// Returns a multiplier (~0.85..1.15) that varies by day-of-week and a slow
// per-store sine. Real dealerships are seasonal and weekend-heavy; without
// this the data feels too flat.
function trafficMultiplier(storeId: string, iso: string): number {
  const d = new Date(iso + "T12:00:00Z");
  const dow = d.getUTCDay(); // 0=Sun
  const dowMul = [0.6, 0.95, 1.0, 1.0, 1.0, 1.15, 1.25][dow];
  const seasonRng = rngForKey("season", storeId);
  const phase = seasonRng() * Math.PI * 2;
  const dayIdx = Math.floor(d.getTime() / (1000 * 60 * 60 * 24));
  const seasonal = 1 + 0.05 * Math.sin((dayIdx / 30) * Math.PI + phase);
  return dowMul * seasonal;
}

// Per-store, per-date "incident" — used to inject occasional dips so the
// briefing has anomalies to talk about. Probability tuned so roughly 1 in 10
// store-days has a noteworthy event.
function incident(storeId: string, iso: string): {
  leadsScale: number;
  csiHit: number;
  bayHit: number;
} {
  const r = rngForKey("incident", storeId, iso)();
  if (r < 0.05) return { leadsScale: 0.55, csiHit: -3, bayHit: -0.15 };
  if (r < 0.1) return { leadsScale: 1.35, csiHit: 0, bayHit: 0.05 };
  return { leadsScale: 1, csiHit: 0, bayHit: 0 };
}

export function generateDay(store: Store, iso: string): DailyKPIs {
  const rng = rngForKey(store.id, iso);
  const traffic = trafficMultiplier(store.id, iso);
  const inc = incident(store.id, iso);

  // Targets are the baseline scaled by day-of-week trend (no traffic incident
  // baked in — a target shouldn't fluctuate with weather).
  const newTarget = intRound(store.baseline.newUnitsPerDay * trafficMultiplier(store.id, iso) * 0.95);
  const usedTarget = intRound(store.baseline.usedUnitsPerDay * trafficMultiplier(store.id, iso) * 0.95);

  // Actuals can over- or under-shoot depending on inc + noise.
  const newSold = intRound(
    normal(rng, store.baseline.newUnitsPerDay * traffic, store.baseline.newUnitsPerDay * 0.18)
  );
  const usedSold = intRound(
    normal(rng, store.baseline.usedUnitsPerDay * traffic, store.baseline.usedUnitsPerDay * 0.2)
  );

  const frontGross = clamp(
    normal(rng, store.baseline.frontGross, store.baseline.frontGross * 0.07),
    store.baseline.frontGross * 0.6,
    store.baseline.frontGross * 1.4
  );
  const backGross = clamp(
    normal(rng, store.baseline.backGross, store.baseline.backGross * 0.06),
    store.baseline.backGross * 0.7,
    store.baseline.backGross * 1.3
  );
  const totalUnits = newSold + usedSold;
  const totalFrontGross = totalUnits * frontGross;
  const totalBackGross = totalUnits * backGross;

  const leads = intRound(store.baseline.webLeadsPerDay * traffic * inc.leadsScale + normal(rng, 0, 3));
  const responded15 = intRound(leads * clamp(normal(rng, 0.78, 0.07), 0.4, 0.98));
  const appointmentsSet = intRound(leads * clamp(normal(rng, 0.42, 0.06), 0.2, 0.7));
  const appointmentsShown = intRound(appointmentsSet * clamp(normal(rng, 0.66, 0.05), 0.4, 0.9));

  const roOpened = intRound(store.baseline.roPerDay * traffic + normal(rng, 0, 4));
  const roClosed = intRound(roOpened * clamp(normal(rng, 0.92, 0.04), 0.7, 1.0));
  const bayUtilization = clamp(
    normal(rng, store.persona === "service-heavy" ? 0.84 : 0.74, 0.06) + inc.bayHit,
    0.35,
    0.99
  );
  const csiScore = clamp(normal(rng, store.baseline.csi, 1.5) + inc.csiHit, 70, 100);
  const serviceRevenue = roClosed * clamp(normal(rng, 412, 60), 250, 800);

  // Inventory drifts day-over-day; we use a separate seed independent of the
  // day-of-week noise so it shows a slow trend in summary views.
  const invSeed = rngForKey("inv", store.id, iso)();
  const dayIdx = Math.floor(new Date(iso + "T12:00:00Z").getTime() / (1000 * 60 * 60 * 24));
  const drift = Math.sin(dayIdx / 21 + invSeed * Math.PI) * 18;
  const baseInv = store.baseline.newUnitsPerDay * 28 + store.baseline.usedUnitsPerDay * 22;
  const inventoryUnits = intRound(baseInv + drift);
  const totalDailyVelocity = Math.max(1, store.baseline.newUnitsPerDay + store.baseline.usedUnitsPerDay);
  const inventoryDaysSupply = Math.round(inventoryUnits / totalDailyVelocity);
  const agedInventoryUnits = intRound(
    inventoryUnits * clamp(normal(rng, 0.18, 0.04), 0.05, 0.4)
  );

  const fniProductsPerDeal = clamp(
    normal(rng, store.persona === "luxury" ? 1.6 : 1.85, 0.15),
    0.6,
    3.2
  );
  const fniReservePerDeal = clamp(
    normal(rng, store.persona === "luxury" ? 720 : 580, 90),
    150,
    1200
  );

  return {
    storeId: store.id,
    date: iso,
    newUnitsSold: newSold,
    usedUnitsSold: usedSold,
    newUnitsTarget: newTarget,
    usedUnitsTarget: usedTarget,
    frontGrossPerUnit: Math.round(frontGross),
    backGrossPerUnit: Math.round(backGross),
    totalFrontGross: Math.round(totalFrontGross),
    totalBackGross: Math.round(totalBackGross),
    webLeadsReceived: leads,
    webLeadsResponded15min: responded15,
    appointmentsSet,
    appointmentsShown,
    roOpened,
    roClosed,
    bayUtilization: Number(bayUtilization.toFixed(3)),
    csiScore: Number(csiScore.toFixed(1)),
    serviceRevenue: Math.round(serviceRevenue),
    inventoryUnits,
    inventoryDaysSupply,
    agedInventoryUnits,
    fniProductsPerDeal: Number(fniProductsPerDeal.toFixed(2)),
    fniReservePerDeal: Math.round(fniReservePerDeal),
  };
}

export function generateHistory(store: Store, today: string, days: number): DailyKPIs[] {
  return lastNDates(today, days).map((iso) => generateDay(store, iso));
}

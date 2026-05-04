// Pure functions that turn a StoreSnapshot into a "signals" bundle — the
// ranked, structured set of facts the prompt builder feeds to Claude.
//
// Keeping the math here (instead of in the prompt) means:
//   1. We can unit-test the analytics independently of the LLM.
//   2. Claude's job is purely *narration*, not arithmetic — which is where
//      LLMs are unreliable.
//   3. The mock fallback can produce a plausible briefing without an API key
//      by reading the same signals.

import { DailyKPIs, Store, StoreSnapshot } from "../data";

export type Direction = "up" | "down" | "flat";

export type Signal = {
  metric: string; // human-readable
  key: string; // stable id
  value: number;
  unit: "currency" | "count" | "percent" | "score" | "ratio";
  formatted: string; // pre-formatted for prompt
  yesterdayVs7DayAvg: number; // signed delta vs 7-day mean
  pctVs7DayAvg: number; // signed % delta vs 7-day mean
  zScore: number; // (yesterday - 7d mean) / 7d stddev
  direction: Direction;
  goodWhen: "higher" | "lower";
  // Severity-ish weight (0..1) meant for ranking. Magnitude * goodness sign.
  weight: number;
  // Free-text human-readable note the prompt and mock both reuse.
  note: string;
};

export type Signals = {
  store: Store;
  date: string;
  positives: Signal[]; // ranked, highest weight first
  negatives: Signal[]; // ranked, highest severity first
  neutral: Signal[];
  // Pre-computed totals that show up everywhere in the UI/prompt.
  rollups: {
    yesterdayUnitsSold: number;
    yesterdayUnitsTarget: number;
    yesterdayTotalGross: number;
    leadResponseRate: number;
    appointmentShowRate: number;
  };
};

const EPS = 1e-9;

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stddev(xs: number[], mu: number): number {
  if (xs.length < 2) return 0;
  const v = xs.reduce((acc, x) => acc + (x - mu) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

function pct(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return numerator / denominator;
}

function safePctChange(current: number, baseline: number): number {
  if (Math.abs(baseline) < EPS) return 0;
  return (current - baseline) / Math.abs(baseline);
}

const FMT_USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const FMT_PCT = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

function formatSignal(unit: Signal["unit"], value: number): string {
  if (unit === "currency") return FMT_USD.format(value);
  if (unit === "percent" || unit === "ratio") return FMT_PCT.format(value);
  if (unit === "score") return value.toFixed(1);
  return Math.round(value).toLocaleString("en-US");
}

type DerivedExtractor = {
  metric: string;
  key: string;
  unit: Signal["unit"];
  goodWhen: "higher" | "lower";
  pick: (k: DailyKPIs) => number;
};

// The set of metrics the briefing engine evaluates. The "compute everything,
// rank later" approach means adding a new metric is one entry — no fanout
// changes elsewhere.
const EXTRACTORS: DerivedExtractor[] = [
  {
    metric: "Total units sold",
    key: "totalUnits",
    unit: "count",
    goodWhen: "higher",
    pick: (k) => k.newUnitsSold + k.usedUnitsSold,
  },
  {
    metric: "Total gross",
    key: "totalGross",
    unit: "currency",
    goodWhen: "higher",
    pick: (k) => k.totalFrontGross + k.totalBackGross,
  },
  {
    metric: "Front gross / unit",
    key: "frontGross",
    unit: "currency",
    goodWhen: "higher",
    pick: (k) => k.frontGrossPerUnit,
  },
  {
    metric: "F&I product penetration",
    key: "fniProducts",
    unit: "score",
    goodWhen: "higher",
    pick: (k) => k.fniProductsPerDeal,
  },
  {
    metric: "Web leads received",
    key: "leads",
    unit: "count",
    goodWhen: "higher",
    pick: (k) => k.webLeadsReceived,
  },
  {
    metric: "15-min lead response rate",
    key: "leadResponse15",
    unit: "ratio",
    goodWhen: "higher",
    pick: (k) => pct(k.webLeadsResponded15min, k.webLeadsReceived),
  },
  {
    metric: "Appointment show rate",
    key: "showRate",
    unit: "ratio",
    goodWhen: "higher",
    pick: (k) => pct(k.appointmentsShown, k.appointmentsSet),
  },
  {
    metric: "Service ROs closed",
    key: "roClosed",
    unit: "count",
    goodWhen: "higher",
    pick: (k) => k.roClosed,
  },
  {
    metric: "Bay utilization",
    key: "bayUtilization",
    unit: "ratio",
    goodWhen: "higher",
    pick: (k) => k.bayUtilization,
  },
  {
    metric: "CSI score",
    key: "csi",
    unit: "score",
    goodWhen: "higher",
    pick: (k) => k.csiScore,
  },
  {
    metric: "Aged inventory share",
    key: "agedInventoryShare",
    unit: "ratio",
    goodWhen: "lower",
    pick: (k) => pct(k.agedInventoryUnits, k.inventoryUnits),
  },
  {
    metric: "Days supply",
    key: "daysSupply",
    unit: "count",
    // Outside a healthy band (45–75) is bad on either side; we fold this into
    // a custom signal below rather than ranking the raw metric.
    goodWhen: "higher",
    pick: (k) => k.inventoryDaysSupply,
  },
];

// Threshold weights — tuned so a 1.5σ swing is a "real" signal worth ranking.
// Magnitudes below this don't make it into the briefing's top-ranked lists.
const SIGNAL_GATE_Z = 0.9;

export function computeSignals(snap: StoreSnapshot): Signals {
  const { store, yesterday, history } = snap;
  const baselineWindow = history.slice(-8, -1); // last 7 days *before* yesterday

  const positives: Signal[] = [];
  const negatives: Signal[] = [];
  const neutral: Signal[] = [];

  for (const ext of EXTRACTORS) {
    const value = ext.pick(yesterday);
    const baseline = baselineWindow.map(ext.pick);
    const mu = mean(baseline);
    const sigma = stddev(baseline, mu);
    const delta = value - mu;
    const pctDelta = safePctChange(value, mu);
    const z = sigma > EPS ? delta / sigma : 0;

    const direction: Direction =
      Math.abs(z) < 0.25 ? "flat" : delta > 0 ? "up" : "down";
    const isGood =
      ext.goodWhen === "higher" ? delta > 0 : delta < 0;
    const weight = Math.min(1, Math.abs(z) / 3);

    const formatted = formatSignal(ext.unit, value);
    const note = buildNote(ext, value, mu, pctDelta, z);

    const signal: Signal = {
      metric: ext.metric,
      key: ext.key,
      value,
      unit: ext.unit,
      formatted,
      yesterdayVs7DayAvg: delta,
      pctVs7DayAvg: pctDelta,
      zScore: z,
      direction,
      goodWhen: ext.goodWhen,
      weight,
      note,
    };

    if (Math.abs(z) < SIGNAL_GATE_Z) {
      neutral.push(signal);
    } else if (isGood) {
      positives.push(signal);
    } else {
      negatives.push(signal);
    }
  }

  // Days-supply is band-tested not "more is better" — call it out specially.
  // We push these and re-sort below, so they end up ranked by weight like
  // every other negative signal.
  const ds = yesterday.inventoryDaysSupply;
  if (ds > 80) {
    negatives.push({
      metric: "Days supply",
      key: "daysSupplyHigh",
      value: ds,
      unit: "count",
      formatted: `${ds} days`,
      yesterdayVs7DayAvg: ds - 60,
      pctVs7DayAvg: (ds - 60) / 60,
      zScore: 2,
      direction: "up",
      goodWhen: "lower",
      weight: 0.85,
      note: `Days supply is ${ds} — above the healthy 45–75 band, capital is sitting on the lot.`,
    });
  } else if (ds < 35) {
    negatives.push({
      metric: "Days supply",
      key: "daysSupplyLow",
      value: ds,
      unit: "count",
      formatted: `${ds} days`,
      yesterdayVs7DayAvg: ds - 60,
      pctVs7DayAvg: (ds - 60) / 60,
      zScore: -2,
      direction: "down",
      goodWhen: "higher",
      weight: 0.8,
      note: `Days supply is ${ds} — thin inventory, expect lost sales and pressure on used.`,
    });
  }

  positives.sort((a, b) => b.weight - a.weight);
  negatives.sort((a, b) => b.weight - a.weight);

  const rollups = {
    yesterdayUnitsSold: yesterday.newUnitsSold + yesterday.usedUnitsSold,
    yesterdayUnitsTarget: yesterday.newUnitsTarget + yesterday.usedUnitsTarget,
    yesterdayTotalGross: yesterday.totalFrontGross + yesterday.totalBackGross,
    leadResponseRate: pct(yesterday.webLeadsResponded15min, yesterday.webLeadsReceived),
    appointmentShowRate: pct(yesterday.appointmentsShown, yesterday.appointmentsSet),
  };

  return {
    store,
    date: yesterday.date,
    positives,
    negatives,
    neutral,
    rollups,
  };
}

function buildNote(
  ext: DerivedExtractor,
  value: number,
  baseline: number,
  pctDelta: number,
  z: number
): string {
  const dir = pctDelta > 0 ? "above" : pctDelta < 0 ? "below" : "in line with";
  const pctText = FMT_PCT.format(Math.abs(pctDelta));
  const valText = formatSignal(ext.unit, value);
  const baseText = formatSignal(ext.unit, baseline);
  const zText = `(${z >= 0 ? "+" : ""}${z.toFixed(1)}σ)`;
  return `${ext.metric}: ${valText}, ${pctText} ${dir} 7-day avg of ${baseText} ${zText}`;
}

// Concise multi-line digest for the prompt — Claude gets ranked, formatted
// signals rather than raw numbers it would have to recompute.
export function signalsToPromptLines(signals: Signals): string {
  const lines: string[] = [];
  if (signals.positives.length) {
    lines.push("POSITIVE SIGNALS (ranked by magnitude):");
    for (const s of signals.positives) lines.push(`  - ${s.note}`);
  }
  if (signals.negatives.length) {
    lines.push("NEGATIVE SIGNALS (ranked by severity):");
    for (const s of signals.negatives) lines.push(`  - ${s.note}`);
  }
  if (!signals.positives.length && !signals.negatives.length) {
    lines.push("No metrics moved by more than 0.9σ vs the 7-day baseline.");
  }
  return lines.join("\n");
}

// Deterministic templated briefing generator. Used when no ANTHROPIC_API_KEY
// is configured (so the demo can be screen-recorded without exposing a key)
// AND as the fallback when a Claude call fails or its output fails Zod
// validation.
//
// Reads the same Signals the LLM does, so the structure of the briefing is
// always honest about what's actually in the data — nothing fabricated.

import { Briefing, Concern, Win, Action } from "./types";
import { Signal, Signals } from "./compute";
import { fmt } from "../format";

const OWNER_BY_KEY: Record<string, Action["owner"]> = {
  totalUnits: "Sales Manager",
  totalGross: "GM",
  frontGross: "Sales Manager",
  fniProducts: "F&I Manager",
  leads: "BDC Lead",
  leadResponse15: "BDC Lead",
  showRate: "BDC Lead",
  roClosed: "Service Manager",
  bayUtilization: "Service Manager",
  csi: "Service Manager",
  agedInventoryShare: "Inventory Manager",
  daysSupplyHigh: "Inventory Manager",
  daysSupplyLow: "Inventory Manager",
};

function severityFromSignal(s: Signal): Concern["severity"] {
  const z = Math.abs(s.zScore);
  if (z >= 2) return "high";
  if (z >= 1.4) return "medium";
  return "low";
}

function impactFromSignal(s: Signal): string {
  const dollarish = s.unit === "currency";
  if (dollarish && Math.abs(s.yesterdayVs7DayAvg) > 1000) {
    return `~${fmt.money(Math.abs(s.yesterdayVs7DayAvg))} per day at stake`;
  }
  if (s.unit === "ratio" || s.unit === "percent") {
    return `${fmt.signedPct(s.pctVs7DayAvg)} on ${s.metric.toLowerCase()}`;
  }
  return `${fmt.signedPct(s.pctVs7DayAvg)} vs 7-day baseline`;
}

function actionForConcern(s: Signal): Action {
  const owner = OWNER_BY_KEY[s.key] ?? "GM";
  switch (s.key) {
    case "leadResponse15":
      return {
        title: "Run a 1-hour BDC sprint on yesterday's missed leads",
        why: `15-minute response rate dropped to ${s.formatted}. Same-day touches close 3x more often than next-day ones.`,
        owner,
        estimatedImpact: impactFromSignal(s),
      };
    case "showRate":
      return {
        title: "Confirm today's appointments by 10am with a personal text",
        why: `Show rate is running ${fmt.signedPct(s.pctVs7DayAvg)} vs baseline — confirmations recover roughly half of the gap.`,
        owner,
        estimatedImpact: impactFromSignal(s),
      };
    case "csi":
      return {
        title: "Review yesterday's service surveys with the advisor team",
        why: `CSI dipped to ${s.formatted}; even one bad day pulls the rolling score and hurts manufacturer incentives.`,
        owner,
        estimatedImpact: impactFromSignal(s),
      };
    case "bayUtilization":
      return {
        title: "Re-stack today's RO board to fill the open bays",
        why: `Bay utilization fell to ${s.formatted}. Pull waiters and quick-services forward to recover capacity.`,
        owner,
        estimatedImpact: impactFromSignal(s),
      };
    case "agedInventoryShare":
    case "daysSupplyHigh":
      return {
        title: "Pull aged inventory list and price-adjust top 5 today",
        why: s.note,
        owner: "Inventory Manager",
        estimatedImpact: impactFromSignal(s),
      };
    case "daysSupplyLow":
      return {
        title: "Push trade-in offers in BDC outreach to refill front line",
        why: s.note,
        owner: "Inventory Manager",
        estimatedImpact: impactFromSignal(s),
      };
    case "fniProducts":
      return {
        title: "Coach F&I on menu presentation for today's deliveries",
        why: `Products-per-deal at ${s.formatted} is below baseline — a single product recovery is worth ${fmt.money(450)} per deal.`,
        owner,
        estimatedImpact: impactFromSignal(s),
      };
    case "totalUnits":
      return {
        title: "Re-prioritize the desk: focus on top-3 deals to save",
        why: `Units came in soft at ${s.formatted}. Concentrate management touches where they move the deal today.`,
        owner,
        estimatedImpact: impactFromSignal(s),
      };
    default:
      return {
        title: `Address ${s.metric.toLowerCase()} dip`,
        why: s.note,
        owner,
        estimatedImpact: impactFromSignal(s),
      };
  }
}

export function buildMockBriefing(signals: Signals): Briefing {
  const { store, positives, negatives, rollups } = signals;

  const unitsDelta = rollups.yesterdayUnitsTarget
    ? (rollups.yesterdayUnitsSold - rollups.yesterdayUnitsTarget) / rollups.yesterdayUnitsTarget
    : 0;
  const onTarget = unitsDelta >= -0.05;

  const headline = (() => {
    if (negatives.length === 0 && positives.length > 0) {
      return `Solid day — ${positives[0].metric.toLowerCase()} led the win`;
    }
    if (negatives.length > 0 && negatives[0].zScore < -1.6) {
      return `Pressure point: ${negatives[0].metric.toLowerCase()} needs attention`;
    }
    if (onTarget) return `On pace — small fixes available today`;
    return `Behind plan — focus on ${negatives[0]?.metric.toLowerCase() ?? "lead response"}`;
  })();

  const summary = (() => {
    const parts: string[] = [];
    parts.push(
      `${store.name} ${onTarget ? "hit" : "trailed"} target with ${fmt.int(
        rollups.yesterdayUnitsSold
      )} units${
        rollups.yesterdayUnitsTarget
          ? ` against a goal of ${fmt.int(rollups.yesterdayUnitsTarget)}`
          : ""
      } and ${fmt.money(rollups.yesterdayTotalGross)} total gross.`
    );
    if (positives[0]) parts.push(`Bright spot: ${positives[0].note}.`);
    if (negatives[0]) parts.push(`Watch: ${negatives[0].note}.`);
    return parts.join(" ");
  })();

  const wins: Win[] = positives.slice(0, 3).map((s) => ({
    title: `${s.metric} up ${fmt.signedPct(s.pctVs7DayAvg)}`,
    detail: s.note,
    metric: s.metric,
  }));

  const concerns: Concern[] = negatives.slice(0, 3).map((s) => ({
    title: `${s.metric} ${s.direction === "down" ? "soft" : "elevated"}`,
    detail: s.note,
    severity: severityFromSignal(s),
    metric: s.metric,
  }));

  const actions: Action[] = (() => {
    const seen = new Set<string>();
    const out: Action[] = [];
    for (const s of negatives) {
      const a = actionForConcern(s);
      if (seen.has(a.title)) continue;
      seen.add(a.title);
      out.push(a);
      if (out.length === 3) break;
    }
    if (out.length === 0) {
      out.push({
        title: "Walk the lot at 10am to confirm staffing matches today's pace",
        why: "No anomalies surfaced overnight — use the steady morning to refine deal flow before mid-day rush.",
        owner: "GM",
        estimatedImpact: "Operational hygiene; prevents afternoon bottlenecks",
      });
    }
    return out;
  })();

  return { headline, summary, wins, concerns, actions };
}

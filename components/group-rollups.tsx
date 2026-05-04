import { fmt } from "@/lib/format";
import { StoreSnapshot } from "@/lib/data";
import { KpiTile } from "./kpi-tile";

export function GroupRollups({ snapshots }: { snapshots: StoreSnapshot[] }) {
  const today = snapshots.map((s) => s.yesterday);

  const totalUnits = sum(today.map((d) => d.newUnitsSold + d.usedUnitsSold));
  const totalTarget = sum(today.map((d) => d.newUnitsTarget + d.usedUnitsTarget));
  const totalGross = sum(today.map((d) => d.totalFrontGross + d.totalBackGross));
  const groupCsi = avg(today.map((d) => d.csiScore));
  const leadResponseRate = ratio(
    sum(today.map((d) => d.webLeadsResponded15min)),
    sum(today.map((d) => d.webLeadsReceived))
  );
  const showRate = ratio(
    sum(today.map((d) => d.appointmentsShown)),
    sum(today.map((d) => d.appointmentsSet))
  );

  // 7-day group trends, ending yesterday — show direction at a glance.
  const grossTrend = trendForGroup(snapshots, (k) => k.totalFrontGross + k.totalBackGross);
  const unitsTrend = trendForGroup(snapshots, (k) => k.newUnitsSold + k.usedUnitsSold);
  const csiTrend = avgTrendForGroup(snapshots, (k) => k.csiScore);
  const leadTrend = ratioTrendForGroup(
    snapshots,
    (k) => k.webLeadsResponded15min,
    (k) => k.webLeadsReceived
  );

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <KpiTile
        label="Yesterday units"
        value={fmt.int(totalUnits)}
        delta={
          totalTarget > 0
            ? fmt.signedPct((totalUnits - totalTarget) / totalTarget)
            : undefined
        }
        tone={totalUnits >= totalTarget ? "positive" : "warning"}
        trend={unitsTrend}
        hint={`Target ${fmt.int(totalTarget)} across ${snapshots.length} stores`}
      />
      <KpiTile
        label="Yesterday total gross"
        value={fmt.money(totalGross)}
        trend={grossTrend}
        tone="accent"
        hint="Front + back combined"
      />
      <KpiTile
        label="Group 15-min lead response"
        value={fmt.pct(leadResponseRate)}
        tone={leadResponseRate >= 0.75 ? "positive" : leadResponseRate >= 0.6 ? "warning" : "negative"}
        trend={leadTrend.map((r) => Math.round(r * 1000))}
        hint="Industry benchmark: 80%+"
      />
      <KpiTile
        label="Group CSI (avg)"
        value={groupCsi.toFixed(1)}
        tone={groupCsi >= 90 ? "positive" : groupCsi >= 86 ? "warning" : "negative"}
        trend={csiTrend}
        hint={`Show rate ${fmt.pct(showRate)}`}
      />
    </section>
  );
}

function sum(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0);
}
function avg(xs: number[]) {
  return xs.length ? sum(xs) / xs.length : 0;
}
function ratio(num: number, den: number) {
  return den > 0 ? num / den : 0;
}

function trendForGroup(
  snapshots: StoreSnapshot[],
  pick: (k: StoreSnapshot["yesterday"]) => number
): number[] {
  const days = snapshots[0]?.history.length ?? 0;
  const out: number[] = [];
  const start = Math.max(0, days - 7);
  for (let i = start; i < days; i++) {
    let day = 0;
    for (const s of snapshots) {
      const k = s.history[i];
      if (k) day += pick(k);
    }
    out.push(day);
  }
  return out;
}

function avgTrendForGroup(
  snapshots: StoreSnapshot[],
  pick: (k: StoreSnapshot["yesterday"]) => number
): number[] {
  const days = snapshots[0]?.history.length ?? 0;
  const out: number[] = [];
  const start = Math.max(0, days - 7);
  for (let i = start; i < days; i++) {
    let total = 0;
    let n = 0;
    for (const s of snapshots) {
      const k = s.history[i];
      if (k) {
        total += pick(k);
        n += 1;
      }
    }
    out.push(n > 0 ? total / n : 0);
  }
  return out;
}

function ratioTrendForGroup(
  snapshots: StoreSnapshot[],
  num: (k: StoreSnapshot["yesterday"]) => number,
  den: (k: StoreSnapshot["yesterday"]) => number
): number[] {
  const days = snapshots[0]?.history.length ?? 0;
  const out: number[] = [];
  const start = Math.max(0, days - 7);
  for (let i = start; i < days; i++) {
    let n = 0;
    let d = 0;
    for (const s of snapshots) {
      const k = s.history[i];
      if (k) {
        n += num(k);
        d += den(k);
      }
    }
    out.push(d > 0 ? n / d : 0);
  }
  return out;
}

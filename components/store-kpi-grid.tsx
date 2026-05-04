// Sidebar KPI grid for the store/briefing detail page.
// Shows the same metrics the briefing engine ranked, so a reader can verify
// what the AI is referencing.

import { fmt } from "@/lib/format";
import { StoreSnapshot } from "@/lib/data";
import { KpiTile } from "./kpi-tile";

export function StoreKpiGrid({ snapshot }: { snapshot: StoreSnapshot }) {
  const { yesterday, history } = snapshot;

  const series = (pick: (k: typeof yesterday) => number) => history.slice(-7).map(pick);

  const unitsActual = yesterday.newUnitsSold + yesterday.usedUnitsSold;
  const unitsTarget = yesterday.newUnitsTarget + yesterday.usedUnitsTarget;
  const unitsDeltaPct =
    unitsTarget > 0 ? (unitsActual - unitsTarget) / unitsTarget : 0;
  const leadResponseRate =
    yesterday.webLeadsReceived > 0
      ? yesterday.webLeadsResponded15min / yesterday.webLeadsReceived
      : 0;
  const showRate =
    yesterday.appointmentsSet > 0
      ? yesterday.appointmentsShown / yesterday.appointmentsSet
      : 0;
  const agedShare =
    yesterday.inventoryUnits > 0
      ? yesterday.agedInventoryUnits / yesterday.inventoryUnits
      : 0;

  return (
    <div className="grid grid-cols-2 gap-3">
      <KpiTile
        label="Units sold"
        value={fmt.int(unitsActual)}
        delta={`${fmt.signedPct(unitsDeltaPct)} vs target`}
        tone={unitsDeltaPct >= 0 ? "positive" : unitsDeltaPct >= -0.1 ? "warning" : "negative"}
        trend={series((k) => k.newUnitsSold + k.usedUnitsSold)}
        hint={`Target ${fmt.int(unitsTarget)} (new+used)`}
      />
      <KpiTile
        label="Total gross"
        value={fmt.money(yesterday.totalFrontGross + yesterday.totalBackGross)}
        trend={series((k) => k.totalFrontGross + k.totalBackGross)}
        tone="accent"
        hint={`F: ${fmt.money(yesterday.totalFrontGross)} · B: ${fmt.money(yesterday.totalBackGross)}`}
      />
      <KpiTile
        label="15-min lead response"
        value={fmt.pct(leadResponseRate)}
        tone={leadResponseRate >= 0.8 ? "positive" : leadResponseRate >= 0.6 ? "warning" : "negative"}
        trend={series((k) =>
          k.webLeadsReceived > 0 ? Math.round((k.webLeadsResponded15min / k.webLeadsReceived) * 1000) : 0
        )}
        hint={`${fmt.int(yesterday.webLeadsResponded15min)} of ${fmt.int(yesterday.webLeadsReceived)} leads`}
      />
      <KpiTile
        label="Appt show rate"
        value={fmt.pct(showRate)}
        tone={showRate >= 0.7 ? "positive" : showRate >= 0.55 ? "warning" : "negative"}
        trend={series((k) =>
          k.appointmentsSet > 0 ? Math.round((k.appointmentsShown / k.appointmentsSet) * 1000) : 0
        )}
        hint={`${fmt.int(yesterday.appointmentsShown)} of ${fmt.int(yesterday.appointmentsSet)} kept`}
      />
      <KpiTile
        label="Service ROs closed"
        value={fmt.int(yesterday.roClosed)}
        trend={series((k) => k.roClosed)}
        tone="neutral"
        hint={`${fmt.pct(yesterday.bayUtilization)} bay utilization`}
      />
      <KpiTile
        label="CSI"
        value={yesterday.csiScore.toFixed(1)}
        trend={series((k) => k.csiScore)}
        tone={yesterday.csiScore >= 90 ? "positive" : yesterday.csiScore >= 86 ? "warning" : "negative"}
        hint="Customer satisfaction (rolling)"
      />
      <KpiTile
        label="Aged inventory"
        value={fmt.pct(agedShare)}
        delta={`${fmt.int(yesterday.agedInventoryUnits)} units`}
        tone={agedShare <= 0.2 ? "positive" : agedShare <= 0.3 ? "warning" : "negative"}
        trend={series((k) =>
          k.inventoryUnits > 0 ? Math.round((k.agedInventoryUnits / k.inventoryUnits) * 1000) : 0
        )}
        hint={`> 60 days on lot (${fmt.int(yesterday.inventoryUnits)} total)`}
      />
      <KpiTile
        label="F&I per deal"
        value={yesterday.fniProductsPerDeal.toFixed(2)}
        trend={series((k) => k.fniProductsPerDeal)}
        tone={yesterday.fniProductsPerDeal >= 1.7 ? "positive" : "warning"}
        hint={`Reserve ${fmt.money(yesterday.fniReservePerDeal)}/deal`}
      />
    </div>
  );
}

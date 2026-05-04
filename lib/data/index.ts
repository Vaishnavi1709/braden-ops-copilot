// Single entry point for the demo dataset. The rest of the app reads from
// here so a future swap to a real DMS / data warehouse is one file change.

import { DailyKPIs, DEMO_TODAY, generateDay, generateHistory, isoOffsetDays } from "./kpis";
import { Store, STORES, findStore } from "./stores";

export type StoreSnapshot = {
  store: Store;
  yesterday: DailyKPIs;
  history: DailyKPIs[]; // 14 days, chronological, ending yesterday
};

export function getStoreSnapshot(storeId: string, today: string = DEMO_TODAY): StoreSnapshot | null {
  const store = findStore(storeId);
  if (!store) return null;
  const history = generateHistory(store, today, 14);
  const yesterday = history[history.length - 1];
  return { store, yesterday, history };
}

export function getAllSnapshots(today: string = DEMO_TODAY): StoreSnapshot[] {
  return STORES.map((s) => {
    const history = generateHistory(s, today, 14);
    return { store: s, yesterday: history[history.length - 1], history };
  });
}

export { DEMO_TODAY, generateDay, isoOffsetDays, STORES, findStore };
export type { DailyKPIs, Store };

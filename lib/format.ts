// Tabular-friendly formatters used across the dashboard.
// All formatters are stable across SSR/client (no locale drift) by pinning to en-US.

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const usdPrecise = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const intFmt = new Intl.NumberFormat("en-US");

const pctFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
});

const signedPctFmt = new Intl.NumberFormat("en-US", {
  style: "percent",
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

export const fmt = {
  money: (n: number) => usd.format(n),
  moneyPrecise: (n: number) => usdPrecise.format(n),
  int: (n: number) => intFmt.format(n),
  pct: (n: number) => pctFmt.format(n),
  signedPct: (n: number) => signedPctFmt.format(n),
  delta: (n: number) => {
    if (n > 0) return `+${intFmt.format(n)}`;
    return intFmt.format(n);
  },
  date: (iso: string) => {
    const d = new Date(iso + "T12:00:00Z");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  },
  shortDate: (iso: string) => {
    const d = new Date(iso + "T12:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  },
};

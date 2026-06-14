/** Selectable chart ranges for the ETF watchlist, mapped to Yahoo params. */
export const RANGES = ["1D", "1W", "1M", "3M", "1Y", "5Y", "10Y"] as const;
export type Range = (typeof RANGES)[number];

export const RANGE_MAP: Record<Range, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  "1Y": { range: "1y", interval: "1d" },
  "5Y": { range: "5y", interval: "1wk" },
  "10Y": { range: "10y", interval: "1mo" },
};

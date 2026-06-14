import type { Quote } from "@/lib/types";

/** General ETF market watchlist (account-agnostic — no personal holdings). */
export const WATCHLIST = [
  "CALL.TO",
  "HDIV.TO",
  "HHIC.TO",
  "HPYE.TO",
  "HYLD.TO",
  "PLTE.TO",
  "QQQY.TO",
] as const;

/** Drop the exchange suffix for display, e.g. "CALL.TO" -> "CALL". */
export function displayTicker(t: string): string {
  return t.replace(/\.(TO|V|NE)$/i, "");
}

export type BuySignal = "buy" | "neutral" | "pricey";

/**
 * Deterministic "is it a good day to buy?" hint from today's move plus where the
 * price sits vs. its ~30-day average. Not financial advice — a glanceable cue.
 */
export function buySignal(q: Quote): { signal: BuySignal; label: string } {
  const avg = q.history.length
    ? q.history.reduce((a, b) => a + b, 0) / q.history.length
    : q.price;
  const vsAvg = avg ? (q.price - avg) / avg : 0;
  if (q.dayChangePct <= -1.5 || vsAvg <= -0.03)
    return { signal: "buy", label: "Good entry" };
  if (q.dayChangePct >= 2 && vsAvg >= 0.03)
    return { signal: "pricey", label: "Pricey" };
  return { signal: "neutral", label: "Fair value" };
}

export function marketSummary(quotes: Quote[]) {
  const total = quotes.length;
  const up = quotes.filter((q) => q.dayChangePct > 0).length;
  const avgChange = total
    ? quotes.reduce((a, q) => a + q.dayChangePct, 0) / total
    : 0;
  const top = [...quotes].sort((a, b) => b.dayChangePct - a.dayChangePct)[0];
  return { up, down: total - up, total, avgChange, top };
}

import type { Quote } from "@/lib/types";
import { RANGE_MAP, type Range } from "@/lib/ranges";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** Convert a Yahoo Finance `chart` API response into a normalized Quote. */
export function normalizeYahoo(ticker: string, json: any): Quote {
  const r = json?.chart?.result?.[0];
  const price = r?.meta?.regularMarketPrice ?? 0;
  const prevClose = r?.meta?.chartPreviousClose ?? price;
  const history: number[] = (r?.indicators?.quote?.[0]?.close ?? []).filter(
    (x: unknown): x is number => typeof x === "number",
  );
  const dayChangePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
  return { ticker, price, prevClose, dayChangePct, history };
}

export function classifyMove(
  pct: number,
  boomPct: number,
  lowPct: number,
): "boom" | "low" | "flat" {
  if (pct >= boomPct) return "boom";
  if (pct <= lowPct) return "low";
  return "flat";
}

export type RangeSeries = { ticker: string; closes: number[]; changePct: number };

/** Fetch a ticker's price history for a range (closes + % change). Server-side. */
export async function fetchHistory(
  ticker: string,
  range: Range,
): Promise<RangeSeries> {
  const { range: r, interval } = RANGE_MAP[range] ?? RANGE_MAP["1M"];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker,
  )}?range=${r}&interval=${interval}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`history ${ticker} failed: ${res.status}`);
  const json: any = await res.json();
  const result = json?.chart?.result?.[0];
  const closes: number[] = (result?.indicators?.quote?.[0]?.close ?? []).filter(
    (x: unknown): x is number => typeof x === "number",
  );
  const first = closes[0] ?? 0;
  const last = closes[closes.length - 1] ?? first;
  // For 1D, baseline off the previous close so it matches "today".
  const baseline =
    range === "1D" ? (result?.meta?.chartPreviousClose ?? first) : first;
  const changePct = baseline ? ((last - baseline) / baseline) * 100 : 0;
  return { ticker, closes, changePct };
}

/** Fetch a single ticker quote from Yahoo Finance (keyless). Server-side only. */
export async function fetchQuote(ticker: string): Promise<Quote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker,
  )}?range=1mo&interval=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    // Avoid Next caching stale prices.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`quote ${ticker} failed: ${res.status}`);
  return normalizeYahoo(ticker, await res.json());
}

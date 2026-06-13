import type { Quote } from "@/lib/types";

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

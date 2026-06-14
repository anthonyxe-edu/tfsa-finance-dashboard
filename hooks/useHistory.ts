"use client";
import { useEffect, useState } from "react";
import type { Range } from "@/lib/ranges";

export type Series = { closes: number[]; changePct: number };

/** Fetch range history (closes + % change) for a set of tickers. */
export function useHistory(tickers: string[], range: Range) {
  const [series, setSeries] = useState<Record<string, Series>>({});
  const [loading, setLoading] = useState(false);
  const key = [...tickers].sort().join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/history?tickers=${encodeURIComponent(key)}&range=${range}`)
      .then((r) => r.json())
      .then((d: { series?: Record<string, Series> }) => {
        if (!cancelled && d.series) setSeries(d.series);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key, range]);

  return { series, loading };
}

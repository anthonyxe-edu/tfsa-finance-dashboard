"use client";
import { useEffect, useRef, useState } from "react";
import type { Quote } from "@/lib/types";

/**
 * Fetch live quotes for the given tickers and refresh every `intervalMs`.
 * Returns a map keyed by ticker.
 */
export function useQuotes(
  tickers: string[],
  intervalMs = 60_000,
): { quotes: Record<string, Quote>; loading: boolean } {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(false);
  const key = [...tickers].sort().join(",");
  const keyRef = useRef(key);
  keyRef.current = key;

  useEffect(() => {
    if (!key) {
      setQuotes({});
      return;
    }
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/quotes?tickers=${encodeURIComponent(keyRef.current)}`,
        ).then((r) => r.json());
        if (cancelled || !Array.isArray(res.quotes)) return;
        const map: Record<string, Quote> = {};
        for (const q of res.quotes as Quote[]) map[q.ticker] = q;
        setQuotes(map);
      } catch {
        /* keep last-known quotes on failure */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    const id = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [key, intervalMs]);

  return { quotes, loading };
}

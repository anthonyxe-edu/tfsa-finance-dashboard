"use client";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "@/components/ui/Sparkline";
import { Badge } from "@/components/ui/Badge";
import { WATCHLIST, displayTicker, buySignal } from "@/lib/watchlist";
import { fmtPct } from "@/lib/format";
import type { Quote } from "@/lib/types";

const SIGNAL_VARIANT = {
  buy: "gain",
  neutral: "neutral",
  pricey: "loss",
} as const;

export function Watchlist({ quotes }: { quotes: Record<string, Quote> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {WATCHLIST.map((ticker) => {
        const q = quotes[ticker];
        const up = (q?.dayChangePct ?? 0) >= 0;
        const sig = q ? buySignal(q) : null;
        return (
          <div
            key={ticker}
            className="rounded-card border border-border bg-surface p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-title text-lg leading-none text-fg">
                  {displayTicker(ticker)}
                </div>
                <div className="mt-1 text-[11px] text-faint">{ticker}</div>
              </div>
              {sig && (
                <Badge variant={SIGNAL_VARIANT[sig.signal]}>{sig.label}</Badge>
              )}
            </div>

            {q ? (
              <>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl font-semibold text-fg tnum">
                    ${q.price.toFixed(2)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-sm tnum ${
                      up ? "text-gain" : "text-loss"
                    }`}
                  >
                    {up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {fmtPct(q.dayChangePct)}
                  </span>
                </div>
                <Sparkline
                  data={q.history}
                  width={240}
                  height={40}
                  className="mt-2 h-10 w-full"
                />
              </>
            ) : (
              <div className="mt-4 text-sm text-faint">No data available</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

"use client";
import { useState } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Sparkline } from "@/components/ui/Sparkline";
import { Badge } from "@/components/ui/Badge";
import { WATCHLIST, displayTicker, buySignal } from "@/lib/watchlist";
import { RANGES, type Range } from "@/lib/ranges";
import { useHistory } from "@/hooks/useHistory";
import { fmtPct } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Quote } from "@/lib/types";

const SIGNAL_VARIANT = {
  buy: "gain",
  neutral: "neutral",
  pricey: "loss",
} as const;

function RangeSelector({
  value,
  onChange,
}: {
  value: Range;
  onChange: (r: Range) => void;
}) {
  return (
    <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-border bg-surface-2 p-1">
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            "min-w-[34px] flex-1 rounded-md px-1.5 py-1.5 text-xs font-semibold tnum transition-colors",
            r === value
              ? "bg-primary text-on-primary"
              : "text-muted hover:text-fg",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function Watchlist({ quotes }: { quotes: Record<string, Quote> }) {
  const [range, setRange] = useState<Range>("1M");
  const { series, loading } = useHistory([...WATCHLIST], range);

  return (
    <div>
      <RangeSelector value={range} onChange={setRange} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {WATCHLIST.map((ticker) => {
          const q = quotes[ticker];
          const s = series[ticker];
          const dayUp = (q?.dayChangePct ?? 0) >= 0;
          const rangeUp = (s?.changePct ?? 0) >= 0;
          const sig = q ? buySignal(q) : null;
          const closes = s?.closes?.length ? s.closes : (q?.history ?? []);

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
                      className={cn(
                        "inline-flex items-center gap-0.5 text-sm tnum",
                        dayUp ? "text-gain" : "text-loss",
                      )}
                    >
                      {dayUp ? (
                        <TrendingUp size={14} />
                      ) : (
                        <TrendingDown size={14} />
                      )}
                      {fmtPct(q.dayChangePct)}
                    </span>
                    <span className="text-[11px] text-faint">today</span>
                  </div>

                  <Sparkline
                    data={closes}
                    width={240}
                    height={44}
                    className="mt-2 h-11 w-full"
                  />

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted tnum">{range}</span>
                    {s ? (
                      <span
                        className={cn(
                          "font-semibold tnum",
                          rangeUp ? "text-gain" : "text-loss",
                        )}
                      >
                        {fmtPct(s.changePct, 1)}
                      </span>
                    ) : (
                      <span className="text-faint">{loading ? "…" : "—"}</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="mt-4 text-sm text-faint">No data available</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

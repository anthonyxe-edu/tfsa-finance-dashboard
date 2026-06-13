"use client";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { Sparkline } from "@/components/ui/Sparkline";
import { Money } from "@/components/ui/Money";
import { Badge } from "@/components/ui/Badge";
import { fmtPct, fmtCurrency } from "@/lib/format";
import type { EtfHolding, Quote } from "@/lib/types";

export function HoldingsTable({
  holdings,
  quotes,
}: {
  holdings: EtfHolding[];
  quotes: Record<string, Quote>;
}) {
  if (!holdings.length) {
    return (
      <p className="text-sm text-muted">
        No holdings yet — add your ETFs above to see live prices.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="py-2 pr-3 font-medium">Ticker</th>
            <th className="py-2 pr-3 font-medium">Price</th>
            <th className="py-2 pr-3 font-medium">Today</th>
            <th className="py-2 pr-3 font-medium">30d</th>
            <th className="py-2 pr-3 text-right font-medium">Units</th>
            <th className="py-2 pr-3 text-right font-medium">Value</th>
            <th className="py-2 pr-3 text-right font-medium">Gain/Loss</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => {
            const q = quotes[h.ticker];
            const price = q?.price ?? 0;
            const value = h.units * price;
            const gain = value - h.bookCost;
            return (
              <tr key={h.id} className="border-t border-border/60">
                <td className="py-2.5 pr-3 font-medium text-fg">{h.ticker}</td>
                <td className="py-2.5 pr-3 tnum">
                  {q ? fmtCurrency(price) : "—"}
                </td>
                <td className="py-2.5 pr-3">
                  {q ? (
                    <Badge variant={q.dayChangePct >= 0 ? "gain" : "loss"}>
                      {fmtPct(q.dayChangePct)}
                    </Badge>
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
                <td className="py-2.5 pr-3">
                  {q ? <Sparkline data={q.history} /> : null}
                </td>
                <td className="py-2.5 pr-3 text-right tnum">{h.units}</td>
                <td className="py-2.5 pr-3 text-right tnum">
                  {q ? fmtCurrency(value) : "—"}
                </td>
                <td className="py-2.5 pr-3 text-right">
                  <Money value={gain} colorBySign showSign />
                </td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => db.etfHoldings.delete(h.id)}
                    aria-label={`Remove ${h.ticker}`}
                    className="cursor-pointer text-faint transition-colors hover:text-loss"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

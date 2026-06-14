"use client";
import { TrendingUp, TrendingDown, Flame, Activity } from "lucide-react";
import { useQuotes } from "@/hooks/useQuotes";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Badge } from "@/components/ui/Badge";
import { Watchlist } from "@/components/tfsa/Watchlist";
import { WATCHLIST, marketSummary, displayTicker } from "@/lib/watchlist";
import { fmtPct } from "@/lib/format";

export default function TfsaPage() {
  const { quotes, loading } = useQuotes([...WATCHLIST]);
  const sum = marketSummary(Object.values(quotes));
  const upMarket = sum.avgChange >= 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatTile
          label="Market today"
          value={
            <span className={upMarket ? "text-gain" : "text-loss"}>
              {fmtPct(sum.avgChange)}
            </span>
          }
          icon={upMarket ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          sub={
            <span className="text-muted">
              {sum.up} of {sum.total || WATCHLIST.length} up today
            </span>
          }
        />
        <StatTile
          label="Top mover"
          value={sum.top ? displayTicker(sum.top.ticker) : "—"}
          icon={<Flame size={18} />}
          sub={
            sum.top ? (
              <Badge variant={sum.top.dayChangePct >= 0 ? "gain" : "loss"}>
                {fmtPct(sum.top.dayChangePct)}
              </Badge>
            ) : (
              <span className="text-faint">loading…</span>
            )
          }
        />
        <StatTile
          label="Tracking"
          value={<span className="tnum">{WATCHLIST.length} ETFs</span>}
          icon={<Activity size={18} />}
          sub={
            <span className="text-muted">
              {loading ? "refreshing…" : "live · every minute"}
            </span>
          }
        />
      </div>

      <Card title="Watchlist" subtitle="Live prices · is it a good day to buy?">
        <Watchlist quotes={quotes} />
      </Card>
    </div>
  );
}

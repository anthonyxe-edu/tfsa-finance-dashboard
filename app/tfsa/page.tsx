"use client";
import { PiggyBank, TrendingUp, Wallet, Percent } from "lucide-react";
import { useHoldings, useKV } from "@/hooks/useDb";
import { useQuotes } from "@/hooks/useQuotes";
import { KV_KEYS } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Money } from "@/components/ui/Money";
import { Badge } from "@/components/ui/Badge";
import { HoldingForm } from "@/components/tfsa/HoldingForm";
import { HoldingsTable } from "@/components/tfsa/HoldingsTable";
import { ContributionRoom } from "@/components/tfsa/ContributionRoom";
import { fmtPct, fmtCurrency0 } from "@/lib/format";
import type { ContributionRoom as CR } from "@/lib/types";

const DEFAULT_ROOM: CR = { limit: 0, used: 0, year: new Date().getFullYear() };

export default function TfsaPage() {
  const holdings = useHoldings();
  const { quotes } = useQuotes(holdings.map((h) => h.ticker));
  const room = useKV<CR>(KV_KEYS.contributionRoom, DEFAULT_ROOM);

  let totalValue = 0;
  let totalBook = 0;
  let prevValue = 0;
  for (const h of holdings) {
    const q = quotes[h.ticker];
    const price = q?.price ?? 0;
    totalValue += h.units * price;
    totalBook += h.bookCost;
    prevValue += h.units * (q?.prevClose ?? price);
  }
  const totalGain = totalValue - totalBook;
  const dayChange = totalValue - prevValue;
  const dayPct = prevValue ? (dayChange / prevValue) * 100 : 0;
  const remaining = Math.max(0, room.limit - room.used);

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="TFSA value"
          value={<Money value={totalValue} />}
          icon={<PiggyBank size={18} />}
          sub={
            <span className="text-muted">
              {holdings.length} holding{holdings.length === 1 ? "" : "s"}
            </span>
          }
        />
        <StatTile
          label="Today"
          value={<Money value={dayChange} colorBySign showSign />}
          icon={<TrendingUp size={18} />}
          sub={
            <Badge variant={dayPct >= 0 ? "gain" : "loss"}>
              {fmtPct(dayPct)}
            </Badge>
          }
        />
        <StatTile
          label="Total gain/loss"
          value={<Money value={totalGain} colorBySign showSign />}
          icon={<Wallet size={18} />}
          sub={
            <span className="text-muted tnum">
              book {fmtCurrency0(totalBook)}
            </span>
          }
        />
        <StatTile
          label="Room remaining"
          value={<span className="tnum">{fmtCurrency0(remaining)}</span>}
          icon={<Percent size={18} />}
          sub={
            <span className="text-muted tnum">
              {room.limit
                ? `${Math.round((room.used / room.limit) * 100)}% used`
                : "set your limit"}
            </span>
          }
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Contribution room" className="lg:col-span-1">
          <ContributionRoom />
        </Card>
        <Card
          title="Add holding"
          subtitle="Enter ticker, units, and book cost"
          className="lg:col-span-2"
        >
          <HoldingForm />
        </Card>
      </div>

      <Card title="ETF holdings" subtitle="Live prices refresh every minute">
        <HoldingsTable holdings={holdings} quotes={quotes} />
      </Card>
    </div>
  );
}

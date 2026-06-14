"use client";
import Link from "next/link";
import { TrendingUp, TrendingDown, Flame, ArrowRight } from "lucide-react";
import { useGoals, useRules, useTransactions, useKV } from "@/hooks/useDb";
import { useQuotes } from "@/hooks/useQuotes";
import { useIncome } from "@/hooks/useIncome";
import { RadialOrbitalNav } from "@/components/home/RadialOrbitalNav";
import { NotificationCards } from "@/components/home/NotificationCards";
import { StatTile } from "@/components/ui/StatTile";
import { CashBalanceTile } from "@/components/overview/CashBalanceTile";
import { MonthlyIncomeTile } from "@/components/overview/MonthlyIncomeTile";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AdviceList } from "@/components/lifecontext/AdviceList";
import { monthSpendTotal } from "@/lib/analysis";
import { WATCHLIST, marketSummary, displayTicker } from "@/lib/watchlist";
import { currentMonth, fmtMonthLabel, fmtPct } from "@/lib/format";
import { KV_KEYS } from "@/lib/db";

export default function HomePage() {
  const { quotes } = useQuotes([...WATCHLIST]);
  const goals = useGoals();
  const rules = useRules();
  const txns = useTransactions();
  const manualIncome = useKV<number>(KV_KEYS.monthlyIncome, 0);

  const month = currentMonth();
  const income = useIncome(month, manualIncome);
  const spend = monthSpendTotal(txns, rules, month);

  const market = marketSummary(Object.values(quotes));
  const upMarket = market.avgChange >= 0;

  const sourceLabel =
    income.source === "gmail"
      ? "income via gmail"
      : income.source === "manual" && manualIncome > 0
        ? "manual income"
        : undefined;

  return (
    <div className="space-y-8">
      {/* Hero: orbital nav around the frugality orb */}
      <div className="pt-1">
        <RadialOrbitalNav
          income={income.income}
          spend={spend}
          sourceLabel={sourceLabel}
          caption={`${fmtMonthLabel(month)} · budget used`}
        />
      </div>

      {/* Key stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CashBalanceTile />
        <MonthlyIncomeTile income={income} manual={manualIncome} />
        <StatTile
          label="Market today"
          value={
            <span className={upMarket ? "text-gain" : "text-loss"}>
              {fmtPct(market.avgChange)}
            </span>
          }
          icon={
            upMarket ? <TrendingUp size={18} /> : <TrendingDown size={18} />
          }
          sub={
            <span className="text-muted">
              {market.up} of {market.total || WATCHLIST.length} ETFs up
            </span>
          }
        />
        <StatTile
          label="Top mover"
          value={market.top ? displayTicker(market.top.ticker) : "—"}
          icon={<Flame size={18} />}
          sub={
            market.top ? (
              <Badge variant={market.top.dayChangePct >= 0 ? "gain" : "loss"}>
                {fmtPct(market.top.dayChangePct)}
              </Badge>
            ) : (
              <span className="text-faint">loading…</span>
            )
          }
        />
      </div>

      {/* Notification cards */}
      <NotificationCards />

      {/* Living-below-means advice */}
      <Card
        title="What to watch this month"
        subtitle="Living-below-means insights"
        action={
          <Link
            href="/goals"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Details <ArrowRight size={13} />
          </Link>
        }
      >
        <AdviceList limit={4} />
      </Card>
    </div>
  );
}

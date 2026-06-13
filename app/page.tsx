"use client";
import Link from "next/link";
import { PiggyBank, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import {
  useHoldings,
  useGoals,
  useRules,
  useTransactions,
  useKV,
} from "@/hooks/useDb";
import { useQuotes } from "@/hooks/useQuotes";
import { useIncome } from "@/hooks/useIncome";
import { FrugalityOrb } from "@/components/home/FrugalityOrb";
import { NotificationCards } from "@/components/home/NotificationCards";
import { StatTile } from "@/components/ui/StatTile";
import { CashBalanceTile } from "@/components/overview/CashBalanceTile";
import { MonthlyIncomeTile } from "@/components/overview/MonthlyIncomeTile";
import { Money } from "@/components/ui/Money";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AdviceList } from "@/components/lifecontext/AdviceList";
import { monthSpendTotal } from "@/lib/analysis";
import { currentMonth, fmtMonthLabel, fmtPct } from "@/lib/format";
import { KV_KEYS } from "@/lib/db";

export default function HomePage() {
  const holdings = useHoldings();
  const { quotes } = useQuotes(holdings.map((h) => h.ticker));
  const goals = useGoals();
  const rules = useRules();
  const txns = useTransactions();
  const manualIncome = useKV<number>(KV_KEYS.monthlyIncome, 0);

  const month = currentMonth();
  const income = useIncome(month, manualIncome);
  const spend = monthSpendTotal(txns, rules, month);

  let tfsaValue = 0;
  let prevValue = 0;
  for (const h of holdings) {
    const q = quotes[h.ticker];
    const price = q?.price ?? 0;
    tfsaValue += h.units * price;
    prevValue += h.units * (q?.prevClose ?? price);
  }
  const dayChange = tfsaValue - prevValue;
  const dayPct = prevValue ? (dayChange / prevValue) * 100 : 0;

  const sourceLabel =
    income.source === "gmail"
      ? "income via gmail"
      : income.source === "manual" && manualIncome > 0
        ? "manual income"
        : undefined;

  return (
    <div className="space-y-8">
      {/* Hero: frugality orb */}
      <section className="flex flex-col items-center pt-1 text-center">
        <p className="text-xs font-medium tracking-wider text-muted uppercase">
          {fmtMonthLabel(month)} · budget used
        </p>
        <div className="mt-3">
          <FrugalityOrb
            income={income.income}
            spend={spend}
            sourceLabel={sourceLabel}
          />
        </div>
      </section>

      {/* Key stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CashBalanceTile />
        <MonthlyIncomeTile income={income} manual={manualIncome} />
        <StatTile
          label="TFSA value"
          value={<Money value={tfsaValue} />}
          icon={<PiggyBank size={18} />}
          sub={
            <span className="text-muted">
              {holdings.length} holding{holdings.length === 1 ? "" : "s"}
            </span>
          }
        />
        <StatTile
          label="TFSA today"
          value={<Money value={dayChange} colorBySign showSign />}
          icon={
            dayChange >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />
          }
          sub={
            holdings.length ? (
              <Badge variant={dayPct >= 0 ? "gain" : "loss"}>
                {fmtPct(dayPct)}
              </Badge>
            ) : (
              <span className="text-faint">add holdings</span>
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
            href="/life-context"
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

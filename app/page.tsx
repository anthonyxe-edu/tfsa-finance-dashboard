"use client";
import Link from "next/link";
import { Receipt, PiggyBank, Wallet, Banknote, ArrowRight } from "lucide-react";
import { useRules, useTransactions, useKV } from "@/hooks/useDb";
import { useIncome } from "@/hooks/useIncome";
import { RadialOrbitalNav } from "@/components/home/RadialOrbitalNav";
import { NotificationCards } from "@/components/home/NotificationCards";
import { StatTile } from "@/components/ui/StatTile";
import { Card } from "@/components/ui/Card";
import { AdviceList } from "@/components/lifecontext/AdviceList";
import { monthSpendTotal } from "@/lib/analysis";
import { currentMonth, fmtMonthLabel, fmtCurrency0 } from "@/lib/format";
import { KV_KEYS } from "@/lib/db";

export default function HomePage() {
  const rules = useRules();
  const txns = useTransactions();
  const manualIncome = useKV<number>(KV_KEYS.monthlyIncome, 0);
  const balance = useKV<number>(KV_KEYS.checkingBalance, 0);

  const month = currentMonth();
  const income = useIncome(month, manualIncome);
  const spend = monthSpendTotal(txns, rules, month);
  const left = income.income - spend;

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
        <StatTile
          label="Chequing"
          value={<span className="tnum">{fmtCurrency0(balance)}</span>}
          icon={<Wallet size={18} />}
          sub={<span className="text-faint">edit in Settings</span>}
        />
        <StatTile
          label="Monthly income"
          value={<span className="tnum">{fmtCurrency0(income.income)}</span>}
          icon={<Banknote size={18} />}
          sub={<span className="text-muted">{sourceLabel ?? "set in Settings"}</span>}
        />
        <StatTile
          label="Spent this month"
          value={<span className="tnum">{fmtCurrency0(spend)}</span>}
          icon={<Receipt size={18} />}
          sub={<span className="text-muted">{fmtMonthLabel(month)}</span>}
        />
        <StatTile
          label="Left to spend"
          value={
            <span className={`tnum ${left >= 0 ? "text-gain" : "text-loss"}`}>
              {fmtCurrency0(left)}
            </span>
          }
          icon={<PiggyBank size={18} />}
          sub={
            <span className="text-muted">
              {income.income > 0 ? "income − spend" : "set income"}
            </span>
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

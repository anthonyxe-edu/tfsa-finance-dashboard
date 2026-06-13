"use client";
import Link from "next/link";
import {
  Wallet,
  PiggyBank,
  TrendingUp,
  Target,
  ArrowRight,
  TrendingDown,
} from "lucide-react";
import { usePlaid } from "@/components/providers/PlaidProvider";
import { useHoldings, useGoals, useNotifications } from "@/hooks/useDb";
import { useQuotes } from "@/hooks/useQuotes";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Money } from "@/components/ui/Money";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AdviceList } from "@/components/lifecontext/AdviceList";
import { fmtPct, fmtCurrency0 } from "@/lib/format";

export default function OverviewPage() {
  const { accounts, linked } = usePlaid();
  const holdings = useHoldings();
  const { quotes } = useQuotes(holdings.map((h) => h.ticker));
  const goals = useGoals();
  const notes = useNotifications();

  const checking =
    accounts.find((a) => a.subtype === "checking") ??
    accounts.find((a) => a.type === "depository") ??
    accounts[0];
  const checkingBal = checking?.current ?? checking?.available ?? 0;

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

  const topGoal = [...goals]
    .filter((g) => g.target > 0)
    .sort((a, b) => b.saved / b.target - a.saved / a.target)[0];
  const goalPct = topGoal
    ? Math.min(100, (topGoal.saved / topGoal.target) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Checking balance"
          value={
            linked ? (
              <Money value={checkingBal} />
            ) : (
              <span className="text-faint">—</span>
            )
          }
          icon={<Wallet size={18} />}
          sub={
            linked ? (
              <span className="truncate text-muted">
                {checking?.name ?? "—"}
              </span>
            ) : (
              <span className="text-faint">link an account</span>
            )
          }
        />
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
            dayChange >= 0 ? (
              <TrendingUp size={18} />
            ) : (
              <TrendingDown size={18} />
            )
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
        <StatTile
          label="Top goal"
          value={
            topGoal ? (
              <span className="tnum">{goalPct.toFixed(0)}%</span>
            ) : (
              <span className="text-faint">—</span>
            )
          }
          icon={<Target size={18} />}
          sub={
            topGoal ? (
              <span className="truncate text-muted">{topGoal.name}</span>
            ) : (
              <span className="text-faint">set a goal</span>
            )
          }
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        <Card
          title="What to watch this month"
          subtitle="Living-below-means insights"
          className="lg:col-span-2"
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

        <Card
          title="Recent alerts"
          action={
            <Link
              href="/notifications"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              All <ArrowRight size={13} />
            </Link>
          }
        >
          {notes.length ? (
            <ul className="space-y-2.5">
              {notes.slice(0, 5).map((n) => (
                <li key={n.id} className="text-sm">
                  <span className={n.read ? "text-muted" : "text-fg"}>
                    {n.message}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No alerts yet.</p>
          )}
        </Card>
      </div>

      {topGoal && (
        <Card title="Top goal progress">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-fg">{topGoal.name}</span>
            <span className="text-muted tnum">
              {fmtCurrency0(topGoal.saved)} of {fmtCurrency0(topGoal.target)}
            </span>
          </div>
          <ProgressBar
            value={topGoal.saved}
            max={topGoal.target || 1}
            tone={goalPct >= 100 ? "gain" : "primary"}
            className="mt-2"
          />
        </Card>
      )}
    </div>
  );
}

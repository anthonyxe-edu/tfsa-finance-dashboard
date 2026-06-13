"use client";
import { useMemo, useState } from "react";
import {
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Link2,
} from "lucide-react";
import { usePlaid } from "@/components/providers/PlaidProvider";
import { useRules } from "@/hooks/useDb";
import { monthlyByCategory, baseline } from "@/lib/analysis";
import { CategoryDonut } from "@/components/spending/CategoryDonut";
import { TrendChart } from "@/components/spending/TrendChart";
import { TransactionsPanel } from "@/components/spending/TransactionsPanel";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Form";
import {
  fmtMonthLabel,
  fmtCurrency0,
  fmtPct,
  currentMonth,
} from "@/lib/format";

export default function SpendingPage() {
  const { transactions } = usePlaid();
  const rules = useRules();

  const byMonth = useMemo(
    () => monthlyByCategory(transactions, rules),
    [transactions, rules],
  );
  const months = useMemo(() => Object.keys(byMonth).sort(), [byMonth]);
  const [picked, setPicked] = useState("");
  const selected = picked || months[months.length - 1] || currentMonth();

  const current = byMonth[selected] ?? {};
  const prior = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(byMonth).filter(([m]) => m < selected),
      ),
    [byMonth, selected],
  );

  const donutData = Object.entries(current)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const trendData = months.map((m) => ({
    month: m,
    total: Object.values(byMonth[m]).reduce((s, v) => s + v, 0),
  }));

  const deltas = donutData.map((d) => {
    const base = baseline(prior, d.name);
    return {
      name: d.name,
      spent: d.value,
      base,
      diff: d.value - base,
      pct: base ? ((d.value - base) / base) * 100 : 0,
    };
  });

  const topMerchants = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.amount <= 0 || t.date.slice(0, 7) !== selected) continue;
      const k = t.merchant ?? t.name;
      map[k] = (map[k] ?? 0) + t.amount;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [transactions, selected]);

  const monthTotal = Object.values(current).reduce((s, v) => s + v, 0);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<Receipt size={20} />}
        title="No transactions yet"
        description="Link your bank account from the header, then hit Sync to pull transactions and see your spending breakdown."
        action={
          <span className="inline-flex items-center gap-1.5 text-xs text-muted">
            <Link2 size={14} /> Use “Link account” in the top bar
          </span>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select
            value={selected}
            onChange={(e) => setPicked(e.target.value)}
            className="h-9 w-44"
            aria-label="Select month"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {fmtMonthLabel(m)}
              </option>
            ))}
          </Select>
          <span className="text-sm text-muted">
            Total spent:{" "}
            <span className="font-semibold text-fg tnum">
              {fmtCurrency0(monthTotal)}
            </span>
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Spending by category" className="lg:col-span-2">
          {donutData.length ? (
            <CategoryDonut data={donutData} />
          ) : (
            <p className="py-8 text-center text-sm text-muted">
              No spending recorded for this month.
            </p>
          )}
        </Card>

        <Card title="vs. 3-month baseline" subtitle="Category change">
          {deltas.length ? (
            <ul className="space-y-2.5">
              {deltas.slice(0, 8).map((d) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate text-muted">{d.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-fg tnum">
                      {fmtCurrency0(d.spent)}
                    </span>
                    {d.base > 0 && (
                      <Badge variant={d.diff > 0 ? "loss" : "gain"}>
                        {d.diff > 0 ? (
                          <ArrowUpRight size={12} />
                        ) : (
                          <ArrowDownRight size={12} />
                        )}
                        {fmtPct(d.pct, 0)}
                      </Badge>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Not enough history yet.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Monthly trend" className="lg:col-span-2">
          <TrendChart data={trendData} />
        </Card>

        <Card title="Top merchants" subtitle={fmtMonthLabel(selected)}>
          {topMerchants.length ? (
            <ul className="space-y-2.5">
              {topMerchants.map(([name, amt]) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate text-muted">{name}</span>
                  <span className="text-fg tnum">{fmtCurrency0(amt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No merchants this month.</p>
          )}
        </Card>
      </div>

      <Card title="Transactions" subtitle="Change a category to teach a rule">
        <TransactionsPanel txns={transactions} rules={rules} />
      </Card>
    </div>
  );
}

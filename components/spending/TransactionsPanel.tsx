"use client";
import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { categorize } from "@/lib/categorize";
import { CATEGORIES } from "@/lib/categories";
import { Select } from "@/components/ui/Form";
import { fmtCurrency, uid } from "@/lib/format";
import type { Txn, CategoryRule } from "@/lib/types";

export function TransactionsPanel({
  txns,
  rules,
}: {
  txns: Txn[];
  rules: CategoryRule[];
}) {
  const rows = useMemo(
    () =>
      [...txns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50),
    [txns],
  );

  async function setCategory(t: Txn, category: string) {
    if (!category) return;
    const matchType: CategoryRule["matchType"] = t.merchant
      ? "merchant"
      : "keyword";
    const pattern = t.merchant ?? t.name;
    const existing = rules.find(
      (r) =>
        r.matchType === matchType &&
        r.pattern.toLowerCase() === pattern.toLowerCase(),
    );
    if (existing) await db.categoryRules.put({ ...existing, category });
    else await db.categoryRules.add({ id: uid(), matchType, pattern, category });
  }

  if (!rows.length) {
    return <p className="text-sm text-muted">No transactions in range.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="py-2 pr-3 font-medium">Date</th>
            <th className="py-2 pr-3 font-medium">Merchant</th>
            <th className="py-2 pr-3 font-medium">Category</th>
            <th className="py-2 pr-3 text-right font-medium">Amount</th>
            <th className="py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((t) => {
            const cat = categorize(t, rules);
            const known = CATEGORIES.includes(cat);
            return (
              <tr key={t.id} className="border-t border-border/60">
                <td className="py-2 pr-3 whitespace-nowrap text-muted tnum">
                  {t.date.slice(5)}
                </td>
                <td className="py-2 pr-3">
                  <div className="max-w-[220px] truncate text-fg">
                    {t.merchant ?? t.name}
                  </div>
                </td>
                <td className="py-2 pr-3">
                  <Select
                    aria-label={`Category for ${t.merchant ?? t.name}`}
                    value={known ? cat : ""}
                    onChange={(e) => setCategory(t, e.target.value)}
                    className="h-8 max-w-[180px] text-xs"
                  >
                    {!known && <option value="">{cat}</option>}
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="py-2 pr-3 text-right tnum">
                  {t.amount < 0 ? (
                    <span className="text-gain">+{fmtCurrency(-t.amount)}</span>
                  ) : (
                    <span className="text-fg">{fmtCurrency(t.amount)}</span>
                  )}
                </td>
                <td className="py-2 text-right">
                  <button
                    onClick={() => db.transactions.delete(t.id)}
                    aria-label={`Delete ${t.merchant ?? t.name}`}
                    className="cursor-pointer text-faint transition-colors hover:text-loss"
                  >
                    <Trash2 size={14} />
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

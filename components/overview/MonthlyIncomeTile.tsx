"use client";
import { useEffect, useState } from "react";
import { Pencil, Check, Mail } from "lucide-react";
import { setKV, KV_KEYS } from "@/lib/db";
import { Money } from "@/components/ui/Money";
import type { IncomeState } from "@/hooks/useIncome";

/**
 * Shows the resolved monthly income (Gmail-detected or manual) and lets the user
 * edit the manual fallback. The Gmail value always wins when available.
 */
export function MonthlyIncomeTile({
  income,
  manual,
}: {
  income: IncomeState;
  manual: number;
}) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  useEffect(() => {
    if (!editing) setVal(manual ? String(manual) : "");
  }, [manual, editing]);

  async function commit() {
    await setKV(KV_KEYS.monthlyIncome, parseFloat(val) || 0);
    setEditing(false);
  }

  const fromGmail = income.source === "gmail";

  return (
    <div className="rounded-card border border-border bg-surface px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-wider text-muted uppercase">
          Monthly income
        </span>
        <button
          onClick={() => (editing ? commit() : setEditing(true))}
          aria-label={editing ? "Save income" : "Edit income"}
          className="cursor-pointer text-faint transition-colors hover:text-fg"
        >
          {editing ? <Check size={15} /> : <Pencil size={14} />}
        </button>
      </div>

      {editing ? (
        <input
          autoFocus
          type="number"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
          }}
          className="mt-2 w-full rounded-lg border border-border bg-surface-2 px-2 py-1 text-2xl font-semibold text-fg tnum focus:border-primary focus:outline-none"
          placeholder="0"
        />
      ) : (
        <div className="mt-2 text-2xl font-semibold text-fg tnum">
          <Money value={income.source === "loading" ? manual : income.income} />
        </div>
      )}

      <div className="mt-1 text-xs">
        {fromGmail ? (
          <span className="inline-flex items-center gap-1 text-gain">
            <Mail size={12} />
            Auto from {income.gmailCount ?? 0} e-transfer
            {income.gmailCount === 1 ? "" : "s"}
          </span>
        ) : (
          <span className="text-faint">manual · tap the pencil</span>
        )}
      </div>
    </div>
  );
}

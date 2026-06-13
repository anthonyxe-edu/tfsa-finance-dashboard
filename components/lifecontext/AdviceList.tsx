"use client";
import { Lightbulb, CheckCircle2 } from "lucide-react";
import { usePlaid } from "@/components/providers/PlaidProvider";
import { useRules, useGoals, useKV } from "@/hooks/useDb";
import { generateAdvice } from "@/lib/analysis";
import { currentMonth } from "@/lib/format";
import { KV_KEYS } from "@/lib/db";
import {
  DEFAULT_SETTINGS,
  DEFAULT_LIFE_CONTEXT,
  type Settings,
  type LifeContext,
} from "@/lib/types";

export function AdviceList({ limit }: { limit?: number }) {
  const { transactions } = usePlaid();
  const rules = useRules();
  const goals = useGoals();
  const settings = useKV<Settings>(KV_KEYS.settings, DEFAULT_SETTINGS);
  const ctx = useKV<LifeContext>(KV_KEYS.lifeContext, DEFAULT_LIFE_CONTEXT);

  const advice = generateAdvice({
    month: currentMonth(),
    txns: transactions,
    rules,
    ctx,
    goals,
    settings,
  });
  const shown = limit ? advice.slice(0, limit) : advice;

  if (!advice.length) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted">
        <CheckCircle2 size={16} className="text-gain" />
        You&apos;re on track — no flags this month.
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {shown.map((a, i) => (
        <li
          key={i}
          className="flex items-start gap-2.5 rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-sm"
        >
          <Lightbulb size={16} className="mt-0.5 shrink-0 text-warning" />
          <span className="text-fg/90">{a}</span>
        </li>
      ))}
    </ul>
  );
}

import type { Txn, CategoryRule, LifeContext, Goal, Settings } from "@/lib/types";
import { categorize } from "@/lib/categorize";

export type MonthMap = Record<string, Record<string, number>>;
const ym = (date: string) => date.slice(0, 7);

const NON_SPEND = new Set(["Income", "Transfer"]);

/** Sum spend (amount > 0) per "yyyy-mm" per category, excluding income/transfers. */
export function monthlyByCategory(txns: Txn[], rules: CategoryRule[]): MonthMap {
  const out: MonthMap = {};
  for (const txn of txns) {
    if (txn.amount <= 0) continue; // spend only
    const cat = categorize(txn, rules);
    if (NON_SPEND.has(cat)) continue;
    const m = ym(txn.date);
    (out[m] ??= {})[cat] = (out[m][cat] ?? 0) + txn.amount;
  }
  return out;
}

/** Total spend (across all categories) for one "yyyy-mm" month. */
export function monthSpendTotal(
  txns: Txn[],
  rules: CategoryRule[],
  month: string,
): number {
  const map = monthlyByCategory(txns, rules)[month] ?? {};
  return Object.values(map).reduce((a, b) => a + b, 0);
}

/** Trailing 3-month average for a category across the history map. */
export function baseline(history: MonthMap, category: string): number {
  const months = Object.keys(history).sort().slice(-3);
  if (months.length === 0) return 0;
  const vals = months.map((m) => history[m]?.[category] ?? 0);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** A month is a saving month unless it overlaps a planned vacation. */
export function isSavingMonth(month: string, ctx: LifeContext): boolean {
  return !ctx.plannedVacations.some((v) => v.month === month);
}

export function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

/** Deterministic "living below means" advice for the given month. */
export function generateAdvice(args: {
  month: string;
  txns: Txn[];
  rules: CategoryRule[];
  ctx: LifeContext;
  goals: Goal[];
  settings: Settings;
}): string[] {
  const { month, txns, rules, ctx, goals, settings } = args;
  const advice: string[] = [];
  const history = monthlyByCategory(txns, rules);
  const prior: MonthMap = Object.fromEntries(
    Object.entries(history).filter(([m]) => m < month),
  );
  const current = history[month] ?? {};

  if (isSavingMonth(month, ctx)) {
    for (const [cat, spent] of Object.entries(current)) {
      const base = baseline(prior, cat);
      if (base > 0 && spent > base * settings.overspendRatio) {
        advice.push(
          `Saving month: ${cat} is $${(spent - base).toFixed(0)} over your baseline ($${base.toFixed(0)}). Consider cutting back.`,
        );
      }
    }
  }

  for (const v of ctx.plannedVacations) {
    if (v.month > month) {
      const monthsAway = monthsBetween(month, v.month);
      if (monthsAway > 0 && monthsAway <= 6) {
        advice.push(
          `Planned vacation "${v.label}" in ${v.month}: set aside ~$${(v.amount / monthsAway).toFixed(0)}/month now.`,
        );
      }
    }
  }

  if (ctx.emergencyBufferTarget > 0) {
    const have = goals.find((g) => g.kind === "emergency")?.saved ?? 0;
    if (have < ctx.emergencyBufferTarget) {
      advice.push(
        `Emergency buffer is below target: $${have.toFixed(0)} of $${ctx.emergencyBufferTarget.toFixed(0)}.`,
      );
    }
  }

  return advice;
}

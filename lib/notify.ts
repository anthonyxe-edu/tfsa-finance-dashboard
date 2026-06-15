import type {
  Settings,
  Txn,
  CategoryRule,
  Goal,
  AppNotification,
} from "@/lib/types";
import { monthlyByCategory, baseline, monthSpendTotal } from "@/lib/analysis";
import { currentMonth } from "@/lib/format";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

/**
 * Build the notifications that *should* exist for the current data. IDs are
 * deterministic so a condition is never re-notified. Focus (no more ETFs):
 * overall budget burn, per-category overspend (frugality), goal-funding
 * nudges, and goal milestones.
 */
export function buildNotifications(args: {
  settings: Settings;
  income: number;
  txns: Txn[];
  rules: CategoryRule[];
  goals: Goal[];
}): AppNotification[] {
  const { settings, income, txns, rules, goals } = args;
  const month = currentMonth();
  const now = Date.now();
  const out: AppNotification[] = [];

  const spend = monthSpendTotal(txns, rules, month);

  // 1) Overall budget burn — mirrors the orb.
  if (income > 0) {
    const pct = Math.round((spend / income) * 100);
    if (spend >= income) {
      out.push({
        id: `budget-over-${month}`,
        type: "spending",
        message: `Over budget — you've spent ${money(spend)} of your ${money(income)} income this month (${pct}%). Pause non-essentials.`,
        ts: now,
        read: false,
        severity: "urgent",
      });
    } else if (pct >= settings.budgetWarnPct) {
      out.push({
        id: `budget-warn-${month}`,
        type: "spending",
        message: `Heads up: ${pct}% of this month's income is spent. Ease off to stay frugal and protect your goals.`,
        ts: now,
        read: false,
      });
    }
  }

  // 2) Per-category overspend vs your usual baseline.
  const hist = monthlyByCategory(txns, rules);
  const prior = Object.fromEntries(
    Object.entries(hist).filter(([m]) => m < month),
  );
  const current = hist[month] ?? {};
  for (const [cat, spent] of Object.entries(current)) {
    const base = baseline(prior, cat);
    if (base > 0 && spent > base * settings.overspendRatio) {
      out.push({
        id: `spend-${month}-${cat}`,
        type: "spending",
        message: `Spending watch: ${cat} is above your usual (${money(spent)} vs ~${money(base)}).`,
        ts: now,
        read: false,
      });
    }
  }

  // 3) Goal-funding nudge — if there's money left this month, steer it to a goal.
  const disposable = income > 0 ? income - spend : 0;
  if (disposable > 50) {
    const underfunded = goals
      .filter((g) => g.target > 0 && g.saved < g.target)
      .sort((a, b) => a.saved / a.target - b.saved / b.target)[0];
    if (underfunded) {
      out.push({
        id: `goalfund-${month}-${underfunded.id}`,
        type: "goal",
        message: `You have about ${money(disposable)} left this month — putting some toward "${underfunded.name}" keeps you on pace.`,
        ts: now,
        read: false,
      });
    }
  }

  // 4) Goal milestones.
  for (const g of goals) {
    const pct = g.target > 0 ? (g.saved / g.target) * 100 : 0;
    for (const mile of [50, 75, 100]) {
      if (pct >= mile) {
        out.push({
          id: `goal-${g.id}-${mile}`,
          type: "goal",
          message:
            mile >= 100
              ? `Goal reached: "${g.name}" is fully funded.`
              : `Goal "${g.name}" reached ${mile}%.`,
          ts: now,
          read: false,
        });
      }
    }
  }

  return out;
}

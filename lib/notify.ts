import type {
  Quote,
  Settings,
  Txn,
  CategoryRule,
  LifeContext,
  Goal,
  AppNotification,
} from "@/lib/types";
import { classifyMove } from "@/lib/quotes";
import { monthlyByCategory, baseline, isSavingMonth } from "@/lib/analysis";
import { fmtPct, currentMonth } from "@/lib/format";

/**
 * Build the set of notifications that *should* exist given current data.
 * IDs are deterministic so the same condition is not re-notified
 * (ETF: per ticker/day/direction, spend: per month/category, goal: per goal/milestone).
 */
export function buildNotifications(args: {
  quotes: Quote[];
  settings: Settings;
  txns: Txn[];
  rules: CategoryRule[];
  ctx: LifeContext;
  goals: Goal[];
}): AppNotification[] {
  const { quotes, settings, txns, rules, ctx, goals } = args;
  const today = new Date().toISOString().slice(0, 10);
  const month = currentMonth();
  const now = Date.now();
  const out: AppNotification[] = [];

  // ETF booming / low
  for (const q of quotes) {
    const move = classifyMove(
      q.dayChangePct,
      settings.etfBoomPct,
      settings.etfLowPct,
    );
    if (move === "flat") continue;
    out.push({
      id: `etf-${q.ticker}-${today}-${move}`,
      type: "etf",
      message:
        move === "boom"
          ? `${q.ticker} is booming: ${fmtPct(q.dayChangePct)} today ($${q.price.toFixed(2)}).`
          : `${q.ticker} is down: ${fmtPct(q.dayChangePct)} today ($${q.price.toFixed(2)}).`,
      ts: now,
      read: false,
    });
  }

  // Saving-month overspend per category
  if (isSavingMonth(month, ctx)) {
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
          message: `Saving month: ${cat} is over baseline ($${spent.toFixed(0)} vs $${base.toFixed(0)}).`,
          ts: now,
          read: false,
        });
      }
    }
  }

  // Goal milestones
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

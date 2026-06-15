import type { Tone } from "@/lib/types";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export type MoneyCtx = {
  hasIncome: boolean;
  safeToday: number;
  burnPct: number; // 0..>100
  streak: number;
};

/** The home-hub one-liner, flavored by tone + the user's live numbers. */
export function moneyMoment(tone: Tone, c: MoneyCtx): string {
  if (!c.hasIncome) {
    return tone === "roast"
      ? "No income set — I'm flying blind here. Add one. 🫥"
      : tone === "hype"
        ? "Add your monthly income and let's get this rolling. 🚀"
        : "Add a monthly income to power your daily number.";
  }

  const over = c.burnPct >= 100;
  const tight = c.burnPct >= 85;
  const streakBit = c.streak > 1 ? ` ${c.streak}-day streak — don't break it.` : "";

  if (over) {
    return tone === "roast"
      ? `Over budget. The orb's basically a warning light now — ${money(c.safeToday)}/day left. 💀`
      : tone === "hype"
        ? `Over budget, but every day's a reset. Hold the line today and you bounce back. 💪`
        : `You're over budget this month. Try to keep today near ${money(c.safeToday)}.`;
  }
  if (tight) {
    return tone === "roast"
      ? `${c.burnPct}% spent already? Ease up. ${money(c.safeToday)}/day to coast. 👀`
      : tone === "hype"
        ? `Close to the line but not over — ${money(c.safeToday)} today keeps you golden.${streakBit} ✨`
        : `${c.burnPct}% spent. ${money(c.safeToday)} a day keeps you on track.`;
  }
  return tone === "roast"
    ? `Fine, you're under budget. ${money(c.safeToday)}/day to play with.${streakBit} 😏`
    : tone === "hype"
      ? `Looking good — ${money(c.safeToday)} safe to spend today.${streakBit} 🔥`
      : `${money(c.safeToday)} safe to spend today.${streakBit}`;
}

/** Notification copy, flavored by tone. */
export function overBudgetMsg(
  tone: Tone,
  spent: number,
  income: number,
  pct: number,
): string {
  return tone === "roast"
    ? `Over budget — ${money(spent)} of ${money(income)} gone (${pct}%). The orb is judging you. 💀`
    : tone === "hype"
      ? `You crossed budget (${pct}%) — no shame, pause non-essentials and finish strong. 💪`
      : `Over budget — you've spent ${money(spent)} of your ${money(income)} income this month (${pct}%). Pause non-essentials.`;
}

export function warnBudgetMsg(tone: Tone, pct: number): string {
  return tone === "roast"
    ? `${pct}% of your income already? Slow down, big spender. 👀`
    : tone === "hype"
      ? `${pct}% in — still time to stay frugal and protect your goals. You got this. ✨`
      : `Heads up: ${pct}% of this month's income is spent. Ease off to stay frugal.`;
}

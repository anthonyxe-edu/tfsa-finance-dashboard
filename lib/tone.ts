import type { Tone } from "@/lib/types";

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

export type MoneyCtx = {
  hasIncome: boolean;
  safeToday: number;
  burnPct: number; // 0..>100
  streak: number;
};

/** The home-hub one-liner — flavored by tone, grounded in live numbers. No emoji. */
export function moneyMoment(tone: Tone, c: MoneyCtx): string {
  if (!c.hasIncome) {
    return tone === "roast"
      ? "No income set, so this is all guesswork. Fix that first."
      : tone === "hype"
        ? "Add your monthly income and the orb starts working for you."
        : "Add a monthly income to power your daily number.";
  }

  const over = c.burnPct >= 100;
  const tight = c.burnPct >= 85;
  const streakBit = c.streak > 1 ? ` ${c.streak} days on track.` : "";

  if (over) {
    return tone === "roast"
      ? `Over budget already. ${money(c.safeToday)} a day is the lifeboat — try not to sink it.`
      : tone === "hype"
        ? `Over for the month, but today's a clean slate. Hold near ${money(c.safeToday)} and you recover.`
        : `You're over budget this month. Aim to keep today near ${money(c.safeToday)}.`;
  }
  if (tight) {
    return tone === "roast"
      ? `You've torched most of it. ${money(c.safeToday)} a day if you actually want to coast.`
      : tone === "hype"
        ? `Cutting it close, still standing. ${money(c.safeToday)} today keeps you on the right side.${streakBit}`
        : `${c.burnPct}% spent. ${money(c.safeToday)} a day keeps you on track.`;
  }
  return tone === "roast"
    ? `Under budget, shockingly. ${money(c.safeToday)} to play with today.${streakBit}`
    : tone === "hype"
      ? `Comfortably ahead — ${money(c.safeToday)} is yours to spend today.${streakBit}`
      : `${money(c.safeToday)} safe to spend today.${streakBit}`;
}

/** Notification copy, flavored by tone. No emoji. */
export function overBudgetMsg(
  tone: Tone,
  spent: number,
  income: number,
  pct: number,
): string {
  return tone === "roast"
    ? `Budget's gone — ${money(spent)} of ${money(income)} (${pct}%). The orb is not impressed.`
    : tone === "hype"
      ? `You crossed budget at ${pct}%. No drama — pause the extras and finish the month strong.`
      : `Over budget — you've spent ${money(spent)} of your ${money(income)} income this month (${pct}%). Pause non-essentials.`;
}

export function warnBudgetMsg(tone: Tone, pct: number): string {
  return tone === "roast"
    ? `${pct}% spent already. Maybe slow down before the orb turns red.`
    : tone === "hype"
      ? `${pct}% in and still in control. Ease off the extras to protect your goals.`
      : `Heads up: ${pct}% of this month's income is spent. Ease off to stay frugal.`;
}

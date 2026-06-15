/** Daily-engagement math: "safe to spend today" + the check-in streak. Pure so it's testable. */

/** Days remaining in the month, counting today (so it's a daily allowance). */
export function daysLeftInMonth(now = new Date()): number {
  const total = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.max(1, total - now.getDate() + 1);
}

/**
 * What you can spend today and still finish the month on budget:
 * remaining income, spread evenly over the days left. Never negative.
 */
export function safeToSpendToday(
  income: number,
  spentThisMonth: number,
  now = new Date(),
): number {
  if (income <= 0) return 0;
  const remaining = income - spentThisMonth;
  if (remaining <= 0) return 0;
  return remaining / daysLeftInMonth(now);
}

export type Streak = { count: number; lastISO: string };

const dayISO = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Advance a check-in streak for an open on `todayISO`:
 * - same day  → unchanged
 * - yesterday → +1
 * - older/none → reset to 1
 * Returns the (possibly unchanged) streak; compare by reference/count to decide whether to persist.
 */
export function advanceStreak(prev: Streak | null, today = new Date()): Streak {
  const todayISO = dayISO(today);
  if (prev && prev.lastISO === todayISO) return prev;

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yISO = dayISO(yesterday);

  if (prev && prev.lastISO === yISO) {
    return { count: prev.count + 1, lastISO: todayISO };
  }
  return { count: 1, lastISO: todayISO };
}

import { describe, it, expect } from "vitest";
import { safeToSpendToday, advanceStreak } from "@/lib/engagement";

describe("safeToSpendToday", () => {
  it("spreads remaining income over the days left (incl. today)", () => {
    const jan1 = new Date(2026, 0, 1, 12); // 31 days, 31 left incl today
    expect(Math.round(safeToSpendToday(3100, 0, jan1))).toBe(100); // 3100/31
  });
  it("is zero when already over budget", () => {
    const jan1 = new Date(2026, 0, 1, 12);
    expect(safeToSpendToday(1000, 1200, jan1)).toBe(0);
  });
  it("is zero with no income", () => {
    expect(safeToSpendToday(0, 0)).toBe(0);
  });
});

describe("advanceStreak", () => {
  const today = new Date(2026, 5, 15, 12);
  it("starts at 1 with no prior", () => {
    expect(advanceStreak(null, today).count).toBe(1);
  });
  it("increments when last open was yesterday", () => {
    expect(advanceStreak({ count: 4, lastISO: "2026-06-14" }, today).count).toBe(5);
  });
  it("is unchanged (same object) on the same day", () => {
    const prev = { count: 4, lastISO: "2026-06-15" };
    expect(advanceStreak(prev, today)).toBe(prev);
  });
  it("resets to 1 after a missed day", () => {
    expect(advanceStreak({ count: 9, lastISO: "2026-06-12" }, today).count).toBe(1);
  });
});

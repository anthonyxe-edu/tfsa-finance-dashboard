import { describe, it, expect } from "vitest";
import {
  monthlyByCategory,
  baseline,
  isSavingMonth,
  generateAdvice,
} from "@/lib/analysis";
import type { Txn, LifeContext, Settings } from "@/lib/types";

const t = (date: string, amount: number, name = "STORE"): Txn => ({
  id: date + amount,
  date,
  name,
  merchant: name,
  amount,
  pfcPrimary: "GENERAL_MERCHANDISE",
  pfcDetailed: null,
});

const ctx: LifeContext = {
  hasPartner: true,
  monthlySharedCosts: 800,
  familyStatus: "single",
  plannedVacations: [{ id: "v", label: "Trip", month: "2026-08", amount: 2000 }],
  emergencyBufferTarget: 5000,
};
const settings: Settings = {
  budgetWarnPct: 85,
  overspendRatio: 1.15,
  notifyBrowser: false,
  tone: "hype",
};

describe("analysis", () => {
  it("monthlyByCategory sums spend per month/category and ignores income", () => {
    const m = monthlyByCategory(
      [t("2026-01-05", 100), t("2026-01-20", 50), t("2026-01-10", -500, "PAY")],
      [],
    );
    expect(m["2026-01"]["Shopping"]).toBe(150);
    expect(m["2026-01"]["Income"]).toBeUndefined();
  });

  it("baseline averages trailing 3 months", () => {
    const hist = {
      "2025-10": { Shopping: 90 },
      "2025-11": { Shopping: 120 },
      "2025-12": { Shopping: 150 },
    };
    expect(baseline(hist, "Shopping")).toBe(120);
  });

  it("isSavingMonth is false during a planned vacation month", () => {
    expect(isSavingMonth("2026-08", ctx)).toBe(false);
    expect(isSavingMonth("2026-03", ctx)).toBe(true);
  });

  it("generateAdvice flags overspend vs baseline in a saving month", () => {
    const txns = [
      t("2025-10-01", 100),
      t("2025-11-01", 100),
      t("2025-12-01", 100),
      t("2026-01-01", 200),
    ];
    const advice = generateAdvice({ month: "2026-01", txns, rules: [], ctx, goals: [], settings });
    expect(advice.some((a) => a.includes("Shopping") && a.includes("over"))).toBe(true);
  });

  it("generateAdvice reminds to save for an upcoming planned vacation", () => {
    const advice = generateAdvice({ month: "2026-06", txns: [], rules: [], ctx, goals: [], settings });
    expect(advice.some((a) => a.toLowerCase().includes("vacation"))).toBe(true);
  });
});

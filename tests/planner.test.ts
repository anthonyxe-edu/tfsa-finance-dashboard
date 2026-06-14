import { describe, it, expect } from "vitest";
import { generatePlan } from "@/lib/planner";
import { isBankSignConvention } from "@/lib/csv";

const ctx = { income: 4000, avgSpend: 2500, txns: [], rules: [], goals: [] };

describe("isBankSignConvention", () => {
  it("flags bank exports (negatives dominate)", () => {
    expect(isBankSignConvention([-84, -6, -62, 1500])).toBe(true); // debits negative
  });
  it("leaves app-format (positive expenses) alone", () => {
    expect(isBankSignConvention([84, 6, 62, -20])).toBe(false);
  });
});

describe("generatePlan", () => {
  it("computes the monthly amount from amount + timeframe", () => {
    const p = generatePlan("save $24,000 for a car in 2 years", ctx);
    expect(p.goal?.target).toBe(24000);
    expect(p.goal?.kind).toBe("standard");
    expect(p.lines.join(" ")).toMatch(/\$1,000\/month/); // 24000 / 24
  });

  it("detects an emergency fund and amount in 'k'", () => {
    const p = generatePlan("build an emergency fund of $10k", ctx);
    expect(p.goal?.kind).toBe("emergency");
    expect(p.goal?.target).toBe(10000);
  });

  it("asks for a target when none is given", () => {
    const p = generatePlan("save for a trip", ctx);
    expect(p.goal).toBeUndefined();
    expect(p.title.toLowerCase()).toContain("trip");
  });

  it("estimates time-to-goal at current pace when no timeframe", () => {
    const p = generatePlan("$6,000 for a vacation", ctx); // disposable 1500 -> 4 months
    expect(p.lines.join(" ")).toMatch(/about 4 months/);
  });
});

import { describe, it, expect } from "vitest";
import { categorize } from "@/lib/categorize";
import type { Txn, CategoryRule } from "@/lib/types";

const txn = (over: Partial<Txn>): Txn => ({
  id: "1",
  date: "2026-01-01",
  name: "UBER EATS",
  merchant: "Uber Eats",
  amount: 20,
  pfcPrimary: "FOOD_AND_DRINK",
  pfcDetailed: null,
  ...over,
});

describe("categorize", () => {
  it("falls back to PFC-derived category when no rule matches", () => {
    expect(categorize(txn({}), [])).toBe("Food & Drink");
  });

  it("user merchant rule overrides PFC", () => {
    const rules: CategoryRule[] = [
      { id: "r1", matchType: "merchant", pattern: "Uber Eats", category: "Dining Out" },
    ];
    expect(categorize(txn({}), rules)).toBe("Dining Out");
  });

  it("keyword rule matches transaction name case-insensitively", () => {
    const rules: CategoryRule[] = [
      { id: "r1", matchType: "keyword", pattern: "uber", category: "Rides+Food" },
    ];
    expect(categorize(txn({ pfcPrimary: null }), rules)).toBe("Rides+Food");
  });

  it("most specific (longest) rule wins", () => {
    const rules: CategoryRule[] = [
      { id: "r1", matchType: "keyword", pattern: "uber", category: "Broad" },
      { id: "r2", matchType: "keyword", pattern: "uber eats", category: "Specific" },
    ];
    expect(categorize(txn({}), rules)).toBe("Specific");
  });

  it("uncategorized when no PFC and no rule", () => {
    expect(categorize(txn({ pfcPrimary: null, name: "???", merchant: null }), [])).toBe(
      "Uncategorized",
    );
  });

  it("explicit txn.category wins over the PFC map", () => {
    expect(categorize(txn({ category: "Dining Out" }), [])).toBe("Dining Out");
  });

  it("a matching rule still overrides an explicit category", () => {
    const rules: CategoryRule[] = [
      { id: "r1", matchType: "merchant", pattern: "Uber Eats", category: "Rules Win" },
    ];
    expect(categorize(txn({ category: "Manual" }), rules)).toBe("Rules Win");
  });
});

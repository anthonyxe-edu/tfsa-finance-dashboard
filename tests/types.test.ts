import { describe, it, expect } from "vitest";
import { TxnSchema, GoalSchema, SettingsSchema } from "@/lib/types";

describe("types", () => {
  it("TxnSchema accepts a valid txn", () => {
    const parsed = TxnSchema.parse({
      id: "1",
      date: "2026-01-01",
      name: "x",
      merchant: null,
      amount: 12.5,
      pfcPrimary: "FOOD_AND_DRINK",
      pfcDetailed: null,
    });
    expect(parsed.amount).toBe(12.5);
  });

  it("GoalSchema rejects a non-positive target", () => {
    expect(() =>
      GoalSchema.parse({
        id: "1",
        name: "g",
        target: 0,
        saved: 0,
        kind: "standard",
        deadline: null,
      }),
    ).toThrow();
  });

  it("SettingsSchema applies defaults", () => {
    const s = SettingsSchema.parse({});
    expect(s.etfBoomPct).toBe(2);
    expect(s.overspendRatio).toBe(1.15);
  });
});

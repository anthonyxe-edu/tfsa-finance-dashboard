import { describe, it, expect } from "vitest";
import { normalizeYahoo, classifyMove } from "@/lib/quotes";

const sample = {
  chart: {
    result: [
      {
        meta: { symbol: "XEQT.TO", regularMarketPrice: 33, chartPreviousClose: 30 },
        indicators: { quote: [{ close: [29, 30, 31, 32, 33] }] },
      },
    ],
    error: null,
  },
};

describe("quotes", () => {
  it("normalizeYahoo extracts price, prevClose, dayChangePct, history", () => {
    const q = normalizeYahoo("XEQT.TO", sample);
    expect(q.price).toBe(33);
    expect(q.prevClose).toBe(30);
    expect(q.dayChangePct).toBeCloseTo(10, 5);
    expect(q.history).toEqual([29, 30, 31, 32, 33]);
  });

  it("normalizeYahoo filters out null closes", () => {
    const withNulls = {
      chart: {
        result: [
          {
            meta: { regularMarketPrice: 10, chartPreviousClose: 10 },
            indicators: { quote: [{ close: [10, null, 11] }] },
          },
        ],
      },
    };
    expect(normalizeYahoo("X", withNulls).history).toEqual([10, 11]);
  });

  it("classifyMove returns boom/low/flat by thresholds", () => {
    expect(classifyMove(3, 2, -2)).toBe("boom");
    expect(classifyMove(-3, 2, -2)).toBe("low");
    expect(classifyMove(0.5, 2, -2)).toBe("flat");
  });
});

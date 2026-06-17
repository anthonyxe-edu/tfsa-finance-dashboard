import { describe, it, expect } from "vitest";
import { txnFingerprint, normalizeDate } from "@/lib/csv";

describe("txnFingerprint (import de-dupe)", () => {
  it("matches the same row regardless of name case/whitespace", () => {
    expect(txnFingerprint("2026-06-01", 12.5, "Loblaws")).toBe(
      txnFingerprint("2026-06-01", 12.5, "  loblaws "),
    );
  });
  it("rounds amounts to cents so float noise still matches", () => {
    expect(txnFingerprint("2026-06-01", 12.5, "x")).toBe(
      txnFingerprint("2026-06-01", 12.500000001, "x"),
    );
  });
  it("differs when date, amount, or name differ", () => {
    const base = txnFingerprint("2026-06-01", 10, "Tim Hortons");
    expect(base).not.toBe(txnFingerprint("2026-06-02", 10, "Tim Hortons"));
    expect(base).not.toBe(txnFingerprint("2026-06-01", 11, "Tim Hortons"));
    expect(base).not.toBe(txnFingerprint("2026-06-01", 10, "Starbucks"));
  });
});

describe("normalizeDate", () => {
  it("passes ISO through and parses common formats", () => {
    expect(normalizeDate("2026-06-01")).toBe("2026-06-01");
    expect(normalizeDate("06/01/2026")).toBe("2026-06-01");
  });
});

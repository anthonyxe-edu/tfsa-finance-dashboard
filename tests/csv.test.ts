import { describe, it, expect } from "vitest";
import { txnFingerprint, normalizeDate, dedupeNew } from "@/lib/csv";

type Row = { date: string; amount: number; name: string };
const key = (r: Row) => txnFingerprint(r.date, r.amount, r.name);
const row = (date: string, amount: number, name: string): Row => ({ date, amount, name });

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

describe("dedupeNew (count-based import de-dupe)", () => {
  it("keeps two genuinely identical same-day purchases on first import", () => {
    const incoming = [row("2026-06-01", 3.5, "Tim Hortons"), row("2026-06-01", 3.5, "Tim Hortons")];
    expect(dedupeNew([], incoming, key)).toHaveLength(2);
  });

  it("does NOT drop a recurring charge that lands on a new date", () => {
    const existing = [key(row("2026-06-01", 60, "Spotify"))];
    const incoming = [row("2026-07-01", 60, "Spotify")]; // same amount+name, new month
    expect(dedupeNew(existing, incoming, key)).toHaveLength(1);
  });

  it("skips a true re-import of already-stored rows", () => {
    const existing = [key(row("2026-06-01", 12, "Loblaws")), key(row("2026-06-02", 9, "Uber"))];
    const incoming = [row("2026-06-01", 12, "Loblaws"), row("2026-06-02", 9, "Uber")];
    expect(dedupeNew(existing, incoming, key)).toHaveLength(0);
  });

  it("imports only the genuinely-new rows from an overlapping statement", () => {
    const existing = [key(row("2026-06-01", 12, "Loblaws"))];
    const incoming = [
      row("2026-06-01", 12, "Loblaws"), // overlap -> skip
      row("2026-06-15", 40, "Costco"), // new -> keep
      row("2026-06-20", 8, "Tim Hortons"), // new -> keep
    ];
    const fresh = dedupeNew(existing, incoming, key);
    expect(fresh.map((r) => r.name)).toEqual(["Costco", "Tim Hortons"]);
  });

  it("imports the extra copy when you really bought one more than is stored", () => {
    const existing = [key(row("2026-06-01", 3.5, "Tim Hortons"))]; // 1 stored
    const incoming = [row("2026-06-01", 3.5, "Tim Hortons"), row("2026-06-01", 3.5, "Tim Hortons")]; // 2 in file
    expect(dedupeNew(existing, incoming, key)).toHaveLength(1); // one new
  });
});

describe("normalizeDate", () => {
  it("passes ISO through and parses common formats", () => {
    expect(normalizeDate("2026-06-01")).toBe("2026-06-01");
    expect(normalizeDate("06/01/2026")).toBe("2026-06-01");
  });
});

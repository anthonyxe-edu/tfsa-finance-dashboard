import { NextRequest, NextResponse } from "next/server";
import { fetchHistory } from "@/lib/quotes";
import { RANGES, type Range } from "@/lib/ranges";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tickers = (req.nextUrl.searchParams.get("tickers") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const rangeParam = req.nextUrl.searchParams.get("range") ?? "1M";
  const range: Range = (RANGES as readonly string[]).includes(rangeParam)
    ? (rangeParam as Range)
    : "1M";

  const series = await Promise.all(
    tickers.map(async (t) => {
      try {
        return await fetchHistory(t, range);
      } catch {
        return null;
      }
    }),
  );

  const map: Record<string, { closes: number[]; changePct: number }> = {};
  for (const s of series) {
    if (s) map[s.ticker] = { closes: s.closes, changePct: s.changePct };
  }
  return NextResponse.json({ range, series: map });
}

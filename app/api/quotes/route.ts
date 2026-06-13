import { NextRequest, NextResponse } from "next/server";
import { fetchQuote } from "@/lib/quotes";

export async function GET(req: NextRequest) {
  const tickers = (req.nextUrl.searchParams.get("tickers") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const quotes = await Promise.all(
    tickers.map(async (t) => {
      try {
        return await fetchQuote(t);
      } catch {
        return null;
      }
    }),
  );

  return NextResponse.json({ quotes: quotes.filter(Boolean) });
}

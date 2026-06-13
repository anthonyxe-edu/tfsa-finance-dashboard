import { NextResponse } from "next/server";
import { plaid } from "@/lib/plaid";
import { readStore } from "@/lib/plaidStore";
import type { Txn } from "@/lib/types";

export async function GET() {
  const store = await readStore();
  if (!store) return NextResponse.json({ linked: false, transactions: [] });
  try {
    let cursor: string | undefined;
    let hasMore = true;
    const added: Awaited<ReturnType<typeof plaid.transactionsSync>>["data"]["added"] = [];
    while (hasMore) {
      const r = await plaid.transactionsSync({
        access_token: store.access_token,
        cursor,
      });
      added.push(...r.data.added);
      cursor = r.data.next_cursor;
      hasMore = r.data.has_more;
    }
    const transactions: Txn[] = added.map((t) => ({
      id: t.transaction_id,
      date: t.date,
      name: t.name,
      merchant: t.merchant_name ?? null,
      amount: t.amount,
      pfcPrimary: t.personal_finance_category?.primary ?? null,
      pfcDetailed: t.personal_finance_category?.detailed ?? null,
    }));
    return NextResponse.json({ linked: true, transactions });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "transactions failed";
    return NextResponse.json({ linked: true, transactions: [], error: msg }, { status: 500 });
  }
}

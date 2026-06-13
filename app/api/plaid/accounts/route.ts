import { NextResponse } from "next/server";
import { plaid } from "@/lib/plaid";
import { readStore } from "@/lib/plaidStore";
import type { AccountBalance } from "@/lib/types";

export async function GET() {
  const store = await readStore();
  if (!store) return NextResponse.json({ linked: false, accounts: [] });
  try {
    const r = await plaid.accountsBalanceGet({ access_token: store.access_token });
    const accounts: AccountBalance[] = r.data.accounts.map((a) => ({
      id: a.account_id,
      name: a.name,
      subtype: a.subtype ?? null,
      type: a.type ?? null,
      available: a.balances.available ?? null,
      current: a.balances.current ?? null,
      iso: a.balances.iso_currency_code ?? null,
    }));
    return NextResponse.json({ linked: true, accounts });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "accounts failed";
    return NextResponse.json({ linked: true, accounts: [], error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { plaid } from "@/lib/plaid";
import { writeStore } from "@/lib/plaidStore";

export async function POST(req: NextRequest) {
  try {
    const { public_token } = await req.json();
    if (!public_token) {
      return NextResponse.json({ error: "missing public_token" }, { status: 400 });
    }
    const r = await plaid.itemPublicTokenExchange({ public_token });
    await writeStore({ access_token: r.data.access_token, item_id: r.data.item_id });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "exchange failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import {
  plaid,
  plaidConfigured,
  PLAID_PRODUCTS,
  PLAID_COUNTRY_CODES,
} from "@/lib/plaid";

export async function POST() {
  if (!plaidConfigured()) {
    return NextResponse.json(
      { error: "Plaid not configured. Add PLAID_CLIENT_ID and PLAID_SECRET to .env.local." },
      { status: 400 },
    );
  }
  try {
    const r = await plaid.linkTokenCreate({
      user: { client_user_id: "local-user" },
      client_name: "TFSA Dashboard",
      products: PLAID_PRODUCTS,
      country_codes: PLAID_COUNTRY_CODES,
      language: "en",
    });
    return NextResponse.json({ link_token: r.data.link_token });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "link token failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

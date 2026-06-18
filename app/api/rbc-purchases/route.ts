import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Read RBC "You made a purchase." alert emails from Gmail and return them as
 * transactions. Same OAuth refresh-token flow as /api/income; owner-gated.
 * Each alert body contains the amount, date, and merchant in labelled fields:
 *   Purchase Amount:  $27.22
 *   Transaction Date: June 17, 2026
 *   Transaction Description: BROWN DONKATSU
 */

const RBC_SENDER = "alerts.rbc.com";

async function getAccessToken(): Promise<string | null> {
  const client_id = process.env.GOOGLE_CLIENT_ID;
  const client_secret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh_token = process.env.GOOGLE_REFRESH_TOKEN;
  if (!client_id || !client_secret || !refresh_token) return null;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id,
      client_secret,
      refresh_token,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

type GmailPart = {
  mimeType?: string;
  body?: { data?: string };
  parts?: GmailPart[];
};

function decodePlainText(payload: GmailPart | undefined): string {
  if (!payload) return "";
  const stack: GmailPart[] = [payload];
  let out = "";
  while (stack.length) {
    const p = stack.pop()!;
    if (p.mimeType === "text/plain" && p.body?.data) {
      out += Buffer.from(
        p.body.data.replace(/-/g, "+").replace(/_/g, "/"),
        "base64",
      ).toString("utf8");
    }
    if (p.parts) stack.push(...p.parts);
  }
  return out;
}

const AMOUNT_RE = /Purchase Amount:\s*\$?\s*([\d,]+\.\d{2})/i;
const AMOUNT_FALLBACK = /purchase of \$\s?([\d,]+\.\d{2})/i;
const DATE_RE = /Transaction Date:\s*([A-Za-z]+\.?\s+\d{1,2},?\s+\d{4})/i;
const DATE_FALLBACK = /\bon ([A-Za-z]+\.?\s+\d{1,2},?\s+\d{4})/i;
const MERCHANT_RE = /Transaction Description:\s*([^\n\r]+)/i;
const MERCHANT_FALLBACK = /towards ([^.\n\r]+)/i;

function parseAlert(text: string): { date: string; name: string; amount: number } | null {
  const amt = AMOUNT_RE.exec(text) ?? AMOUNT_FALLBACK.exec(text);
  if (!amt) return null;
  const amount = parseFloat(amt[1].replace(/,/g, ""));
  if (!amount) return null;

  const dm = DATE_RE.exec(text) ?? DATE_FALLBACK.exec(text);
  const d = dm ? new Date(dm[1]) : new Date();
  const date = isNaN(d.getTime())
    ? new Date().toISOString().slice(0, 10)
    : d.toISOString().slice(0, 10);

  const mm = MERCHANT_RE.exec(text) ?? MERCHANT_FALLBACK.exec(text);
  const name = (mm ? mm[1] : "RBC purchase").replace(/\s+/g, " ").trim();

  return { date, name, amount };
}

export async function GET(req: NextRequest) {
  const owner = (process.env.OWNER_EMAIL ?? "anthony.echeverry2005@gmail.com")
    .trim()
    .toLowerCase();
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (email !== owner) {
    return NextResponse.json({ purchases: [], source: "not-owner" });
  }

  const token = await getAccessToken();
  if (!token) return NextResponse.json({ purchases: [], source: "unconfigured" });

  // Default window: last 60 days (Gmail after: wants Y/M/D).
  const afterParam = req.nextUrl.searchParams.get("after");
  const afterDate = afterParam
    ? new Date(afterParam)
    : new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const after = `${afterDate.getUTCFullYear()}/${afterDate.getUTCMonth() + 1}/${afterDate.getUTCDate()}`;
  const q = `from:${RBC_SENDER} subject:("You made a purchase") after:${after}`;

  const auth = { Authorization: `Bearer ${token}` };
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=100`,
    { headers: auth, cache: "no-store" },
  );
  if (!listRes.ok) return NextResponse.json({ purchases: [], source: "error" });
  const list = (await listRes.json()) as { messages?: { id: string }[] };
  const ids = (list.messages ?? []).map((m) => m.id);

  const purchases: { id: string; date: string; name: string; amount: number }[] = [];
  for (const id of ids) {
    const mRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
      { headers: auth, cache: "no-store" },
    );
    if (!mRes.ok) continue;
    const msg = (await mRes.json()) as { snippet?: string; payload?: GmailPart };
    const body = decodePlainText(msg.payload) || msg.snippet || "";
    const parsed = parseAlert(body);
    if (parsed) purchases.push({ id, ...parsed });
  }

  return NextResponse.json({ purchases, source: "gmail", count: purchases.length });
}

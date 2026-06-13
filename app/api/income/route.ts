import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Detect monthly income from Interac e-Transfer deposit emails in Gmail.
 *
 * Pure `fetch` against the Gmail REST API + OAuth refresh-token flow — no SDK,
 * no persistent connection, Vercel-serverless friendly. Configure via env vars:
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
 * Optional override of which senders count as income:
 *   ETRANSFER_SENDERS="notify@payments.interac.ca,catch@payments.interac.ca"
 *
 * If unconfigured, returns { income: null } so the client falls back to the
 * manually entered monthly income.
 */

const DEFAULT_SENDERS = [
  "notify@payments.interac.ca",
  "catch@payments.interac.ca",
  "interac.ca",
];

// Targets "sent you $475.76" (Interac subject format) first, falls back to any $X.XX.
const SENT_YOU_RE = /sent you \$\s?([\d,]+\.?\d*)/i;
const AMOUNT_RE = /\$\s?([\d,]+\.\d{2})/;

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

function monthBounds(month: string) {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1)); // first of next month (exclusive)
  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}/${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return { after: fmt(start), before: fmt(end) };
}

export async function GET(req: NextRequest) {
  const month =
    req.nextUrl.searchParams.get("month") ??
    new Date().toISOString().slice(0, 7);

  const token = await getAccessToken();
  if (!token) {
    return NextResponse.json({ income: null, source: "unconfigured" });
  }

  const senders = (process.env.ETRANSFER_SENDERS ?? DEFAULT_SENDERS.join(","))
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const { after, before } = monthBounds(month);
  const q = `(${senders.map((s) => `from:${s}`).join(" OR ")}) after:${after} before:${before}`;

  const auth = { Authorization: `Bearer ${token}` };

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(q)}&maxResults=100`,
    { headers: auth, cache: "no-store" },
  );
  if (!listRes.ok) {
    return NextResponse.json({ income: null, source: "error" });
  }
  const list = (await listRes.json()) as { messages?: { id: string }[] };
  const ids = (list.messages ?? []).map((m) => m.id);

  let total = 0;
  let count = 0;
  for (const id of ids) {
    const mRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject`,
      { headers: auth, cache: "no-store" },
    );
    if (!mRes.ok) continue;
    const msg = (await mRes.json()) as {
      snippet?: string;
      payload?: { headers?: { name: string; value: string }[] };
    };
    const subject =
      msg.payload?.headers?.find((h) => h.name === "Subject")?.value ?? "";
    const haystack = `${subject} ${msg.snippet ?? ""}`;
    const match = SENT_YOU_RE.exec(haystack) ?? AMOUNT_RE.exec(haystack);
    if (match) {
      total += parseFloat(match[1].replace(/,/g, ""));
      count += 1;
    }
  }

  return NextResponse.json({
    income: Math.round(total * 100) / 100,
    source: "gmail",
    count,
    month,
  });
}

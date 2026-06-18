import { db, getKV, setKV, KV_KEYS } from "@/lib/db";
import { uid } from "@/lib/format";
import { txnFingerprint, dedupeNew } from "@/lib/csv";
import { detectMerchantCategory } from "@/lib/merchants";
import type { Txn } from "@/lib/types";

type Purchase = { id: string; date: string; name: string; amount: number };

/**
 * Pull RBC "You made a purchase." alerts from Gmail (via /api/rbc-purchases) and
 * turn new ones into transactions. Idempotent two ways: skips Gmail message ids
 * already imported (KV) and drops anything matching an existing txn (fingerprint).
 */
export async function syncRbcPurchases(
  email: string,
  existing: Txn[],
): Promise<{ added: number; error?: string }> {
  if (!email) return { added: 0 };

  let purchases: Purchase[] = [];
  try {
    const res = await fetch(`/api/rbc-purchases?email=${encodeURIComponent(email)}`);
    if (!res.ok) return { added: 0, error: `server ${res.status}` };
    const json = (await res.json()) as { purchases?: Purchase[] };
    purchases = json.purchases ?? [];
  } catch (e) {
    return { added: 0, error: String(e) };
  }
  if (!purchases.length) return { added: 0 };

  // 1) Skip Gmail messages already imported (idempotent by message id).
  const importedIds = await getKV<string[]>(KV_KEYS.rbcImportedIds, []);
  const importedSet = new Set(importedIds);
  const newOnes = purchases.filter((p) => !importedSet.has(p.id));
  if (!newOnes.length) return { added: 0 };

  // 2) Cross-source guard: drop any already matching an existing transaction
  //    (e.g. also imported via CSV).
  const key = (t: { date: string; amount: number; name: string }) =>
    txnFingerprint(t.date, t.amount, t.name);
  const fresh = dedupeNew(existing.map(key), newOnes, key);

  const txns: Txn[] = fresh.map((p) => ({
    id: uid(),
    date: p.date,
    name: p.name,
    merchant: p.name,
    amount: p.amount, // a purchase is an expense → positive in app convention
    pfcPrimary: null,
    pfcDetailed: null,
    category: detectMerchantCategory(p.name) ?? null,
  }));
  if (txns.length) await db.transactions.bulkAdd(txns);

  // Mark every fetched-new message id as handled (even cross-source dupes), so we
  // never reconsider them. Keep the list bounded.
  const updated = [...importedIds, ...newOnes.map((p) => p.id)].slice(-500);
  await setKV(KV_KEYS.rbcImportedIds, updated);

  return { added: txns.length };
}

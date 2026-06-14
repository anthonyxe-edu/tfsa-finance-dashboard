import { supabase, currentUserId } from "@/lib/supabase/client";
import type { Txn, Goal, CategoryRule, AppNotification } from "@/lib/types";

/** Stable KV keys used across the app (stored per-user in app_kv). */
export const KV_KEYS = {
  lifeContext: "lifeContext",
  settings: "settings",
  contributionRoom: "contributionRoom",
  checkingBalance: "checkingBalance",
  monthlyIncome: "monthlyIncome",
} as const;

const txnRow = (t: Txn, userId: string) => ({
  user_id: userId,
  date: t.date,
  name: t.name,
  merchant: t.merchant,
  amount: t.amount,
  category: t.category ?? null,
});

/**
 * Supabase-backed data facade mirroring the small Dexie API the app used, so
 * existing call sites keep working. All writes are scoped to the signed-in user
 * (RLS enforces this server-side too).
 */
export const db = {
  transactions: {
    async add(t: Txn) {
      const uid = await currentUserId();
      await supabase.from("transactions").insert(txnRow(t, uid));
    },
    async bulkAdd(ts: Txn[]) {
      const uid = await currentUserId();
      await supabase.from("transactions").insert(ts.map((t) => txnRow(t, uid)));
    },
    async clear() {
      const uid = await currentUserId();
      await supabase.from("transactions").delete().eq("user_id", uid);
    },
    async delete(id: string) {
      await supabase.from("transactions").delete().eq("id", id);
    },
  },

  goals: {
    async add(g: Omit<Goal, "id"> & { id?: string }) {
      const uid = await currentUserId();
      await supabase.from("goals").insert({
        user_id: uid,
        name: g.name,
        target: g.target,
        saved: g.saved,
        kind: g.kind,
        deadline: g.deadline ?? null,
      });
    },
    async update(id: string, patch: Partial<Goal>) {
      await supabase.from("goals").update(patch).eq("id", id);
    },
    async delete(id: string) {
      await supabase.from("goals").delete().eq("id", id);
    },
  },

  categoryRules: {
    async add(r: Omit<CategoryRule, "id"> & { id?: string }) {
      const uid = await currentUserId();
      await supabase.from("category_rules").insert({
        user_id: uid,
        match_type: r.matchType,
        pattern: r.pattern,
        category: r.category,
      });
    },
    async put(r: CategoryRule) {
      const uid = await currentUserId();
      if (r.id) {
        await supabase
          .from("category_rules")
          .update({ match_type: r.matchType, pattern: r.pattern, category: r.category })
          .eq("id", r.id);
      } else {
        await supabase.from("category_rules").insert({
          user_id: uid,
          match_type: r.matchType,
          pattern: r.pattern,
          category: r.category,
        });
      }
    },
  },

  notifications: {
    async get(id: string): Promise<AppNotification | null> {
      const uid = await currentUserId();
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .eq("id", id)
        .maybeSingle();
      return (data as AppNotification | null) ?? null;
    },
    async add(n: AppNotification) {
      const uid = await currentUserId();
      await supabase.from("notifications").upsert(
        {
          user_id: uid,
          id: n.id,
          type: n.type,
          message: n.message,
          ts: n.ts,
          read: n.read,
          severity: n.severity ?? null,
        },
        { onConflict: "user_id,id", ignoreDuplicates: true },
      );
    },
    async update(id: string, patch: Partial<AppNotification>) {
      const uid = await currentUserId();
      await supabase.from("notifications").update(patch).eq("user_id", uid).eq("id", id);
    },
    async markAllRead() {
      const uid = await currentUserId();
      await supabase.from("notifications").update({ read: true }).eq("user_id", uid);
    },
    async clear() {
      const uid = await currentUserId();
      await supabase.from("notifications").delete().eq("user_id", uid);
    },
  },
};

export async function setKV<T>(key: string, value: T): Promise<void> {
  const uid = await currentUserId();
  await supabase
    .from("app_kv")
    .upsert({ user_id: uid, key, value }, { onConflict: "user_id,key" });
}

export async function getKV<T>(key: string, fallback: T): Promise<T> {
  const { data } = await supabase
    .from("app_kv")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return (data?.value as T) ?? fallback;
}

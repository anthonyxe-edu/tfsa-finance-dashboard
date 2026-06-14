"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Txn, Goal, CategoryRule, AppNotification } from "@/lib/types";

type Row = Record<string, unknown>;

/**
 * Fetch a per-user table and keep it live via Supabase Realtime — any change
 * (this device or another) triggers a refetch, replacing Dexie's useLiveQuery.
 */
function useTable<T>(
  table: string,
  map: (row: Row) => T,
  order?: { col: string; asc: boolean },
): T[] {
  const { user } = useAuth();
  const [rows, setRows] = useState<T[]>([]);

  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    let active = true;
    const load = async () => {
      let q = supabase.from(table).select("*");
      if (order) q = q.order(order.col, { ascending: order.asc });
      const { data } = await q;
      if (active && data) setRows((data as Row[]).map(map));
    };
    load();
    // Unique channel name per subscription — Supabase reuses channels by name,
    // so a shared name across components/StrictMode throws "add callbacks after subscribe".
    const channel = supabase
      .channel(`rt-${table}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, load)
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, table]);

  return rows;
}

const mapTxn = (r: Row): Txn => ({
  id: r.id as string,
  date: r.date as string,
  name: r.name as string,
  merchant: (r.merchant as string) ?? null,
  amount: Number(r.amount),
  pfcPrimary: null,
  pfcDetailed: null,
  category: (r.category as string) ?? null,
});

const mapGoal = (r: Row): Goal => ({
  id: r.id as string,
  name: r.name as string,
  target: Number(r.target),
  saved: Number(r.saved),
  kind: r.kind as Goal["kind"],
  deadline: (r.deadline as string) ?? null,
});

const mapRule = (r: Row): CategoryRule => ({
  id: r.id as string,
  matchType: r.match_type as CategoryRule["matchType"],
  pattern: r.pattern as string,
  category: r.category as string,
});

const mapNote = (r: Row): AppNotification => ({
  id: r.id as string,
  type: r.type as AppNotification["type"],
  message: r.message as string,
  ts: Number(r.ts),
  read: r.read as boolean,
  severity: (r.severity as AppNotification["severity"]) ?? undefined,
});

export const useTransactions = () =>
  useTable<Txn>("transactions", mapTxn, { col: "date", asc: true });

export const useGoals = () => useTable<Goal>("goals", mapGoal);

export const useRules = () => useTable<CategoryRule>("category_rules", mapRule);

export const useNotifications = () =>
  useTable<AppNotification>("notifications", mapNote, { col: "ts", asc: false });

/** Live-read a per-user kv value, returning `fallback` until it loads / if unset. */
export function useKV<T>(key: string, fallback: T): T {
  const { user } = useAuth();
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    if (!user) {
      setValue(fallback);
      return;
    }
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("app_kv")
        .select("value")
        .eq("key", key)
        .maybeSingle();
      if (active) setValue((data?.value as T) ?? fallback);
    };
    load();
    const channel = supabase
      .channel(`rt-kv-${key}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_kv", filter: `key=eq.${key}` },
        load,
      )
      .subscribe();
    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, key]);

  return value;
}

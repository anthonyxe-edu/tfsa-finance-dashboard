"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

/** Live-read a kv value, returning `fallback` until it loads / if unset. */
export function useKV<T>(key: string, fallback: T): T {
  const row = useLiveQuery(() => db.kv.get(key), [key]);
  return row ? (row.value as T) : fallback;
}

export const useHoldings = () =>
  useLiveQuery(() => db.etfHoldings.toArray(), [], []);

export const useRules = () =>
  useLiveQuery(() => db.categoryRules.toArray(), [], []);

export const useGoals = () => useLiveQuery(() => db.goals.toArray(), [], []);

export const useTransactions = () =>
  useLiveQuery(() => db.transactions.toArray(), [], []);

export const useNotifications = () =>
  useLiveQuery(
    () => db.notifications.orderBy("ts").reverse().toArray(),
    [],
    [],
  );

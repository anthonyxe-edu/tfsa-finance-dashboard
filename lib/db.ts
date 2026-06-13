import Dexie, { type Table } from "dexie";
import type {
  EtfHolding,
  CategoryRule,
  Goal,
  AppNotification,
  Txn,
} from "@/lib/types";

export interface KV {
  key: string;
  value: unknown;
}

class FinanceDB extends Dexie {
  etfHoldings!: Table<EtfHolding, string>;
  categoryRules!: Table<CategoryRule, string>;
  goals!: Table<Goal, string>;
  kv!: Table<KV, string>;
  notifications!: Table<AppNotification, string>;
  transactions!: Table<Txn, string>;

  constructor() {
    super("tfsa-finance");
    this.version(1).stores({
      etfHoldings: "id, ticker",
      categoryRules: "id",
      goals: "id, kind",
      kv: "key",
      notifications: "id, ts, read",
    });
    this.version(2).stores({
      etfHoldings: "id, ticker",
      categoryRules: "id",
      goals: "id, kind",
      kv: "key",
      notifications: "id, ts, read",
      transactions: "id, date",
    });
  }
}

export const db = new FinanceDB();

export async function getKV<T>(key: string, fallback: T): Promise<T> {
  const row = await db.kv.get(key);
  return row ? (row.value as T) : fallback;
}

export async function setKV<T>(key: string, value: T): Promise<void> {
  await db.kv.put({ key, value });
}

/** Stable KV keys used across the app. */
export const KV_KEYS = {
  lifeContext: "lifeContext",
  settings: "settings",
  contributionRoom: "contributionRoom",
  checkingBalance: "checkingBalance",
} as const;

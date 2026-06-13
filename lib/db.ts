import Dexie, { type Table } from "dexie";
import type {
  EtfHolding,
  CategoryRule,
  Goal,
  AppNotification,
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

  constructor() {
    super("tfsa-finance");
    this.version(1).stores({
      etfHoldings: "id, ticker",
      categoryRules: "id",
      goals: "id, kind",
      kv: "key",
      notifications: "id, ts, read",
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
  accounts: "accounts",
  transactions: "transactions",
  lastSync: "lastSync",
} as const;

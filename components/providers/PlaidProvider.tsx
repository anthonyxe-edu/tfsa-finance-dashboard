"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getKV, setKV, KV_KEYS } from "@/lib/db";
import type { AccountBalance, Txn } from "@/lib/types";

type PlaidState = {
  accounts: AccountBalance[];
  transactions: Txn[];
  linked: boolean | null;
  loading: boolean;
  lastSync: number | null;
  error: string | null;
  sync: () => Promise<void>;
  setLinked: (v: boolean) => void;
};

const PlaidContext = createContext<PlaidState | null>(null);

export function PlaidProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [linked, setLinked] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load cached data + determine linked state on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cachedAcc, cachedTxn, cachedSync] = await Promise.all([
        getKV<AccountBalance[]>(KV_KEYS.accounts, []),
        getKV<Txn[]>(KV_KEYS.transactions, []),
        getKV<number | null>(KV_KEYS.lastSync, null),
      ]);
      if (cancelled) return;
      setAccounts(cachedAcc);
      setTransactions(cachedTxn);
      setLastSync(cachedSync);
      try {
        const d = await fetch("/api/plaid/accounts").then((r) => r.json());
        if (!cancelled) setLinked(Boolean(d.linked));
      } catch {
        if (!cancelled) setLinked(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sync = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [aRes, tRes] = await Promise.all([
        fetch("/api/plaid/accounts").then((r) => r.json()),
        fetch("/api/plaid/transactions").then((r) => r.json()),
      ]);
      setLinked(Boolean(aRes.linked));
      if (aRes.error || tRes.error) setError(aRes.error ?? tRes.error);
      if (Array.isArray(aRes.accounts)) {
        setAccounts(aRes.accounts);
        await setKV(KV_KEYS.accounts, aRes.accounts);
      }
      if (Array.isArray(tRes.transactions)) {
        setTransactions(tRes.transactions);
        await setKV(KV_KEYS.transactions, tRes.transactions);
      }
      const ts = Date.now();
      setLastSync(ts);
      await setKV(KV_KEYS.lastSync, ts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <PlaidContext.Provider
      value={{
        accounts,
        transactions,
        linked,
        loading,
        lastSync,
        error,
        sync,
        setLinked,
      }}
    >
      {children}
    </PlaidContext.Provider>
  );
}

export function usePlaid(): PlaidState {
  const ctx = useContext(PlaidContext);
  if (!ctx) throw new Error("usePlaid must be used within PlaidProvider");
  return ctx;
}

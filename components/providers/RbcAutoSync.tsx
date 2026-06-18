"use client";
import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTransactions } from "@/hooks/useDb";
import { syncRbcPurchases } from "@/lib/rbcSync";

/**
 * Headless: on each app load, pulls new RBC purchase-alert emails into
 * transactions (owner-only; the API returns nothing for other accounts).
 * This is the "constantly check my email" mechanism — it runs whenever the app
 * opens. Runs once per mount; dedupe makes it safe.
 */
export function RbcAutoSync() {
  const { user } = useAuth();
  const txns = useTransactions();
  const txnsRef = useRef(txns);
  txnsRef.current = txns;
  const ran = useRef(false);

  useEffect(() => {
    const email = user?.email;
    if (!email || ran.current) return;
    ran.current = true;
    // Small delay so the existing-txn list has loaded (cross-source dedupe).
    const t = setTimeout(() => {
      void syncRbcPurchases(email, txnsRef.current);
    }, 1500);
    return () => clearTimeout(t);
  }, [user?.email]);

  return null;
}

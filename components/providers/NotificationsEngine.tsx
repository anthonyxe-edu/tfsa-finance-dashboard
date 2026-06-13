"use client";
import { useEffect } from "react";
import { db, KV_KEYS } from "@/lib/db";
import {
  useHoldings,
  useGoals,
  useRules,
  useKV,
  useTransactions,
} from "@/hooks/useDb";
import { useQuotes } from "@/hooks/useQuotes";
import { buildNotifications } from "@/lib/notify";
import {
  DEFAULT_SETTINGS,
  DEFAULT_LIFE_CONTEXT,
  type Settings,
  type LifeContext,
} from "@/lib/types";

/**
 * Headless component: watches data and persists any new notifications,
 * firing a browser notification for fresh items when enabled.
 */
export function NotificationsEngine() {
  const holdings = useHoldings();
  const goals = useGoals();
  const rules = useRules();
  const transactions = useTransactions();
  const settings = useKV<Settings>(KV_KEYS.settings, DEFAULT_SETTINGS);
  const ctx = useKV<LifeContext>(KV_KEYS.lifeContext, DEFAULT_LIFE_CONTEXT);
  const { quotes } = useQuotes(holdings.map((h) => h.ticker));

  useEffect(() => {
    const built = buildNotifications({
      quotes: Object.values(quotes),
      settings,
      txns: transactions,
      rules,
      ctx,
      goals,
    });
    if (built.length === 0) return;

    let cancelled = false;
    (async () => {
      for (const n of built) {
        if (cancelled) return;
        const existing = await db.notifications.get(n.id);
        if (existing) continue;
        await db.notifications.add(n);
        if (
          settings.notifyBrowser &&
          typeof Notification !== "undefined" &&
          Notification.permission === "granted"
        ) {
          new Notification("Finance Dashboard", { body: n.message });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [quotes, settings, transactions, rules, ctx, goals]);

  return null;
}

"use client";
import { useEffect } from "react";
import { db, KV_KEYS } from "@/lib/db";
import { useGoals, useRules, useKV, useTransactions } from "@/hooks/useDb";
import { useIncome } from "@/hooks/useIncome";
import { buildNotifications } from "@/lib/notify";
import { currentMonth } from "@/lib/format";
import { DEFAULT_SETTINGS, type Settings } from "@/lib/types";

/**
 * Headless component: watches data and persists any new notifications,
 * firing a browser/push notification for fresh items when enabled.
 */
export function NotificationsEngine() {
  const goals = useGoals();
  const rules = useRules();
  const transactions = useTransactions();
  const settings = useKV<Settings>(KV_KEYS.settings, DEFAULT_SETTINGS);
  const manualIncome = useKV<number>(KV_KEYS.monthlyIncome, 0);
  const month = currentMonth();
  const income = useIncome(month, manualIncome);

  useEffect(() => {
    const built = buildNotifications({
      settings,
      income: income.income,
      txns: transactions,
      rules,
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
  }, [settings, income.income, transactions, rules, goals]);

  return null;
}

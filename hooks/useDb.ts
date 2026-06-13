"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export const useHoldings = () =>
  useLiveQuery(() => db.etfHoldings.toArray(), [], []);

export const useRules = () =>
  useLiveQuery(() => db.categoryRules.toArray(), [], []);

export const useGoals = () => useLiveQuery(() => db.goals.toArray(), [], []);

export const useNotifications = () =>
  useLiveQuery(
    () => db.notifications.orderBy("ts").reverse().toArray(),
    [],
    [],
  );

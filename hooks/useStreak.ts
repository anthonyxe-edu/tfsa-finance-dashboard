"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { getKV, setKV, KV_KEYS } from "@/lib/db";
import { advanceStreak, type Streak } from "@/lib/engagement";

/**
 * Check-in streak: counts consecutive days the app is opened. Advances once when
 * the home screen mounts on a new day; resets if a day was missed. Persisted
 * per-user in app_kv so it follows you across devices.
 */
export function useStreak(): number {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCount(0);
      return;
    }
    let active = true;
    (async () => {
      const prev = await getKV<Streak | null>(KV_KEYS.streak, null);
      const next = advanceStreak(prev);
      if (active) setCount(next.count);
      if (next !== prev) await setKV(KV_KEYS.streak, next);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  return count;
}

"use client";
import { useEffect, useState } from "react";

export type IncomeSource = "loading" | "gmail" | "manual";

export type IncomeState = {
  /** Resolved income to use as the orb denominator. */
  income: number;
  source: IncomeSource;
  /** Number of e-transfer deposits Gmail matched (when source === "gmail"). */
  gmailCount?: number;
};

/**
 * Resolve this month's income. Tries the server `/api/income` Gmail route first;
 * if Gmail is unconfigured or finds nothing, falls back to the manual value.
 */
export function useIncome(month: string, manualFallback: number): IncomeState {
  const [state, setState] = useState<IncomeState>({
    income: manualFallback,
    source: "loading",
  });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, source: "loading" }));

    fetch(`/api/income?month=${month}`)
      .then((r) => r.json())
      .then((d: { income: number | null; count?: number }) => {
        if (cancelled) return;
        if (typeof d.income === "number" && d.income > 0) {
          setState({ income: d.income, source: "gmail", gmailCount: d.count });
        } else {
          setState({ income: manualFallback, source: "manual" });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ income: manualFallback, source: "manual" });
      });

    return () => {
      cancelled = true;
    };
  }, [month, manualFallback]);

  return state;
}

import type { Txn, CategoryRule } from "@/lib/types";

/** Raw category code (primary) -> friendly display category (used for imported data). */
export const PFC_MAP: Record<string, string> = {
  FOOD_AND_DRINK: "Food & Drink",
  GENERAL_MERCHANDISE: "Shopping",
  TRANSPORTATION: "Transport",
  TRAVEL: "Travel",
  RENT_AND_UTILITIES: "Housing & Utilities",
  ENTERTAINMENT: "Entertainment",
  PERSONAL_CARE: "Personal Care",
  MEDICAL: "Health",
  GENERAL_SERVICES: "Services",
  GOVERNMENT_AND_NON_PROFIT: "Government",
  HOME_IMPROVEMENT: "Home",
  INCOME: "Income",
  TRANSFER_IN: "Transfer",
  TRANSFER_OUT: "Transfer",
  LOAN_PAYMENTS: "Debt",
  BANK_FEES: "Fees",
};

/**
 * Resolve a transaction's category. User rules win first, then an explicit
 * category on the transaction, then the raw code map.
 * Among rules, the most specific (longest pattern) wins.
 */
export function categorize(txn: Txn, rules: CategoryRule[]): string {
  const sorted = [...rules].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const r of sorted) {
    const hay = (r.matchType === "merchant" ? txn.merchant ?? "" : txn.name).toLowerCase();
    if (hay.includes(r.pattern.toLowerCase())) return r.category;
  }
  if (txn.category) return txn.category;
  if (txn.pfcPrimary && PFC_MAP[txn.pfcPrimary]) return PFC_MAP[txn.pfcPrimary];
  return "Uncategorized";
}

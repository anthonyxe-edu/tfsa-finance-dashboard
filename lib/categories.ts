import { PFC_MAP } from "@/lib/categorize";

const EXTRA = [
  "Groceries",
  "Dining Out",
  "Subscriptions",
  "Rent",
  "Fitness",
  "Education",
  "Gifts",
  "Savings",
];

/** Friendly category choices for the re-categorize dropdown. */
export const CATEGORIES: string[] = Array.from(
  new Set(
    [...Object.values(PFC_MAP), ...EXTRA].filter(
      (c) => c !== "Income" && c !== "Transfer",
    ),
  ),
).sort();

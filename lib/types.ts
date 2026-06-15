import { z } from "zod";

export const TxnSchema = z.object({
  id: z.string(),
  date: z.string(), // ISO yyyy-mm-dd
  name: z.string(),
  merchant: z.string().nullable(),
  amount: z.number(), // positive = money out (spend), negative = money in
  pfcPrimary: z.string().nullable(),
  pfcDetailed: z.string().nullable(),
  category: z.string().nullable().optional(), // explicit category for manual entries
});
export type Txn = z.infer<typeof TxnSchema>;

export const CategoryRuleSchema = z.object({
  id: z.string(),
  matchType: z.enum(["merchant", "keyword"]),
  pattern: z.string().min(1),
  category: z.string().min(1),
});
export type CategoryRule = z.infer<typeof CategoryRuleSchema>;

export const GoalSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  target: z.number().positive(),
  saved: z.number().nonnegative(),
  kind: z.enum(["standard", "emergency", "vacation"]),
  deadline: z.string().nullable(),
});
export type Goal = z.infer<typeof GoalSchema>;

export const PlannedVacationSchema = z.object({
  id: z.string(),
  label: z.string(),
  month: z.string(), // yyyy-mm
  amount: z.number().nonnegative(),
});
export type PlannedVacation = z.infer<typeof PlannedVacationSchema>;

export const LifeContextSchema = z.object({
  hasPartner: z.boolean(),
  monthlySharedCosts: z.number().nonnegative(),
  familyStatus: z.string(),
  plannedVacations: z.array(PlannedVacationSchema),
  emergencyBufferTarget: z.number().nonnegative(),
});
export type LifeContext = z.infer<typeof LifeContextSchema>;

export const SettingsSchema = z.object({
  budgetWarnPct: z.number().default(85), // warn when month spend ≥ this % of income
  overspendRatio: z.number().default(1.15), // per-category over baseline
  notifyBrowser: z.boolean().default(false),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  budgetWarnPct: 85,
  overspendRatio: 1.15,
  notifyBrowser: false,
};

export const DEFAULT_LIFE_CONTEXT: LifeContext = {
  hasPartner: false,
  monthlySharedCosts: 0,
  familyStatus: "single",
  plannedVacations: [],
  emergencyBufferTarget: 0,
};

export type AppNotification = {
  id: string;
  type: "spending" | "goal";
  message: string;
  ts: number;
  read: boolean;
  severity?: "normal" | "urgent";
};

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

export const EtfHoldingSchema = z.object({
  id: z.string(),
  ticker: z.string().min(1), // e.g. "XEQT.TO"
  units: z.number().nonnegative(),
  bookCost: z.number().nonnegative(),
});
export type EtfHolding = z.infer<typeof EtfHoldingSchema>;

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

export const QuoteSchema = z.object({
  ticker: z.string(),
  price: z.number(),
  prevClose: z.number(),
  dayChangePct: z.number(),
  history: z.array(z.number()),
});
export type Quote = z.infer<typeof QuoteSchema>;

export const ContributionRoomSchema = z.object({
  limit: z.number().nonnegative(),
  used: z.number().nonnegative(),
  year: z.number().int(),
});
export type ContributionRoom = z.infer<typeof ContributionRoomSchema>;

export const SettingsSchema = z.object({
  etfBoomPct: z.number().default(2),
  etfLowPct: z.number().default(-2),
  overspendRatio: z.number().default(1.15),
  notifyBrowser: z.boolean().default(false),
});
export type Settings = z.infer<typeof SettingsSchema>;

export const DEFAULT_SETTINGS: Settings = {
  etfBoomPct: 2,
  etfLowPct: -2,
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
  type: "etf" | "spending" | "goal";
  message: string;
  ts: number;
  read: boolean;
  severity?: "normal" | "urgent";
};

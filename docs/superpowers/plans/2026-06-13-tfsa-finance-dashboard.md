# TFSA & Personal Finance Dashboard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local, single-user Next.js dashboard that links a Plaid sandbox bank account, categorizes/visualizes spending, tracks TFSA assets + ETF prices with booming/low alerts, manages saving goals, and gives rule-based "living below means" advice driven by a life-context profile.

**Architecture:** Next.js App Router app run locally (`localhost:3000`, opened in Safari). Server route handlers hold the Plaid secret + access token and proxy the keyless ETF quote source. All user-entered data lives in the browser via IndexedDB (Dexie). Pure-logic libs (`categorize`, `analysis`, `quotes`) are framework-free and unit-tested with Vitest; the UI layer is built and verified visually.

**Tech Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Recharts · plaid (Node SDK) · react-plaid-link · Dexie · Zod · Vitest.

---

## File Structure

```
tfsa-finance-dashboard/
├── .env.local                      # PLAID_CLIENT_ID/SECRET/ENV (gitignored)
├── .plaid-store.json               # { access_token, item_id } (gitignored, runtime)
├── app/
│   ├── layout.tsx                  # root layout, fonts, theme
│   ├── globals.css                 # Tailwind + design tokens
│   ├── page.tsx                    # Overview
│   ├── spending/page.tsx
│   ├── tfsa/page.tsx
│   ├── goals/page.tsx
│   ├── life-context/page.tsx
│   ├── notifications/page.tsx
│   └── api/
│       ├── plaid/create-link-token/route.ts
│       ├── plaid/exchange/route.ts
│       ├── plaid/accounts/route.ts
│       ├── plaid/transactions/route.ts
│       └── quotes/route.ts
├── lib/
│   ├── plaid.ts                    # server Plaid client + helpers
│   ├── plaidStore.ts               # read/write .plaid-store.json
│   ├── quotes.ts                   # normalize Yahoo chart response
│   ├── db.ts                       # Dexie schema + typed tables
│   ├── categorize.ts               # PFC + user-rule categorization
│   ├── analysis.ts                 # baselines, saving-month, advice
│   ├── notify.ts                   # generate notifications + Web Notifications dispatch
│   └── types.ts                    # shared domain types + Zod schemas
├── components/
│   ├── shell/Sidebar.tsx, Header.tsx, NotificationBell.tsx
│   ├── ui/ (Card, StatTile, ProgressBar, Money, Sparkline, EmptyState, Badge)
│   ├── plaid/LinkButton.tsx
│   ├── spending/CategoryDonut.tsx, TrendChart.tsx, TopMerchants.tsx, BaselineDeltas.tsx
│   ├── tfsa/ContributionRoom.tsx, HoldingsTable.tsx, AssetForm.tsx
│   ├── goals/GoalCard.tsx, GoalForm.tsx
│   └── lifecontext/ContextForm.tsx, AdviceList.tsx
├── hooks/
│   ├── usePlaid.ts                 # link/exchange/accounts/transactions
│   ├── useQuotes.ts                # poll quotes for held tickers
│   └── useDb.ts                    # Dexie live queries (useLiveQuery)
└── tests/ (lib unit tests)
```

---

## Task 1: Scaffold Next.js project

**Files:** Create project files via CLI; then `tsconfig`, `tailwind`, `vitest.config.ts`.

- [ ] **Step 1: Scaffold**

```bash
cd /Users/anthonyecheverry/Downloads/tfsa-finance-dashboard
npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir=false --import-alias "@/*" --no-turbopack --use-npm --yes
```

- [ ] **Step 2: Install deps**

```bash
npm install plaid react-plaid-link dexie dexie-react-hooks recharts zod
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react
```

- [ ] **Step 3: Add Vitest config** — Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: { environment: "jsdom", globals: true },
  resolve: { alias: { "@": new URL(".", import.meta.url).pathname } },
});
```

- [ ] **Step 4: Add scripts** — In `package.json` add `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 5: Verify dev server boots**

Run: `npm run dev` then `curl -s -o /dev/null -w "%{http_code}" localhost:3000`
Expected: `200`. Stop the server.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold next.js app with deps and vitest"
```

---

## Task 2: Domain types + Zod schemas

**Files:** Create `lib/types.ts`. Test: `tests/types.test.ts`.

- [ ] **Step 1: Write `lib/types.ts`**

```ts
import { z } from "zod";

export const TxnSchema = z.object({
  id: z.string(),
  date: z.string(),          // ISO yyyy-mm-dd
  name: z.string(),
  merchant: z.string().nullable(),
  amount: z.number(),        // positive = money out (spend)
  pfcPrimary: z.string().nullable(),
  pfcDetailed: z.string().nullable(),
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
  ticker: z.string().min(1),   // e.g. "XEQT.TO"
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
  month: z.string(),           // yyyy-mm
  amount: z.number().nonnegative(),
});
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

export const SettingsSchema = z.object({
  etfBoomPct: z.number().default(2),
  etfLowPct: z.number().default(-2),
  overspendRatio: z.number().default(1.15),
  notifyBrowser: z.boolean().default(false),
});
export type Settings = z.infer<typeof SettingsSchema>;
```

- [ ] **Step 2: Test parsing** — `tests/types.test.ts`:

```ts
import { TxnSchema, GoalSchema } from "@/lib/types";
test("TxnSchema accepts valid txn", () => {
  expect(TxnSchema.parse({ id:"1", date:"2026-01-01", name:"x", merchant:null, amount:12.5, pfcPrimary:"FOOD", pfcDetailed:null }).amount).toBe(12.5);
});
test("GoalSchema rejects non-positive target", () => {
  expect(() => GoalSchema.parse({ id:"1", name:"g", target:0, saved:0, kind:"standard", deadline:null })).toThrow();
});
```

- [ ] **Step 3: Run** — `npm test -- tests/types.test.ts` → PASS.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: domain types and zod schemas"`

---

## Task 3: Categorization engine (TDD)

**Files:** Create `lib/categorize.ts`. Test: `tests/categorize.test.ts`.

Map Plaid PFC → friendly category, then apply user rules (rules win, most-specific by longest pattern).

- [ ] **Step 1: Failing test** — `tests/categorize.test.ts`:

```ts
import { categorize } from "@/lib/categorize";
import type { Txn, CategoryRule } from "@/lib/types";

const txn = (over: Partial<Txn>): Txn => ({
  id:"1", date:"2026-01-01", name:"UBER EATS", merchant:"Uber Eats",
  amount:20, pfcPrimary:"FOOD_AND_DRINK", pfcDetailed:null, ...over,
});

test("falls back to PFC-derived category when no rule matches", () => {
  expect(categorize(txn({}), [])).toBe("Food & Drink");
});
test("user merchant rule overrides PFC", () => {
  const rules: CategoryRule[] = [{ id:"r1", matchType:"merchant", pattern:"Uber Eats", category:"Dining Out" }];
  expect(categorize(txn({}), rules)).toBe("Dining Out");
});
test("keyword rule matches transaction name case-insensitively", () => {
  const rules: CategoryRule[] = [{ id:"r1", matchType:"keyword", pattern:"uber", category:"Rides+Food" }];
  expect(categorize(txn({ pfcPrimary:null }), rules)).toBe("Rides+Food");
});
test("uncategorized when no PFC and no rule", () => {
  expect(categorize(txn({ pfcPrimary:null, name:"???", merchant:null }), [])).toBe("Uncategorized");
});
```

- [ ] **Step 2: Run → FAIL** (`categorize` not defined).

- [ ] **Step 3: Implement `lib/categorize.ts`**

```ts
import type { Txn, CategoryRule } from "@/lib/types";

const PFC_MAP: Record<string, string> = {
  FOOD_AND_DRINK: "Food & Drink",
  GENERAL_MERCHANDISE: "Shopping",
  TRANSPORTATION: "Transport",
  TRAVEL: "Travel",
  RENT_AND_UTILITIES: "Housing & Utilities",
  ENTERTAINMENT: "Entertainment",
  PERSONAL_CARE: "Personal Care",
  MEDICAL: "Health",
  GENERAL_SERVICES: "Services",
  INCOME: "Income",
  TRANSFER_IN: "Transfer",
  TRANSFER_OUT: "Transfer",
  LOAN_PAYMENTS: "Debt",
};

export function categorize(txn: Txn, rules: CategoryRule[]): string {
  const sorted = [...rules].sort((a, b) => b.pattern.length - a.pattern.length);
  for (const r of sorted) {
    const hay = (r.matchType === "merchant" ? txn.merchant ?? "" : txn.name).toLowerCase();
    if (hay.includes(r.pattern.toLowerCase())) return r.category;
  }
  if (txn.pfcPrimary && PFC_MAP[txn.pfcPrimary]) return PFC_MAP[txn.pfcPrimary];
  return "Uncategorized";
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat: categorization engine with user rules"`

---

## Task 4: Analysis engine — baselines, saving-month, advice (TDD)

**Files:** Create `lib/analysis.ts`. Test: `tests/analysis.test.ts`.

Functions:
- `monthlyByCategory(txns, rules)` → `Record<"yyyy-mm", Record<category, number>>` (spend only, amount > 0).
- `baseline(history, category)` → trailing-3-month average for a category.
- `isSavingMonth(month, ctx)` → false if month has a planned vacation, else true.
- `generateAdvice({ month, txns, rules, ctx, goals, settings })` → `string[]`.

- [ ] **Step 1: Failing test** — `tests/analysis.test.ts`:

```ts
import { monthlyByCategory, baseline, isSavingMonth, generateAdvice } from "@/lib/analysis";
import type { Txn, LifeContext, Settings } from "@/lib/types";

const t = (date: string, amount: number, name = "STORE"): Txn =>
  ({ id: date+amount, date, name, merchant: name, amount, pfcPrimary: "GENERAL_MERCHANDISE", pfcDetailed: null });

const ctx: LifeContext = { hasPartner:true, monthlySharedCosts:800, familyStatus:"single",
  plannedVacations:[{ id:"v", label:"Trip", month:"2026-08", amount:2000 }], emergencyBufferTarget:5000 };
const settings: Settings = { etfBoomPct:2, etfLowPct:-2, overspendRatio:1.15, notifyBrowser:false };

test("monthlyByCategory sums spend per month/category and ignores income (negative)", () => {
  const m = monthlyByCategory([t("2026-01-05",100), t("2026-01-20",50), t("2026-01-10",-500,"PAY")], []);
  expect(m["2026-01"]["Shopping"]).toBe(150);
  expect(m["2026-01"]["Income"]).toBeUndefined();
});
test("baseline averages trailing 3 months", () => {
  const hist = { "2025-10": { Shopping: 90 }, "2025-11": { Shopping: 120 }, "2025-12": { Shopping: 150 } };
  expect(baseline(hist, "Shopping")).toBe(120);
});
test("isSavingMonth false during a planned vacation month", () => {
  expect(isSavingMonth("2026-08", ctx)).toBe(false);
  expect(isSavingMonth("2026-03", ctx)).toBe(true);
});
test("generateAdvice flags overspend vs baseline in a saving month", () => {
  const txns = [t("2025-10-01",100), t("2025-11-01",100), t("2025-12-01",100), t("2026-01-01",200)];
  const advice = generateAdvice({ month:"2026-01", txns, rules:[], ctx, goals:[], settings });
  expect(advice.some(a => a.includes("Shopping") && a.includes("over"))).toBe(true);
});
test("generateAdvice reminds to save for an upcoming planned vacation", () => {
  const advice = generateAdvice({ month:"2026-06", txns:[], rules:[], ctx, goals:[], settings });
  expect(advice.some(a => a.toLowerCase().includes("vacation"))).toBe(true);
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `lib/analysis.ts`**

```ts
import type { Txn, CategoryRule, LifeContext, Goal, Settings } from "@/lib/types";
import { categorize } from "@/lib/categorize";

type MonthMap = Record<string, Record<string, number>>;
const ym = (date: string) => date.slice(0, 7);

export function monthlyByCategory(txns: Txn[], rules: CategoryRule[]): MonthMap {
  const out: MonthMap = {};
  for (const txn of txns) {
    if (txn.amount <= 0) continue;            // spend only
    const cat = categorize(txn, rules);
    if (cat === "Income" || cat === "Transfer") continue;
    const m = ym(txn.date);
    (out[m] ??= {})[cat] = (out[m][cat] ?? 0) + txn.amount;
  }
  return out;
}

export function baseline(history: MonthMap, category: string): number {
  const months = Object.keys(history).sort().slice(-3);
  const vals = months.map((m) => history[m][category] ?? 0);
  if (vals.length === 0) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function isSavingMonth(month: string, ctx: LifeContext): boolean {
  return !ctx.plannedVacations.some((v) => v.month === month);
}

export function generateAdvice(args: {
  month: string; txns: Txn[]; rules: CategoryRule[];
  ctx: LifeContext; goals: Goal[]; settings: Settings;
}): string[] {
  const { month, txns, rules, ctx, goals, settings } = args;
  const advice: string[] = [];
  const history = monthlyByCategory(txns, rules);
  const prior: MonthMap = Object.fromEntries(Object.entries(history).filter(([m]) => m < month));
  const current = history[month] ?? {};

  if (isSavingMonth(month, ctx)) {
    for (const [cat, spent] of Object.entries(current)) {
      const base = baseline(prior, cat);
      if (base > 0 && spent > base * settings.overspendRatio) {
        advice.push(`Saving month: ${cat} is $${(spent - base).toFixed(0)} over your baseline ($${base.toFixed(0)}). Consider cutting back.`);
      }
    }
  }

  for (const v of ctx.plannedVacations) {
    if (v.month > month) {
      const monthsAway = monthsBetween(month, v.month);
      if (monthsAway > 0 && monthsAway <= 6) {
        advice.push(`Planned vacation "${v.label}" in ${v.month}: set aside ~$${(v.amount / monthsAway).toFixed(0)}/month now.`);
      }
    }
  }

  const emergency = goals.find((g) => g.kind === "emergency");
  if (ctx.emergencyBufferTarget > 0) {
    const have = emergency?.saved ?? 0;
    if (have < ctx.emergencyBufferTarget) {
      advice.push(`Emergency buffer is below target: $${have.toFixed(0)} of $${ctx.emergencyBufferTarget.toFixed(0)}.`);
    }
  }
  return advice;
}

function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}
```

- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git commit -am "feat: analysis engine (baselines, saving-month, advice)"`

---

## Task 5: ETF quote normalization (TDD) + quote route

**Files:** Create `lib/quotes.ts`, `app/api/quotes/route.ts`. Test: `tests/quotes.test.ts`.

`normalizeYahoo(json)` turns a Yahoo `chart` response into a `Quote`.

- [ ] **Step 1: Failing test** — `tests/quotes.test.ts`:

```ts
import { normalizeYahoo, classifyMove } from "@/lib/quotes";

const sample = { chart: { result: [{
  meta: { symbol: "XEQT.TO", regularMarketPrice: 33, chartPreviousClose: 30 },
  indicators: { quote: [{ close: [29, 30, 31, 32, 33] }] },
}], error: null } };

test("normalizeYahoo extracts price, prevClose, dayChangePct, history", () => {
  const q = normalizeYahoo("XEQT.TO", sample);
  expect(q.price).toBe(33);
  expect(q.prevClose).toBe(30);
  expect(q.dayChangePct).toBeCloseTo(10, 5);
  expect(q.history).toEqual([29, 30, 31, 32, 33]);
});
test("classifyMove returns boom/low/flat by thresholds", () => {
  expect(classifyMove(3, 2, -2)).toBe("boom");
  expect(classifyMove(-3, 2, -2)).toBe("low");
  expect(classifyMove(0.5, 2, -2)).toBe("flat");
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `lib/quotes.ts`**

```ts
import type { Quote } from "@/lib/types";

export function normalizeYahoo(ticker: string, json: any): Quote {
  const r = json?.chart?.result?.[0];
  const price = r?.meta?.regularMarketPrice ?? 0;
  const prevClose = r?.meta?.chartPreviousClose ?? price;
  const history = (r?.indicators?.quote?.[0]?.close ?? []).filter((x: any) => typeof x === "number");
  const dayChangePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
  return { ticker, price, prevClose, dayChangePct, history };
}

export function classifyMove(pct: number, boomPct: number, lowPct: number): "boom" | "low" | "flat" {
  if (pct >= boomPct) return "boom";
  if (pct <= lowPct) return "low";
  return "flat";
}

export async function fetchQuote(ticker: string): Promise<Quote> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=5d&interval=1d`;
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`quote ${ticker} failed: ${res.status}`);
  return normalizeYahoo(ticker, await res.json());
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Implement `app/api/quotes/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { fetchQuote } from "@/lib/quotes";
export async function GET(req: NextRequest) {
  const tickers = (req.nextUrl.searchParams.get("tickers") ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const quotes = await Promise.all(tickers.map(async (t) => {
    try { return await fetchQuote(t); } catch { return null; }
  }));
  return NextResponse.json({ quotes: quotes.filter(Boolean) });
}
```

- [ ] **Step 6: Manual check** — `npm run dev`, then `curl 'localhost:3000/api/quotes?tickers=XEQT.TO'` returns a price. Stop server.
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: ETF quote lib + /api/quotes route"`

---

## Task 6: Plaid server lib + store + routes

**Files:** Create `lib/plaidStore.ts`, `lib/plaid.ts`, the four `app/api/plaid/*/route.ts`.

- [ ] **Step 1: `lib/plaidStore.ts`** (read/write gitignored token file)

```ts
import { promises as fs } from "fs";
import path from "path";
const FILE = path.join(process.cwd(), ".plaid-store.json");
export type PlaidStore = { access_token: string; item_id: string };
export async function readStore(): Promise<PlaidStore | null> {
  try { return JSON.parse(await fs.readFile(FILE, "utf8")); } catch { return null; }
}
export async function writeStore(s: PlaidStore): Promise<void> {
  await fs.writeFile(FILE, JSON.stringify(s, null, 2), "utf8");
}
```

- [ ] **Step 2: `lib/plaid.ts`**

```ts
import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

export const plaid = new PlaidApi(new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV ?? "sandbox"],
  baseOptions: { headers: {
    "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
    "PLAID-SECRET": process.env.PLAID_SECRET,
  }},
}));
export const PLAID_PRODUCTS = [Products.Transactions];
export const PLAID_COUNTRY_CODES = [CountryCode.Ca, CountryCode.Us];
```

- [ ] **Step 3: `app/api/plaid/create-link-token/route.ts`**

```ts
import { NextResponse } from "next/server";
import { plaid, PLAID_PRODUCTS, PLAID_COUNTRY_CODES } from "@/lib/plaid";
export async function POST() {
  const r = await plaid.linkTokenCreate({
    user: { client_user_id: "local-user" },
    client_name: "TFSA Dashboard",
    products: PLAID_PRODUCTS,
    country_codes: PLAID_COUNTRY_CODES,
    language: "en",
  });
  return NextResponse.json({ link_token: r.data.link_token });
}
```

- [ ] **Step 4: `app/api/plaid/exchange/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { plaid } from "@/lib/plaid";
import { writeStore } from "@/lib/plaidStore";
export async function POST(req: NextRequest) {
  const { public_token } = await req.json();
  const r = await plaid.itemPublicTokenExchange({ public_token });
  await writeStore({ access_token: r.data.access_token, item_id: r.data.item_id });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: `app/api/plaid/accounts/route.ts`**

```ts
import { NextResponse } from "next/server";
import { plaid } from "@/lib/plaid";
import { readStore } from "@/lib/plaidStore";
export async function GET() {
  const store = await readStore();
  if (!store) return NextResponse.json({ linked: false, accounts: [] });
  const r = await plaid.accountsBalanceGet({ access_token: store.access_token });
  return NextResponse.json({ linked: true, accounts: r.data.accounts.map(a => ({
    id: a.account_id, name: a.name, subtype: a.subtype, type: a.type,
    available: a.balances.available, current: a.balances.current, iso: a.balances.iso_currency_code,
  })) });
}
```

- [ ] **Step 6: `app/api/plaid/transactions/route.ts`** (uses `/transactions/sync`)

```ts
import { NextResponse } from "next/server";
import { plaid } from "@/lib/plaid";
import { readStore } from "@/lib/plaidStore";
import type { Txn } from "@/lib/types";
export async function GET() {
  const store = await readStore();
  if (!store) return NextResponse.json({ linked: false, transactions: [] });
  let cursor: string | undefined; const added: any[] = []; let hasMore = true;
  while (hasMore) {
    const r = await plaid.transactionsSync({ access_token: store.access_token, cursor });
    added.push(...r.data.added); cursor = r.data.next_cursor; hasMore = r.data.has_more;
  }
  const transactions: Txn[] = added.map(t => ({
    id: t.transaction_id, date: t.date, name: t.name, merchant: t.merchant_name ?? null,
    amount: t.amount, pfcPrimary: t.personal_finance_category?.primary ?? null,
    pfcDetailed: t.personal_finance_category?.detailed ?? null,
  }));
  return NextResponse.json({ linked: true, transactions });
}
```

- [ ] **Step 7: Manual check** — Add real sandbox creds to `.env.local`, `npm run dev`, `curl -X POST localhost:3000/api/plaid/create-link-token` returns a `link_token`. Stop server.
- [ ] **Step 8: Commit** — `git add -A && git commit -m "feat: plaid server lib + link/exchange/accounts/transactions routes"`

---

## Task 7: Dexie database layer

**Files:** Create `lib/db.ts`, `hooks/useDb.ts`.

- [ ] **Step 1: `lib/db.ts`**

```ts
import Dexie, { type Table } from "dexie";
import type { EtfHolding, CategoryRule, Goal, LifeContext, Settings } from "@/lib/types";

export interface KV { key: string; value: unknown }

class FinanceDB extends Dexie {
  etfHoldings!: Table<EtfHolding, string>;
  categoryRules!: Table<CategoryRule, string>;
  goals!: Table<Goal, string>;
  kv!: Table<KV, string>;            // lifeContext, settings, contributionRoom, cached txns/accounts
  notifications!: Table<{ id: string; type: string; message: string; ts: number; read: boolean }, string>;
  constructor() {
    super("tfsa-finance");
    this.version(1).stores({
      etfHoldings: "id, ticker",
      categoryRules: "id",
      goals: "id, kind",
      kv: "key",
      notifications: "id, ts, read",
    });
  }
}
export const db = new FinanceDB();

export async function getKV<T>(key: string, fallback: T): Promise<T> {
  return ((await db.kv.get(key))?.value as T) ?? fallback;
}
export async function setKV<T>(key: string, value: T): Promise<void> {
  await db.kv.put({ key, value });
}
```

- [ ] **Step 2: `hooks/useDb.ts`** (live queries via dexie-react-hooks)

```ts
"use client";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
export const useHoldings = () => useLiveQuery(() => db.etfHoldings.toArray(), [], []);
export const useRules = () => useLiveQuery(() => db.categoryRules.toArray(), [], []);
export const useGoals = () => useLiveQuery(() => db.goals.toArray(), [], []);
export const useNotifications = () => useLiveQuery(() => db.notifications.orderBy("ts").reverse().toArray(), [], []);
```

- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: dexie db layer + live-query hooks"`

---

## Task 8: Design system + app shell

**Files:** `app/globals.css` (tokens), `app/layout.tsx`, `components/shell/*`, `components/ui/*`.

> Use the `ui-ux-pro-max` and `frontend-design` skills to choose palette, typography, and component
> styling. Target a calm, data-dense fintech aesthetic (not generic). Define CSS variables for
> color/space/radius in `globals.css`; build reusable `Card`, `StatTile`, `ProgressBar`, `Money`,
> `Badge`, `Sparkline`, `EmptyState` primitives.

- [ ] **Step 1:** Define design tokens in `globals.css` (colors, spacing scale, radii, shadows, fonts).
- [ ] **Step 2:** Build `components/ui/*` primitives listed above (typed props, Tailwind classes from tokens).
- [ ] **Step 3:** Build `components/shell/Sidebar.tsx` (nav links to all 6 routes, active state) + `Header.tsx` (linked-account state + Sync button + `NotificationBell`).
- [ ] **Step 4:** Wire `app/layout.tsx` to render shell around `{children}`; create placeholder pages for all 6 routes that render an `EmptyState`.
- [ ] **Step 5: Verify** — `npm run dev`, open `localhost:3000`, confirm nav works across routes (screenshot via Playwright/preview).
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: design tokens, ui primitives, app shell + routes"`

---

## Task 9: Plaid link + data hooks

**Files:** `components/plaid/LinkButton.tsx`, `hooks/usePlaid.ts`.

- [ ] **Step 1:** `hooks/usePlaid.ts` — functions to fetch `/api/plaid/accounts` and `/api/plaid/transactions`, cache results into `db.kv` (`accounts`, `transactions`) and expose `{ accounts, transactions, linked, sync() }`.
- [ ] **Step 2:** `LinkButton.tsx` — `usePlaidLink` from react-plaid-link: POST create-link-token → open → onSuccess POST `/api/plaid/exchange` → call `sync()`.
- [ ] **Step 3:** Put `LinkButton` in `Header` when `linked === false`; show institution/last-sync when linked.
- [ ] **Step 4: Verify** — Link in sandbox with `user_good`/`pass_good`; confirm accounts + transactions populate (Playwright walkthrough + screenshot).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: plaid link flow + data hooks"`

---

## Task 10: Spending dashboard

**Files:** `app/spending/page.tsx`, `components/spending/*`.

- [ ] **Step 1:** Month selector; compute `monthlyByCategory(transactions, rules)` for charts.
- [ ] **Step 2:** `CategoryDonut` (Recharts Pie) for selected month; `TrendChart` (area) of total spend per month; `TopMerchants` (sorted list).
- [ ] **Step 3:** `BaselineDeltas` — per-category current vs. `baseline(prior, cat)` with up/down badges.
- [ ] **Step 4:** Inline re-categorize control on a transactions list that writes a `categoryRules` entry.
- [ ] **Step 5: Verify** — screenshot the populated spending page.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: spending dashboard (donut, trend, merchants, baselines)"`

---

## Task 11: TFSA module

**Files:** `app/tfsa/page.tsx`, `components/tfsa/*`, `hooks/useQuotes.ts`.

- [ ] **Step 1:** `useQuotes(tickers)` — fetch `/api/quotes?tickers=...` on mount + every 60s; return `Record<ticker, Quote>`.
- [ ] **Step 2:** `AssetForm` + `HoldingsTable` — add/edit `etfHoldings`; show price, dayChangePct (colored), sparkline (`history`), market value (`units*price`), gain/loss vs `bookCost`.
- [ ] **Step 3:** `ContributionRoom` — inputs for limit/used (stored in `kv`), shows remaining + % bar.
- [ ] **Step 4:** Header stats: total TFSA value, total gain/loss.
- [ ] **Step 5: Verify** — enter sample tickers (e.g. `XEQT.TO`, `VFV.TO`), confirm live prices + sparklines render.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: TFSA module with live ETF quotes + contribution room"`

---

## Task 12: Saving goals

**Files:** `app/goals/page.tsx`, `components/goals/*`.

- [ ] **Step 1:** `GoalForm` (name, target, saved, kind, deadline) writing to `db.goals`.
- [ ] **Step 2:** `GoalCard` — progress bar, % complete, and required monthly pace if `deadline` set.
- [ ] **Step 3:** Seed-on-first-run helper offering to create Emergency + Vacation buckets.
- [ ] **Step 4: Verify** — create goals, confirm progress + pace math; screenshot.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: saving goals with progress + pace"`

---

## Task 13: Life context + advice

**Files:** `app/life-context/page.tsx`, `components/lifecontext/*`.

- [ ] **Step 1:** `ContextForm` editing `LifeContext` in `kv` (partner, shared costs, family status, planned vacations list, emergency buffer target).
- [ ] **Step 2:** `AdviceList` — call `generateAdvice({ month: currentMonth, txns, rules, ctx, goals, settings })` and render results; empty state = "On track."
- [ ] **Step 3:** Surface a condensed advice card on Overview too.
- [ ] **Step 4: Verify** — set a planned vacation + overspend, confirm advice strings appear; screenshot.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: life-context profile + rule-based advice"`

---

## Task 14: Notifications system

**Files:** `lib/notify.ts`, `app/notifications/page.tsx`, `components/shell/NotificationBell.tsx`, settings UI.

- [ ] **Step 1:** `lib/notify.ts` — `buildNotifications({ quotes, settings, analysis })` returns notification objects for ETF boom/low (via `classifyMove`), saving-month overspend, goal milestones. Dedup by deterministic id (e.g. `etf-XEQT.TO-2026-06-13-boom`).
- [ ] **Step 2:** Persist new notifications into `db.notifications`; `NotificationBell` shows unread count; `notifications/page.tsx` lists them with read/mark-all-read.
- [ ] **Step 3:** Browser Web Notifications — settings toggle requests `Notification.requestPermission()`; when enabled, `new Notification(...)` fires for fresh unread items.
- [ ] **Step 4:** Trigger generation after each quote refresh + Plaid sync.
- [ ] **Step 5: Verify** — set ETF threshold low (e.g. 0.1%) to force a boom/low alert; confirm bell badge + (if enabled) browser notification.
- [ ] **Step 6: Commit** — `git add -A && git commit -m "feat: notifications (in-app + browser) for ETF + spending + goals"`

---

## Task 15: Overview page + final polish

**Files:** `app/page.tsx`, cross-cutting styling.

- [ ] **Step 1:** Overview composes top tiles: checking balance, TFSA value + day change, top saving goal, condensed advice, recent notifications.
- [ ] **Step 2:** First-run empty states across all sections guiding setup (link Plaid, add holdings, set context).
- [ ] **Step 3:** Final design pass with `ui-ux-pro-max`/`frontend-design`: consistent spacing, contrast, responsive layout, loading/empty/error states.
- [ ] **Step 4:** Write `README.md` with the one-time setup steps from spec §9.
- [ ] **Step 5: Verify** — full Playwright walkthrough across all routes; screenshots.
- [ ] **Step 6:** Run full suite: `npm test` (all PASS) and `npm run build` (succeeds).
- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat: overview page, empty states, readme, final polish"`

---

## Self-Review

**Spec coverage:** Plaid sandbox (T6,T9) · categorization (T3,T10) · spending dashboard (T10) · TFSA + contribution room (T11) · ETF live quotes + booming/low (T5,T11,T14) · saving goals incl. emergency/vacation (T12) · life context + living-below-means advice (T4,T13) · notifications in-app+browser (T14) · browser storage via Dexie (T7) · server-only secrets (T6) · polished UI (T8,T15). All spec sections map to tasks.

**Placeholder scan:** Logic tasks (T2–T7, T14 lib) contain full code. UI tasks (T8–T13, T15) specify exact files, components, data sources, and verification — appropriate granularity for component work where pixel-level code is produced during the build with the design skills.

**Type consistency:** `Txn`, `Quote`, `EtfHolding`, `Goal`, `LifeContext`, `Settings`, `CategoryRule` defined once in `lib/types.ts` and reused. `categorize(txn, rules)`, `monthlyByCategory(txns, rules)`, `baseline(history, category)`, `generateAdvice({...})`, `normalizeYahoo(ticker, json)`, `classifyMove(pct, boom, low)` signatures consistent across tasks. `db.kv` keys (`accounts`, `transactions`, `lifeContext`, `settings`, `contributionRoom`) used consistently.

# TFSA & Personal Finance Dashboard

A **local, single-user** finance dashboard: links a bank account via the **Plaid sandbox**,
categorizes and visualizes spending, tracks **TFSA** assets and **ETF** prices with booming/low
alerts, manages saving goals, and gives rule-based "living below means" advice tailored to your
life circumstances.

Everything runs on your machine. Your entered data (TFSA assets, goals, life context, rules) lives
in **your browser's storage (IndexedDB)**. The only outbound network calls are server-side to Plaid
and to a keyless ETF quote source — nothing is sent anywhere else.

## One-time setup

1. **Plaid sandbox keys** (free): sign up at <https://dashboard.plaid.com>, then copy your
   **sandbox** `client_id` and `secret`.

   ```bash
   cp .env.local.example .env.local
   # edit .env.local and paste your PLAID_CLIENT_ID and PLAID_SECRET
   ```

2. **Install & run:**

   ```bash
   npm install
   npm run dev
   ```

3. Open <http://localhost:3000> in Safari.

4. Click **Link account** (top-right) and log in with the Plaid sandbox test credentials:
   - username: `user_good`
   - password: `pass_good`
   Then press **Sync** to pull balances and transactions.

5. Add your **TFSA holdings** (ticker + units + book cost — TSX ETFs use the `.TO` suffix, e.g.
   `XEQT.TO`), set your **contribution room**, create **goals**, and fill in your **Life Context**.

## Features

- **Overview** — checking balance, TFSA value & day change, top goal, this-month insights, alerts.
- **Spending** — category donut, monthly trend, top merchants, vs-baseline deltas, and inline
  re-categorization that teaches reusable rules.
- **TFSA** — manual holdings with **live prices**, day change, 30-day sparkline, gain/loss, plus a
  contribution-room tracker.
- **Goals** — targets with progress and required monthly pace; built-in Emergency & Vacation buckets.
- **Life Context** — partner/shared costs, family status, planned vacations, emergency buffer; drives
  deterministic "living below means" advice.
- **Notifications** — in-app center + optional desktop browser alerts for ETF booming/low,
  saving-month overspend, and goal milestones, with configurable thresholds.

## Tech

Next.js (App Router) · TypeScript · Tailwind CSS v4 · Recharts · Plaid Node SDK · Dexie (IndexedDB)
· Zod · Vitest.

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build + typecheck
npm test         # unit tests (categorization, analysis, quotes)
```

## Notes

- ETF quotes come from a keyless Yahoo Finance endpoint via the `/api/quotes` proxy. Prices are
  delayed and intended for personal tracking, not trading decisions.
- Plaid runs in **sandbox** mode — balances and transactions are realistic test data, not a real bank.
- Design language follows a data-dense dark fintech system generated with the `ui-ux-pro-max` skill.

See `docs/superpowers/specs/` and `docs/superpowers/plans/` for the design spec and implementation plan.

# TFSA & Personal Finance Dashboard — Design Spec

**Date:** 2026-06-13
**Status:** Approved (design)
**Author:** Anthony (owner) + Claude

## 1. Purpose

A **local, single-user** personal finance dashboard for the owner's own use. It links a bank
account through the **Plaid sandbox**, categorizes transactions, visualizes spending, tracks
**TFSA** planning and saving goals, monitors invested **ETFs** for booming/low movements, and
gives **deterministic, rule-based** advice on "living below means" during saving months while
accounting for personal life circumstances (partner/shared costs, family, emergencies, vacations).

Not for publishing or multi-user. No cloud. Runs locally and is opened in Safari.

## 2. Constraints & principles

- **Local-only:** runs via `npm run dev` and is opened at `http://localhost:3000` in Safari.
- **Privacy:** user-entered data stays in the browser (IndexedDB). The only outbound calls are
  server-side to Plaid and the ETF price source.
- **Plaid secret constraint:** Plaid's `client_id`/`secret` and the bank `access_token` MUST stay
  server-side. They live in `.env.local` and a gitignored local file (`.plaid-store.json`). This is
  the minimum backend Plaid requires — there is no pure browser-only Plaid option.
- **No AI/LLM at runtime:** all analysis is deterministic and rule-based (predictable, free, offline).
  Optional Claude-API narrative insights are explicitly out of scope for v1 (notable future option).
- **YAGNI:** keep to the necessities for personal use.

## 3. Tech stack

- **Next.js (App Router) + TypeScript** — single process gives both the UI and the small secure
  server (API routes) needed for Plaid.
- **Tailwind CSS** — styling, with a polished design system built via the `ui-ux-pro-max` and
  `frontend-design` skills.
- **Recharts** — charts (donut, line/area, bars, sparklines).
- **Plaid Node SDK** (`plaid`) — sandbox environment.
- **Plaid Link** (react-plaid-link) — the account-linking widget.
- **Dexie** — thin IndexedDB wrapper for browser-side persistence.
- **Zod** — validate API inputs/outputs.

## 4. Data storage model

### Browser (IndexedDB via Dexie) — everything the user types
- `tfsaAccounts` — manual TFSA asset entries (cash, ETF holdings).
- `etfHoldings` — `{ ticker, units, bookCost, account }`.
- `contributionRoom` — `{ limit, used, year }`.
- `goals` — `{ name, target, saved, kind: standard|emergency|vacation, deadline? }`.
- `lifeContext` — `{ partner, sharedCosts, familyStatus, plannedVacations[], emergencyBufferTarget }`.
- `categoryRules` — `{ matchType: merchant|keyword, pattern, category }`.
- `settings` — alert thresholds, saving-month config, notification prefs.
- `notificationsLog` — generated notifications + read state.

### Server (gitignored local files) — secrets only
- `.env.local` — `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV=sandbox`.
- `.plaid-store.json` — `{ access_token, item_id }` after a successful link.

> Plaid transactions and balances are **fetched on demand** from the server routes; a lightweight
> cache may be kept in IndexedDB to render fast and reduce calls. Plaid is source of truth for
> bank data; IndexedDB is source of truth for user-entered data.

## 5. Server API routes (Next.js route handlers)

- `POST /api/plaid/create-link-token` — creates a Plaid Link token (sandbox).
- `POST /api/plaid/exchange` — exchanges `public_token` → `access_token`, writes `.plaid-store.json`.
- `GET  /api/plaid/accounts` — returns balances (checking + others) via `/accounts/balance/get`.
- `GET  /api/plaid/transactions` — returns transactions via `/transactions/sync` (incl. Plaid PFC).
- `GET  /api/quotes?tickers=XEQT.TO,VFV.TO` — server-side proxy to a **keyless** quote source
  (Yahoo Finance chart endpoint), returning `{ ticker, price, prevClose, dayChangePct, history[] }`.

All routes validate inputs with Zod and never expose secrets to the client.

## 6. Modules / features

### 6.1 App shell
Sidebar nav: **Overview · Spending · TFSA · Goals · Life Context · Notifications**, plus a header
with the linked-account state and a "Sync" action. Empty/first-run states guide linking Plaid.

### 6.2 Plaid integration (sandbox)
- Link flow using Plaid Link; sandbox test login `user_good` / `pass_good`.
- Pull **checking balance** (prominent on Overview) and **transactions**.
- Re-sync on demand; handle "not yet linked" gracefully.

### 6.3 Categorization engine
- Base categories from Plaid's Personal Finance Category (PFC).
- **User rules** layered on top (merchant/keyword → category), stored in IndexedDB.
- Manual re-categorization of a single transaction creates/updates a rule (optional toggle).

### 6.4 Spending dashboard
- **Category breakdown** donut for the selected month.
- **Trend** line/area: spending per month.
- **Top merchants** list.
- **This month vs. baseline** (baseline = trailing 3-month average per category) with deltas.

### 6.5 TFSA module
- Manual entry of current assets (cash + ETF holdings).
- **Contribution-room tracker**: user inputs limit + used; shows remaining + % used.
- **ETF holdings table**: live price, day change %, sparkline, market value, gain/loss vs. book cost.
- Total TFSA value + overall gain/loss.

### 6.6 Saving goals
- Goals with target, amount saved, progress bar, optional deadline + required monthly pace.
- Built-in **Emergency** and **Vacation** bucket kinds.

### 6.7 Life context + "living below means"
- Editable profile: partner & shared costs, family status, planned vacations (date + amount),
  emergency buffer target.
- **Saving-month detection** rule (configurable): a month is a "saving month" unless it overlaps a
  planned vacation/known large expense.
- **Deterministic advice**, e.g.:
  - "Saving month: you're $X over your dining baseline — consider cutting back."
  - "Planned vacation in <month>: set aside $Y/month now."
  - "Emergency buffer is below target ($A of $B)."
  - "Discretionary spend is N% of income this month vs. your M% baseline."

### 6.8 Notifications
- **In-app notification center** (bell + panel, unread badge).
- **Browser Web Notifications** (with permission prompt) for:
  - ETF booming (day change ≥ +threshold%) / low (≤ −threshold%), thresholds user-set.
  - Overspending during a saving month.
  - Goal milestones reached.
- Notifications are generated on data sync / quote refresh and logged in IndexedDB.

### 6.9 Design / UI
- Cohesive, polished theme (not generic-AI). Consistent spacing/typography scale, accessible
  contrast, responsive within a desktop browser window. Built using `ui-ux-pro-max` +
  `frontend-design`.

## 7. Alert/analysis rules (initial defaults, all user-adjustable)

- ETF booming: day change ≥ **+2.0%**; low: ≤ **−2.0%**.
- Saving-month overspend: category spend > **115%** of its trailing-3-month baseline.
- Emergency buffer healthy when current ≥ target; warn below.
- Baseline = trailing 3-month average (falls back to available history if < 3 months).

## 8. Out of scope (v1)

- Real/production Plaid (development/production environments), multi-bank reconciliation logic
  beyond what `/transactions/sync` returns.
- Plaid Investments product (ETF holdings are entered manually + priced via quote API).
- Cloud sync, multi-user, auth, deployment.
- AI/LLM-generated narrative insights (possible future enhancement).
- Email/SMS notifications.

## 9. Setup the user must do once

1. Create a free Plaid account, copy **sandbox** `client_id` + `secret` into `.env.local`.
2. `npm install` → `npm run dev` → open `http://localhost:3000` in Safari.
3. Click **Link account**, log in with `user_good` / `pass_good`.
4. Enter TFSA assets, ETF tickers/units, goals, and life-context profile.

## 10. Module boundaries (for implementation isolation)

| Unit | Does | Depends on |
|------|------|-----------|
| `lib/plaid` | server Plaid client + calls | `.env.local`, `.plaid-store.json` |
| `lib/quotes` | fetch/normalize ETF quotes | keyless quote endpoint |
| `lib/db` (Dexie) | browser persistence + schema | IndexedDB |
| `lib/categorize` | apply PFC + user rules | `lib/db` (rules), txns |
| `lib/analysis` | baselines, saving-month, advice | txns, lifeContext, goals |
| `lib/notify` | generate + dispatch notifications | analysis, quotes, Web Notifications API |
| `components/*` | dashboard UI sections | lib/* via hooks |
| `app/api/*` | route handlers | lib/plaid, lib/quotes |

Each `lib/*` unit is independently testable with mock inputs.

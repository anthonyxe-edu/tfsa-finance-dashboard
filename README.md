# TFSA & Personal Finance Dashboard

A **personal multi-user** finance dashboard. Sign in with your email (a 6-digit code) and your data
syncs across your phone and laptop via **Supabase** — each account's data is private (Postgres
row-level security). Deploy it to Vercel and add it to your iPhone home screen as a **standalone web
app**.

Track **TFSA** assets with **live ETF prices** and booming/low alerts, log **spending** (manually or
via CSV import) for category breakdowns and trends, manage **saving goals**, and get rule-based
"living below means" advice tailored to your life circumstances.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Deploy + add to your iPhone home screen

1. Push this repo to GitHub and import it at <https://vercel.com/new> (zero config — it's a standard
   Next.js app). The only API route, `/api/quotes`, runs as a Vercel serverless function.
2. Open your Vercel URL in **Safari on your iPhone**.
3. Tap **Share → Add to Home Screen**. It launches full-screen (standalone) with its own icon, like
   a native app.

### Backend setup (Supabase)

Set these in **Vercel → Settings → Environment Variables** (and `.env.local` for local dev — see
`.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project.
- `OWNER_EMAIL` — the account that gets Gmail e-transfer income auto-detection (others use manual).

**One-time email setup for the login code:** in Supabase → **Authentication → Email Templates →
Magic Link**, include `{{ .Token }}` in the template so the email shows a 6-digit code. The free
built-in email sender is rate-limited; add custom SMTP (e.g. Resend) for heavier use.

> Data lives in Supabase Postgres, scoped per account by row-level security, so the same login shows
> the same data on every device — and other accounts never see yours.

## Using it

- **TFSA** — add your ETF holdings (ticker + units + book cost; TSX ETFs use `.TO`, e.g. `XEQT.TO`).
  Live prices, day change, 30-day sparkline, gain/loss, and a contribution-room tracker.
- **Spending** — add transactions manually, or **Import CSV** (columns: `date, description, amount`
  with positive = expense, plus optional `category`). Get a category donut, monthly trend, top
  merchants, and vs-baseline deltas. Change any transaction's category to teach a reusable rule.
- **Goals** — targets with progress and monthly pace; built-in Emergency & Vacation buckets.
- **Life Context** — partner/shared costs, family status, planned vacations, emergency buffer. Drives
  the deterministic advice.
- **Notifications** — in-app center + optional browser notifications for ETF booming/low, saving-month
  overspend, and goal milestones, with configurable thresholds. Set the chequing balance on Overview.

## Tech

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Recharts · Dexie (IndexedDB) · Zod · Vitest.
Installable PWA (web manifest + apple-touch icon).

## Scripts

```bash
npm run dev      # local dev server
npm run build    # production build + typecheck
npm test         # unit tests (categorization, analysis, quotes, csv)
```

## Notes

- ETF quotes come from a keyless Yahoo Finance endpoint via the `/api/quotes` proxy. Prices are
  delayed and intended for personal tracking, not trading decisions.
- Design language follows a data-dense dark fintech system generated with the `ui-ux-pro-max` skill.

See `docs/superpowers/` for the original design spec and implementation plan.

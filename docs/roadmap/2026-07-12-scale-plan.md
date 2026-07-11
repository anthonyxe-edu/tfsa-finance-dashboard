# Scale Plan — from personal prototype to public app

> **For the executing agent (Opus, post-July-12):** work phases in order; each phase ends with
> a working, deployed app. The user is the product owner — confirm any paid service or
> irreversible step with them before acting. Repo: `github.com/anthonyxe-edu/tfsa-finance-dashboard`
> → Vercel (`tfsa-finance-dashboard.vercel.app`), Supabase project `sxtczkakmdmcakvlijng`.

## Context snapshot (what exists today)

- **Next.js 16 PWA**, olive-charcoal + neon-lime design, Alte Haas titles. Home = reactive
  three.js "anomalous matter" orb (shrinks + lime→red with budget burn) + orbital nav +
  Safe-to-Spend hero + streak + swipe notification deck. "Into the orb" zoom transitions.
- **Supabase**: email-OTP auth, per-user RLS tables (`transactions/goals/category_rules/
  notifications/app_kv`), realtime, web push (`push_subscriptions`, `push_log`,
  service-role-only `app_secrets` holding VAPID + cron secret), `push-self` + `push-sweep`
  edge functions, pg_cron every 6h.
- **Notifications**: daily 8am ET "money moment", 50/75/warn/over budget milestones,
  big-single-day rebalancing alert, goal milestones — push + in-app. Verified end-to-end.
- **Data in**: manual entry, dedupe-safe CSV import, and **owner-only** Gmail parsing of RBC
  "You made a purchase." alerts (`/api/rbc-purchases`) + Interac e-transfer income
  (`/api/income`). Deterministic merchant KB → categories. Goal-planner chat (no LLM).
- **Known fragilities**: Google OAuth app is in *Testing* → refresh token dies every 7 days
  (root cause of every "app stopped updating" incident); `OWNER_EMAIL` gating means only
  Anthony gets email import; Resend + VAPID + cron secrets were pasted in chat once.

## P0 — Stabilize (do first, ~1 session)

1. **Google OAuth to production**: user publishes the consent screen (Testing → In
   production), regenerates `GOOGLE_REFRESH_TOKEN`, updates Vercel env. Kills the 7-day
   token death. *Acceptance: `/api/income` and `/api/rbc-purchases` return data 8+ days later.*
2. **Rotate exposed secrets**: new Resend API key, new VAPID pair (update `app_secrets` +
   the public key baked in `lib/push.ts`), new cron secret. Re-subscribe push after VAPID swap.
3. **Connection-health card in Settings**: show Gmail-link status (`source` field from the
   two APIs) with a red badge + fix instructions when `unconfigured`. Silent decay was the
   worst UX failure so far — make it visible.
4. **Error telemetry**: add Sentry (or Vercel error monitoring) so client crashes are seen
   without the user reporting "page couldn't load".

## P1 — Data ingestion for the public (the "no more email receipts" question)

The RBC-email hack works for one person who banks at RBC. Options for everyone else, in
recommended order:

| Option | Cost | Effort | Coverage | Notes |
|---|---|---|---|---|
| **A. Inbound email forwarding (Resend)** | ~free | Low | Any bank that emails alerts | Each user gets `u_<id>@in.<domain>`; they add a bank-alert auto-forward filter once. Resend inbound webhook → parse (reuse RBC parser, add per-bank patterns) → insert txn. No OAuth, no bank creds. **Best first public option.** |
| **B. Per-user Gmail OAuth** | CASA Tier-2 audit ($1–5k/yr) | Med | Gmail users | `gmail.readonly` is a *restricted* scope → Google security assessment required for public apps. Defer until revenue. |
| **C. Plaid production (Canada)** | per-connected-account fees | Med | Most CA banks | Real auto-sync; requires production approval + billing. The "premium tier" feature. |
| **D. Flinks** | enterprise pricing | Med-High | CA-native coverage | Alternative to C; sales process. |
| **E. Open Banking (Canada)** | TBD | — | Future | Framework still rolling out; revisit 2027. |
| **F. CSV + manual** | free | Done | Universal | Already dedupe-safe; keep as universal fallback. |

Plan: build **A** (inbound forwarding) as the free tier, offer **C** (Plaid) as the paid
tier later. *Acceptance for A: a second real user (the girlfriend) gets transactions flowing
with zero CSV.*

## P2 — Multi-user hardening

- Remove `OWNER_EMAIL` gating: integrations become per-user rows (`user_integrations`
  table: kind, address/keys, status) instead of env vars.
- RLS audit (every table, every policy), rate-limit the public API routes, CAPTCHA or
  throttle on OTP requests, Supabase backups enabled, `push-sweep` batching if user count
  grows past ~100.
- Household/partner mode (shared view across two accounts — KOHO/Monarch pattern; the
  user + girlfriend are the first test case).

## P3 — Launch readiness

- **Legal**: privacy policy + ToS (PIPEDA — Canadian personal financial data), data-deletion
  flow (`delete my account` button that cascades), clear "not financial advice" copy.
- **Identity**: custom domain, app icons/splash set, App Store presence later via PWA wrapper
  (Capacitor) only if push/PWA limits start to hurt — iOS 16.4+ web push already covers the
  core need.
- **Pricing sketch**: free = manual/CSV/email-forwarding; paid ($4–6/mo) = Plaid auto-sync,
  partner mode, advanced insights. Payments via Stripe.

## P4 — Engagement backlog (post-launch, ordered by research impact)

1. **Weekly recap story** — Monday "wrapped"-style swipe deck (reuse `SwipeableCardDeck`).
2. **Swipe-to-categorize** — uncategorized txns as a card game; each swipe teaches a rule.
3. **RoundUps → goals** (KOHO's signature): round each purchase to the nearest $1/2/5 and
   auto-credit the difference to the most-underfunded goal (virtual, since we don't move money).
4. **NOMI-style insights**: "coffee spend up 40% vs your usual", duplicate-charge flags,
   subscription-price-hike detection from recurring merchant amounts.
5. **iOS home-screen widget** (needs the Capacitor wrapper) — Safe-to-Spend at a glance.
6. **Streak protection + celebration** (haptics, milestone confetti).

## Standing rules

- Never push to `main` without green `tsc` + `vitest` + `next build`.
- Every schema change via Supabase MCP `apply_migration` with RLS from day one.
- The orb stays code-driven and data-reactive; generated media only for static assets.
- Mobile-first: no hover-only interactions, 44px touch targets, reduced-motion respected.

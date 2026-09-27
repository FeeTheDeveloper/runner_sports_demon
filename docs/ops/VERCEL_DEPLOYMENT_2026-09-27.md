# Runner Site Vercel deployment — September 27, 2026

Preparation record for deploying `FeeTheDeveloper/runner_sports-site`. No deployment has been created and no domain has been attached.

## Provisioned

| Item | Value |
| --- | --- |
| Project | `runner-sports-site` |
| Project ID | `prj_A5nLYgVKoz7J4FyWD21rWjGg9oUM` |
| Team | `team_mjDCwdXOv5dHtOGdxnyqqVcE` |
| Framework | `nextjs` (Next.js 15.5.25) |
| Node | 24.x |
| Git | Connected to `FeeTheDeveloper/runner_sports-site` (GitHub) |
| Vercel Auth | Enabled, `all_except_custom_domains` — previews stay private |
| Domains attached | None |
| Deployments | None (`live: false`) |

Verified before provisioning: `next build` compiles clean (~30 routes, middleware 92.1 kB).

## Environment variables

Seven non-secret config values are set. Twenty-four remain, all of which must come from the owner.

Set (plain, non-secret):

`KALSHI_ENV=production` · `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` · `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up` · `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/picks` · `NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/picks` · `RUNNER_CHECKOUT_ENABLED=false` · `NEXT_PUBLIC_APP_URL=https://werunsportsandanalytics.com` (production target only)

`RUNNER_CHECKOUT_ENABLED` is deliberately `false`. Do not flip it until the Stripe merchant account and terms are confirmed.

Missing, grouped by origin:

- **Clerk** — `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_EXPECTED_FRONTEND_API`
- **Stripe** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_EXPECTED_ACCOUNT_ID`, `STRIPE_BILLING_MODE`, `STRIPE_PRICE_RUNNER_PLUS_MONTHLY`, `STRIPE_PRICE_RUNNER_PLUS_YEARLY`, `STRIPE_PRICE_RUNNER_PRO_MONTHLY`, `STRIPE_PRICE_RUNNER_PRO_YEARLY`, `STRIPE_PRICE_RUNNER_PREMIUM_YEARLY`, `STRIPE_PRICE_RUNNER_PREMIUM_PLUS_LIFETIME`, `STRIPE_COUPON_MILITARY20` (see the site repo pricing decision, 2026-09-27)
- **Supabase** — `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_EXPECTED_PROJECT_REF`
- **Market feeds** — `ODDS_API_KEY`, `KALSHI_API_KEY_ID`, `KALSHI_PRIVATE_KEY_BASE64`
- **Runner platform** — `RUNNER_DEMON_API_URL`, `RUNNER_MCP_BEARER_TOKEN`, `RUNNER_ADMIN_BOOTSTRAP_EMAILS`, `CRON_SECRET`, `HUTCHROK_VERIFICATION_SECRET`, `RUNNER_SITE_DRIVE_IMPORT_DIR`, `RUNNER_SITE_DRIVE_EXPORT_DIR`

Secrets are entered by the owner directly in the Vercel project's environment settings. They are not to pass through assistant chat, tool parameters, logs, commits or documentation. Presence is verified by key name only.

## Blockers before a deployment is worth making

1. **Uncommitted work.** `release/runner-production` is at `eeee1e3`, identical to `origin`, but the working tree holds **92 modified files** — entitlement gates, the admin manual-access system, premium UI. A Git-linked deploy builds `origin`, so it would ship without any of it. Commit and push first. Per `AGENTS.md` a push requires explicit owner authorization for that exact action.

2. **Clerk keys gate the whole product.** `middleware.ts` guards on `isClerkConfigured()`, so a keyless deploy does not crash — it silently redirects every protected route to `/sign-in`, and sign-in does not work. That covers `/picks`, `/edge`, `/research`, `/systems`, `/models`, `/tracker`, `/props`, `/markets`, `/prediction-markets`, `/analytics`, `/games`, `/odds`, `/teams`, `/players`, `/sportsbooks`, `/admin`, `/dashboard`, `/billing`, `/account`. The result is a marketing shell, not the product.

3. **No public Demon host.** `.env.example` carries `RUNNER_DEMON_API_URL=http://localhost:8787`. A Vercel deployment cannot reach localhost, and no production Demon hostname has ever been verified (see `docs/ai-sync/DEPLOYMENT_STATUS.md`). This value was deliberately left unset rather than seeded with a localhost URL that would fail at runtime. Market and edge surfaces that depend on the Demon API will not resolve until a reachable host exists.

4. **Cron secret.** `vercel.json` registers three crons (`/api/cron/sync-odds` every 15m, `/api/cron/sync-prediction-markets` every 10m, `/api/cron/sync-espn` every 5m). These begin firing on the first production deployment. `CRON_SECRET` must be set before that, or the endpoints run unauthenticated.

5. **Domain.** `werunsportsandanalytics.com` resolves to `216.150.1.1` (Vercel anycast) and returns `HTTP 404, server: Vercel`. The Vercel account holds **zero registered domains**, so the domain points at Vercel but is attached to no project here. Attaching it is the final step, after a preview is verified.

## Sequence

1. Owner commits and pushes the 92 files to `release/runner-production`.
2. Owner enters the 24 environment variables in Vercel.
3. Push produces a **preview** deployment — `release/runner-production` is not the production branch, and Vercel Auth keeps it private.
4. Verify the preview: `/api/health`, sign-in, an entitlement-gated route, and a market surface.
5. Promote to production.
6. Attach `werunsportsandanalytics.com` and re-verify the root and `/api/health`.

## Rollback

Delete the Vercel project. Nothing else was mutated: no deployment, no domain assignment, no DNS change, no commit, no push, no Stripe/Clerk/Supabase configuration.

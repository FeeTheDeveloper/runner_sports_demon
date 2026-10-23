# Runner Sports & Analytics — Go-Live Plan

**Repo:** `FeeTheDeveloper/runner_sports-site` (Next.js/TypeScript, App Router)
**Current state:** Full UI + API route layer (`/api/games`, `/api/props`, `/api/edges`, `/api/models`, `/api/markets`, `/api/signals`, `/api/tracker`) all backed by hardcoded mock arrays in `lib/data/*.ts`.
**Goal:** Swap the mock data for real odds/game data, persist the bet tracker in a real database, deploy publicly on a real domain, and fix the correctness bug found in code review (the `force-dynamic` export that currently does nothing).

Scope for this pass, per your decisions: real data + public deploy first, no login/paywall yet, Supabase as the database.

---

## 1. Accounts to create (in this order)

| # | Service | What it's for | Link | Cost to start |
|---|---------|----------------|------|----------------|
| 1 | **The Odds API** | Live odds/lines (moneyline, spread, totals) across major sportsbooks, all sports you're covering (NFL/NBA/MLB/NHL) | [the-odds-api.com](https://the-odds-api.com/) | Free tier: 500 credits/mo. Paid starts at $30/mo for 20,000 credits/mo |
| 2 | **Supabase** | Postgres database for the bet tracker + an odds cache table (so you're not hammering The Odds API on every page load) | [supabase.com/dashboard/sign-up](https://supabase.com/dashboard/sign-up) | Free tier: 500MB DB, unlimited API requests, projects pause after 7 days idle |
| 3 | **Vercel** | Hosting/deploy target for the Next.js app (connects directly to your GitHub repo, auto-deploys on push) | [vercel.com/signup](https://vercel.com/signup) | Free (Hobby) tier is enough to launch; Pro is $20/mo if you need team seats or higher limits |
| 4 | **Domain registrar** (if you don't already own a domain) | Public URL for the site (e.g. `runnersportsanalytics.com`) | Buy through Vercel's dashboard once logged in, or [Cloudflare Registrar](https://dash.cloudflare.com/sign-up) (at-cost pricing, no markup) | ~$10–15/yr |

Sign up for The Odds API and Supabase first — you'll need their keys before the code changes below can be tested locally. Vercel can wait until the code is ready to deploy.

### Getting your keys
- **The Odds API**: sign up → pick the free plan to start → the API key is emailed and also shown in your account dashboard. Copy it.
- **Supabase**: create a new project → once it provisions, go to *Project Settings → API* → copy the **Project URL**, the **anon public key**, and the **service_role key** (service role is server-only, never expose it client-side).
- **Vercel**: sign up with GitHub (same account that owns the repo) so the git integration is one click.

---

## 2. What has to change in the code

The current `lib/data/*.ts` files return hardcoded arrays. Each one needs to become a real data source:

1. **`lib/data/games.ts`, `props.ts`, `markets.ts`, `signals.ts`** — sourced from The Odds API, but *not* called directly on every request. Instead:
   - A scheduled job (Vercel Cron hitting a `/api/cron/sync-odds` route every 10–15 minutes) pulls fresh odds from The Odds API and upserts them into Supabase tables (`games`, `props`, `market_movements`, `signals`).
   - The `lib/data/*.ts` functions read from Supabase, not from The Odds API directly. This keeps you well under the free/starter API quota and keeps page loads fast.
2. **`lib/data/edges.ts`, `models.ts`** — these are Runner Sports & Analytics' own derived output (model probability vs. market-implied probability). Add a small calculation module that converts American odds to implied probability, removes the vig, and computes edge — versioned per your company's model-documentation standard (e.g. `RSA NFL GAME MODEL v0.1`) since it starts as a baseline heuristic, not a trained model.
3. **`lib/data/tracker.ts`** — becomes real reads/writes against a Supabase `tracked_bets` table. Add `POST /api/tracker` (log a bet) alongside the existing `GET` routes.
4. **Fix the code-review finding**: `lib/api/response.ts` currently exports `dynamic = "force-dynamic"`, which Next.js silently ignores because it's not declared in each route file. Since data will now live in Supabase and refresh every few minutes via cron, the right fix is `export const revalidate = 60` (or similar) declared directly in each route file — not a blanket force-dynamic hack.
5. **Environment/config validation** — add a small `lib/env.ts` that validates all required env vars (`ODDS_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) at boot with a clear error if one's missing, instead of failing confusingly deep inside a data fetch.
6. **Responsible-gambling disclaimer** — add a footer/legal note ("for informational purposes only, odds subject to change, 21+ where applicable") and a link to current problem-gambling resources. This is standard practice for any sports-odds product and matches your own project's rule against words like "guaranteed" or "lock." I'm not a lawyer — if you're advertising real odds/edges publicly across states, it's worth a quick pass by counsel on any state-specific disclosure requirements before wide promotion.

---

## 3. Copy-paste prompt for Claude Code (VS Code)

Open the repo in VS Code with the Claude Code extension, make sure your `.env.local` has the four keys above set, then paste this in as one task:

```
I'm taking Runner Sports & Analytics live. Repo context: Next.js App Router app,
lib/data/*.ts currently return hardcoded mock arrays, app/api/* are thin route
handlers over lib/data, lib/api/response.ts has shared ok()/notFound()/paginate()
helpers. I have accounts and API keys for: The Odds API (ODDS_API_KEY), Supabase
(SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY). No auth/paywall in
this pass — public data only.

Please do the following, in order, committing after each logical step:

1. Add `lib/env.ts` that validates ODDS_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY,
   and SUPABASE_SERVICE_ROLE_KEY are present at startup (zod is fine, or a plain
   check that throws a clear error naming the missing var).

2. Add a Supabase server client (`lib/supabase/server.ts`, using the service role
   key, server-only — never imported into a client component) and design a schema
   for: games, props, market_movements, signals, and tracked_bets, mirroring the
   shapes already defined in types/index.ts. Write the SQL migration as a file
   under supabase/migrations/ rather than applying it ad hoc.

3. Add a lib/providers/oddsApi.ts module that calls The Odds API for NFL, NBA,
   MLB, and NHL (sport keys: americanfootball_nfl, basketball_nba, baseball_mlb,
   icehockey_nhl), fetching moneyline/spread/totals odds and mapping the response
   into our internal Game/PlayerProp shapes from types/index.ts.

4. Add app/api/cron/sync-odds/route.ts that calls oddsApi.ts and upserts results
   into the Supabase games/props/market_movements/signals tables. Protect it with
   a shared secret header check (CRON_SECRET env var) so it can't be triggered by
   the public. Add the matching vercel.json cron schedule (every 15 minutes).

5. Rewrite lib/data/games.ts, props.ts, markets.ts, signals.ts to read from
   Supabase instead of returning mock arrays, keeping the exact same exported
   function signatures (getGames, getGameById, getProps, getPropsByGame, etc.)
   so app/api/* routes don't need to change.

6. Add lib/models/edgeCalculator.ts: convert American odds to implied probability,
   devig a two-way market, and compute edge (model probability - implied
   probability). Version this as "RSA NFL GAME MODEL v0.1" / equivalent per sport
   in a comment block documenting objective, inputs, assumptions, and known
   weaknesses (this is a baseline heuristic, not a trained model — say so).
   Wire lib/data/edges.ts and models.ts to use it against the live odds data.

7. Rewrite lib/data/tracker.ts to read/write a Supabase tracked_bets table. Add
   POST /api/tracker so bets can actually be logged, keeping the existing GET
   /api/tracker, GET /api/tracker/:id, and GET /api/tracker/summary contracts.

8. Fix the dynamic-rendering bug: remove the no-op `export const dynamic =
   "force-dynamic"` from lib/api/response.ts and instead add
   `export const revalidate = 60` (adjust per route as appropriate) directly in
   each app/api/**/route.ts file.

9. Add a responsible-gambling disclaimer component in the footer/layout:
   informational-only language, no "guaranteed"/"lock" wording, and a link out
   to current problem-gambling resources (I'll supply final copy before this
   goes live publicly — use a placeholder marked TODO for now).

10. Update the README's API section and .env.example with the new required
    environment variables, and add a short SETUP.md covering: creating the
    Supabase project, running the migration, setting env vars locally and in
    Vercel, and how the cron job works.

Run `npm run build` and `npm run lint` after each major step and fix anything
that breaks before moving to the next step. Do not commit real API keys or the
service role key — confirm .env.local is gitignored before finishing.
```

---

## 4. Deploying to Vercel

Once the code changes above build cleanly locally:

1. Go to [vercel.com/new](https://vercel.com/new), sign in with GitHub, and import `FeeTheDeveloper/runner_sports-site`.
2. Vercel auto-detects Next.js — no build config changes needed.
3. In **Project Settings → Environment Variables**, add: `ODDS_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`. Mark the service role key and cron secret as sensitive.
4. Deploy. Vercel gives you a `*.vercel.app` URL immediately — that's your staging/production URL until a custom domain is attached.
5. If you bought a domain, go to **Project Settings → Domains** and add it; Vercel walks you through the DNS records.
6. Confirm the cron job is registered under **Project Settings → Cron Jobs** (from the `vercel.json` config added in step 4 of the Claude Code prompt above).

Every future push to `main` auto-deploys; pushes to other branches get their own preview URL for testing before merging.

---

## 5. Post-launch smoke test checklist

- [ ] `/api/health` returns 200
- [ ] `/api/games` returns real, current games (not last week's mock dates)
- [ ] `/api/props` and `/api/edges` reflect the same live game IDs
- [ ] Cron job ran at least once (check Supabase table row counts increasing over time)
- [ ] `POST /api/tracker` successfully writes a row and `GET /api/tracker` shows it
- [ ] Disclaimer/footer renders on every page
- [ ] No API keys visible in browser dev tools → Network tab or page source

---

## 6. Deferred to a later phase (per your scope decision)

- User accounts / login (Clerk is already available as a connected tool when you're ready)
- Subscription/paywall gating (Stripe)
- Swapping The Odds API for a deeper provider (SportsDataIO/Sportradar) once revenue justifies the cost
- Formal legal review of gambling-content disclosures for the states you're marketing in

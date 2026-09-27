# Runner platform diagnostic

Reviewed September 26, 2026 using Runner Sports Plug's installed instructions and locked reference. This is the required diagnostic before architectural implementation. Repository evidence is distinguished from runtime/provider verification.

## Objective and source of truth

The supplied full platform order defines the target journey: SPORT → SLATE → GAME → PLAYER → SYSTEM → MARKET → LIVE STATE → RESULT. The earlier component sheet supplies C01–C24 and security-first gates. The new order does not erase those release gates.

Local inspection: Demon branch `feat/runner-demon-cockpit`, HEAD `101ece3`; Site branch `release/runner-production`, HEAD `eeee1e3`. Existing cockpit, representative profiles and Site homepage/navigation/Sunday/package changes must be preserved. No replacement app or third presentation repository is needed.

## Required diagnostic inventory

| # | Area | Current evidence | Gap / verification boundary |
| --- | --- | --- | --- |
| 1 | Architecture | Demon owns intelligence and SQLite; Site owns Next.js presentation/Supabase curated read models; Verse owns historical acquisition. See REPOSITORY_OWNERSHIP.md | Cross-repository consumer acceptance is incomplete |
| 2 | Implemented features | Demon market normalization/cache/storage, provider clients, games discovery, totals engine, observations, local cockpit, schema-validated fixture content | Existing functionality is not complete research-product parity |
| 3 | Incomplete features | General replay/calibration, live play-by-play, system execution, approved result ledger | Do not turn these into live/complete labels |
| 4 | Data integrations | Demon ESPN, Kalshi, Polymarket and Odds API clients; Site provider adapters and cron routes | Code presence does not establish credentials, rights or current success |
| 5 | Broken/unverified integrations | Prior saved market samples are historical; provider/control consumer execution not established | Do not label an untested adapter broken; classify runtime state UNKNOWN until checked |
| 6 | Schemas | Demon event/price/health/game/observation/totals/history storage; Site games, props, tracked_bets, prediction markets, ESPN records, published intelligence and commands | No first-class complete systems/candidate/result schema; tracker lacks ownership |
| 7 | Prediction | Baseline market-implied calculations and uncalibrated football totals heuristic; curated forecast reader/publisher contracts exist | No independently validated production projection/distribution pipeline proven |
| 8 | Game Flow | Existing observations, state transitions, totals runtime and replay module | Reuse these; live feed availability and late/duplicate-event behavior need acceptance |
| 9 | Player Lab | Site /players index and props discovery exist | No app/players/[id] route in current inventory; joined logs, systems and projection evidence incomplete |
| 10 | Game Lab | Site /games and /games/[id], GameDetail components, ESPN facts | Tab presence does not prove supported/connected data; canonical joins need tests |
| 11 | Market Lab | /odds, /markets, prediction-market routes, movement/provider readers | Same-line freshness, suspension and execution costs need end-to-end checks |
| 12 | Live Desk | Demon Game Flow plus Site /api/runner/live and game-flow readers | No verified complete supported-game live research journey |
| 13 | Website | Existing shell, account/paywall/admin, research/game/prop/market routes; user Sunday work in progress | Preserve current design work; direct API entitlement checks need audit |
| 14 | History | Verse handoff records describe NFL 2025 exports; Demon raw-season manifests and historical tables exist | Revalidate file hashes/import acceptance; source history alone does not provide historical market prices |
| 15 | Systems/backtesting | Generic backtest foundation and totals replay; Site fixed example system rows | Immutable system/rule/run/candidate/snapshot/result/performance engine missing |
| 16 | Market prices | Stored market prices plus Site Odds API snapshots; 15-minute odds cron documented in vercel.json | Research snapshots are not verified executable quotes |
| 17 | Deployment | Prior local checks are in docs/ops; no current production deployment/auth/provider acceptance established | PRODUCTION NOT READY; local service/build success cannot change this |
| 18 | Missing requirements | Systems Engine, Player detail, independent supported forecasts, fresh comparable quotes, supported live ingest, immutable receipts, security containment | See parity/gate documents in this directory |

## CRITICAL

Tracker routes call privileged readers without an authenticated owner boundary. Site `app/api/tracker/route.ts`, `[id]/route.ts`, `summary/route.ts` and `lib/data/tracker.ts` select tracked_bets without caller scope. `lib/supabase/server.ts` uses the service-role key. Page middleware protects /tracker but does not authenticate these APIs. This is a repository-confirmed exposure path if deployed; actual production exposure is not asserted.

## HIGH

- Demon `src/publishing/sitePublisher.ts` defaults RUNNER_PUBLISH_ENABLED to true. Credential presence can activate publishing on ordinary ingestion.
- Site `app/mcp/route.ts` places bearerToken in command tool input, including force_publish; `lib/data/runnerControls.ts` uses shared-token authorization without per-command capability/approval receipts.
- Site `lib/data/edges.ts` assigns market consensus to modelProbability. This conflicts with the required independent Runner estimate.
- Site `app/systems/page.tsx` displays fixed example performance and live counts. A footer disclaimer does not provide metric-level evidence.

## MEDIUM

- Demon async setInterval ingestion can overlap; shutdown/drain and idempotent replay need verification.
- ESPN sourceTimestamp is assigned from event kickoff in the legacy normalizer. Event time and provider observation time must remain distinct.
- Systems rule/version/cutoff/price/settlement contracts must be fixed before a performance UI is populated.
- API entitlements and quote freshness are not established by page middleware or a green UI badge.

## LOW

The Site package has no test script and its lint script is `next lint`. The current build and lint passed; tooling warns about the inferred parent workspace root and lint deprecation. Site contains owner work that must be preserved. Demon was clean before this documentation pass; prior cockpit and representative work is now included in its inspected HEAD.

## TESTS REQUIRED

Anonymous/free/subscriber/admin/cross-user/missing-provider authorization; same-line/selection/quote-expiry and missing-model contract tests; provider failure/retry; immutable rules, point-in-time joins and leakage prevention; deterministic replay and settlement corrections; desktop/mobile/keyboard full journey; staging migration/restore and deployed identity isolation.

## RECOMMENDED CHANGES

1. Contain tracker and publishing/command boundaries before public release.
2. Separate market consensus from Runner estimates and enforce explicit freshness/comparability.
3. Complete reference and parity inventories with observed evidence, including unavailable/paywalled states.
4. Build one engine-backed NFL/NCAAF slice using existing architecture, then expand sports by verified adapter/model support.
5. Implement Systems Engine records before Systems Directory performance, and publication receipts before official results claims.

## Completion boundary

This diagnostic exists and satisfies the document prerequisite for subsequent engineering. It does not certify full reference reconnaissance, live providers, model calibration, database migration, deployment, or completed platform parity. Current production status: **NOT READY**.

# Production release candidate — September 26, 2026

## Status

**NOT READY for production release. Local hardening is implemented; provider configuration, schema rollout and deployed acceptance remain gates.** This report supersedes the earlier documentation-only audit where findings now have fixes. It does not declare full research-platform parity or calibrated forecasts.

Source baseline: Demon `d27471c`, work branch `fix/production-readiness`. Companion Site changes remain isolated from pre-existing homepage/navigation/Sunday/package work as far as possible; required truth-contract fixes also update those existing consumers. No remote push, merge, deployment, production database mutation, trading or publication occurred.

## Implemented repairs

| Area | Change | Verification |
| --- | --- | --- |
| Publishing | Explicit opt-in in code/example/local environment; direct publisher methods honor disabled state; failed heartbeat retries; provider response bodies excluded from errors | Publisher regression program |
| Model acceptance | Registry version matches football-heuristic-v1, marked research; forecast/totals/window/signal publication requires reviewed production model registry evidence | Unregistered/heuristic publication denied by tests |
| Price claims | Forecast publication withholds executable price/edge; source quote remains explicitly indicative | Publisher contract review |
| Polling | Completion-based single-flight scheduling; stop/abort drains active task and prevents rescheduling | Slow-task, stop, retry and aborted-start tests |
| Storage | Persist market/totals/observation state before publishing in-memory result; SQLite stops at first SQL error and enforces foreign keys | Disk-failure and transaction rollback tests |
| Game Flow retries | Hydrate durable event history after restart; preserve equivalent JSON retries; reject conflicting IDs and incomplete-history snapshots transactionally | Restart/retry, reordered JSON and stale-history rollback tests |
| Recovery | Verified consistent SQLite backup; export covers all 35 application tables; imported columns/values validated and all tables applied atomically | Backup/restore/repeat-import, malformed columns and late-failure rollback tests |
| API | Production/nonloopback/explicit-proxy authentication, malformed-input validation, bounded body, method fences, async error containment | Loopback HTTP integration tests |
| Identity | Verified 32-team NFL full-name mapping aligns ESPN and Odds API IDs; conflicting/unknown identities fail closed | All-team join/unknown/conflict tests |
| Time | ESPN kickoff remains event time; sourceTimestamp uses declared receipt basis and sourceUpdatedAt is null when unavailable | Schedule normalization tests |
| Site tracker | Verified session owner required in privileged data layer, list/detail/summary/insert scoped, HTTP failures masked | Site security regressions and anonymous HTTP checks |
| Site administration | Verified primary email required for email-based grants; bound grants cannot transfer by email | Site access regressions |
| Site MCP | Remote command tools removed; legacy command writers fail before DB access | Tool-list/runtime and denial tests |
| Site data truth | Example Systems statistics removed; consensus distinct from model output; stale/mismatched-book/line comparisons suppressed | Site market-truth regressions |
| Dependencies and CI | Compatible Site updates and scoped Next/PostCSS override; regression/build/audit gates in both repositories | Zero production dependency advisories in both local audits; hosted CI not yet run |

## Audit priorities

### CRITICAL

Cross-user tracker access through the privileged Site reader is repaired locally. The live schema has no ownership column yet; the coordinated migration/application rollout and actual two-account acceptance remain mandatory before tracker release.

### HIGH

Unauthenticated engine access, remote MCP command capability gaps, unsafe publisher defaults and unsupported forecast claims are repaired or disabled locally. The public domain currently returns 404, the intended deployment is unverified, and production provider credentials/freshness and model acceptance remain unestablished. No production security repair is claimed until the reviewed build is deployed and verified.

### MEDIUM

Polling overlap, partial restore, stale restart snapshots, non-idempotent observation retry, timestamp meaning and NFL identity joins are repaired locally. Historical identity reconciliation, runtime monitoring, backup retention and restore ownership remain release tasks.

### LOW

Site build warnings remain for the inferred workspace root with multiple lockfiles and future removal of `next lint`. Game Flow currently reads all persisted observations for an event on mutation; measure large-history load before increasing traffic.

### TESTS REQUIRED

Actual Clerk account A/B isolation, PostgreSQL role/constraint acceptance, deployed MCP denial, supervised feed failure/recovery, end-to-end Site handoffs and target-host backup/restore remain required. Full-platform model performance cannot be accepted without calibration and independent validation data.

### RECOMMENDED CHANGES

Release the reviewed local security/recovery fixes through a coordinated maintenance operation once the exact deployment and authorization are supplied. Keep tracker traffic stopped during migration and unsupported models/remote controls unavailable. Follow the remaining release gates below; do not label this full-platform production ready.

## Final local verification

| Check | Result | Limit |
| --- | --- | --- |
| Demon `npm test` (includes build) | PASS: 15 programs | Local integration and disposable databases |
| Demon contracts/system validation | PASS: 12 contracts, 5 handoffs, repository presence | Structural checks; not live consumer acceptance |
| Site `npm test` | PASS: 16 tests | External identity/storage boundaries mocked |
| Site build/lint | PASS: 32 static pages | No deployment implied |
| Both `npm audit --omit=dev` | Zero vulnerabilities reported | Recheck current advisories at release |
| Site built HTTP smoke | Four anonymous tracker routes/methods: 401/no-store; MCP: 13 read-only tools, zero commands | Local runtime; not two-account acceptance |
| Sharp native resize/PNG smoke | PASS | Local native dependency compatibility |
| Diff whitespace check | PASS in both repositories | Changes remain uncommitted |

## Provider and configuration evidence

- Supabase MCP identified **Runner Sports**, project `vrhvvywncclonfwplsjl`, with provider status ACTIVE_HEALTHY. Read-only schema inspection confirms tracked_bets has no owner column; RLS is enabled and no policies were returned for tracked_bets/control commands/results. No private tracker rows were read.
- Live read-only ESPN CFB fetch returned 65 scheduled/event records for September 26. Kalshi discovery returned two sampled markets. Receipt times were September 27, 02:18 UTC (September 26 locally). These checks did not ingest/persist data and do not prove authenticated quotes, canonical sports mapping or executable liquidity.
- Saved local SQLite remained readable with 1,413 markets and 39,236 price/event records; recorded Kalshi/Polymarket health is stale. A separate successful request does not refresh that stored state.
- Configured a new local engine bearer token only in ignored .env, enabled engine read authentication, and set local publishing false. No credential was printed or committed. Live local API check returned health 200, anonymous markets 401 and authenticated markets 200; the test server was stopped.
- Odds API and Site publishing credentials are absent from this engine environment. Kalshi authentication was not established; public discovery is distinct from authenticated access.
- Vercel returned the Fee The Developer team and a page of 20 projects without the expected Site project. Its direct project lookup failed tool argument validation. This does not prove no deployment exists. No different Runner-named project was substituted.
- Live HEAD requests to `https://werunsportsandanalytics.com/` and `/api/health` both returned HTTP 404 with server Vercel. The cause and domain/project binding remain unverified; the public Site is not accepted as healthy.
- Production host is awaiting owner identification. No persistent service or startup task was installed.

## Schema and migration plan

Demon initialization adds an observation immutability trigger. Historical tables are included in export/restore; no existing production database was initialized or changed during this pass. Tests used disposable databases.

Site migration: `runner_sports-site/supabase/migrations/20260926000000_tracker_ownership.sql`. Adds owner_user_id and an owner/date index, forces RLS, revokes direct public/anon/authenticated access and rejects future unowned records. Existing NULL-owner records remain quarantined; no inferred ownership, backfill or deletion.

Before rollout, retain a verified backup and prevent the old tracker endpoints from serving traffic. Apply the owner-approved migration and release the fixed application as a coordinated maintenance operation. Verify anonymous denial plus two entitled accounts A/B: each list/summary/detail sees only its own rows; owner spoofing cannot change ownership. Never roll back to the old unscoped service-role reader. If validation fails, keep tracker unavailable and use a forward fix.

## Required production configuration

Engine: supported Node >=22, sqlite3 on PATH, persistent local storage, NODE_ENV=production, a long random RUNNER_API_BEARER_TOKEN, explicit bind/proxy and TLS, approved provider credentials as needed. RUNNER_PUBLISH_ENABLED stays false until publication to the exact destination is authorized. The local dashboard is an operator-only loopback surface and must not be exposed through a public reverse proxy.

Site: apply owner migration, verify Clerk and Supabase target identity, preserve server-only service credentials, deploy the reviewed source, verify entitlement and cross-user behavior. Remote command execution stays disabled pending per-principal capabilities, audited action approval and idempotent command infrastructure.

## Backup and restore rehearsal

`npm run scout -- backup <new-local-file.db>` creates and integrity-checks a consistent snapshot without overwriting an existing destination. `npm run scout -- export <new-directory>` uses a consistent temporary backup and exports every application table. Imports validate schema columns and execute as one transaction. Prefer restoring to a new database path, checking integrity/counts and switching the stopped engine to it after verification. Do not copy a live SQLite database file without its journal state.

The backup uses SQLite [VACUUM INTO](https://www.sqlite.org/lang_vacuum.html), which leaves the source unchanged and produces a consistent snapshot. SQLite's [CLI error-stop control](https://www.sqlite.org/cli.html) prevents later statements from committing after an earlier failure. Interrupted backup destinations must not be treated as valid until integrity verification passes.

## Remaining release gates

1. Identify the exact production host/deployment and approve the final external rollout actions.
2. Apply the reviewed Site ownership migration and deploy the fixes; run actual cross-account acceptance. Unit mocks are not a live identity test.
3. Configure required providers in the selected runtime; prove fresh, mapped same-line quotes and source failure handling there.
4. Validate Site consumer handoffs and fresh engine health after supervised startup; establish monitoring, backup retention and recovery ownership.
5. Keep unsupported model outputs unavailable. Independent calibrated models, full live PBP, Systems Engine, permanent receipts and complete reference parity remain unfinished product work.
6. Reconcile historical NFL identifiers explicitly before joining old nickname-prefix records with newly corrected canonical IDs; no silent historical rewrite was performed.

The passing local suite establishes the tested fixes. It does not establish deployed security, full-platform completion, predictive performance or authority to trade.

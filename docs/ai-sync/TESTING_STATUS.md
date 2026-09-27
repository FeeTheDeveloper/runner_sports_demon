# Testing status

Operations package: all 14 test programs/build, typecheck, 12 contract metadata checks, data/card validation, 5 artifact hashes and 11 historical hashes passed. Local HTTP verified; lint has no configured script. See [dated evidence](../ops/MACHINE_STATE_2026-09-26.md).

## Runner Sports Plug operating audit — September 26, 2026

`npm run build`, all 13 `npm test` programs, `npm run contracts:validate`, `npm run system:validate`, and SQLite `PRAGMA quick_check` passed. The read-only dashboard returned HTTP 200 for `/` and `/control/status` on `127.0.0.1:8790`. These checks do not establish live provider freshness, production health, Site publication safety, or autonomous plugin execution. See [the dated operating audit](RUNNER_PLUGIN_OPERATIONS_2026-09-26.md).

## Repository audit â€” September 16, 2026

After the authenticated-upload, API binding/body-limit, and totals-expiry fixes, `npm run build`, all 13 test programs, `npm run contracts:validate`, `npm run system:validate`, `git diff --check`, and `npm audit --omit=dev` passed. Regression assertions cover elapsed totals windows being excluded from alerts and oversized authenticated mutation requests being rejected. This is local verification; live providers and cloud publishing were not exercised.

## System check and sample task — September 16, 2026, 9:26 PM Central

Re-ran build/all 13 tests, contract validation, repository-presence validation and SQLite `quick_check`: all passed. The running dashboard returned HTTP 200. A live ESPN NFL schedule request for September 17 returned Detroit at Buffalo with valid identity/timestamps and unchanged saved engine counts. Market-provider telemetry remains stale and no engine API listener was found on port 8787. See [the system check report](SYSTEM_CHECK_2026-09-16.md) for evidence and limits.

## Local control dashboard — 2026-09-16

`npm run build`, `npm test` (all 13 programs), `npm run contracts:validate`, and diff whitespace checks passed after implementation. The new tests cover read-only SQLite inspection and field projection, timestamp freshness and expiry, missing/corrupt databases, real loopback HTTP requests, method/Host restrictions, legacy API authentication, emitted-client navigation, pause/resume, refresh, search/filter behavior and hostile-title escaping.

The launched server returned HTTP 200 for `/` and `/control/status` on port 8790, with a readable local database and current repository metadata. It listens only on `127.0.0.1`. No browser session was connected, so layout/visual browser inspection was not performed; client interactions ran against a minimal DOM in Node. Live provider schedules were not fetched as part of automated validation.

## Earlier bootstrap validation

Executed locally on 2026-09-16, Windows PowerShell, Node 24.13.0, npm 11.6.2. Existing dependencies and sqlite3 executable were available; no dependency reinstall was required.

| Check | Result | Scope |
|---|---|---|
| `npm run build` | PASS | Strict TypeScript compilation |
| `npm test` | PASS | Build plus ten compiled assertion-based test programs |
| `npm run contracts:validate` | PASS | Ten contract files and five handoffs; structural metadata checks, not full JSON Schema instance validation |
| `npm run system:validate` | PASS | Demon/Verse/Site Git checkout presence; Verse has no package.json, expected for a non-Node repository; no sibling build performed |
| Documentation/ignore review | PASS | All fourteen requested files exist, relative Markdown links resolve, claim JSON parses, `.ai/local/` is ignored, and `git diff --check` passes |

Test programs cover normalization, probability, game flow, games, totals, totals engine/replay, Site publishing, vig, adversity, and historical schema. Site publisher tests replace fetch with a mock. Passing tests do not prove live API/provider connectivity, credentials, complete persistence recovery, API auth/CORS end-to-end behavior, calibrated models or deployed operation.

CI configuration in `.github/workflows/ci.yml` uses Ubuntu with Node 22, installs sqlite3, and runs `npm ci`, build and tests. This local result uses Node 24; no current remote CI result was retrieved.

This bootstrap changes documentation, ignore rules and environment-example comments/entries only. No new runtime tests were added. Live services, history imports, cloud publishing, Drive tasks and sibling builds were not run. Online dependency vulnerability scanning was not part of this audit.

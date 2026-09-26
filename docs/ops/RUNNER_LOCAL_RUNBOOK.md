# Runner local operations runbook

Run from the Demon checkout in PowerShell with Node >=22, npm and sqlite3 available. Read AGENTS.md and docs/ai-sync/SESSION_START.md first. Follow the shared [data and policy contract](RUNNER_DATA_SPINE.md); close with SESSION_CLOSE.md.

## Install and verify

```powershell
npm ci
npm run typecheck --if-present
npm test
npm run lint --if-present
npm run contracts:validate
npm run data:validate
```

There is no lint script; --if-present skips it. TypeScript and tests are active checks.

## Dashboard and API-only operation

```powershell
npm run dashboard
# Separate terminal, for authorized local observation/totals evaluation:
npm run scout -- api --port 8787
```

Dashboard: http://127.0.0.1:8790. It reads saved SQLite and repository content. API-only mode uses memory and does not persist evaluations across restart. Both bind to loopback by default; dashboard binding is always loopback. Stop the launching terminal with Ctrl+C. Check Get-NetTCPConnection before restarting; do not terminate unrelated listeners.

```powershell
Invoke-RestMethod http://127.0.0.1:8790/api/health
Invoke-RestMethod http://127.0.0.1:8790/control/status
Invoke-RestMethod http://127.0.0.1:8790/markets/snapshot
Invoke-RestMethod http://127.0.0.1:8790/content
Invoke-RestMethod 'http://127.0.0.1:8790/schedule/cfb?date=2026-09-26'
```

Choose the intended calendar date explicitly; canonical game IDs use UTC kickoff dates. A successful health response proves process liveness only. Every provider's receipt/health must be checked separately.

## Route contract

| Route | Runtime | Result / auth |
|---|---|---|
| GET /api/health, /health | Both | Liveness, timestamp, scope and runtime mode |
| GET /control/status | Dashboard | Saved counts, provider warnings, overall freshness, receipt timestamps |
| GET /markets/snapshot | Dashboard | At most 250 saved normalized market rows, source/receipt/freshness; 503 for unavailable DB |
| GET /markets/live | Engine/API | In-memory cache with per-row receipt/provenance/freshness; empty is UNKNOWN |
| GET /schedule/nfl, /schedule/cfb | Both | ESPN normalized rows with receipt provenance; 502 UNKNOWN on upstream failure |
| GET /content | Both | Schema-validated PUBLIC cards from data/content/cards.json; 503 on invalid/missing file |
| POST /observations | Engine/API | Bearer required; 201 flow snapshot plus source/age; persists only in ingest+API mode |
| POST /totals/evaluate | Engine/API | Bearer required; 201 evaluation plus model/input provenance and freshness |

Both POST routes return 503 auth_not_configured without RUNNER_API_BEARER_TOKEN, 401 for missing/wrong tokens, and 400 for malformed or oversized input. Dashboard rejects mutations with 405 even for a valid token and rejects nonlocal Host values with 403. CORS emits no allow-origin by default; exact configured origins receive it; disallowed origins do not. CORS is a browser control, not authentication. Keep tokens in server/local process configuration, never example payloads or browser UI. Tests exercise these cases.

## Local-only market ingestion

This command contacts configured read providers and writes local SQLite. Verify entitlements, local credentials and backups first. It can consume provider quota. API-only and dashboard modes above are sufficient for inspection and fixture workflow.

```powershell
$env:RUNNER_PUBLISH_ENABLED='false'
$env:RUNNER_ENABLE_POLYMARKET='false'
npm run scout -- start --once
```

The explicit false publish override is required because existing publisher defaults are enabled. Inspect provider receipts afterward; command exit success alone does not prove successful ingest (individual connector failures are caught). For polling plus API use `npm run scout -- start --api --port 8787` in place of --once after stopping API-only mode. Continuous ingestion retains the existing overlapping-tick risk; unattended operation is not certified.

## Content and exports

```powershell
npm run content:generate
npm run data:validate
npm run operations -- validate-file exports/normalized.json
npm run scout -- export exports/local-backup
# Imports mutate local SQLite; first review the export and take a backup:
npm run scout -- import exports/reviewed-engine-bundle
```

content:generate deterministically regenerates twenty fixture shells and their manifest. It does not analyze live games or publish. Edit fixture inputs only as fixtures; new real sources require reviewed normalization/provenance and model evidence. Validation accepts normalized JSON, not arbitrary CSV. Export/import cover the current engine export table list, not a complete SQLite disaster-recovery backup; do not treat them as a full database restore.

No paid data, provider keys, public publication, or model inference is needed to reproduce the passing fixture workflow. The sibling Site can consume the JSON contract server-side; production Site integration/deployment is not verified by the local dashboard.

## Failure / recovery

Keep stale records for audit and display HISTORICAL/UNKNOWN warnings. Do not reset receipt times to hide a failed connector. Investigate provider health using redacted logs. Back up SQLite before imports; preserve manifests and hashes for replay. A schema/content failure returns 503 rather than silently substituting fixtures for real data. Rebuild after code updates, restart the applicable local service, then verify HTTP responses.

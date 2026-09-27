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

## Experimental live NFL snapshots

Python 3.11+ can produce a local, read-only score/clock analog from the saved historical SQLite database and the dashboard's current ESPN schedule receipt:

```powershell
python scripts/live-win-analog.py --date 2026-09-27 --write
python scripts/live-win-analog.py --date 2026-09-27 --watch --interval-seconds 300
```

The first command saves one timestamped JSON file under `.runner/predictions/`. The second saves a new file every five minutes until every game on that date is final; stop it with Ctrl+C. It requires the local dashboard at `127.0.0.1:8790` and refuses stale or warning-bearing schedule receipts. The earliest saved live probability for each game is frozen for grading once its final score appears. Generated snapshots and logs remain local and are ignored by Git.

This is an **experimental historical comparison**, not Runner's deployed prediction model, a market edge, or a betting recommendation. It uses 2016–24 historical score and clock states, at most three minutes and two score-margin points from the live state, with a minimum of 80 games. Its 2025 holdout only tests halftime winners. It does not account for live possession, injuries, team strength, weather, or executable odds. Scoreboard retrieval time does not establish ESPN's last update time. The watcher covers only the date passed to it and depends on this machine and dashboard staying online.

## NFL, WNBA, and MLB date slate

```powershell
node scripts/live-slate.mjs --date 2026-09-27 --write
node scripts/live-slate.mjs --date 2026-09-27 --watch --interval-seconds 120
node scripts/live-slate.mjs --rolling --interval-seconds 120
```

The local research receipt fetches every game ESPN returns for the selected calendar date in each league, including scheduled, live, final, and delayed games. Each league has its own receipt and `UNKNOWN` state if its fetch fails; the script never fills a failed feed with cached games. Changed snapshots are saved under `.runner/slates/`, ignored by Git. A fixed-date watcher checks every two minutes and stops when every returned game is final or otherwise terminal. `--rolling` instead follows the Chicago calendar date, checking every two minutes while games are live, at least every five minutes before games, and at least every fifteen minutes after the day's slate; stop it with Ctrl+C. Both require this machine to remain on. ESPN's retrieval timestamp does not prove when its score last changed, and this path does not supply sportsbook prices, Kalshi positions, model estimates, or sell decisions. These ESPN endpoints are used for local research; review provider terms before public redistribution.

## WNBA research winner model

```powershell
node scripts/wnba-win-analog.mjs --write
# When an approved history file and its rights record exist locally:
node scripts/wnba-win-analog.mjs --history C:\private\wnba-states.jsonl --rights-record C:\private\wnba-rights.json --write
```

The first command writes a WNBA coverage report with `BLOCKED_DATA_RIGHTS_OR_HISTORY` and no probabilities. The second uses the latest local slate receipt, a supplied historical JSONL and a self-attested rights record. It emits experimental probabilities only after its freshness, unique-game, chronological holdout and per-state analog gates pass. The [WNBA data gate](WNBA_MODEL_DATA_GATE_2026-09-27.md) specifies the file shape, thresholds, license evidence, and BettingPros/Outlier pull blocker. This model is research-only, not a sell/stay or executable-price signal.

## Private Kalshi position inventory

```powershell
node --env-file-if-exists=.env scripts/kalshi-positions-readonly.mjs
node --env-file-if-exists=.env scripts/kalshi-positions-readonly.mjs --write
```

The command only makes authenticated `GET /portfolio/positions` requests and paginates them. It needs `KALSHI_API_KEY_ID` and `KALSHI_PRIVATE_KEY_BASE64` in the existing untracked environment. Without both, it reports `NOT_CONFIGURED` and makes no account request. It never places, amends, or cancels an order. Private receipts remain under ignored `.runner/positions/`. A browser login is not scheduler authority or an API credential. A position stays `UNKNOWN` for sell/hold analysis until Runner has a verified lot cost basis, executable exit quote including fees, and validated fair value. Do not present a scoreboard lead or market midpoint as an executable exit.

## Authorized transcript intake and Gemini analysis

```powershell
node scripts/transcript-intake.mjs --file C:\path\captions.vtt --source-url https://www.youtube.com/watch?v=VIDEO_ID --rights OWNER --event-id ESPN_EVENT_ID
# Optional, only for a source you may send to Google and with GEMINI_API_KEY configured:
node --env-file-if-exists=.env scripts/transcript-intake.mjs --file C:\path\captions.vtt --source-url https://www.youtube.com/watch?v=VIDEO_ID --rights OWNER --event-id ESPN_EVENT_ID --send-to-gemini --authorize-transfer
```

The intake accepts `.vtt`, `.srt`, or `.txt` caption files, saves a hashed private receipt under ignored `.runner/transcripts/`, and prepares an English Gemini analysis prompt. `--rights` records the operator's stated owner, license, or public-domain basis; it does not independently establish rights. The game ID remains `USER_SUPPLIED_UNVERIFIED` until reconciled to a scoreboard event. The default path does not contact Gemini. The explicit transfer flags and `GEMINI_API_KEY` are required to send up to 20,000 transcript characters to Google using `gemini-3.8-flash`; the response remains unverified commentary. The Browser plugin can export a transcript from a YouTube watch page when YouTube exposes one. The official YouTube caption download API requires permission to edit the video. Live audio transcription needs a separately authorized audio source and Gemini Live API wiring; this intake does not capture or restream broadcasts.

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

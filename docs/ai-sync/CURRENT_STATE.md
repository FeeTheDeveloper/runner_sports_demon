# Current state

Operations package completed locally on 2026-09-26: strict data/content schemas, 20 fixture content shells, receipt-aware routes, API-only mode and runbook. Markets remain HISTORICAL; ESPN CFB retrieval succeeded at 17:50 UTC. See [completion evidence](../ops/MACHINE_STATE_2026-09-26.md).

## 2026-09-26 Runner Sports Plug operating audit

The installed Runner Sports Plug provides skills and governing instructions for intelligence work, not a persistent runner or repository connector. The local read-only dashboard is currently reachable at `http://127.0.0.1:8790`; this process is not installed for startup. Saved markets were last processed on 2026-09-19, so the dashboard is a historical snapshot. Build, 13 tests, contract/repository validation, and SQLite `quick_check` passed. The [dated operating audit](RUNNER_PLUGIN_OPERATIONS_2026-09-26.md) records risks and scope. No engine ingestion, Site publication, deployment, or trading was performed.

## 2026-09-16 repository audit

Revalidated the clean `feature/local-control-dashboard` checkout against source, tests, environment contracts, and operational records. Corrected four high-confidence runtime defects: authenticated intel uploads now supply the configured bearer token; mutation request bodies are bounded; totals reads expire elapsed decision windows; and the general API defaults to IPv4 loopback with an explicit host override for authorized deployments. Build, all 13 test programs, contract and sibling-repository validation, diff checks, and `npm audit --omit=dev` pass. No provider, publishing, deployment, push, merge, or trading action was performed.

## 2026-09-16, 9:37 PM Central — Three-repository local session

Opened all three folders in the shared VS Code workspace. Demon ingestion/API is running on port 8787 with 250 freshly discovered Kalshi markets; the control center remains on 8790. Runner Site homepage and health pass on `http://localhost:3001`. Verse CLI works after installing declared Python dependencies; 11 warehouses are readable, four tests pass, and the 2025 six-artifact export validates. Verse uses batch commands rather than a persistent server. Site continues reading Supabase; automatic local Demon-to-Site integration is not established. See [LOCAL_STACK.md](LOCAL_STACK.md) for exact commands and limits.

## 2026-09-16 — Local control dashboard

Implemented and hosted the owner's requested visual control center at **http://127.0.0.1:8790**, with the Node process bound to loopback. Restart with `npm run dashboard`; an alternative port can be supplied with `-- --port 8791`.

The dashboard displays read-only SQLite snapshots, recorded provider freshness, 24 hourly event buckets, market search/provider filters/sorting, totals window expiry, engineering handoffs, historical blockers, repository presence and model metadata. Navigation, pause/resume refresh, manual refresh, JSON status export and on-demand ESPN date/league schedules are implemented. Missing/unreadable storage has explicit empty/unavailable states. The original engine/API mode is preserved.

Local verification found 1,413 stored markets, 38,532 market events, five handoffs and three models. Recorded Kalshi/Polymarket telemetry was stale; the UI does not call it live. Build, all 13 test programs, contracts and loopback HTTP checks passed. Browser visual inspection was unavailable because no browser session was connected; emitted-client behavior was tested in a minimal DOM environment.

Work branch: `feature/local-control-dashboard`, started from `3af26af`. An intervening workspace commit `70c08d1` captured part of the work; subsequent changes remain in the working tree. No remote push, cloud deployment, ingestion or Site publication was performed by this session. Local process details/logs are in ignored `.ai/local/`.

## Earlier bootstrap record

Verified 2026-09-16 from source and local checks at baseline `ae89200`. The working tree was clean on arrival at `release/runner-production`; documentation work uses `docs/ai-sync-bootstrap`.

Implemented: REST market polling, normalization/cache, SQLite market history, ESPN NFL/CFB game discovery, structured game observations, football totals heuristics, suppression/windows, totals frame replay, dashboards, and optional curated Site publishing. Source map: [ARCHITECTURE.md](ARCHITECTURE.md).

Not established: current provider connectivity, credentials, Site deployment, remote CI outcome, historical export acceptance, calibrated predictive performance, or production readiness. `/health` is liveness only. General edges/signals and game props routes return `implemented: false`. WebSocket helpers are not wired into ingestion. There is no full event-store replay/backtest runner.

Local build and all ten test files passed; contract structural checks passed for ten contracts and five handoffs; sibling repository presence checks passed. These checks do not establish schema-instance compliance, end-to-end provider operation, or model profitability. See [TESTING_STATUS.md](TESTING_STATUS.md).

This session added the AI-sync records, connected existing agent guidance, corrected foundation-only root documentation, and documented three existing helper environment variables. Runtime source and dependencies were unchanged.

Historical records: `.runner/system-status.json` is dated 2026-09-13; its provider-connected and export-ready statements were not revalidated. `RUNNER_INTELLIGENCE_STATE.md` and `CURRENT_INFRASTRUCTURE_AUDIT.md` contain earlier operational/companion-site claims. Preserve them as dated evidence and recheck before operational use; do not promote them to live facts.

Follow-ups and verification limits are recorded in [ACTIVE_PRIORITIES.md](ACTIVE_PRIORITIES.md) and [BLOCKERS.md](BLOCKERS.md). No external publication, production mutation, push, merge, or deployment was performed.

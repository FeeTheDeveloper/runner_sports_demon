# Current state

Verified 2026-09-16 from source and local checks at baseline `ae89200`. The working tree was clean on arrival at `release/runner-production`; documentation work uses `docs/ai-sync-bootstrap`.

Implemented: REST market polling, normalization/cache, SQLite market history, ESPN NFL/CFB game discovery, structured game observations, football totals heuristics, suppression/windows, totals frame replay, dashboards, and optional curated Site publishing. Source map: [ARCHITECTURE.md](ARCHITECTURE.md).

Not established: current provider connectivity, credentials, Site deployment, remote CI outcome, historical export acceptance, calibrated predictive performance, or production readiness. `/health` is liveness only. General edges/signals and game props routes return `implemented: false`. WebSocket helpers are not wired into ingestion. There is no full event-store replay/backtest runner.

Local build and all ten test files passed; contract structural checks passed for ten contracts and five handoffs; sibling repository presence checks passed. These checks do not establish schema-instance compliance, end-to-end provider operation, or model profitability. See [TESTING_STATUS.md](TESTING_STATUS.md).

This session added the AI-sync records, connected existing agent guidance, corrected foundation-only root documentation, and documented three existing helper environment variables. Runtime source and dependencies were unchanged.

Historical records: `.runner/system-status.json` is dated 2026-09-13; its provider-connected and export-ready statements were not revalidated. `RUNNER_INTELLIGENCE_STATE.md` and `CURRENT_INFRASTRUCTURE_AUDIT.md` contain earlier operational/companion-site claims. Preserve them as dated evidence and recheck before operational use; do not promote them to live facts.

Follow-ups and verification limits are recorded in [ACTIVE_PRIORITIES.md](ACTIVE_PRIORITIES.md) and [BLOCKERS.md](BLOCKERS.md). No external publication, production mutation, push, merge, or deployment was performed.

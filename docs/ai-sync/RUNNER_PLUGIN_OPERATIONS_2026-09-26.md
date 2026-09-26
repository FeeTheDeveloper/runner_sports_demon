# Runner Sports Plug operating audit

Verified 2026-09-26 in `runner_sports_demon` on branch `audit/runner-plugin-operations-20260926`. This is a dated local audit, not a production-health claim.

## Objective and current condition

Use the installed Runner Sports Plug as the Runner intelligence desk for this repository. The installed `gpt-3ec36573ff5349bb4d38f4eace1f5d74` bundle, version `0.1.1+bundle.4761b9cd47b12673334bd42b11b4b72f`, declares only a `skills` capability. Its instructions and lock govern analysis and handoffs; they do not install a daemon, repository connector, scheduler, or autonomous execution tool. `scripts/runner-command.mjs` resolves phrases to existing `.github/prompts/` and agent labels; it does not execute those prompts.

The existing authority split remains in force: Runner supplies sports intelligence and editorial analysis, Fee The Developer owns technical execution, and King Fee retains final human authority. Invoking the plugin in a session permits its analytical workflow. It does not create persistent access or authorize external mutations.

The read-only local dashboard was started on `127.0.0.1:8790` and returned HTTP 200 for `/` and `/control/status`. The listener was bound to loopback. Its PID and logs are under ignored `.ai/local/runner-plugin-dashboard.*`; the process is session-dependent and is not installed as a startup service. The dashboard reads saved SQLite state and does not start ingestion or Site publishing.

## Findings

### CRITICAL

None demonstrated by this audit. Production exposure, credentials, and live integrations were not tested.

### HIGH

- **Publishing can be enabled by an ordinary engine start.** `src/publishing/sitePublisher.ts` defaults `RUNNER_PUBLISH_ENABLED` to `true`, and `.env.example` sets it to `true`. `src/cli.ts` loads `.env` before `start` enters ingestion. With a Site URL and service-role key present, an engine tick writes to Site Supabase. The inspected local `.env` has empty Site URL and key fields, so this specific checkout is not currently configured to publish. Any future engine run must force publishing off unless that exact publication is authorized.
- **Saved market state is stale for live analysis.** The local SQLite `quick_check` passed and contains 1,413 markets and 39,236 market events, but its latest market processing timestamp is `2026-09-19T08:50:27.924Z`. The dashboard displays historical evidence; it cannot establish current provider connectivity, executable prices, or proprietary model output.

### MEDIUM

- **Polling ticks can overlap.** `src/ingestion.ts` schedules `tick()` with `setInterval` without a single-flight guard. A slow provider or Site publish can leave two ticks writing to SQLite or publishing at once. Validate sequencing and idempotency before unattended operation.
- **General API read access relies on network placement.** `src/api/server.ts` binds to loopback by default and authenticates mutating POST routes, but its read routes are unauthenticated. An explicit wider `RUNNER_API_HOST` requires a separate network and data-exposure review. A schedule GET on the general API also persists fetched games when a store is present.
- **Live inference inputs remain incomplete.** Existing `docs/ai-sync/BLOCKERS.md` records cross-provider event-ID differences, kickoff being labeled as an ESPN source timestamp, incomplete replay/export coverage, and unimplemented generic edge/signal and props routes. These block claims of calibrated, complete live intelligence.

### LOW

- The command registry is a routing aid, not an operations controller. `RUNNER STATUS` returns a prompt path and agent label; no actual status check or execution follows automatically.

## Approved local operating mode

- The Runner Sports Plug may be invoked for source-verified research, model-versus-market analysis, Live Desk reasoning, audit, and structured engineering handoffs using this checkout as implementation truth.
- Read-only repository checks, build/tests, and the loopback dashboard are suitable local operations. Dashboard data must be labeled with its recorded timestamps.
- Ingestion and the general API are separate operational modes. Before a local run, set `RUNNER_PUBLISH_ENABLED=false`, confirm the target database and loopback binding, and inspect current provider configuration without revealing values. Do not infer provider health from `/health` or a successful build.
- Site publication, public deployment, pushes/merges, provider or production mutations, scheduled automation, and trading require action-specific authorization under `SECURITY_BOUNDARIES.md`. No automatic trading authority exists.

## Verification and acceptance

- `npm run build`: passed.
- `npm test`: all 13 compiled test programs passed.
- `npm run contracts:validate`: 10 contracts and 5 handoffs passed structural validation.
- `npm run system:validate`: Demon, Site, and Verse checkout presence passed; this did not build siblings.
- SQLite `PRAGMA quick_check`: `ok` using `-readonly`.
- Dashboard `/` and `/control/status`: HTTP 200 on loopback; snapshot reported `mode: local-snapshot`, database ready, and 1,413 markets.
- No engine ingestion, Site publication, deployment, push, merge, or production mutation was performed in this audit.

## Tests required before wider operation

1. Make Site publishing explicit opt-in in code and `.env.example`, with a regression test proving a configured key alone cannot publish.
2. Add a single-flight polling test with a delayed connector and delayed publisher; show that no overlapping tick occurs and that shutdown stops scheduling.
3. Verify current provider responses, event-ID joins, source/update timestamps, and stale-data suppression against dated fixtures before calling outputs live.
4. Exercise API auth and network exposure in the actual deployment topology; test Site publication contracts only in an approved nonproduction target.
5. Validate replay/export completeness and representative calibration before any model-edge or trading claim.

## Recommended changes

Keep the plugin as the canonical Runner analysis interface and the existing repository as execution truth. Implement the publishing opt-in and polling guard as focused, reviewable fixes. Use the existing `.runner/` work claims and handoffs for cross-agent continuity. Broader operational delegation requires a defined runtime adapter and a specific approval scope; the installed skills bundle alone cannot run recurring repository operations.

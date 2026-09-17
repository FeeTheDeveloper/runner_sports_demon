# Security boundaries

King Fee retains human authority. Autonomous work covers reversible repository-local actions clearly needed for the authorized objective: inspection, focused edits, tests, build, documentation and necessary local tooling.

Push, merge, deploy, publish, purchase, delete production resources, rotate secrets, contact third parties, alter billing/DNS, mutate production data, and irreversible external changes require explicit authorization for the exact action. Complete local preparation and verification before requesting any missing final approval. Existing session authorization persists.

`.env.example` defines variable names. Secrets belong only in untracked local/runtime environments; never copy real values into source, logs, fixtures, patches, documentation, handoffs or chat. Preserve shared variable names and avoid agent-specific secret stores. `.ai/local/` is ignored scratch space, not a place for unique production logic or secret duplication.

Runtime evidence:

- `npm run dashboard` is the explicitly authorized local hosting path. It binds to `127.0.0.1`, restricts Host names, rejects non-GET requests, reads SQLite with `-readonly`, and does not start ingestion or Site publishing. The UI only requests provider schedules when the user submits a league/date. The general engine/API mode below remains separate.

- `src/cli.ts` loads `.env`. `src/publishing/sitePublisher.ts` can publish when Site credentials are present and publishing is enabled. Build/test success does not authorize starting publishing.
- `POST /observations` and `POST /totals/evaluate` fail closed if `RUNNER_API_BEARER_TOKEN` is absent and enforce a configurable body-size limit. Read routes are unauthenticated; CORS is opt-in and is not authentication. The API binds to IPv4 loopback by default; an authorized deployment can explicitly set `RUNNER_API_HOST` with appropriate network controls.
- `scripts/push-runner-intel.mjs` requires `RUNNER_API_BEARER_TOKEN`; Drive sync, history imports and scheduled-task installation have write effects. Inspect their paths, target environment and exact authorization before running them.
- Kalshi signing keys, Odds credentials, Supabase service-role credentials and webhook URLs are sensitive. Provider health and missing configuration can be reported without exposing values.

No automatic wagering or trading. The handoff requires calibrated models, reliable feeds, replay/backtesting, transaction-cost/liquidity/latency representation and validated signal performance before any separate authorization to enable execution.

Security observations from this audit are recorded in [BLOCKERS.md](BLOCKERS.md). This document is an operational boundary, not a claim of a completed penetration test or dependency-security certification.

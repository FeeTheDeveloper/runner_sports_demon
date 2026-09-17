# Security boundaries

King Fee retains human authority. Autonomous work covers reversible repository-local actions clearly needed for the authorized objective: inspection, focused edits, tests, build, documentation and necessary local tooling.

Push, merge, deploy, publish, purchase, delete production resources, rotate secrets, contact third parties, alter billing/DNS, mutate production data, and irreversible external changes require explicit authorization for the exact action. Complete local preparation and verification before requesting any missing final approval. Existing session authorization persists.

`.env.example` defines variable names. Secrets belong only in untracked local/runtime environments; never copy real values into source, logs, fixtures, patches, documentation, handoffs or chat. Preserve shared variable names and avoid agent-specific secret stores. `.ai/local/` is ignored scratch space, not a place for unique production logic or secret duplication.

Runtime evidence:

- `src/cli.ts` loads `.env`. `src/publishing/sitePublisher.ts` can publish when Site credentials are present and publishing is enabled. Build/test success does not authorize starting publishing.
- `POST /observations` and `POST /totals/evaluate` fail closed if `RUNNER_API_BEARER_TOKEN` is absent. Read routes are unauthenticated; CORS is opt-in and is not authentication. `server.listen(port)` does not explicitly restrict binding to loopback; evaluate exposure before any authorized deployment.
- `scripts/push-runner-intel.mjs`, Drive sync, history imports and scheduled-task installation have write effects. Inspect their paths, target environment and exact authorization before running them.
- Kalshi signing keys, Odds credentials, Supabase service-role credentials and webhook URLs are sensitive. Provider health and missing configuration can be reported without exposing values.

No automatic wagering or trading. The handoff requires calibrated models, reliable feeds, replay/backtesting, transaction-cost/liquidity/latency representation and validated signal performance before any separate authorization to enable execution.

Security observations from this audit are recorded in [BLOCKERS.md](BLOCKERS.md). This document is an operational boundary, not a claim of a completed penetration test or dependency-security certification.

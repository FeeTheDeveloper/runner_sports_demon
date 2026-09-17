# Runner Sports Demon — Agent Operating Contract

## Repository
`FeeTheDeveloper/runner_sports_demon`

This repository is the primary Runner Sports & Analytics live intelligence engine. `rsaa_verse` is the historical intelligence/data authority. `runner_sports-site` is the related presentation/product repository.

## Agent synchronization

Codex, Claude Code, GitHub Copilot, ChatGPT, and VS Code work from this repository as the shared live-intelligence source of truth. Do not create agent-specific forks of production logic or separate secret files that drift from the repository contract.

The synchronization control plane is:

- `RUNNER_SYNC_AUDIT.md` — human-readable authority, audit, drift rules, and priority gaps.
- `.runner/sync-manifest.json` — machine-readable ownership, control status, required reading, and boundaries.

When the sync audit conflicts with verified current code/runtime data, investigate the drift. Do not silently choose whichever source is convenient.

## Source precedence

Apply this order when instructions or evidence conflict:

1. Legal, platform, security, and safety requirements.
2. Authorized Runner Sports leadership instructions.
3. Current verified live data.
4. Versioned analytical/model standards.
5. Versioned Runner operating-source documents.
6. Historical research artifacts.
7. General model knowledge.

Never allow stale knowledge or a stale status snapshot to override verified current data.

## Before changing code

1. Read `RUNNER_SYNC_AUDIT.md` and `.runner/sync-manifest.json`.
2. Read `PROJECT_HANDOFF.md` when present/relevant, `ARCHITECTURE.md`, `RUNNER_INTELLIGENCE_STATE.md`, `.runner/system-status.json`, `CURRENT_INFRASTRUCTURE_AUDIT.md`, `DATA_SOURCES.md`, `DATA_SCHEMA.md`, `MODEL_REGISTRY.json`, `MODEL_NOTES.md`, and `BACKTESTING.md`.
3. Inspect the relevant implementation, contracts, and tests.
4. Check git status and current branch.
5. Check whether `.runner/system-status.json` is fresh enough for the task; stale status is not authoritative.
6. Preserve working behavior unless the task explicitly changes it.

## After changing code

1. Run `npm run build`.
2. Run `npm test` when the change can affect runtime behavior.
3. Run applicable contract/system validation commands when their dependencies are available.
4. Review the diff.
5. Update documentation when interfaces, data sources, models, signals, schemas, environment variables, or operations change.
6. Update synchronization/audit records when a material architecture, source, model, cross-repo, or control-plane change occurs.

## Environment contract

The committed variable contract is `.env.example`.

Actual secrets belong only in untracked local/runtime environments. Never commit `.env`, `.env.local`, private keys, API secrets, Supabase service-role credentials, bearer tokens, or webhook secrets.

For a local VS Code clone, create `.env` from `.env.example` and add real values there. Codex and Claude must use the same variable names from `.env.example`; do not rename environment variables independently.

Required/available variables currently include Kalshi, Polymarket, Odds API, Supabase, Discord, Runner API security, Drive sync, and Runner Scout runtime configuration. Treat `.env.example` as authoritative and update it whenever code introduces a new variable.

## Runtime

- Node.js >= 22
- Install: `npm ci`
- Build: `npm run build`
- Test: `npm test`
- Start: `npm start`
- Scout CLI: `npm run scout -- <command>`

## Data and model discipline

- Separate FACT, CALCULATION, MODEL OUTPUT, INFERENCE, OPINION, and UNKNOWN.
- Never fabricate live statistics, injuries, rosters, lines, prices, probabilities, model results, provider status, or test/deployment results.
- Preserve canonical event identity, timestamps, source lineage, freshness, and data-quality state.
- Preserve raw/normalized/feature/forecast/presentation/postgame layer separation.
- Keep market snapshots and original forecasts immutable/replayable.
- Use explicit model names and model versions; material methodology changes require version increments.
- Do not use market-implied probability as an independent Runner model forecast.
- Postgame learning appends to the record; it never rewrites the original forecast.

## Cross-repository boundary

- `runner_sports_demon` owns live intelligence, predictions, model runtime, Game Flow, markets, totals, alerts, replay, and postgame records.
- `rsaa_verse` owns historical acquisition, normalization, warehouse artifacts, historical features, comparables, and training exports.
- `runner_sports-site` owns presentation and product surfaces only; it must not become a second authoritative model engine.
- Demon SQLite is the operational/replay system of record.
- Runner Site Supabase is a curated publishing bus, not the Demon operational database.
- Google Drive is institutional memory/exchange, not a real-time data plane.

## Engineering boundary

Runner Sports Demon is intelligence-first. Do not enable automatic wagering/trading without explicit authorization and the validation gates defined by the project handoff and model governance.

Prioritize: live data integrity, timestamps/latency, canonical event mapping, normalization, probability models, market reaction, signals/suppression, replay, backtesting, calibration, observability, API/dashboard integration, and durable proprietary research assets.

## Source control

Use focused branches/commits. Do not force-push, rewrite shared history, or commit secrets. Production logic must remain version controlled.

For significant work, report exactly:

- what changed;
- validation performed;
- source/model/schema versions affected;
- remaining blocker or uncertainty;
- whether sync/audit state must be regenerated.

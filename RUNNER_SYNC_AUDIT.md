# Runner Sports & Analytics — Sync and Audit Control Plane

Version: 1.0
Audit date: 2026-09-17
Audited base: `main@a0e67a23b72cb0000d758d0a6582f9a6485590b6`
Primary repository: `FeeTheDeveloper/runner_sports_demon`

## Purpose

This file is the human-readable synchronization and audit control plane for Runner Sports & Analytics engineering.

It exists to keep ChatGPT, Codex, Claude Code, GitHub Copilot, VS Code, local Runner workers, Google Drive exports, `rsaa_verse`, and `runner_sports-site` aligned around one operating model without duplicating production logic.

This document does not replace implementation, schemas, live provider data, model artifacts, tests, or runtime state. It defines how those layers stay synchronized and how drift is detected.

## System ownership

| System | Authority | Role |
| --- | --- | --- |
| `runner_sports_demon` | Primary live intelligence authority | Live providers, canonical live state, markets, Game Flow, totals, forecasts, model runtime, signals, alerts, replay, postgame records, publishing contracts |
| `rsaa_verse` | Historical data authority | Historical acquisition, normalization, DuckDB/Parquet, research datasets, historical features, comparable states, training/baseline exports |
| `runner_sports-site` | Presentation/product authority | Dashboards, subscriber/product presentation, curated cloud read models; must not become a second model engine |
| Demon SQLite | Operational system of record | Full-fidelity local engine state, immutable snapshots, replay/research history |
| Runner Site Supabase | Curated publication bus | Shared cloud serving layer for approved Demon intelligence |
| Google Drive | Institutional memory/exchange | Imports, exports, manifests, reports; not a live database |

## Source precedence

When sources disagree, apply this order:

1. Legal, platform, security, and safety requirements.
2. Authorized Runner Sports leadership instructions.
3. Current verified live data.
4. Versioned analytical/model standards.
5. Versioned Runner operating-source documents.
6. Historical research artifacts.
7. General model knowledge.

Stale knowledge never overrides verified current data.

## Required reading before production changes

Every coding or analytical agent must read, at minimum:

1. `RUNNER_SYNC_AUDIT.md`
2. `AGENTS.md`
3. `ARCHITECTURE.md`
4. `RUNNER_INTELLIGENCE_STATE.md`
5. `.runner/system-status.json`
6. `DATA_SOURCES.md`
7. `DATA_SCHEMA.md`
8. `MODEL_REGISTRY.json`
9. `MODEL_NOTES.md`
10. `BACKTESTING.md`
11. Relevant implementation and tests for the requested change

`PROJECT_HANDOFF.md` remains required when present and relevant.

## Synchronization contract

### 1. Code synchronization

- Production behavior lives in version control.
- Agents do not create separate production forks for ChatGPT, Claude, Copilot, or Codex.
- Agent-specific prompts may route work, but they must target the same implementation and contracts.
- Focused branches and reviewable commits are required for meaningful changes.
- No force-push or history rewriting on shared branches.

### 2. Environment synchronization

- `.env.example` is the committed variable-name contract.
- Real secrets remain local/runtime-only.
- Agent tools must not rename provider variables independently.
- New runtime variables require an `.env.example` update in the same change.

### 3. Runtime-state synchronization

`.runner/system-status.json` is an operational snapshot, not timeless truth.

Treat it as stale when either condition is true:

- its `updated_at` is older than the operational freshness window for the task; or
- repository history has materially changed since the snapshot was generated.

A stale status snapshot must not override current code, provider health, or verified runtime observations.

### 4. Cross-repository synchronization

Cross-repo work follows explicit contracts:

- Verse exports historical artifacts; Demon validates/loads them.
- Demon publishes curated intelligence; Site consumes it.
- Site does not calculate authoritative Runner probabilities independently.
- Demon does not turn Google Drive or Supabase into a substitute for its replay-grade local store.
- Handoffs belong under `.runner/handoffs/` and `.runner/work/`; do not create duplicate orchestration directories.

### 5. Data synchronization

Raw, normalized, feature, forecast, presentation, and postgame-evaluation layers remain logically distinct.

Significant derived records should preserve or reference:

- source identity
- source locator
- retrieval/observation time
- effective time when applicable
- sport/league/season
- canonical event identity
- team/player identity where applicable
- metric definition/calculation method
- model/version
- pipeline/run identity when available
- confidence
- data-quality status

Current live claims must include effective time/freshness and must never be filled from model memory when the provider is unavailable.

### 6. Market synchronization

Market snapshots are append-only research observations.

Do not treat the following as interchangeable:

- bid
- ask
- midpoint
- last trade
- sportsbook price
- no-vig implied probability
- model fair probability

A theoretical model edge is not automatically executable. Spread, vig/fees, liquidity, slippage, stale quotes, suspension, limits, and settlement rules remain separate risk inputs.

### 7. Model synchronization

Every production-relevant model needs an explicit model name and model version.

Material changes to features, weights, thresholds, windows, similarity rules, calibration, or source mappings require a version increment and comparison against the prior version.

Do not rewrite original forecasts after settlement. Postgame learning appends to the historical record.

### 8. Live Game Flow synchronization

Live interpretation must preserve the pregame baseline and measure deviation from it.

Recalculate on material trigger events, including verified injuries, player/quarterback/pitcher changes, major weather shifts, ejections, pace regime changes, lineup confirmations, market shocks, and other state-changing events supported by verified data.

Live outputs must disclose the effective state time. Stale state is labeled stale.

### 9. Publishing synchronization

Demon may publish curated state to Runner Site Supabase, but publication is downstream of Demon authority.

Publisher payloads should preserve:

- canonical event id
- source/effective timestamp
- model name/version
- freshness
- confidence/data quality where supported
- source label
- immutable/replay linkage where appropriate

Do not publish a market-implied probability as an independent Runner forecast.

### 10. Drive synchronization

Drive is an exchange and archive layer only.

- Drive -> local import path: `00 VS Code Outbox - IMPORT TO LOCAL`
- Local -> Drive export path: `08 VS Code Inbox - EXPORT FROM LOCAL/00 Live Sync`
- Sync manifests: `08 VS Code Inbox - EXPORT FROM LOCAL/99 Sync Manifests`

High-frequency live intelligence must continue to use local runtime/storage, not Drive polling.

---

# Audit — 2026-09-17

## Executive status

Overall state: **operational foundation is strong; governance and calibration are partially synchronized.**

The repository already contains a substantial live-intelligence architecture: provider connectors, canonical normalization, append-only market/game storage, Game Flow, totals research, API/dashboard surfaces, agent routing, contracts, tests, model registry, publishing, and Drive sync.

The primary gaps are not another scaffold. They are source-control synchronization, status freshness, formal lineage completeness, explicit production model versioning/calibration, historical/live fusion completion, and cross-repository acceptance tests.

## Control audit

| Control | Status | Evidence | Required action |
| --- | --- | --- | --- |
| Company/agent identity | PASS | `AGENTS.md`, `.github/copilot-instructions.md` | Keep all agents on same repo contract |
| Repo role separation | PASS | `ARCHITECTURE.md`, Copilot instructions | Preserve Demon / Verse / Site ownership boundaries |
| Current live-data verification | PASS/PARTIAL | ESPN/Odds connectors, provider health, freshness logic | Extend same guarantees across every active sport/provider |
| Canonical event identity | PASS/PARTIAL | normalization + provider mappings | Continue deterministic mapping before fuzzy fallback |
| Raw/normalized/feature/forecast separation | PASS/PARTIAL | SQLite schema and architecture | Standardize remaining lineage fields across derived records |
| Append-only market/game history | PASS | market/game snapshot architecture | Preserve immutability and replay semantics |
| Market executability/risk | PASS/PARTIAL | odds math, selection-aware comparisons, suppression | Continue explicit spread/fee/liquidity treatment across providers |
| Pregame baseline preservation | PASS | immutable Runner baselines | Maintain no-market-derived baseline rule |
| Game Flow intelligence | PASS/PARTIAL | Game Flow + totals + Live Desk | NFL live PBP/drive ingestion remains incomplete |
| Model registry | PARTIAL | `MODEL_REGISTRY.json` | Replace placeholder versions such as `existing`; finish calibration metadata |
| Model calibration | PARTIAL | calibration agent/backtesting seams | Run representative-game calibration before production-grade `ACTIONABLE` claims |
| Forecast/postgame immutability | PASS/PARTIAL | immutable baselines, postgame agent/records | Verify all forecast families append settlement learning rather than mutate original state |
| Source lineage | PARTIAL | timestamps, provider mappings, historical manifests | Standardize `pipeline_run_id`, retrieval/effective timestamps, and quality status across all significant derived records |
| Agent behavior router | PASS/PARTIAL | `.github/agents/`, `.github/prompts/` | Require this sync/audit control plane in every agent entry path |
| CI | PASS/PARTIAL | build/test workflow | Add contract validation to CI when it is proven hermetic in GitHub Actions |
| Runtime status freshness | FAIL | `.runner/system-status.json` predates current `main` changes | Generate status with commit anchor/freshness metadata |
| Cross-repo historical fusion | PARTIAL | Verse export reported ready | Demon adapter still must accept/load validated Verse export |
| Site publishing boundary | PASS/PARTIAL | `src/publishing/sitePublisher.ts` | Keep model name/version explicit and preserve publication lineage |
| Secret hygiene | PASS | `.env.example`; fail-closed API token behavior | Continue no-secret commits |
| Automatic wagering/trading | PASS | explicitly disabled | Keep disabled unless separately authorized and validated |
| Productization alignment | PARTIAL | site publisher/dashboard surfaces | Tie recurring intelligence outputs to explicit product/API contracts and public-safe metric policy |

## Verified current implementation strengths

1. Local-first Demon operational storage with SQLite.
2. Curated Runner Site Supabase publishing rather than Supabase replacing engine authority.
3. ESPN CFB/NFL scoreboard foundations.
4. The Odds API normalization with quota metadata and bounded polling.
5. Kalshi/Polymarket observation architecture with no auto-execution.
6. Append-only game-state and sportsbook-market snapshots.
7. Immutable Runner pregame/current baselines.
8. Game Flow and totals research with suppression/decision-window logic.
9. Multi-agent routing for live data, markets, modeling, calibration, QA, postgame learning, publishing, and orchestration.
10. Build/test CI and fail-closed protection for mutating API endpoints.

## P0 — synchronization blockers

### P0.1 Runtime status is stale

`.runner/system-status.json` was last marked `2026-09-13T14:30:00Z`, while `main` includes later merges through 2026-09-16.

Required fix:

- add current git commit/ref to generated status;
- record `generated_at`/`updated_at`;
- mark status stale on commit mismatch or age threshold;
- never let stale status override verified runtime/provider state.

### P0.2 Model identity/version is not uniformly production-grade

`MODEL_REGISTRY.json` currently includes `football_totals_heuristic` with version `existing` and calibration `not_calibrated`.

Required fix:

- assign a durable semantic/internal version;
- document feature version and calibration state;
- preserve old version for backtests;
- increment on material analytical changes.

### P0.3 Lineage fields are not yet uniform

The repo preserves many timestamps and provider mappings, but searches do not show `pipeline_run_id` or a single standardized `source_retrieved_at` contract across live derived records.

Required fix:

- define a shared lineage envelope;
- add it to significant derived artifacts;
- keep raw provider rows immutable;
- propagate lineage into published records where appropriate.

### P0.4 Historical/live fusion remains incomplete

The current intelligence state reports the validated Verse historical export as ready, but the Demon historical adapter has not accepted/loaded it.

Required fix:

- validate export schema/checksum;
- load into a versioned feature adapter;
- register feature/model version;
- run deterministic comparison tests;
- preserve Verse as historical authority and Demon as model/runtime authority.

### P0.5 NFL live play/drive richness remains incomplete

Scoreboard-level NFL state is not enough for production-grade live pace, possession, drive, and Game Flow analysis.

Required fix:

- complete authoritative NFL play/drive ingestion;
- preserve source/received/processed timestamps;
- suppress unsupported derived fields until verified input exists.

## P1 — hardening work

1. Add a machine-readable sync manifest with source-pack version, base commit, ownership map, and known gaps.
2. Add commit anchoring to `.runner/system-status.json` generation.
3. Add contract validation to CI if the validation script is self-contained in GitHub Actions.
4. Separate probability model name and model version in every publication DTO/type rather than relying on version-encoded names.
5. Add a common data-quality enum/flags contract across live and historical layers.
6. Add cross-repository acceptance tests: Verse export -> Demon adapter -> published Site read model.
7. Add provider-level freshness SLAs by data family instead of relying on one generic threshold everywhere.
8. Validate Kalshi production signing/WebSocket behavior against current official documentation before treating authenticated streaming as production-ready.
9. Define public-safe vs proprietary fields for Site publication.
10. Make postgame grading/calibration a scheduled or explicit repeatable command rather than an ad hoc workflow.

## P2 — product/IP development

1. Convert calibrated intelligence into versioned API products.
2. Track Brier/log loss/calibration error/MAE-RMSE/CLV by model, market family, sport, confidence bucket, and data-quality grade.
3. Build replay-driven regression suites from live-state snapshots.
4. Build model cards and change logs from the registry.
5. Persist product/content lineage from source -> model -> published asset.

## Drift rules

A synchronization audit is required when any of these change:

- provider contract or endpoint
- canonical event identity
- schema/migration
- model feature/weight/threshold/calibration
- agent routing/authority
- cross-repo ownership
- publish contract
- environment variable contract
- live freshness rule
- market comparison/executability math
- Drive import/export contract
- security/authentication behavior

## Definition of synchronized

Runner Sports is considered synchronized only when:

1. current code, contracts, and runtime status agree;
2. agents read the same operating controls;
3. live claims come from verified timestamped data;
4. source lineage is reconstructable;
5. model name/version is explicit;
6. original forecasts remain immutable;
7. postgame learning appends rather than rewrites;
8. cross-repo ownership remains intact;
9. Site receives curated Demon outputs instead of recreating model logic;
10. CI/tests/contracts validate the interfaces changed by the work.

## Next executable sequence

1. Install this sync/audit layer into agent instructions.
2. Add the machine-readable sync manifest.
3. Fix status generation to anchor to git commit and freshness.
4. Normalize model name/version publication contracts.
5. Complete Verse historical adapter acceptance.
6. Complete NFL live PBP/drive ingestion.
7. Run representative calibration/backtest batches.
8. Validate Site consumption end-to-end.
9. Regenerate this audit after each material architecture/model milestone.

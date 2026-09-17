# Fee The Developer — Runner Sports Permanent Operating Constitution

Runner Sports is a sports-data, predictive-modeling, market-intelligence, and live-game-flow system, not a generic sports chatbot.

Read `RUNNER_SYNC_AUDIT.md`, `.runner/sync-manifest.json`, `AGENTS.md`, `RUNNER_INTELLIGENCE_STATE.md`, `RUNNER_COMMANDS.md`, and `.runner/system-status.json` before operational work. Natural-language requests should map to the canonical command registry in `.runner/command-registry.json` and the matching `.github/prompts/runner-*.prompt.md` preset.

Repository ownership is strict: `runner_sports_demon` owns live intelligence, predictions, model runtime, Game Flow, markets, totals, alerts, providers, model registry, decision support, replay, publishing contracts, and postgame records; `rsaa_verse` owns historical acquisition, nflverse/PFR, normalization, DuckDB, Parquet, features, comparable states, training data, and baseline exports; `runner_sports-site` owns dashboards and presentation only and must never become a second authoritative model engine.

Demon SQLite is the operational/replay system of record. Runner Site Supabase is a curated cloud publication bus. Google Drive is institutional memory/exchange, not a live database.

Every operation distinguishes FACT, CALCULATION, MODEL OUTPUT, INFERENCE, OPINION, and UNKNOWN. Never fabricate scores, injuries, rosters, lines, prices, probabilities, statistics, game state, provider results, test results, or deployment results. Current claims require current verified provider data, effective timestamps, and visible freshness; provider failure is reported as `PROVIDER UNAVAILABLE` or `DATA STALE`.

Apply source precedence in this order: legal/security requirements; authorized leadership instruction; verified current live data; versioned model/analytical standards; Runner operating-source documents; historical artifacts; general model knowledge. A stale `.runner/system-status.json` snapshot never overrides current code or verified runtime/provider state.

For market analysis, generate the independent Runner model view before examining market prices whenever practical. Preserve source lineage, versioned contracts, explicit model name/version, immutable forecasts, append-only postgame learning, and the no-auto-trading boundary. Never publish market-implied probability as an independent Runner forecast.

Use `.runner/handoffs/` and `.runner/work/` for coordination; do not create duplicate orchestration directories.

## Operating mode

- Continue the existing system; never scaffold a replacement unless explicitly ordered.
- Inspect before editing. Find the runtime path, tests, schemas, environment contract, and downstream consumers.
- Read `RUNNER_SYNC_AUDIT.md` and `.runner/sync-manifest.json` before making a production change.
- Prefer the smallest complete change that solves the task without duplicating architecture.
- Never fabricate live sports, market, provider, test, or deployment results.
- Never expose or commit secrets. `.env.example` defines variable names; local `.env` holds values.
- Preserve the intelligence-engine boundary. No automatic wagering/trading unless explicitly authorized and separately validated.
- Keep `runner_sports-site` presentation concerns separate from Demon intelligence concerns.
- Keep `rsaa_verse` historical data authority separate from Demon runtime/model authority.
- Preserve raw/normalized/feature/forecast/presentation/postgame separation.
- Preserve append-only snapshots and original forecast immutability.
- Material feature, weight, threshold, calibration, window, similarity, or source-mapping changes require model/version change control.

## Definition of done

1. Implementation complete.
2. `npm run build` passes.
3. Relevant tests pass; normally run `npm test` for runtime changes.
4. Applicable contract/system validation runs when its dependencies are available.
5. Diff reviewed for regressions, dead code, secret leakage, duplicated logic, stale source assumptions, and broken cross-repo boundaries.
6. Documentation updated when contracts, sources, schemas, formulas, models, signals, environment variables, or operations change.
7. `RUNNER_SYNC_AUDIT.md` / `.runner/sync-manifest.json` are updated when a material synchronization or governance control changes.
8. Report exactly what changed, validation performed, and any real blocker or unverified assumption.

## Action routing

Use the custom agents in `.github/agents/` when the task matches their specialty. Use prompt presets in `.github/prompts/` for repeatable action types. All specialized agents inherit this constitution and the sync/audit control plane; no specialty agent may weaken freshness, lineage, versioning, security, or repo-ownership rules.

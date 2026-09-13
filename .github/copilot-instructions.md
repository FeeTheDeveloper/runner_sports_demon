# Fee The Developer — Runner Sports Permanent Operating Constitution

Runner Sports is a sports-data, predictive-modeling, market-intelligence, and live-game-flow system, not a generic sports chatbot. Read `AGENTS.md`, `RUNNER_INTELLIGENCE_STATE.md`, `RUNNER_COMMANDS.md`, and `.runner/system-status.json` before operational work. Natural-language requests should map to the canonical command registry in `.runner/command-registry.json` and the matching `.github/prompts/runner-*.prompt.md` preset.

Repository ownership is strict: `runner_sports_demon` owns live intelligence, predictions, model runtime, Game Flow, markets, totals, alerts, providers, model registry, decision support, and postgame records; `rsaa_verse` owns historical acquisition, nflverse/PFR, normalization, DuckDB, Parquet, features, comparable states, training data, and baselines; `runner_sports-site` owns dashboards and presentation only and must never become a second model engine.

Every operation distinguishes FACT, CALCULATION, MODEL OUTPUT, INFERENCE, OPINION, and UNKNOWN. Never fabricate scores, injuries, rosters, lines, prices, probabilities, statistics, game state, or provider results. Current claims require current local provider data, effective timestamps, and visible freshness; provider failure is reported as `PROVIDER UNAVAILABLE` or `DATA STALE`.

For market analysis, generate the independent Runner model view before examining market prices. Preserve source lineage, versioned contracts, immutable forecasts, append-only postgame learning, and the no-auto-trading boundary. Use `.runner/handoffs/` and `.runner/work/` for coordination; do not create duplicate orchestration directories.

Read `AGENTS.md` first. Treat repository documentation and implementation as the source of truth.

## Operating mode
- Continue the existing system; never scaffold a replacement unless explicitly ordered.
- Inspect before editing. Find the runtime path, tests, schemas, environment contract, and downstream consumers.
- Prefer the smallest complete change that solves the task without duplicating architecture.
- Never fabricate live sports, market, provider, test, or deployment results.
- Never expose or commit secrets. `.env.example` defines variable names; local `.env` holds values.
- Preserve the intelligence-engine boundary. No automatic wagering/trading unless explicitly authorized.
- Keep `runner_sports-site` presentation concerns separate from demon intelligence concerns.

## Definition of done
1. Implementation complete.
2. `npm run build` passes.
3. Relevant tests pass; normally run `npm test` for runtime changes.
4. Diff reviewed for regressions, dead code, secret leakage, and duplicated logic.
5. Documentation updated when contracts, sources, schemas, formulas, signals, or operations change.
6. Report exactly what changed, validation performed, and any real blocker.

## Action routing
Use the custom agents in `.github/agents/` when the task matches their specialty. Use prompt presets in `.github/prompts/` for repeatable action types.

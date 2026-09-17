# Verified architecture map

Source audit: 2026-09-16. Read alongside root [ARCHITECTURE.md](../../ARCHITECTURE.md), [CURRENT_IMPLEMENTATION.md](../../CURRENT_IMPLEMENTATION.md) and [REPOSITORY_OWNERSHIP.md](../../REPOSITORY_OWNERSHIP.md).

| Boundary | Implementation and data flow |
|---|---|
| CLI | `src/cli.ts` loads env and constructs cache, SQLite store and Game Flow. `start` enters ingestion; `--api` also starts HTTP; import/export/init-db are separate commands. |
| Market ingestion | `src/connectors/index.ts` selects Kalshi, opt-in Polymarket and credential-gated NFL Odds. `src/ingestion.ts` polls REST, updates cache, persists markets/health and renders terminal output. |
| Provider transport | Kalshi/Polymarket clients include WebSocket helpers; current ingestion does not call them. Do not describe the runtime as streaming. |
| Identity/normalization | `src/normalization/` normalizes markets and builds `RUNNER:{SPORT}:{DATE}:{AWAY}:{HOME}` IDs. Provider identity consistency remains a known gap. |
| Sports discovery | `src/games/discovery/` handles ESPN NFL/CFB scoreboards, schedules and snapshots. It is separate from the market polling loop. |
| Game observations | Authenticated `/observations` feeds `src/game-flow/engine.ts` and SQLite. Human/AI observations remain distinct from numerical provider facts. |
| Totals | `src/totals/` projects football heuristics, computes market comparisons, suppressions and windows; authenticated evaluation API persists outputs. `src/game-flow/totals.ts` is a compatibility layer. |
| Models | Baseline implied probability helper, vig math and football totals heuristics exist; no calibrated independent predictive market pipeline is established. |
| Storage | `src/storage/schema.sql` / `sqlite.ts` invoke the external sqlite3 CLI. Market events/prices, game observations/snapshots and totals have storage paths; historical tables support the dedicated Verse loader. |
| Replay | `src/totals/replay.ts` sorts supplied frames and runs the shared totals runtime at frame time. General persisted-event replay and backtesting remain future work. |
| API/UI | `src/api/server.ts`, `src/dashboard/web.ts` and `terminal.ts` expose schedules/games/markets/totals. `/health` is liveness; generic edge/signal and props routes are placeholders. |
| Local control center | `npm run dashboard` starts loopback port 8790. `control-web.ts`, `control-styles.ts`, and `control-client.ts` provide the responsive UI; `control.ts` reads bounded SQLite and repository records for `/control/status`. No ingestion/publishing starts. Non-GET requests are rejected; on-demand schedules use the existing services without persistence. |
| Site publishing | `src/publishing/sitePublisher.ts` sends curated snapshots/health and explicitly supplied forecasts to Site Supabase; ingestion does not synthesize forecast fallbacks. Failure does not stop local operation. |
| History/automation | `scripts/` handles Verse export validation/load, Python ingestion and PowerShell Drive workflows. `.runner/` and `.github/` hold coordination and editor/CI automation. |

Demon SQLite is the operational store. Site Supabase is optional publishing infrastructure. Verse is the historical-data owner. The companion repositories' presence was checked, but their builds, current source behavior and deployments were not audited here.

Mutation API authentication is fail-closed bearer auth; read routes are unauthenticated and CORS is opt-in. No automatic trading is authorized. See [SECURITY_BOUNDARIES.md](SECURITY_BOUNDARIES.md) and [BLOCKERS.md](BLOCKERS.md) before treating local functionality as production readiness.

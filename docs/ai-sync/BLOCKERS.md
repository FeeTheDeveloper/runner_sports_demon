# Blockers and known limitations

Updated 2026-09-16. No blocker prevents completion of the documentation bootstrap. These limits apply to runtime/integration readiness; not every item is a reproduced production incident.

| Finding | Evidence and consequence |
|---|---|
| Cross-provider canonical mapping risk | `src/normalization/events/canonicalId.ts`, `src/connectors/odds-api/client.ts`, `src/games/discovery/espn.ts`: nickname fallback versus provider abbreviations can produce different IDs for one NFL game. |
| Timestamp semantics | `src/games/discovery/espn.ts`: `sourceTimestamp` uses event kickoff, not a verified provider-update timestamp; unsuitable as evidence of live freshness without correction. |
| Cached window expiry | `src/totals/runtime.ts`: evaluation creates windows; `get`, `all`, and `alerts` do not refresh time-based status. Reproduce and cover stale reads before production decision support. |
| Intel upload lacks authentication | `scripts/push-runner-intel.mjs` sends only content-type to `/observations`; `src/api/server.ts` requires bearer authentication. Configured server rejects it with 401; missing server token rejects with 503. |
| Replay/export coverage | `src/totals/replay.ts` replays supplied frames only. `SqliteStore.EXPORT_TABLES` excludes historical tables and `game_state_snapshots`; full export/restore completeness is not established. |
| Incomplete live intelligence | NFL PBP/drive ingestion, general edge/signal and props API output, integrated predictive pipeline, representative calibration/backtests remain incomplete. |
| External state unverified | Credentials, live feeds, Site Supabase acceptance, actual Verse load and deployed endpoints were not checked. This does not imply credentials or deployments are absent. |
| Tooling | `Rscript` was unavailable to the operational audit; affects optional Verse R tasks, not the passing Demon build/test suite. |
| Security verification limits | Read API lacks authentication; listener does not specify loopback. No dedicated API auth/CORS end-to-end test suite or online dependency vulnerability assessment was run. |

The older `.runner/system-status.json` records provider and historical-export facts as of 2026-09-13. Revalidate before replacing those records; a local documentation audit cannot attest to current operational health.

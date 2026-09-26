# Blockers and known limitations

2026-09-26 operations update: receipt-aware API labels and artifact validation are implemented. Historical market state, unverified authenticated feeds, no scraper adapter and unverified public Site consumption remain explicit. [Current package limits](../ops/MACHINE_STATE_2026-09-26.md#blocked-items).

## 2026-09-26 operating-audit additions

- A normal engine start can publish to Site when credentials are configured because `RUNNER_PUBLISH_ENABLED` defaults to true in `src/publishing/sitePublisher.ts` and `.env.example`. Use an explicit false override for local ingestion until a reviewable opt-in fix is made. The inspected local `.env` has empty Site publishing fields.
- `src/ingestion.ts` uses `setInterval` without a single-flight guard; slow ticks may overlap. Test sequencing and idempotency before unattended polling.
- The installed Runner Sports Plug is skills-only, so it cannot itself schedule or execute recurring repository operations. See [the dated operating audit](RUNNER_PLUGIN_OPERATIONS_2026-09-26.md).

Updated 2026-09-16. No blocker prevents completion of the documentation bootstrap. These limits apply to runtime/integration readiness; not every item is a reproduced production incident.

| Finding | Evidence and consequence |
|---|---|
| Cross-provider canonical mapping risk | `src/normalization/events/canonicalId.ts`, `src/connectors/odds-api/client.ts`, `src/games/discovery/espn.ts`: nickname fallback versus provider abbreviations can produce different IDs for one NFL game. |
| Timestamp semantics | `src/games/discovery/espn.ts`: `sourceTimestamp` uses event kickoff, not a verified provider-update timestamp; unsuitable as evidence of live freshness without correction. |
| Replay/export coverage | `src/totals/replay.ts` replays supplied frames only. `SqliteStore.EXPORT_TABLES` excludes historical tables and `game_state_snapshots`; full export/restore completeness is not established. |
| Incomplete live intelligence | NFL PBP/drive ingestion, general edge/signal and props API output, integrated predictive pipeline, representative calibration/backtests remain incomplete. |
| External state unverified | Credentials, live feeds, Site Supabase acceptance, actual Verse load and deployed endpoints were not checked. This does not imply credentials or deployments are absent. |
| Tooling | `Rscript` was unavailable to the operational audit; affects optional Verse R tasks, not the passing Demon build/test suite. |
| Security verification limits | Read API lacks authentication. The local npm production-dependency audit passed, but no penetration test or deployed-network review was performed. |

The older `.runner/system-status.json` records provider and historical-export facts as of 2026-09-13. Revalidate before replacing those records; a local documentation audit cannot attest to current operational health.

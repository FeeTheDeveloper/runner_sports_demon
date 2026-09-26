# Data Schema

The [operations data spine](docs/ops/RUNNER_DATA_SPINE.md) adds strict `runner.data.v1` and `runner.content-card.v1` schemas beside the existing engine contracts. JSON/Markdown examples and hashes are stored under `data/`; legacy season manifests now include explicit historical provenance. `npm run data:validate` checks actual instances and artifact checksums.

SQLite remains the local event/research store. Totals history is separated into flow snapshots, projections, market snapshots, trend scores, signals, decision windows, window transitions, and set points. Every analytical record carries source and/or processed timestamps in its payload and indexed envelope.

`src/storage/schema.sql` is authoritative. JSON payloads preserve exposed model components while relational columns support event, market, status, and timestamp queries.

## A3 sportsbook and adversity history

The A3 lane is NFL-first and sportsbook-first. `sportsbook_market_snapshots` stores immutable polling observations with bookmaker, market, line, American odds, raw implied probability, optional de-vigged probability, overround, and source/received/processed timestamps. Repeated states are deduplicated by a stable change hash; distinct observations are retained for replay.

`adversity_events` stores timestamped manual or observer-supplied events. `event_market_alignments` stores deterministic event-to-market links and preserves impact class, mapping confidence, and causality status. Temporal proximity alone does not establish causality; `UNKNOWN` is a valid state.

Initial sportsbook history is polling-based and must be graded honestly using the M0-M5 market-history resolution scale. The current implementation does not claim tick-level M4/M5 coverage, and derived response metrics must reference immutable source rows rather than overwrite them.

## Verse historical baselines

`historical_seasons`, `historical_team_profiles`, `historical_games`, `historical_market_history`, `historical_drives`, `historical_periods`, and `historical_game_state_samples` hold nflverse-derived NFL history sourced from `rsaa_verse` exports (`dev/export_runner_demon.py`), not live provider data. Each row is scoped to a `season`; `historical_seasons` is the load ledger (source export path, feature version, load timestamp, validation status).

Loading is explicit and idempotent: `npm run verse:load-history -- <season> [season...]` re-validates the Verse export's manifest/checksums (`scripts/validate-verse-export.mjs`), converts the relevant parquet artifacts to CSV via `scripts/verse_history_to_csv.py` (DuckDB), and replaces that season's rows via `scripts/load-verse-history.mjs`. Nothing here is fabricated or interpolated — a missing season simply means it has not been loaded yet.

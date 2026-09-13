# Data Schema

SQLite remains the local event/research store. Totals history is separated into flow snapshots, projections, market snapshots, trend scores, signals, decision windows, window transitions, and set points. Every analytical record carries source and/or processed timestamps in its payload and indexed envelope.

`src/storage/schema.sql` is authoritative. JSON payloads preserve exposed model components while relational columns support event, market, status, and timestamp queries.


P0 live-feed tables:

- `raw_provider_events`: deduplicated raw ESPN/Odds API payload history.
- `game_state_snapshots`: append-only canonical ESPN game states.
- `sports_market_snapshots`: append-only sportsbook outcome/line/price states.
- `provider_mappings`: exact ESPN and successfully matched Odds API event mappings.
- `runner_baselines`: immutable externally/model-produced Runner projections; update/delete triggers enforce immutability.
- `provider_health`: connection state, errors, latency, retry timing, and provider quota counters.

Current `games` rows are projections of latest identity/status; snapshot tables remain the replay source of truth.

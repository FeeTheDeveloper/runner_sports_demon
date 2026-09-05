# runner-live-market-scout Architecture

## Goal

A local-first intelligence service that observes live games and prediction markets, persists every meaningful market state change, estimates fair value, detects lag/divergence, and emits alerts without auto-trading.

## Phase implemented here

This initial foundation implements market ingestion, market normalization, SQLite persistence, a live in-memory cache, provider health tracking, a terminal dashboard, and a minimal local API. Prediction modeling beyond baseline implied probability is intentionally deferred.

## Runtime components

1. **Connectors**
   - `src/connectors/kalshi`: Kalshi REST discovery and authenticated WebSocket subscription support.
   - `src/connectors/polymarket`: Polymarket Gamma discovery and public CLOB market WebSocket subscription support.
   - Connectors only fetch/stream provider data and track health.

2. **Normalization**
   - `src/normalization/markets`: Converts provider payloads into `NormalizedMarket`.
   - `src/normalization/events`: Builds canonical Runner event ids when deterministic game fields are available.

3. **State**
   - `src/state/market-state`: Maintains the current local market cache.
   - Future game-state and order-book adapters should live under sibling state folders.

4. **Storage**
   - `src/storage/schema.sql`: SQLite schema for markets, market prices, market events, provider mappings, health, model predictions, signals, alerts, replay, and backtests.
   - `src/storage/sqlite.ts`: Small SQLite wrapper using the system `sqlite3` binary.
   - Persistence is event-oriented: state changes are hashed and inserted into append-only market event/price tables.
   - Game-flow observations and derived snapshots are stored separately so authorized human/AI observations remain replayable without treating them as authoritative numerical feeds.

5. **Models and signals**
   - `src/models/probability/baseline.ts`: Baseline implied probability model for smoke testing.
   - `src/signals/divergence`: Placeholder divergence calculation seam.
   - Sport-specific live fair-value models should implement a common `predict(state) -> probability` contract.

6. **Interfaces**
   - Terminal dashboard: prints live Kalshi/Polymarket market rows sorted by liquidity/volume.
   - Local HTTP API: `/health`, `/markets/live`, `/edges/live`, `/signals/live`, `/games/live`.
   - `POST /observations` accepts structured observations from `GAME_FEED`, `YOUTUBE_TV_OBSERVATION`, `HUMAN_ANALYST`, `CLAUDE_RESEARCH`, `RUNNER_AI`, or `VERIFIED_NEWS`; it does not ingest or archive video.

## Data flow

Provider API/WebSocket → connector health/retry → provider payload validation → normalized market → market-state cache → SQLite current market upsert + event/price insert → dashboard/API → future model/signal/alert pipeline.

Structured observation → game-flow engine → momentum/regime/latent-state snapshot → SQLite/API. YouTube TV is an observational source only; ESPN and other machine-readable feeds remain authoritative for numerical game state.

## Totals desk

Every game-flow snapshot includes a conservative `totals` payload and `totalsSignals` list. Values that cannot be supported by the observation stream remain absent; the engine does not infer team rates, red-zone rates, or conversion suppression without inputs.

`src/game-flow/totals.ts` owns totals signal names, decision-window lifecycle, configurable user decision timers, and football reprice checkpoints. Decision windows are informational only and never execute wagers. `/totals/live` exposes the derived payload for dashboards.

## Latency invariant

Every important record should carry:

- `source_timestamp`
- `received_timestamp`
- `processed_timestamp`

These fields are required for lag detection and replay research.

## Canonical event identity

Canonical ids should use deterministic game facts:

`RUNNER:{SPORT}:{YYYY-MM-DD}:{AWAY}:{HOME}`

Provider mappings should record Kalshi market ids, Polymarket condition/market ids, Odds API event ids, ESPN event ids, and mapping method/confidence.

## Boundaries

- No auto-trading.
- No hardcoded credentials.
- No unsupported API endpoints invented in code.
- Mocks belong only in tests/fixtures.
- Connectors must not import model or dashboard code.
- Models must not import connector or UI code.

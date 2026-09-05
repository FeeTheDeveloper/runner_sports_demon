# runner-live-market-scout

Local-first Runner Sports market intelligence service for live Kalshi and Polymarket monitoring.

## Operational now

- Kalshi REST market discovery with optional auth signing.
- Polymarket Gamma sports market discovery.
- WebSocket client scaffolding for Kalshi and Polymarket market channels.
- Normalized market schema with source/received/processed timestamps.
- SQLite current-state plus append-only market event and price persistence.
- Provider health tracking.
- Terminal dashboard sorted by liquidity/volume.
- Minimal local API for health and live markets.

## Quick start

```bash
npm install
cp .env.example .env
npm run scout -- start --once
```

For continuous local operation:

```bash
npm run scout -- start --api
```

## Documentation

- `CURRENT_INFRASTRUCTURE_AUDIT.md`
- `ARCHITECTURE.md`
- `DATA_SOURCES.md`
- `SETUP.md`
- `MODEL_NOTES.md`
- `BACKTESTING.md`

## Current stop point

This repository intentionally stops after proving market ingestion and local persistence. Prediction modeling, live game-state adapters, lag detection, alert routing, replay execution, and backtesting should be built next on top of the persisted event stream.

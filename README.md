# runner-live-market-scout

Local-first Runner Sports market intelligence service for live Kalshi and Polymarket monitoring.

## Architecture contract

Demon SQLite
    = full-fidelity local engine store

Runner Site Supabase
    = shared cloud data plane and published intelligence bus

Runner Site
    = presentation/subscriber layer

Demon
    = live intelligence engine

This repository remains local-first. SQLite is the authoritative engine store, while the Runner Site Supabase project is optional and only receives curated intelligence snapshots rather than raw tick streams.

## Operational now

- Kalshi REST market discovery with optional auth signing.
- Polymarket Gamma sports market discovery.
- WebSocket client scaffolding for Kalshi and Polymarket market channels.
- Normalized market schema with source/received/processed timestamps.
- SQLite current-state plus append-only market event and price persistence.
- Provider health tracking.
- Terminal dashboard sorted by liquidity/volume.
- Minimal local API for health and live markets.
- ESPN NFL/CFB schedules and game-state snapshots; credential-gated NFL Odds API markets.
- Structured Game Flow observations, football totals heuristics, suppression and decision windows.
- Totals frame replay, a browser dashboard, and optional curated Site Supabase publishing.

These capabilities are implemented locally; this list does not attest to live provider health or deployment. The ingestion loop polls REST; WebSocket helpers are not wired into it. Models remain uncalibrated research tools.

## Quick start

```bash
npm ci
cp .env.example .env
npm run scout -- start --once
```

For continuous local operation:

```bash
npm run scout -- start --api
```

## Documentation

- [AI session start](docs/ai-sync/SESSION_START.md)
- [Verified project manifest](docs/ai-sync/PROJECT_MANIFEST.md)
- [Current state and audit follow-ups](docs/ai-sync/CURRENT_STATE.md)
- `CURRENT_INFRASTRUCTURE_AUDIT.md`
- `ARCHITECTURE.md`
- `DATA_SOURCES.md`
- `SETUP.md`
- `MODEL_NOTES.md`
- `BACKTESTING.md`

## Current stop point

The implementation includes market ingestion, game discovery/observations, and totals decision support. General live edge/signal routes remain placeholders; full event-store replay, representative backtesting, calibration, and NFL play-by-play/drive ingestion remain follow-up work. See [active priorities](docs/ai-sync/ACTIVE_PRIORITIES.md).

The CLI loads local `.env` configuration. Starting ingestion can publish to Site Supabase when credentials are configured and publishing is enabled. Review [security boundaries](docs/ai-sync/SECURITY_BOUNDARIES.md) before operational commands; build/tests do not establish permission to publish.

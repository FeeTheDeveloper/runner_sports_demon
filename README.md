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

### Local control center

```bash
npm run dashboard
```

Open **http://127.0.0.1:8790**. The responsive control center shows saved markets, provider freshness, event activity, totals windows, model records, repository presence and engineering handoffs. Search/filter markets, navigate work queues, pause automatic refresh, request an ESPN schedule by date, or download the displayed status as JSON.

This command binds to loopback and reads the existing SQLite store without initializing or modifying it. It works when the database is missing, with unavailable values clearly marked. It does not start ingestion, cloud publishing, trading, or agents. Schedules are fetched only when requested and remain in memory. Existing local `.env` configuration supplies `RUNNER_SCOUT_DB` when set; no credentials are sent to the browser.

Use `npm run dashboard -- --port 8791` for another port. Stop with Ctrl+C in the launch terminal. The original engine/API commands below retain their behavior.

### Market ingestion

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

- [Local operations runbook](docs/ops/RUNNER_LOCAL_RUNBOOK.md): health, snapshots, content generation, ingest and export/import commands.
- [Data spine and provider matrix](docs/ops/RUNNER_DATA_SPINE.md): contracts, provenance, freshness and Runner Sports Plug policy.
- Generate fixture content with `npm run content:generate`; validate schemas and artifact hashes with `npm run data:validate`.
- `npm run scout -- api` starts the local API without ingestion. Dashboard `/content` exposes repository content and `/markets/snapshot` exposes saved markets with explicit freshness.

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

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

- Kalshi and optional Polymarket market discovery plus WebSocket client scaffolding.
- ESPN CFB scoreboard discovery and live summary normalization.
- The Odds API v4 CFB moneyline/spread/total and returned-derivative normalization.
- Canonical game ids, provider mappings, current caches, and append-only SQLite history.
- Immutable market-independent Runner baseline intake and guarded model-vs-market comparisons.
- Provider health, independent polling/backoff, terminal monitoring, local API, and RUNNER LIVE DESK dashboard.

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

The P0 live-data and baseline/comparison seams are implemented. A calibrated team-strength or live win-probability model, automated alert promotion, replay orchestration, and statistical backtesting remain future work. No automatic wagering or trading is enabled.

## Live Desk P0

Run the API/dashboard and ingestion workers:

```bash
npm run scout -- start --api
```

Open `http://localhost:8787/`. CFB schedule filters support `date=YYYY-MM-DD`, `sport=cfb|ncaaf`, and `ranked=true|false`. Canonical game ids must be URL encoded when embedded in client-generated paths. Submit a validated, market-independent baseline with `POST /baselines`; inspect it and guarded sportsbook comparisons at `/games/:id/baselines` and `/games/:id/comparisons`.

The Odds API worker requires `ODDS_API_KEY`. Missing credentials are surfaced as `DISABLED` provider health and no sportsbook data is fabricated.

# Setup

## Requirements

- Node.js 22+
- npm
- `sqlite3` CLI available on PATH

## Install

```bash
npm install
cp .env.example .env
npm run build
```

## Initialize local storage

```bash
npm run scout -- init-db
```

## Run one ingestion pass

```bash
npm run scout -- start --once
```

## Run continuously with dashboard

```bash
npm run scout -- start
```

## Run with local API

```bash
npm run scout -- start --api --port 8787
```

Then open:

- `GET http://localhost:8787/health`
- `GET http://localhost:8787/markets/live`

## Export / import data

Dump every table (`games`, `markets`, `market_prices`, `market_events`, `market_orderbooks`,
`provider_mappings`, `provider_health`, `model_predictions`, `signals`, `alerts`, `edge_events`,
`market_lag_events`, `replay_sessions`, `backtest_results`) to one JSON file per table plus a
`manifest.json` (export timestamp, source db path, row counts):

```bash
npm run scout -- export                # writes to exports/<timestamp>/
npm run scout -- export path/to/dir     # or a specific directory
```

Load an export back into a database (creates the schema first, then `insert or replace`s every
row — safe to run against a fresh or existing db):

```bash
npm run scout -- import path/to/dir
```

`exports/` is gitignored. To hand a snapshot to someone else or archive it outside this machine
(e.g. a shared Drive folder), copy the exported directory there — export/import only touch the
local filesystem, they don't talk to any cloud storage API.

## Environment

Do not hardcode credentials. Use `.env` values based on `.env.example`.

Kalshi WebSocket ingestion requires credentials. Polymarket public Gamma discovery and public CLOB market WebSocket do not require trading credentials.

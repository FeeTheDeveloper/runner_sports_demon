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

## Environment

Do not hardcode credentials. Use `.env` values based on `.env.example`.

Kalshi WebSocket ingestion requires credentials. Polymarket public Gamma discovery and public CLOB market WebSocket do not require trading credentials.

# Data Sources

## Kalshi

- REST base: `https://external-api.kalshi.com/trade-api/v2`
- Implemented discovery endpoint: `GET /events?status=open&with_nested_markets=true&limit=...`
- WebSocket URL from public documentation/search result: `wss://external-api-ws.kalshi.com/trade-api/ws/v2`
- WebSocket channels prepared: `orderbook_snapshot`, `orderbook_delta`, `ticker_v2`, `trade`
- Auth headers supported: `KALSHI-ACCESS-KEY`, `KALSHI-ACCESS-SIGNATURE`, `KALSHI-ACCESS-TIMESTAMP`
- Credentials are read from `KALSHI_API_KEY_ID`/`KALSHI_PRIVATE_KEY_BASE64` or `KALSHI_API_KEY`/`KALSHI_API_SECRET`.

The Kalshi documentation host was not directly reachable from this sandbox, so implementation reuses the existing Runner Sports Kalshi REST integration and the public WebSocket endpoint/channel/auth details available via web search. Verify exact signing requirements against official docs before enabling production WebSocket ingestion.

## Polymarket

- Gamma base: `https://gamma-api.polymarket.com`
- Implemented discovery endpoint: `GET /markets?active=true&closed=false&tag_id=1&related_tags=true&order=volume24hr&ascending=false`
- CLOB market WebSocket URL from public documentation/search result: `wss://ws-subscriptions-clob.polymarket.com/ws/market`
- Public market WebSocket does not require private trading credentials.

The Polymarket documentation host was not directly reachable from this sandbox. The implementation uses the existing Runner Sports Gamma integration and public documentation/search results for the CLOB market WebSocket location.

## Architecture boundary

Demon SQLite
    = full-fidelity local engine store

Runner Site Supabase
    = shared cloud data plane and published intelligence bus

Runner Site
    = presentation/subscriber layer

Demon
    = live intelligence engine

## Implemented sports feeds and remaining integration

- `src/connectors/odds-api/client.ts` implements NFL sportsbook discovery when `ODDS_API_KEY` is configured.
- `src/games/discovery/espn.ts` and `service.ts` implement NFL/CFB scoreboard normalization and schedule discovery.
- Site Supabase team registry and provider mappings remain shared cloud data used by the presentation layer; they are not the primary Demon persistence layer.

## Staleness rules

The current ingestion loop uses REST polling; WebSocket helpers exist but are not started by `src/ingestion.ts`. NFL play-by-play/drive ingestion remains incomplete. This is source-code verification dated 2026-09-16, not live provider validation. Provider endpoint/signing claims above are inherited documentation and were not reverified against provider services in this session.

Provider health is stored in SQLite. Future signal generation must lower confidence or suppress signals when a provider is disconnected, stale, or reporting excessive latency.

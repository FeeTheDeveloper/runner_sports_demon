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

## Existing Runner Sports feeds to integrate next

- Odds API provider from `runner_sports-site/lib/providers/oddsApi.ts`.
- ESPN provider from `runner_sports-site/lib/providers/espnApi.ts`.
- Supabase team registry and provider mappings from existing migrations.

## Staleness rules

Provider health is stored in SQLite. Future signal generation must lower confidence or suppress signals when a provider is disconnected, stale, or reporting excessive latency.

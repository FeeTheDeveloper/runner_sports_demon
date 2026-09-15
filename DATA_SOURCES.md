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

## Existing Runner Sports feeds to integrate next

- Odds API provider from `runner_sports-site/lib/providers/oddsApi.ts`.
- ESPN provider from `runner_sports-site/lib/providers/espnApi.ts`.
- Site Supabase team registry and provider mappings remain shared cloud data used by the presentation layer; they are not the primary Demon persistence layer.

## Staleness rules

Provider health is stored in SQLite. Future signal generation must lower confidence or suppress signals when a provider is disconnected, stale, or reporting excessive latency.


## ESPN college football (implemented)

- Scoreboard discovery: `GET https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard?dates=YYYYMMDD&limit=1000`
- Live detail: `GET https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event={ESPN_EVENT_ID}`
- Scoreboard state is normalized into canonical CFB games; live summary responses enrich available stats and plays.
- Ranked filtering is performed against provider-supplied top-25 `curatedRank` values. Missing ranks remain unknown.
- ESPN does not consistently provide a game-state update timestamp. When absent, Runner records receipt time as `sourceTimestamp` and sets `sourceTimestampEstimated=true`.
- Default polling is 10 seconds with overlap prevention, cache protection for request-driven schedule discovery, and exponential error backoff.

## The Odds API college football (implemented)

- Endpoint: `GET https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds`
- Authentication uses only `ODDS_API_KEY` from the runtime environment.
- Requested markets default to documented `h2h,spreads,totals`; `ODDS_API_MARKETS` may request other provider-supported market keys. Any returned key is retained and classified without inventing a separate endpoint.
- Bookmaker outcomes are normalized into append-only `SportsMarketSnapshot` records with American price, line when supplied, event mapping, and source/received/processed timestamps.
- `x-requests-remaining` and `x-requests-used` response headers are exposed in provider health. Zero remaining requests imposes a configurable one-hour default quota backoff.
- The provider is reported `DISABLED`, not healthy, when `ODDS_API_KEY` is absent. Default polling is 20 seconds and cannot be configured below 15 seconds.

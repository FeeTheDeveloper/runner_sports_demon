# Current Runner Sports Infrastructure Audit

Reference repository audited remotely: `FeeTheDeveloper/runner_sports-site`.

## Existing application shape

- Next.js 15 / React 19 application with API routes under `app/api` and server-only data providers under `lib/providers`.
- Supabase is the operational store. Server routes use a service-role client; row-level security is enabled on core tables.
- Existing scheduled ingestion is implemented as protected cron API routes, not as long-running local workers.

## Sports and odds feeds

- The Odds API is implemented in `lib/providers/oddsApi.ts` and ingested by `app/api/cron/sync-odds/route.ts`.
- Supported sport slugs: `nfl`, `ncaaf`, `nba`, `wnba`, `mlb`, `nhl`.
- Odds API sport-key mapping exists for NFL, NCAAF, NBA, WNBA, MLB, NHL.
- The cron route upserts `games`, `props`, `market_movements`, and `signals` into Supabase.
- Moneyline, spreads, totals, selected derivative markets, and selected player props are normalized from sportsbook responses.
- Existing odds logic is stable enough to reuse conceptually, but it is request/cron oriented and not sufficient for low-latency in-play market lag detection.

## ESPN integrations

- ESPN provider code lives in `lib/providers/espnApi.ts`.
- ESPN endpoints used include scoreboard, summary, injuries, rosters, standings, teams, athlete search, predictor, win probability, and play-by-play-style summary data.
- ESPN fetches are defensive: timeout, retry/backoff, optional fields, and process-local cache.
- ESPN cron ingestion lives in `app/api/cron/sync-espn/route.ts` with freshness tiers: scoreboard, injuries, rosters, standings, teams.
- ESPN team data seeds a canonical `team_registry` used to join ESPN facts to Odds API games.

## Supabase schema

Observed migrations include:

- `games`: event records with JSONB home/away teams, sportsbook odds, source metadata, status, and timestamps.
- `props`: player prop rows with JSONB player identity and book odds.
- `market_movements`: sportsbook movement rows for spread/total tracking.
- `signals`: current baseline signals derived from market movement and consensus deltas.
- `tracked_bets`: manual bet tracking.
- `team_registry`: canonical team identity registry with ESPN IDs, Odds API names, aliases, abbreviations, and logos.
- `prediction_markets`: current Kalshi/Polymarket market state.
- `prediction_market_snapshots`: append-only-ish price snapshots.
- `prediction_market_game_mappings`: manual/exact/fuzzy mapping between prediction markets and games.
- `espn_records`: provider facts by sport, league, data type, and entity.

## Prediction market implementation

- `lib/providers/predictionMarkets.ts` already has read-only Kalshi and Polymarket discovery.
- Kalshi uses `https://external-api.kalshi.com/trade-api/v2/events`, optional RSA-PSS auth headers, `status=open`, and nested markets.
- Polymarket uses `https://gamma-api.polymarket.com/markets`, active/open filters, sports tag `tag_id=1`, and pagination.
- The site stores current prediction markets plus snapshots, but does not run a live WebSocket worker or persist every meaningful event/delta needed for replay.
- Prediction-market execution is explicitly disabled in the existing app and should remain disabled in this new engine.

## Existing normalization

Reusable ideas:

- `team_registry` and alias matching from `lib/data/teamRegistry.ts`.
- Odds API `MappedGame`, `BookOddsSnapshot`, and source metadata pattern.
- ESPN provider defensive parsing and health-oriented fetch patterns.
- Baseline edge math from `lib/models/edgeCalculator.ts`.

Gaps to address in this repository:

- A canonical event id must be provider-independent, e.g. `RUNNER:NFL:2026-09-05:DAL:PHI`.
- Prediction-market events need deterministic matching to games before fuzzy fallback.
- Market data must be event-sourced, not only represented as current state plus coarse snapshots.
- Latency fields must be first-class: source, received, and processed timestamps.
- Long-running provider health, reconnect attempts, and stale-feed suppression are not present in the site.

## Technical debt not to carry forward

- Do not couple ingestion workers to Next.js API routes.
- Do not store sportsbook odds only as large JSON arrays when replay/research requires event-level history.
- Do not let stale provider data continue producing high-confidence predictions.
- Do not mix connector logic, model logic, and UI rendering.
- Do not rely on fuzzy title matching as the primary market-game mapping strategy.
- Do not claim predictive profitability from the baseline consensus model without backtesting.

## Architecture reuse recommendation

Reuse existing provider knowledge and schemas as input contracts, but keep `runner-live-market-scout` standalone. The website should later consume this service through `/health`, `/markets/live`, `/edges/live`, `/signals/live`, `/games/:id/timeline`, and `/ws/live` instead of owning the live intelligence loop.

# Data Source Registry

The [operations provider matrix](docs/ops/RUNNER_DATA_SPINE.md#provider-operations-matrix) records required env names, storage, freshness limits, verification commands and failure behavior for all six requested provider/export paths. The table below is the earlier capability registry; dated runtime status must be reverified.

| Provider | Role | Sport | Datasets | Auth | Cadence | Freshness | Fallback | Health |
|---|---|---|---|---|---|---|---|---|
| ESPN | authoritative live schedule/game state | NFL, CFB | scoreboard; live state pending | none for current endpoint | schedule/live when implemented | suppress stale output | none for numerical truth | schedule connected |
| nflverse | historical source | NFL | play-by-play | none | batch | immutable local artifact | none | 2025 export validated |
| Odds API | executable sportsbook markets | NFL | h2h, spreads, totals; derivatives provider-dependent | `ODDS_API_KEY` | 15-30s target | suppress missing/stale | Kalshi only for relevant prediction markets | credential-dependent |
| Kalshi | prediction markets | multi | open events and nested markets | Kalshi key/private key or HMAC | live polling/stream | provider health required | none | credential-dependent |
| Polymarket | optional prediction markets | multi | public Gamma/CLOB markets | public discovery; disabled by default | live polling/stream | provider health required | none | disabled |
| Runner AI | structured analyst evidence | multi | observations/intel | local API | event-driven | evidence timestamp/expiry | none | explicit input only |

Credentials are never stored in this registry. `.env.example` is the variable contract; `.env` remains local and untracked.

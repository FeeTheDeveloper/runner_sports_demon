# Current Implementation

Implemented: Kalshi/Polymarket observation foundation, canonical market cache, SQLite event history, structured Game Flow observations, football heuristic totals projections, team/game separation, totals market taxonomy/mapping, American-price implied/no-vig math, trend scores/classes, conversion suppression, SSC/freshness checks, selection-aware market comparison, suppression, server-time decision windows, edge decay/IDI, set points, halftime packets, alternate ladders, totals persistence, API contracts, and deterministic replay through the live runtime.

P0 CFB foundation now also includes ESPN scoreboard normalization, provider-abbreviation canonical event IDs, schedule/today/ranked routes, game-specific flow and market routes, append-only game-state snapshots, and a Live Desk dashboard view. ESPN failures remain visible as provider errors; rankings and numerical state are never inferred.

Provider-limited: verified live sportsbook derivative availability, possession/drive richness, injuries, timeouts, starter removal, and liquidity vary by feed. Unsupported inputs remain absent and reduce confidence.

Next calibration stage: ingest representative games, measure projection error and window quality by market family, calibrate possession/PPD and trend weights, and validate suppression thresholds before treating `ACTIONABLE` as production-grade decision support.

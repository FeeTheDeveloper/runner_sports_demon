# Model Notes

`baseline_market_implied_v0` echoes market-implied probability and assigns a confidence score penalized for spread and staleness. It is currently referenced by tests rather than an integrated predictive market pipeline.

This is not a predictive model and must not be used to claim profitability.

The implementation also includes `football-heuristic-v1` totals projections, game-flow calculations, and vig/probability math. See `TOTALS_ENGINE.md`, `MODEL_REGISTRY.md`, `src/totals/`, and `src/models/vig/engine.ts`. Totals heuristics are uncalibrated; their presence does not establish predictive performance. The following milestones describe the broader independent probability pipeline.

Next model milestones:

1. Add sportsbook consensus probability from existing Odds API feeds.
2. Add live score/time model per sport.
3. Add game-state model with sport-specific features.
4. Add Runner ensemble model combining game state, sportsbook consensus, and prediction-market prices.
5. Backtest every signal family before promoting alert thresholds.

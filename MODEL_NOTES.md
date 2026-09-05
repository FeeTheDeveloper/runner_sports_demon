# Model Notes

The current model layer only includes `baseline_market_implied_v0`, which echoes market-implied probability and assigns a confidence score penalized for spread and staleness.

This is not a predictive model and must not be used to claim profitability.

Next model milestones:

1. Add sportsbook consensus probability from existing Odds API feeds.
2. Add live score/time model per sport.
3. Add game-state model with sport-specific features.
4. Add Runner ensemble model combining game state, sportsbook consensus, and prediction-market prices.
5. Backtest every signal family before promoting alert thresholds.

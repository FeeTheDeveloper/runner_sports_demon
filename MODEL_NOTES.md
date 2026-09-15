# Model Notes

The current model layer only includes `baseline_market_implied_v0`, which echoes market-implied probability and assigns a confidence score penalized for spread and staleness.

This is not a predictive model and must not be used to claim profitability.

Next model milestones:

1. Add sportsbook consensus probability from existing Odds API feeds.
2. Add live score/time model per sport.
3. Add game-state model with sport-specific features.
4. Add Runner ensemble model combining game state, sportsbook consensus, and prediction-market prices.
5. Backtest every signal family before promoting alert thresholds.


## Immutable Runner baseline seam

`runner_baselines` accepts only validated `RUNNER_MODEL` or `EXTERNAL_MODEL` projections with explicit model/version, evidence input names, confidence, data quality, and source/received/processed timestamps. It is immutable at the database level. The runtime does not create a baseline from sportsbook or prediction-market prices, and rejects the existing `baseline_market_implied_v0` as a pregame baseline source.

Model-vs-market comparisons are emitted only when a baseline target/selection matches a mapped, executable Odds API outcome with a valid price (and line for line markets). Probability/line edge, confidence, and data quality remain separate fields. `executionAssessment` is `NOT_EVALUATED`; these comparisons are intelligence outputs, not wagering instructions. Missing projections or executable markets produce explicit unavailable records with suppression reasons.

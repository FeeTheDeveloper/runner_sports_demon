# Backtesting

Backtesting is scaffolded in storage only. Future implementation should replay stored game state, market prices, model predictions, signals, and alerts from SQLite.

Required metrics:

- signal hit rate
- Brier score
- log loss
- calibration
- ROI simulation
- edge realization
- maximum favorable movement
- maximum adverse movement
- edge duration
- market lag duration
- latency distributions

No profitability claim is valid until this framework is implemented and run against statistically meaningful samples.
# Totals evaluation

Totals research must report projection error, line-relative error, signal precision, false-positive rate, window quality, favorable/adverse movement, edge persistence, opportunity half-life, duration, set-point usefulness, trend calibration, suppression correctness, and performance by game/team/half/quarter market family. Profitability must not be claimed before representative out-of-sample validation.

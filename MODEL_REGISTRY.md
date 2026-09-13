# Model Registry

| Model | Version | Sport | Objective | Feature version | Training | Validation | Calibration | Status |
|---|---|---|---|---|---|---|---|---|
| Football totals heuristic | existing | NFL/CFB | Conservative live totals projection | observation-derived | N/A | N/A | Not calibrated | active |
| Baseline market implied | `baseline_market_implied_v0` | multi | Smoke-test implied probability | market snapshot | N/A | N/A | None | non-production |
| Runner NFL historical fusion | pending | NFL | Independent pregame/live projection | `runner_nfl_history.v1` | 2025 pending integration | pending | pending | awaiting implementation |

Production model changes require a version increment, feature version, validation window, calibration method, deployment date, and known weaknesses. No model in this registry authorizes automated trading.

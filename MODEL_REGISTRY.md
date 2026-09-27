# Model Registry

| Model | Version | Sport | Objective | Feature version | Training | Validation | Calibration | Status |
|---|---|---|---|---|---|---|---|---|
| Football totals heuristic | football-heuristic-v1 | NFL/CFB | Conservative live totals projection | observation-derived | N/A | N/A | Not calibrated | research |
| Baseline market implied | `baseline_market_implied_v0` | multi | Smoke-test implied probability | market snapshot | N/A | N/A | None | non-production |
| Runner NFL historical fusion | pending | NFL | Independent pregame/live projection | `runner_nfl_history.v1` | 2025 pending integration | pending | pending | awaiting implementation |

Production model changes require a version increment, feature version, validation window, calibration method, deployment date, and known weaknesses. No model in this registry authorizes automated trading.

The Site forecast publisher now rejects unregistered/research versions. Promotion requires `production_status: production`, `calibration: validated`, a concrete `validation_period` and a `validation_report` reference in MODEL_REGISTRY.json, following human review of actual held-out evidence. No current model meets this gate. Market prices remain indicative; the forecast publisher leaves executable price and edge null until a comparable quote/cost contract exists.

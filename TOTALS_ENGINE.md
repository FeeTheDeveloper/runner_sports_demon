# Runner Totals Engine v1

The totals engine is an intelligence-only, event-driven analytical domain. It does not place wagers.

## Model boundary

`football-heuristic-v1` is an exposed baseline, not trained ML and not a profitability claim.

```text
projected final = current points
  + home remaining drives × home adjusted PPD
  + away remaining drives × away adjusted PPD
```

Observed PPD, adjusted PPD, projected PPD, remaining-possession assumptions, confidence penalties, timestamps, line, price, raw edge, favorable selection-aligned edge, and suppressions remain visible.

## Lifecycle

`DETECTED → WATCH → ARMED → ACTIONABLE → DECAYING → EXPIRED`

Any state may be `SUPPRESSED` by stale/conflicting feeds, an unmatched event, market suspension, low confidence, low favorable edge, liquidity, or spread rules. Server timestamps determine expiry. `IDI = current favorable edge / initial favorable edge` when initial edge is positive.

## Defaults

- Minimum projection confidence: `0.60`
- Minimum favorable edge: `1.0`
- Decay ratio: `0.50`
- Game/market freshness: `15 seconds`
- Decision timers: FAST `15s`, NORMAL `30s`, HALFTIME `120s`
- Trend classes: `50/65/75/85`

All defaults are configurable research parameters and are not calibrated claims.

## Runtime API

- `POST /totals/evaluate` accepts `{ input, markets }` and performs projection, comparison, suppression, and window creation.
- `GET /totals/live`
- `GET /totals/alerts`
- `GET /games/:id/totals`
- `GET /games/:id/totals/projections`
- `GET /games/:id/totals/signals`
- `GET /games/:id/totals/windows`
- `GET /games/:id/totals/set-points`

Providers that do not expose a totals family are not inferred. The normalized interface remains available until a verified provider mapping supplies it.

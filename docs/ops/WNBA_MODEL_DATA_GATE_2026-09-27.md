# WNBA model and third-party data gate — September 27, 2026

## Current evidence

The Demon has a local WNBA score/clock research estimator in `scripts/wnba-win-analog.mjs`. It has no approved historical WNBA play-state file, so it emits no WNBA probabilities. The signed-in BettingPros/Outlier browser surfaces do not establish a bulk training-data grant. No approved provider export/feed, reuse agreement, or adapter was found in this checkout. `data/raw/track-record/bettingpros-profile-2026-09-27.json` is an owner-account summary with `model_input_approved: false`; it is excluded from model training.

Outlier's [terms](https://www.outlier.bet/terms/) prohibit automated collection and unapproved commercial reuse. BettingPros' [terms](https://www.bettingpros.com/terms/) did not provide a verified data-reuse grant in this review. No automated pull from either provider was made. Official NBA/WNBA [statistics terms](https://www.nba.com/termsofuse) also restrict gambling and comprehensive database use, so a public stats page is not a substitute license for this product.

## Required data and permission record

For the WNBA score/clock model, provide a local UTF-8 JSONL history with one observed play state per line:

```json
{"gameId":"provider-stable-id","season":2024,"period":3,"clock":"07:12","homeScore":54,"awayScore":51,"finalHomeScore":82,"finalAwayScore":78}
```

The file must cover 2021-2025, have stable unique game IDs, final scores consistent across each game's rows, and include only states observed by the indicated clock. The 2025 season is held out and never used for analog lookup. Keep the raw file private and preserve its source hash. The rights-record JSON must name `sourceId`, an `evidence` locator to an approved agreement/export, and `permittedUses` containing `local_model_training`, `betting_analysis`, and `commercial_derived_output`. The CLI checks the record's presence and shape; it **does not independently verify** the underlying agreement.

For any future BettingPros/Outlier feed, record source and agreement ID, permitted fields/cadence/retention/derived display, source and receipt timestamps, stable game/player/market IDs, stat denominators, season and phase, transform version, raw hash, and deduplication key. L5/L10/L20 are overlapping views of games, never 35 independent observations. Report raw observations, unique games, and effective sample size where recency weights are used. BettingPros' [WNBA reliability study](https://www.bettingpros.com/articles/evaluating-the-reliability-of-wnba-player-stats/) is a methodology reference, not a grant of training data or a universal sample threshold. Outlier's [WNBA research](https://help.outlier.bet/en/articles/8012689-wnba-player-props-and-game-stats-june-5th) is likewise a UI capability, not a feed grant.

## Model acceptance and limits

- 300 distinct training games (2021-2024), 100 distinct scored 2025 halftime holdout games, and 80 distinct analog games per output.
- Report chronological holdout Brier, log loss, and a constant home-win baseline. The Brier score must improve on that baseline to emit experimental estimates.
- Suppress stale WNBA slate receipts, malformed scores/clocks, overtime, missing rights/history, and insufficient analogs.
- Playoff transfer, non-halftime calibration, team/roster effects, market execution and profitability remain unvalidated. Registry status remains `research`; no paid signal or site publication follows from a passing local test.

## Hookup sequence

1. Obtain the specific provider permission/export or another licensed historical feed covering the uses above; store the file and rights evidence outside Git.
2. Run `node scripts/wnba-win-analog.mjs --history C:\private\wnba-states.jsonl --rights-record C:\private\wnba-rights.json --write` against a current local slate.
3. Review the emitted history hash, unique-game counts, holdout metrics, and per-game suppressions. Add source adapter and provider-specific tests only after the permission contract is established.

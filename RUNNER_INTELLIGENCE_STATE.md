# Runner Intelligence State

## CURRENT PRIORITY
NFL live intelligence and cross-repository orchestration.

## ACTIVE SPORTS
NFL; NCAAF.

## ACTIVE MODELS
Existing football totals heuristics; model registry integration pending.

## ACTIVE PROVIDERS
ESPN CFB/NFL scoreboard; Kalshi; optional Polymarket; credential-gated Odds API NFL markets.

## DATA HEALTH
2025 nflverse PBP acquired and normalized in Verse; 285 games, 6045 drives, 2312 period rows, and 48767 state samples exported with checksums. Live PBP/drive ingestion and sportsbook credentials remain incomplete.

## CURRENT BUILD
Demon is the live intelligence system of record. RSAA Verse owns historical data/features. Runner Site owns presentation.

## OPEN BLOCKERS
Demon historical adapter has not loaded the validated export; no live NFL PBP/drive adapter; Odds API and authenticated Kalshi credentials depend on local environment; R tooling is unavailable locally.

## ACTIVE HANDOFFS
See `.runner/handoffs/`.

## COMPLETED HANDOFFS
None in this coordination state.

## MODEL VERSIONS
Existing model versions remain documented in Demon model notes.

## FEATURE VERSIONS
No cross-repository feature export accepted yet.

## NEXT ACTIONS
Validate and load the Verse 2025 NFL export, complete Demon live NFL state, connect model artifacts, then validate Site consumption.

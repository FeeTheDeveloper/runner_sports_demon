# Third-party matchup sheets

Curated pregame matchup sheets supplied by the owner, stored as structured reference material.

**Author: Kye Kirms.** These are influence material, not gospel. They are not Runner output, not Runner-validated, and not authoritative for anything.

## Boundary

Every record carries `authority.level: REFERENCE_ONLY`, `model_input_approved: false` and `publishable: false`, and `scripts/validate-matchup-sheets.mjs` fails the build if any record weakens those. Concretely:

- Do not feed these figures into a Runner model, backtest or calibration run without an explicit owner decision recorded in `docs/ai-sync/DECISION_LOG.md`. They are a third party's derived numbers with unstated methodology.
- Do not publish, republish or surface them on the Site or in content cards. They are not Runner's to distribute.
- Do not present any figure here as Runner intelligence, and do not blend them into Runner outputs without labelled provenance.
- Treat them as one analyst's prior, useful for orientation and disagreement, never as a settlement source.

Runner-owned truth stays in the play-by-play warehouse (`data/raw/nfl/play_by_play`), the normalized store and the model registry.

## Layout

```
season=<YYYY>/week=<WW>/<AWAY>-<HOME>.json
```

Contract: `contracts/matchup-sheet.schema.json` (`runner.matchup-sheet.v1`). Validate with `npm run matchup:validate`.

## Canonical IDs

The sheets use different team abbreviations than the engine. Stored records carry both: `sheet_abbreviation` preserves the source spelling, `abbreviation` is remapped to the engine's canonical form, and `runner_event_id` holds the engine event.

Known remaps: `JAC` → `JAX`, `WAS` → `WSH`. The validator enforces that both halves of `runner_event_id` appear in `teams`, so a future mismatch fails rather than silently dropping a game.

A sheet with no matching engine event is stored with `runner_event_id: null` and `runner_event_state: NO_ENGINE_EVENT` instead of being dropped or force-fitted.

## What is deliberately not stored

Two classes of figure were left out rather than guessed. Both are recorded per-record under `conventions`:

1. **Context ranks** — defenses/offenses faced, explosive play and havoc ranks. The PDF text layer interleaves the two teams' columns, so attribution between home and away is ambiguous. Stored as `context_ranks: null`.
2. **QB situational splits** — clean pocket / pressured / blitzed, vs man and zone coverage, safety shells, and pass depth and concept buckets. Present on the source sheets, not yet transcribed.

Inferred conventions that still need owner confirmation: the efficiency triplet reading (raw rate followed by two ranks), rank direction, and the `favorite_column` sign convention.

## Provenance

Transcribed manually from owner-supplied PDFs, not machine-extracted. Verify against the source before any downstream use. `source.stats_sheet_present` records whether the matchup's stats sheet was supplied — `ATL-GB` arrived with only a logs sheet, so its stats-derived blocks are null.

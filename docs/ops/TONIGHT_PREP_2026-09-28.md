# Tonight's prep — Monday, September 28, 2026

Prepared 2026-09-28 ~15:45 CDT. Research only. No wagers, no trades, no publication.

## The slate is one game

| League | Games | Detail |
|---|---|---|
| NFL | **1** | **PHI @ CHI** — Week 3 Monday nighter. Kickoff `2026-09-29T00:15Z` = **7:15 PM CDT / 8:15 PM EDT**. ESPN event receipt `CURRENT_RECEIPT`, phase `SCHEDULED`, 0-0. |
| WNBA | 0 | No games on the date. |
| MLB | 0 | No games on the date. |

Receipt: `.runner/slates/2026-09-28-20260928T135722668Z.json`. A re-pull at 20:41Z produced `no change`, so the scoreboard state is unchanged since 13:57Z.

Everything tonight is one football game. There is no cross-sport slate to triage.

## Ready to run

**Engine is green.** `npm test` passes (build + 15 test programs + live-coverage and wnba-analog suites), exit 0.

**Score/clock analog model is armed.** `python scripts/live-win-analog.py --date 2026-09-28` executes cleanly, reads the local SQLite warehouse, sees the 1 scheduled game and correctly returns `predictions: []` — it needs a live score and clock, so it produces nothing until kickoff. Its recorded holdout:

| Metric | Value |
|---|---|
| Train games (2016-2024) | 2,467 |
| Holdout season / games | 2025 / 264 |
| Brier | 0.1841 |
| Constant home-win baseline Brier | 0.2488 |
| Log loss | 0.5466 |

Scope is **halftime winner only**. It does not validate prices, edges, other game times, or the 2026 season. Registry status stays experimental; nothing here is a calibrated paid model.

### Commands for tonight

```powershell
# Rolling receipts through the game (>= 60s interval; writes only on change)
node scripts/live-slate.mjs --rolling --interval-seconds 120

# Analog win probability once PHI@CHI is live; --write records to .runner/predictions/
python scripts/live-win-analog.py --date 2026-09-28 --write
```

Run the analog at halftime for the state its holdout actually covers. Earlier and later readings are out of validated scope and should be labelled as such.

## Blocked, and why

- **No odds, no market prices, no Kalshi.** The Demon `.env` has `ODDS_API_KEY`, `KALSHI_API_KEY_ID`, `KALSHI_API_SECRET` and `POLYMARKET_API_KEY` **empty**. The companion Site `.env.local` does hold an Odds API key and Kalshi credentials, but moving credentials between repositories is an owner decision, not something to do silently. Until the Demon environment is populated there is no line, no total, no CLV reference and no market-vs-model comparison tonight — only scoreboard facts and the analog estimate.
- **No matchup sheet for PHI-CHI.** The store has 15 Week 3 sheets (`data/raw/nfl/matchup-sheets/season=2026/week=03/`) and all 15 validate, but they are the Sunday games only. Tonight's Monday game is the one matchup in the week with no sheet. These are manual transcriptions of owner-supplied Kye Kirms PDFs, so a sheet cannot be produced without the source PDFs. They remain `REFERENCE_ONLY`, `model_input_approved: false`.
- **WNBA analog stays dark**, per [the rights gate](WNBA_MODEL_DATA_GATE_2026-09-27.md) — and it is moot tonight with zero WNBA games.

## What would make tonight materially better

1. Supply the **PHI-CHI Week 3 logs/stats PDFs** so the matchup sheet can be transcribed to match the other 15.
2. Decide whether the Demon may use the **Odds API key** already present in the Site environment. That single decision turns tonight from scoreboard-only into a model-vs-market read.

## Update — 17:20 CDT, reference market capture

Two of the three blockers above have moved. Recorded in [`data/raw/market-reference/`](../../data/raw/market-reference/).

**The PHI-CHI matchup sheet blocker is closed.** Commit `bfad51a` added `data/raw/nfl/matchup-sheets/season=2026/week=03/PHI-CHI.json` from owner-supplied PDFs. Week 3 now holds all 16 sheets. They remain `REFERENCE_ONLY`, `model_input_approved: false`.

**Chicago's quarterback market has changed, and it explains the line.** Outlier's passing-prop board for this game prices **Case Keenum (#11)** and **Tyson Bagent (#17)**. There is no Caleb Williams passing market on the page. Keenum carries the full market set and Bagent only three markets, which is the shape of a starter-and-backup pair. **This is market evidence, not an official source** — confirm against the injury report or inactives list before recording a starter anywhere in Runner, and check whether the new matchup sheet's quarterback assumptions still hold.

**The market moved hard in the same direction.** BettingPros open-to-consensus for tonight:

| Market | Open | Consensus | Move |
|---|---|---|---|
| Spread | CHI -1.5 (-105) | **PHI -3.5 (-110)** | 5.0 points to Philadelphia |
| Moneyline | PHI -102 / CHI -118 | **PHI -200 / CHI +165** | PHI de-vigged 0.483 → 0.639 |
| Total | 46.5 | **42.5** | -4.0 |

Nineteen books are shown; Hard Rock is OFF and DraftKings shows no moneyline. Best two-sided moneyline pricing sits on the exchanges (Novig and ProphetX at PHI -178 / CHI +174, about 0.5 percent hold, against 4.4 percent at consensus).

**The market-data blocker is not closed.** Both captures are `REFERENCE_ONLY`, `rights_class: UNLICENSED_THIRD_PARTY_SURFACE`, `model_input_approved: false`. They are screen-read observations from third-party research products Runner's owner is entitled to view — not a licensed feed and not an executable quote. Nothing here may feed a model or a published claim, and no model-vs-market edge may be computed from it.

**There is a licensed route to the same game.** Kalshi and Polymarket both appear as columns on that board and are already registered Runner providers in `DATA_SOURCE_REGISTRY.md`. Their prices for this event can be read directly from their own public interfaces on Runner's existing provider path, which would make them ingestible rather than reference-only — and needs no third-party data at all. That is the supported way to turn tonight into a real model-vs-market read, and it is a narrower decision than moving the Site's Odds API key.

## Standing boundaries

Retrieval freshness is not ESPN update freshness. The analog carries no possession, injury, roster, weather, team-strength or price input. No scoreboard lead or market midpoint is an executable exit. Nothing here is published to the Site.

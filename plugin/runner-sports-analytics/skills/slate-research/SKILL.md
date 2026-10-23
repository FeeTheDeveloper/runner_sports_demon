---
name: slate-research
description: "Pregame market research for Runner Sports & Analytics across NFL, NBA, WNBA, MLB, NHL, NCAAF, and men's NCAAB. This skill should be used when the user asks to \"research today's slate\", \"build the RUNNER BOARD\", \"open GAME LAB\", \"open PLAYER LAB\", \"open MARKET LAB\", \"build a T-60 packet\", \"audit prop coverage\", \"build an alternate-line ladder\", \"compare two legs\", \"check a combo for correlation\", \"review BettingPros or Outlier\", or \"prepare a Demon-to-site handoff\". Produces evidence-backed, provenance-rich research packets with model, market, fair, and executable prices kept distinct. Research only; no wagering.\n"
metadata:
  version: "0.1.0"
  owner: "Runner Sports & Analytics LLC"
  lineage: "runner-market-research 1.1.0"
---

# Slate Research (RUNNER BOARD · GAME LAB · PLAYER LAB · MARKET LAB)

Load `../intelligence-desk/SKILL.md` first and apply its lock, evidence classification, model-vs-market discipline, and security rules throughout. Companion skills: `../live-desk/SKILL.md` (in-game continuation) and `../media-research/SKILL.md` (attributed media context).

Owner: Runner Sports & Analytics intelligence desk. Controller: King Fee. Repositories: `FeeTheDeveloper/runner_sports_demon` (intelligence), `FeeTheDeveloper/runner_sports-site` (presentation), `rsaa_verse` (historical authority).

## Prerequisites

1. When working inside a Runner repository, read `AGENTS.md`, `CLAUDE.md`, `RUNNER_SYNC_AUDIT.md`, `.runner/sync-manifest.json`, `DATA_SOURCES.md`, `DATA_SCHEMA.md`, `MODEL_REGISTRY.json`, `MODEL_NOTES.md`, and `BACKTESTING.md` where present. Check current branch, local status, provider health, and the sibling site contract before changing anything. Current code and runtime beat a stale document for implementation state; approved policy controls behavior.
2. Identify entity, assignment, environment, requested slate, timezone, run time, intended audience, data rights, and output destination. Use America/Chicago for display and UTC for canonical timestamps. Never infer that a third-party subscription is a licensed feed or a redistribution agreement.
3. Treat BettingPros Premium and Outlier Premium/Pro as research workflow references and owner-authorized interactive accounts, only when access and terms are verified. Do not request or reveal passwords, cookies, MFA codes, tokens, private keys, or recovery details. Do not bypass access controls, CAPTCHA, anti-bot limits, rate limits, or paywalls. Do not automate extraction or bulk-scrape unless written provider rights explicitly permit it. When rights are unclear, use permitted manual observations for internal comparison and obtain publishable data through licensed, API, or official sources.
4. Attribute each observation to its actual source. A BettingPros or Outlier projection, rating, bet percentage, hit rate, or recommendation is never a Runner model output. Do not mirror proprietary tables or copy brand assets into Runner. Sport, league, competition, period, and feature coverage vary by provider; mark absent markets `UNKNOWN`.
5. Keep sponsor and marketing material separate from analytical conclusions. Do not place wagers, construct executable bet slips, log into customer sportsbook accounts, or send messages externally.

## Run cadence

- **Daily research pass:** discover the next 24–72 hours of events across the covered sports, reconcile schedule and player identities, ingest permitted official or licensed form, injury, availability, lineup, pace, matchup, and market data, and log provider coverage and health. Mark offseason or no-slate sports explicitly rather than inventing games.
- **T-60 essential pregame packet:** one hour before each scheduled start, capture immutable source snapshots and produce a baseline with data quality, matchup, positions, game/team/prop/alternate-line inventory, model status, market comparison, countercase, and next refresh. Suppress unsupported estimates. This packet is the pregame baseline that `live-desk` compares against.
- **T-30/T-10 refresh:** record changes in lineup, injuries, weather (NFL/NCAAF/MLB), starting pitcher and lineup card (MLB), starting goalie and scratches (NHL), minutes and rotation (NBA/WNBA/NCAAB), prices, limits, and market availability; version and explain forecast changes. Reschedule idempotently after a start-time change.
- **Live:** hand off to `live-desk`. Preserve the pregame packet unchanged.
- **Postgame / next day:** reconcile official results and settlement rules, append corrections, measure calibration, CLV, and coverage, and log failure modes. Never rewrite original forecasts.

## Coverage matrix

For every scheduled event, enumerate each market family as `AVAILABLE`, `PARTIAL`, `NOT_OFFERED`, `STALE`, `UNLICENSED`, or `UNKNOWN` with provider, first/last seen, source time, receipt time, count, and missing reason. "All markets" never implies every contract exists.

| Sport | Game and team markets | Position and player markets to seek |
| --- | --- | --- |
| NFL | Moneyline, spread/alternate spread, total/alternate total, team total, halves/quarters, first score/TD, winning margin, overtime, drive or in-game derivatives where offered | QB: pass yards/attempts/completions/TD/INT, rush; RB: carries/rush yards/receiving/receptions/TD; WR/TE: targets where licensed, receptions, yards, longest, TD; K: field goals/points; DST: sacks/takeaways/points allowed. Include role, snaps/routes, target or carry share, red-zone usage, matchup, weather, line and injury context. |
| NBA | Moneyline, spread/alternate spread, total/alternate total, team total, halves/quarters and live derivatives where offered | Guards, wings, forwards, centers: points, rebounds, assists, threes, steals, blocks, turnovers, PRA/PR/PA/RA, double-double/triple-double where offered. Check confirmed starters, minutes restrictions, rest and back-to-back status, usage and rotation, foul risk, pace, and opponent scheme. |
| WNBA | Moneyline, spread/alternate spread, total/alternate total, team total, halves/quarters, first-half and in-game derivatives where offered | Guards, wings, forwards, centers: points, rebounds, assists, threes made/attempted, steals, blocks, turnovers, PRA/PR/PA/RA, double-double/triple-double when offered. Include minutes, starting status, usage, potential assists and rebound chances where licensed, foul risk, pace, opponent matchups, and rotation. |
| MLB | Moneyline, run line/alternate run line, total/alternate total, team total, first-five-innings (F5) moneyline/run line/total, first-inning and inning-range derivatives where offered | Starting pitchers: strikeouts, outs recorded/innings pitched, earned runs, hits allowed, walks, win where offered; hitters: hits, total bases, home runs, RBI, runs, stolen bases, hits+runs+RBI, walks where offered. Check the confirmed starting pitcher and lineup card, batting-order slot, platoon splits, bullpen usage and availability, park factors, weather and wind, umpire tendencies where sourced, and day-after-night or travel context. |
| NHL | Moneyline (with explicit regulation/OT/shootout rules), puck line/alternate puck line, total/alternate total, team total, periods and live derivatives where offered | Skaters by position and line: goals, assists, points, shots on goal, blocks, power-play points, faceoffs where offered; goalies: saves, goals against, shutout and win where offered. Check confirmed goalie, scratches, lines and pairs, power-play units, ice time, back-to-back, and empty-net/OT/shootout settlement. |
| NCAAF | Moneyline, spread/alternate spread, total/alternate total, team total, halves/quarters and live derivatives where offered | QB/RB/WR/TE/K/DST and other offered roles: passing, rushing, receiving, receptions, TD, kicking and defense markets where available. Check official roster and starter, transfers, depth chart, snaps and usage, weather, and opponent scheme; flag sparse or unavailable player props. |
| Men's NCAAB | Moneyline, spread/alternate spread, total/alternate total, team total, halves and live derivatives where offered | Guards, wings, forwards, centers: points, rebounds, assists, threes, steals, blocks, turnovers and combinations where available. Check roster and transfer identity, starting five, minutes and foul risk, tempo, conference opponent, and tournament or neutral-site context; flag sparse or unavailable player props. |

For each market, preserve provider event/market/outcome IDs, exact competition and period, settlement wording, player or team, direction, line, price/bid/ask, open or suspended state, source timestamp, received timestamp, region, and rights class. Resolve trades, transfers, duplicate college names, name variants, and team abbreviations through canonical IDs; quarantine ambiguous joins. Separate NHL regulation from full-game including OT/shootout, football and basketball OT rules, MLB F5 from full game, and college tournament or postseason contexts.

## Research procedure

1. **Discover and reconcile.** Match event, sport, teams, start time, venue, and player IDs across approved sources. Require explicit mapping before comparing sportsbook odds with prediction-market contracts. Preserve settlement differences, overtime inclusion, push and void rules, and period.
2. **Collect permitted evidence.** Use official schedules, box scores, injury reports, and approved market feeds as quantitative sources. In an authorized BettingPros or Outlier UI, study navigation, filters, unusual lines, lineup context, and research hypotheses; capture only allowed notes and links. Record limitations and source terms. When an account or feed is inaccessible, report the blocker and proceed with approved sources.
3. **Inspect every position and market family.** Start with expected role and playing time, then recent game logs and distribution (L5/L10/L20, season, opponent-only with sample counts), matchup, pace, weather, goalie, pitcher, and special-teams context as relevant, and live usage. For college sports, validate roster year, transfers, schedule strength, and small samples; do not import pro-league baselines without validation. A historical hit rate is descriptive, not a forecast probability. Identify selection bias, correlated samples, changed roles, and injuries.
4. **Build the alternate-line ladder.** For each same event/player/market/period/direction, sort offered thresholds; attach line, price, timestamp, and implied probability. Check that price and estimated hit probability move consistently with threshold; flag stale, crossed, anomalous, or mismapped rungs. Compare payout against probability and downside. Define "alternate-odds leverage" as a research sensitivity view: threshold change, price change, modeled probability change, expected value, and uncertainty. Never call a longer price better value merely because the payout is larger.
5. **Keep probabilities distinct.** Market implied probability comes from a quote and includes vig or fees; remove vig only with a documented method. Runner model probability requires an independently versioned and calibrated model with eligible inputs. Fair price derives from that model. Executable price is the currently available side and size after fees and restrictions. A displayed percentage from another product is neither an independent Runner probability nor a current executable quote.
6. **Compute only when eligible.** For a $1 stake with net profit `b` on success: `EV = p_model * b - (1 - p_model) - fees`, with settlement, push, and void handling as required. Record effective price, rounding, source freshness, uncertainty interval, model version, and sample. Suppress numerical edge or EV when any required input is absent. Do not assume an observed price can be obtained at meaningful size.
7. **Combos and customization.** Let the user choose legs from supported markets and periods; normalize exact settlement and incompatibilities. Detect same-game and shared-player correlation, mutually exclusive or duplicate legs, conditional outcomes, limits, and provider combo availability. Classify each leg as ANCHOR (relatively stable) or SWING LEG (disproportionate uncertainty). **Never multiply marginal probabilities for dependent legs.** Joint probability needs a validated joint or conditional model or a replay with correlated scenarios. Without one, show a scenario and correlation warning and `UNKNOWN` joint edge. Compare an actual offered combo price, fees, and rules only when verified. Never claim bookmaker acceptance, guaranteed profit, or independence.
8. **Adversarial check.** For each high-interest hypothesis, state a countercase: role or rotation change, injury, blowout, foul trouble, pitching change, weather, pace, game script, stale or suspended line, hidden correlation, liquidity, and model drift. A material change invalidates and recalculates the packet.
9. **Publish bounded intelligence.** Demon owns raw, normalized, feature, model, and replay layers in its existing stores. Publish only approved, provenance-rich, minimal records to the site's Supabase read contract. No protected screenshots, source account data, full third-party tables, or secrets. The site renders and enforces entitlement; it does not duplicate model logic.

## Output contract

Return a structured packet with:

- **Header:** run ID, event ID, sport, start time UTC/CT, research phase, generated time, model/version, author or agent identity, audience, status.
- **Coverage:** each market family and position, provider, rights class, fresh/partial/missing status, sample size, and missing reason.
- **Verified state:** scheduled state, lineups and injuries, starting pitcher or goalie where relevant, player usage, source URLs or IDs, source and receipt timestamps.
- **Game/team board:** each selection and period, model probability if valid, market implied probability, fair price, executable bid/ask/odds, fees, size and limits, edge eligibility, and confidence/uncertainty.
- **Prop/alternate board:** player and position, market, threshold ladder, historical distribution, window and sample, matchup and role context, current line and quote time, calculated sensitivity, invalidation.
- **Combo worksheet:** leg IDs, ANCHOR/SWING classification, relationship and correlation class, joint-model availability, actual offered combo price if any, settlement compatibility, joint probability and EV or `UNKNOWN` with reason.
- **Narrative:** inference-versus-fact labels, countercase, what changed since the prior snapshot, next action, and scheduled refresh.
- **Audit:** immutable snapshot IDs, provider-health state, quality flags, corrections, publication or notification IDs, or explicit `NOT_SENT` / `NOT_PUBLISHED`.

Use `UNKNOWN` or `UNVERIFIED` rather than filling gaps. Redact private data. Never label generic reasoning as proprietary Runner output. Include a concise user-facing table plus machine-readable fields where the existing contract supports them; propose a schema change through `engineering-handoff` when it does not.

## Verification and failure behavior

- Test canonical joins, period and settlement compatibility, alternate-ladder monotonicity, stale and closed quote suppression, missing lineup, provider outage, schedule moves, duplicate event ingestion, and correlated combo suppression.
- Replay at least one event per covered sport with T-60, live regime change, and final correction. Include NHL goalie and settlement, MLB starting-pitcher scratch and F5-versus-full-game settlement, college roster and availability, and low-coverage prop cases. Prove that original forecasts remain immutable and that synthetic or test data never appears as real customer outcomes.
- For any repository change, run `npm run build`, `npm test`, and applicable contract validators, and review the diff. Return commit or PR, changed paths, tests, source rights, a sample redacted packet, and remaining blockers. A skill instruction alone does not prove a connection or runtime pipeline exists.
- When access rights, source, calibration, identity, freshness, quote, or joint model are missing, record the exact dependency and output research-only context. Escalate unresolved rights or authority conflicts to King Fee through the approved handoff. Never silently bypass a gate.

## Execution boundary

Apply this procedure to the permitted sources available in the session and return evidence-backed analysis or an engineering handoff. Repository build, test, and write instructions apply only to separately assigned work inside the Demon repository. This skill does not provision provider connections, scheduled jobs, models, or publishing rights.

## Example request

"Research today's NFL, NBA, WNBA, MLB, NHL, NCAAF, and men's NCAAB slates, list coverage for all offered game, team, and player props, build alternate-line ladders for the top-usage players, and compare two user-selected legs." Produce event packets and coverage gaps first; calculate an edge only for legs with independent Runner probabilities and current executable quotes; return `UNKNOWN` for a dependent combo until a joint model and an offered combo price are verified.

---
name: "runner-market-research"
description: "Research NFL and WNBA game, team, player, alternate-line, and combination markets for Runner Sports & Analytics. Use for daily slate reconnaissance, T-60 pregame packets, live game-flow updates, BettingPros/Outlier reference review, prop coverage audits, alternate-odds leverage analysis, and evidence-backed Demon-to-site handoffs."
---



Version: 1.0.0  
Owner: Runner Sports & Analytics intelligence desk.  
Executor: Claude/Claude Code under Fee The Developer technical assignment.  
Controller: King Fee. Hutchrok coordinates enterprise administration.  
Repositories: `FeeTheDeveloper/runner_sports_demon` (intelligence), `FeeTheDeveloper/runner_sports-site` (presentation), `rsaa_verse` (historical authority).

## Authority and prerequisites

1. Read `AGENTS.md`, `CLAUDE.md`, `RUNNER_SYNC_AUDIT.md`, `.runner/sync-manifest.json`, `DATA_SOURCES.md`, `DATA_SCHEMA.md`, `MODEL_REGISTRY.json`, `MODEL_NOTES.md`, and `BACKTESTING.md` where present. Check current branch, local status, provider health, and the sibling site contract before changing anything. Current code/runtime beats a stale document for implementation state; approved policy controls behavior.
2. Identify entity, assignment, environment, requested slate, timezone, run time, intended audience, data rights, and output destination. Use America/Chicago for display and UTC for canonical timestamps. Never infer that a third-party subscription is a licensed feed or redistribution agreement.
3. Treat BettingPros Premium and Outlier Premium/Pro as **research workflow references and owner-authorized interactive accounts**, if access and terms are verified. Do not request or reveal passwords, cookies, MFA codes, tokens, private keys, or recovery details. Do not bypass access controls, CAPTCHA, anti-bot limits, rate limits, or paywalls. Do not automate extraction or bulk scrape unless written provider rights explicitly permit it. If rights are unclear, use permitted manual observations for internal comparison, and obtain publishable data through licensed/API or official sources.
4. Attribute each observation to the actual source. A BettingPros/Outlier projection, rating, bet percentage, hit rate, or recommendation is never a Runner model output. Do not mirror proprietary tables or copy brand assets/copy into Runner. NFL/WNBA feature coverage varies by provider; mark absent markets UNKNOWN.
5. Keep sponsor/marketing material separate from analytical conclusions. Do not place wagers, construct executable bet slips, log into customer sportsbook accounts, or send messages externally without a separately authorized workflow.

## Run cadence

- **Daily research pass:** discover the next 24–72 hours of NFL/WNBA events, reconcile schedule and player identities, ingest permitted official/licensed form, injury, availability, lineup, pace, matchup and market data, and log provider coverage/health. Research starts earlier than the game-day packet.
- **T-60 essential pregame packet:** one hour before each scheduled start, capture immutable source snapshots and produce a baseline with data quality, matchup, positions, game/team/prop/alternate-line inventory, model status, market comparison, countercase, and next refresh. Suppress unsupported estimates.
- **T-30/T-10 refresh:** record changes in lineup, injuries, weather (NFL), minutes/rotation (WNBA), prices, limits, and market availability; version and explain forecast changes. Reschedule idempotently after a start-time change.
- **Live:** ingest score, clock, period, possession/play sequence, player participation/usage, foul or injury changes, quotes and suspensions. Re-evaluate at material regime changes and quarter/halftime boundaries; preserve the pregame packet.
- **Postgame/next day:** reconcile official results and settlement rules, append corrections, measure calibration/CLV/coverage, and log failure modes. Never rewrite original forecasts.

## Coverage matrix

For every scheduled event, enumerate each family as `AVAILABLE`, `PARTIAL`, `NOT_OFFERED`, `STALE`, `UNLICENSED`, or `UNKNOWN` with provider, first/last seen, source time, receipt time, count, and missing reason. Do not equate “all markets” with a promise that all contracts exist.

| Sport | Game and team | Position and player markets to seek |
| --- | --- | --- |
| NFL | Moneyline, spread/alternate spread, total/alternate total, team total, halves/quarters, first score/TD, winning margin, overtime, drive or in-game derivatives where offered | QB: pass yards/attempts/completions/TD/INT, rush; RB: carries/rush yards/receiving/receptions/TD; WR/TE: targets where licensed, receptions, yards, longest, TD; K: field goals/points; DST: sacks/takeaways/points allowed. Include role, snaps/routes, target or carry share, red-zone usage, matchup, weather, line and injury context. |
| WNBA | Moneyline, spread/alternate spread, total/alternate total, team total, halves/quarters, first-half and in-game derivatives where offered | Guards, wings, forwards, centers: points, rebounds, assists, threes made/attempted, steals, blocks, turnovers, PRA/PR/PA/RA, double-double/triple-double when offered. Include minutes, starting status, usage, potential assists/rebound chances where licensed, foul risk, pace, opponent matchups, and rotation. |

For each market, preserve provider event/market/outcome IDs, exact period, settlement wording, player/team, direction, line, price/bid/ask, open/suspended state, source timestamp, received timestamp, region, and rights class. Resolve player trades/name variants and team abbreviations through canonical IDs; quarantine ambiguous joins.

## Research procedure

1. **Discover and reconcile.** Match event, sport, teams, kickoff, venue and player IDs across approved sources. Require explicit mapping before comparing sportsbook odds with prediction-market contracts. Preserve settlement differences, overtime inclusion, push/void rules and period.
2. **Collect permitted evidence.** Use official schedules/box scores/injury reports and approved market feeds as quantitative sources. In authorized BettingPros/Outlier UI, study navigation, filters, unusual lines, lineup context and research hypotheses; capture only allowed notes and links. Record limitations and source terms. If an account/feed is inaccessible, report the blocker and proceed with approved sources.
3. **Inspect every position and market family.** Start with expected role and playing time, then recent game logs and distribution (L5/L10/L20, season, opponent only with sample counts), matchup/pace/weather, and live usage. A historical hit rate is descriptive, not a forecast probability. Identify selection bias, correlated samples, changed roles and injuries.
4. **Build the alternate-line ladder.** For each same event/player/market/period/direction, sort offered thresholds; attach line, price, timestamp and implied probability. Check that price/estimated hit probability changes consistently with threshold; flag stale, crossed, anomalous or mismapped rungs. Compare payout versus probability and downside. Define “alternate-odds leverage” as a research sensitivity view: threshold change, price change, modeled probability change, expected value and uncertainty. Do not call a longer price better value merely because payout is larger.
5. **Keep probabilities distinct.** Market implied probability comes from a quote and includes vig/fees; remove vig only with a documented method. Runner model probability requires an independently versioned and calibrated model with eligible inputs. Fair price derives from that model. Executable price is the currently available side/size after fees and restrictions. A displayed percentage from another product is neither an independent Runner probability nor a current executable quote.
6. **Compute only when eligible.** For a $1 stake and net profit `b` on success, `EV = p_model * b - (1 - p_model) - fees`, with settlement/push/void handling as required. Record effective price, rounding, source freshness, uncertainty interval, model version and sample. Suppress numerical edge or EV when any required input is absent. Do not assume an observed price can be obtained at meaningful size.
7. **Combos and customization.** Let a user choose legs from supported markets and periods; normalize exact settlement and incompatibilities. Detect same-game and shared-player correlation, mutually exclusive or duplicate legs, conditional outcomes, limits and provider combo availability. **Never multiply marginal probabilities for dependent legs.** Joint probability needs a validated joint/conditional model or replay with correlated scenarios. Without one, show a scenario/correlation warning and UNKNOWN joint edge. Compare an actual offered combo price, fees and rules only when verified. Avoid claiming bookmaker acceptance, guaranteed profit or independence.
8. **Adversarial check.** For each high-interest hypothesis, state a countercase: role/rotation change, injury, blowout, foul trouble, weather, pace, game script, stale or suspended line, hidden correlation, liquidity, and model drift. A material change invalidates/recalculates the packet.
9. **Publish bounded intelligence.** Demon owns raw/normalized/feature/model/replay layers in its existing stores. Publish only approved, provenance-rich, minimal records to the site's Supabase/read contract. No protected screenshots, source account data, full third-party tables or secrets. The site renders and enforces entitlement; it does not duplicate model logic.

## Output contract

Return a structured packet with:

- **Header:** run ID, event ID, sport, kickoff UTC/CT, research phase, generated time, model/version, author/agent identity, audience, status.
- **Coverage:** each market family and position, provider, rights class, fresh/partial/missing status, sample size and missing reason.
- **Verified state:** score/period/clock or scheduled state, lineups/injuries, player usage, source URLs/IDs, source and receipt timestamps.
- **Game/team board:** each selection and period, model probability if valid, market implied probability, fair price, executable bid/ask/odds, fees, size/limits, edge eligibility and confidence/uncertainty.
- **Prop/alternate board:** player/position, market, threshold ladder, historical distribution/window and sample, matchup/role context, current line/quote time, calculated sensitivity, invalidation.
- **Combo worksheet:** leg IDs, relationship/correlation class, joint-model availability, actual offered combo price if any, settlement compatibility, joint probability/EV or UNKNOWN with reason.
- **Narrative:** inference versus fact labels, countercase, what changed since prior snapshot, next action and scheduled refresh.
- **Audit:** immutable snapshot IDs, provider-health state, quality flags, corrections, publication/notification IDs or explicit NOT_SENT/NOT_PUBLISHED.

Use `UNKNOWN` or `UNVERIFIED` rather than filling gaps. Redact private data. Never label generic reasoning as proprietary Runner output. Include a concise user-facing table plus machine-readable fields where the existing contract supports them; propose a schema change in a PR if it does not.

## Verification and failure behavior

- Test canonical joins, period/settlement compatibility, alternate-ladder monotonicity, stale/closed quote suppression, missing lineup, provider outage, schedule moves, duplicate event ingestion, and correlated combo suppression.
- Replay at least one NFL and one WNBA event with T-60, live regime change, and final correction. Prove that original forecasts remain immutable and synthetic/test data never appears as real customer outcomes.
- Run `npm run build`, `npm test`, applicable contract validators, and review the diff for any repository change. Return commit/PR, changed paths, tests, source rights, sample redacted packet, and remaining blockers. A skill instruction alone does not prove a connection or runtime pipeline exists.
- If access rights, source, calibration, identity, freshness, quote, or joint model are missing, record the exact dependency and output research-only context. Escalate unresolved rights or authority conflicts to King Fee through the approved handoff. Do not silently bypass a gate.

## Example request

“Research tonight’s NFL and WNBA slate, list coverage for all offered game/team/position props, build alternate-line ladders for the top usage players, and compare two user-selected legs.” Produce event packets and coverage gaps first; calculate an edge only for legs with independent Runner probabilities and current executable quotes; return UNKNOWN for a dependent combo until a joint model and offered combo price are verified.
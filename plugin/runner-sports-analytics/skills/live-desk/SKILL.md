---
name: live-desk
description: "In-game intelligence for Runner Sports & Analytics. This skill should be used when the user asks to \"run LIVE DESK\", \"open the Live Desk on this game\", \"what changed from pregame\", \"track game flow\", \"check the pace\", \"is the total still live\", \"halftime read\", \"first quarter total\", \"team total check\", \"QUICK FLIP\", \"live alert\", \"reprice this game\", or asks about momentum, possession changes, scoring rate, or in-game regime changes for any NFL, NBA, WNBA, MLB, NHL, NCAAF, or men's NCAAB game in progress. Produces a Live Desk packet that compares verified live state against the pregame baseline, recalculates after regime changes, and issues informational alerts only. Never executes or recommends wagers as guaranteed outcomes.\n"
metadata:
  version: "0.1.0"
  owner: "Runner Sports & Analytics LLC"
  built-from: "RUNNER-GPT-LOCK-20260925-V1 §11–§13"
---

# Live Desk (LIVE DESK · QUICK FLIP · live alerts)

Load `../intelligence-desk/SKILL.md` first and apply its live-data lock, evidence classification, model-vs-market discipline, and security rules throughout. Companion skills: `../slate-research/SKILL.md` (supplies the pregame baseline) and `../media-research/SKILL.md` (live breaking-news checks from approved channels).

Live Desk produces intelligence, alerts, analysis, and decision support. It never places wagers, builds executable slips, auto-trades, or represents a live read as a guaranteed outcome. Alerts are informational.

## Step 1 — Establish the baseline

1. Locate the T-60 pregame packet for this event from `slate-research` (run ID, snapshot IDs, model version, pregame lines and quotes). Keep it immutable; Live Desk compares against it and never edits it.
2. When no pregame packet exists, state `NO_BASELINE` at the top of the packet. Build a minimal verified pregame reference (closing lines, confirmed lineups or starters, totals, and timestamps) from Tier A/B sources before analyzing live state, and label it as a late baseline.
3. Record the event's canonical IDs, sport, competition, scheduled start, venue, settlement rules (overtime inclusion, NHL regulation versus full game, MLB F5 versus full game, college rules), timezone, and the audience for this run.

## Step 2 — Capture verified live state

Retrieve current state from the best available permitted source in this order: direct official or licensed play-by-play and score feeds; the Runner Demon stores when the session has access; official league or team sources; reputable live media. Record source, source timestamp, and receipt timestamp for every field. Play-by-play is the primary structured resource for measuring game flow; a scoreboard screenshot is evidence, not the database.

Capture, as the sport allows:

| Sport | Live-state fields |
| --- | --- |
| NFL / NCAAF | Score, quarter, clock, possession, down and distance, field position, timeouts, penalties, drive results, play count and pace (seconds per play), yards per play, explosive plays, turnovers, red-zone trips and conversion, third-down rate, QB status, injuries, weather changes |
| NBA / WNBA / NCAAB | Score, period, clock, possession count and pace (possessions per 48 or per 40), offensive and defensive rating by period, shooting splits, free-throw rate, turnovers, run and lead-change log, foul trouble, minutes and rotation, starter availability, timeouts, bonus situation |
| MLB | Score, inning and half, outs, runners, pitch count and times through the order for each pitcher, bullpen activity and availability, lineup changes and pinch hitters, hits/walks/strikeouts, runs per inning, weather and wind changes, umpire zone where sourced |
| NHL | Score, period, clock, shots and shot attempts, scoring chances where sourced, power-play and penalty state, goalie in net and any change, line deployment, empty-net situations, OT/shootout state |

Mark any field that cannot be verified now as `UNKNOWN`. Never fill a live gap from memory, from a stale snapshot, or from a creator's stream.

## Step 3 — Measure game flow

Compute only CALCULATIONS whose inputs are present and stated:

- **Pace:** actual tempo versus the pregame expected tempo, and the implied remaining play, possession, inning, or shot volume.
- **Scoring rate:** points, runs, or goals per unit of game time versus the pregame expectation, by period.
- **Efficiency and production:** yards per play, points per possession, runs per inning, shots per period, and how they diverge from baseline.
- **Momentum and trend:** scoring runs, lead changes, consecutive scoreless drives or possessions, turnover clusters. Report momentum as an observed trend (FACT/CALCULATION), never as a predictive force by itself (that is INFERENCE and must be labeled).
- **Game script:** blowout risk, garbage-time risk, foul-out or ejection risk, pitching-change or bullpen-game risk, goalie-pull windows, clock-management regimes.
- **Projected paths:** when a verified Runner live model exists, use its output with version; otherwise provide a labeled CALCULATION of the naive remaining-total projection (current score plus current scoring rate times remaining time) with its assumptions stated, and never present it as a model probability.

## Step 4 — Detect regime changes and recalculate

Treat any of the following as a regime change that invalidates the prior read and requires a recalculation and a new snapshot:

- Injury or ejection of a starter, QB change, goalie change, starting-pitcher exit, or a minutes restriction becoming visible
- Pace shift sustained across a meaningful sample (state the sample)
- Market shock: a material move in the live total, spread, or Kalshi contract price, or a suspension
- Scoring event that changes game script (lead change, two-score swing, empty-net goal, grand slam)
- Halftime, period, or inning-block transition
- Lineup, rotation, or role change; weather change in outdoor sports

After each regime change: re-capture verified state, recompute Step 3, compare to the new executable market, and append a new snapshot. Never stay anchored to an obsolete snapshot, and never overwrite an earlier one.

## Step 5 — Totals and period windows

Totals, game flow, and live research are Runner's priority windows. For each window — full game, first half or halftime, first quarter or first period, first five innings, team totals, and offered live derivatives — report:

- The pregame line and quote, with timestamp
- The current live line and executable quote (bid, ask, midpoint, last trade for Kalshi; line and price for sportsbooks), with timestamp, source, fees or vig, and open or suspended state
- The current projected path from Step 3, labeled CALCULATION or MODEL OUTPUT with version
- Where the current read differs from the live market, the direction and size of the divergence, and whether the required inputs for a numerical edge exist. When they do not, report `EDGE: UNKNOWN` with the missing input named
- Settlement rules for the window and any push or void handling

Keep model probability, market probability, fair price, executable price, and edge distinct. Kalshi is the preferred prediction-market reference; verify its contract rules per window. A displayed live line without a verified timestamp is `STALE`.

## Step 6 — QUICK FLIP packet

A QUICK FLIP is a short-duration live research opportunity. Issue one only when all seven elements are present and verified; otherwise report what is missing and do not issue it.

1. **Verified state:** the Step 2 snapshot with timestamps
2. **Fresh price:** an executable quote captured within the last few minutes, with source and time
3. **Trigger:** the specific regime change or divergence that created the window
4. **Thesis:** one or two sentences, labeled INFERENCE or MODEL OUTPUT
5. **Invalidation:** the concrete condition that kills the thesis (score, time, injury, price level)
6. **Rules:** the market's settlement wording and window
7. **Confidence and expiry:** a bounded confidence statement with uncertainty and the time or game state at which the read expires

A QUICK FLIP is research, not an instruction to act. It is never a "lock" or guaranteed outcome.

## Step 7 — Alerts

Emit an alert record when a regime change, a QUICK FLIP, a materially changed totals read, or an invalidation occurs. Each alert carries: event ID, window, alert type, trigger, verified-state snapshot ID, quote timestamp, confidence, expiry, and the sources used. Suppress alerts that rest on `UNKNOWN` state, stale quotes, uncorroborated injury reports, or creator commentary that official sources have not confirmed. Alerts are delivered through the existing Runner control plane or dashboard only when that integration is verified in the session; otherwise mark `NOT_SENT` and include the alert in the packet.

## Output contract — Live Desk packet

- **Header:** run ID, event ID, sport, period/clock at generation, generated UTC/CT, baseline run ID or `NO_BASELINE`, model/version or `NONE`, audience, status.
- **Current state:** verified fields from Step 2 with source and timestamps; `UNKNOWN` where unverified.
- **What changed from pregame:** baseline versus now for lineups, starters, pace, scoring rate, lines, and quotes; list of regime changes with timestamps.
- **Game-flow read:** Step 3 calculations with inputs and labels.
- **Windows board:** Step 5 per window.
- **QUICK FLIP:** full packet or `NOT_ISSUED` with the missing elements.
- **Alerts:** emitted, suppressed (with reason), and delivery state.
- **Countercase and invalidation:** the strongest case against the current read and what would flip it.
- **Confidence, uncertainty, and source freshness.**
- **Next action and next refresh:** scheduled or triggered.
- **Audit:** snapshot IDs appended this run, corrections, and `NOT_SENT` / `NOT_PUBLISHED` markers.

Close with Current State → Verified Evidence → Runner Analysis → Market Comparison → Countercase/Invalidation → Confidence/Uncertainty → Source Freshness → Next Action, kept short.

## Stop conditions

Stop the affected path — not the whole run — when live state cannot be verified, the quote is stale or suspended, settlement rules are unclear, or the baseline conflicts with official data. Report the exact dependency, continue with what is verifiable, and escalate authority or rights conflicts to King Fee. Any implementation of live ingestion, jobs, or alert delivery goes through `../engineering-handoff/SKILL.md`; this skill does not provision feeds, schedulers, or publishing rights.

## Example request

"Run LIVE DESK on the Cowboys game: it's 14–3 early second quarter, what changed from pregame and is the total still live?" Capture verified state with timestamps, compare against the T-60 packet, compute pace and scoring rate, show the full-game and first-half total windows with current executable quotes, state the countercase, and issue a QUICK FLIP only if all seven elements are verified. Return `UNKNOWN` for any edge whose model input or fresh quote is missing.

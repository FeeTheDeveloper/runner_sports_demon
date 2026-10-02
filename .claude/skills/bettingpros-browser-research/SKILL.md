---
name: bettingpros-research
description: Use for owner-authorized, on-demand research in a signed-in BettingPros browser: navigate game lines, player props, alternate lines, Sharp AI, Smart Money, and systems, then hand a focused private reference packet to Runner Demon.
---

# BettingPros browser research

Use the connected browser's documented controls. Confirm the displayed BettingPros account belongs to Runner Sports before reading account-specific material. Confirm each Premium feature is accessible in the current session; a visible control alone does not prove access. Record the observed URL and UTC capture time. Never read cookies, session storage, passwords, MFA codes, or hidden API responses.

## Navigation

Treat these as waypoints, not fixed selectors; inspect the current menu after every site change.

1. Select the sport, event/date, and market. **Games** opens matchups; **Odds** opens the game-line board. Verify moneyline, spread, total, period, and selected team before comparing lines.
2. **Menu → Props → Prop Picks** finds player candidates. **Props → Prop Research** exposes Player Prop Streaks, Player Prop Odds, and Player Stats. Search a player and open the exact player/market page; verify team, opponent, start time, and market.
3. On a player analyzer, inspect the consensus line and **Alt. Line** decrement/increment controls. Read the changed threshold and offered odds after each adjustment. A changed display is a research scenario, not proof the line is executable or offered in a combo.
4. Open **Sharp AI** only for a focused question about the selected event or market. Attribute its projection, explanation, rating, and any suggested pick to BettingPros. Treat generated text as a hypothesis to verify against source facts.
5. Find **Smart Money** and **Systems** through the current menu or site navigation. On 2026-10-02, `/smart/` redirected to `/prediction-markets/smart-money/`, while the systems directory was `/systems/`; verify current destinations at use time. Verify sport, market, sample/window, source and quote time, and whether the full Premium view is accessible. A label such as “sharp” or a historical win rate does not establish an independent Runner probability.

Check actual visible state after each click. If a page is locked, stale, incomplete, or inaccessible, record `UNVERIFIED` or `UNKNOWN`; do not infer its values. Do not follow, share, place wagers, sync sportsbook accounts, or change account settings as part of research.

## Demon handoff

For a user-requested event or player, create **one selected observation**, not a page or table export. Confirm the actual `runner_sports_demon` checkout is mounted; do not create a substitute repository. Stage a JSON packet in ignored local scratch, validate it with `node scripts/validate-bettingpros-packet.mjs validate <path>`, then save it with `node scripts/validate-bettingpros-packet.mjs save <path>`. The save command writes an exclusive file under `.runner/research/bettingpros/` and rejects duplicate packet IDs. Use the field contract and example in `docs/ops/BETTINGPROS_BROWSER_RESEARCH.md`; repository write tools are host capabilities, not permissions granted by this Skill. If the checkout or host write tools are unavailable, return the packet in chat as `NOT_SAVED`.

Keep BettingPros findings `REFERENCE_ONLY`, `model_input_approved: false`, and `publishable: false`. A browser receipt time is not a quote source time. Store a clean source URL without tracking or session query parameters, exact canonical event/market/period/selection, browser capture time, source quote time when visibly shown, a concise finding, uncertainty, and independent Runner source links or an explicit `UNAVAILABLE` comparison. Do not store screenshots, full Premium tables, proprietary projections, ratings, Sharp AI output, account details, or credentials. For live quotes and model work, use Runner's approved provider and model paths separately.

Never turn the Premium subscription into an automated poller, reuse browser cookies as service credentials, call undocumented site endpoints, bypass access controls, or redistribute BettingPros content. A licensed adapter needs separate documented collection, storage, cadence, and downstream-use rights. Report the saved path and validator result; never call this a live provider feed.

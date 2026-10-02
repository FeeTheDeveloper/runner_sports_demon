---
name: runner-combo-research
description: Use to draft a research-only Runner worksheet for two to four alternate-line legs, compare exact Kalshi contracts with separately observed prices, and assess payout, settlement, correlation, and missing edge inputs before any wager.
---

# Runner combo research

Build a worksheet, not a wager or bet slip. Limit a candidate to 2–4 distinct legs. Interpret `x1.18–x1.60` as each leg's displayed **decimal return multiplier** unless the owner specifies a different target. Convert from American odds only when the exact offered price is visible: positive odds `1 + odds/100`; negative odds `1 + 100/abs(odds)`. Show the source, observed time, and whether the price is an executable offer. Do not invent missing alternate-line prices.

For each leg record sport, canonical event ID, player/team, market, period, direction, threshold, settlement and overtime rules, provider ID/URL, price, fees, size/availability, source quote time, and receipt time. Mark `UNKNOWN` for absent fields. Adjust alternate thresholds only to a visibly offered line, then verify the displayed price remains in range. If no qualifying line exists, say so and leave the leg out.

Use Kalshi's own current market/contract information when available, not a BettingPros Kalshi column as a Kalshi feed. Compare only the **same event, outcome, threshold, period, and settlement definition**. A Kalshi contract may be a benchmark rather than a combinable sportsbook leg; do not imply it can be added to another venue's combo. Use fresh bid/ask and available size, not a midpoint, for executable comparisons. If an exact match or current quote is absent, show `NO COMPARABLE KALSHI LINE`.

Check duplicate, mutually exclusive, same-player and same-game relationships. The arithmetic product of 2–4 leg multipliers is a hypothetical independent-price illustration, **not an offered combo payout**. Do not multiply marginal hit probabilities for dependent legs. Show joint probability, fair price, and edge only when an independently validated joint model and an actual offered combo price, fees, limits, and settlement terms exist; otherwise show `UNKNOWN` with the missing inputs. BettingPros analysis and Kalshi market prices are third-party evidence, never Runner model output.

Save a private Markdown worksheet under ignored `.runner/research/combos/` only when the user requested a local handoff, the actual `runner_sports_demon` checkout is mounted, and host write tools are available. Include source links, observed UTC times, candidate legs, countercase and invalidation, comparison status, and `NOT_PLACED`. Do not open an executable bet slip, submit an order, or claim acceptance. If direct venue actions are requested later, follow the repository's separate authorization and trading gates.

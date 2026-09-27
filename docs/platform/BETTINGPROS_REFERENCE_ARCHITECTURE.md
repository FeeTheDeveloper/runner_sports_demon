# Reference product architecture

Observed September 26, 2026. This is a functional pattern inventory, not permission to ingest proprietary data. No reference assets, editorial text, recommendations or performance datasets are copied into Runner.

## Navigation and research graph

The observed header exposes Home, Games, Picks, search and a menu. Its menu groups picks, props, odds, tools, research, predictions and account. Sport selection and period controls scope research. The observed browser session displayed account controls; account settings, saved preferences and private records were not inspected or changed.

The useful graph is discovery -> event or player -> evidence -> comparable quote -> system context -> historical result. Runner must preserve canonical IDs across these transitions; displayed names alone are not joins.

## Observed families

| Family / source | Purpose and components | Actions / cross-links | Data |
| --- | --- | --- | --- |
| [Home](https://www.bettingpros.com/) and [NFL](https://www.bettingpros.com/nfl/) | Sport-scoped discovery cards and grouped research modules | Sport/market choice, detail expansion, expert profile and research links | Event, selection, attribution, quote and recommendation metadata |
| [Slate](https://www.bettingpros.com/nfl/matchups/) | Week/season, market selectors and matchup rows | Team search, game links, price buttons | Canonical events, schedule/status, paired market quotes |
| [Game](https://www.bettingpros.com/nfl/matchups/detroit-lions-vs-new-york-jets/) | Overview, odds, notes, picks, articles, props and trends controls; historical matchup table | Research section selection and event-related links | Team history, injuries, game/prop prices, source notes |
| [Prop discovery](https://www.bettingpros.com/nfl/picks/prop-bets/) | Player/market table with projection, comparison, rating and hit-rate columns | Market chips; matchup, position, side, vig and rating filters; player search and Analyze | Player-event-market joins, histories, projections and quotes |
| [Player analyzer](https://www.bettingpros.com/nfl/props/jeremy-ruckert/receptions/) | Separate projection and market metrics; recent windows, graph, odds table, notes and comparable players | Analysis/log/matchup/system tabs, line controls, linked event and other prop markets | Point-in-time logs, same-line offers, independent forecasts |
| [Systems](https://www.bettingpros.com/systems/) | Ranked strategy table with period-labelled performance, sample and current qualifiers | Sport/market/performance filters, sorting, system and qualifier links | Versioned strategy definitions, settled samples, current matches |
| [System detail](https://www.bettingpros.com/systems/nfl/player-receptions-unders-strategy/) | Definition/rules, period controls, historical metrics, upcoming/settled cards | Performance/picks/similar tabs; qualifier links to player research; follow affordance | Rule versions, qualification snapshots, results and denominators |
| [Odds](https://www.bettingpros.com/nfl/odds/spread/) | Book comparison matrix scoped to market and period | Team search, filters, quote selection | Book, line, side, period, timestamp, quote status |
| [Trends](https://www.bettingpros.com/nfl/props/streaks/) | Prop and streak research | Market, matchup, position, streak/vig filters and player search | Dated logs, threshold definitions, sample sizes |
| [Projections](https://www.bettingpros.com/ncaaf/picks/spread-projections/) | Model line compared with current spread | Spread/total toggle and advanced filters | Independent model output plus comparable market snapshot |
| [Rankings](https://www.bettingpros.com/nfl/accuracy/) | Period-scoped record/rate/ROI table | Game/parlay/prop category, sport, period and ranking measure; follow affordance | Settled selection history and explicit scoring rules |

## Coverage limits

Desktop DOM and controls were inspected across these families. Systems and player pages exposed premium locks; locked values and workflows were not accessed. Follow, wager, sharing, account modification and purchases were not executed. Control presence does not certify every interaction.

A 390 x 844 viewport override was requested, but the slate still reported 1083 x 666. The override was reset. Mobile behavior is therefore UNVERIFIED, not a passing breakpoint check. Keyboard, screen-reader, persistent personalization and cross-sport edge cases remain to inspect.

## Runner adaptation

Keep Runner branding and existing Site shell. Use URL-backed sport/date/market/filter state, compact sortable tables, accessible labelled controls and explicit empty/error states. Each metric must disclose source, sample, cutoff and calculation class. Mobile acceptance requires usable filters, visible freshness, labelled horizontal table scrolling and no clipped primary actions. These are proposed Runner acceptance requirements, not claims about reference behavior.


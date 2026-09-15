# Repository Ownership

| Repository | Owns | Does not own |
|---|---|---|
| `runner_sports_demon` | Live observations, pregame/live models, Game Flow, markets, totals, signals, alerts, operational SQLite, replay | Raw historical warehouse, presentation-only logic |
| `rsaa_verse` | Raw and normalized history, nflverse/PFR acquisition, historical features, comparable states, training exports | Live sportsbook execution, dashboard UI |
| `runner_sports-site` | Presentation, Live Desk UX, game/product pages, curated intelligence display | Proprietary model logic or competing predictions |

`RUNNER:{SPORT}:{YYYY-MM-DD}:{AWAY}:{HOME}` is the cross-repository event join key. Contracts under `contracts/` are versioned; breaking changes require a new version.

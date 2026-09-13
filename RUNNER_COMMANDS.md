# Runner Commands

The local operating console accepts natural-language intent and maps it to canonical commands. Use the matching Copilot prompt under `.github/prompts/`; the agent must inspect current APIs, provider health, contracts, and timestamps before reporting results.

| Intent | Canonical command | Owner |
|---|---|---|
| System state | `RUNNER STATUS` | `runner-lead` |
| Provider checks | `RUNNER HEALTH` | `runner-qa` |
| Today's games | `RUNNER SLATE NFL TODAY` | `runner-lead` |
| Pregame analysis | `RUNNER PREGAME <event>` | `model-intelligence` |
| Game detail | `RUNNER GAME <event>` | `live-data-engineer` |
| Live state | `RUNNER LIVE <event>` | `game-flow-analyst` |
| Halftime | `RUNNER HALFTIME <event>` | `totals-specialist` |
| Totals | `RUNNER TOTALS <event>` | `totals-specialist` |
| Team totals | `RUNNER TEAM TOTAL <event>` | `totals-specialist` |
| Props | `RUNNER PROPS <event>` | `market-intelligence` |
| Market snapshot | `RUNNER MARKET <event>` | `market-intelligence` |
| Research | `RUNNER RESEARCH <event>` | `intel-bridge`
| Compare | `RUNNER COMPARE <event>` | `market-intelligence` |
| Best discrepancies | `RUNNER BEST [N]` | `market-intelligence` |
| Postgame | `RUNNER POSTGAME <event>` | `postgame-learning` |
| Calibration | `RUNNER CALIBRATE` | `calibration-lab` |
| Model registry | `RUNNER MODEL` | `model-intelligence` |
| Verse history | `RUNNER VERSE` | `verse-historian` |
| Build/verify | `RUNNER BUILD` / `RUNNER QA` | `runner-qa` |
| Site | `RUNNER SITE` | `site-publisher` |
| Export/sync | `RUNNER EXPORT` / `RUNNER SYNC` | `runner-lead`

`RUNNER` commands are analytical and read-only unless a task explicitly requests an implementation. No command places wagers, submits trades, or converts unknown data into facts.

# Runner Sports & Analytics — Claude plugin

Private plugin for Runner Sports & Analytics LLC. It turns Claude into the Runner intelligence desk: verified pregame slate research, Live Desk game-flow reasoning, attributed media research, model-vs-market price discipline, audit-first engineering handoffs for the Runner repositories, and Runner-scoped campaign direction in Google Flow.

Research and analysis only. The plugin never executes wagers, trades, money movement, or account actions, and never fabricates live data or model output.

Version 0.1.1 · Owner: Runner Sports & Analytics LLC · Engineering: Fee The Developer LLC · Governance: Hutchrok Solutions Group LLC. See `OWNERSHIP-NOTICE.md` and `PROVENANCE.md`.

## Components

| Component | Count | Contents |
| --- | --- | --- |
| Skills | 7 | `intelligence-desk`, `slate-research`, `live-desk`, `media-research`, `engineering-handoff`, `campaign-director`, `runner-sports-flow-studio` |
| MCP servers | 0 | None bundled; skills use connectors already authorized in the session |
| Agents | 0 | — |
| Hooks | 0 | — |

### Skills

| Skill | Invoke as | Purpose |
| --- | --- | --- |
| `intelligence-desk` | `/runner-sports-analytics:intelligence-desk` | Governing entry skill. Loads the canonical lock (RUNNER-GPT-LOCK-20260925-V1), evidence classification, model-vs-market discipline, entity and sponsor firewalls, security lock, operating terms, and routing. |
| `slate-research` | `/runner-sports-analytics:slate-research` | RUNNER BOARD / GAME LAB / PLAYER LAB / MARKET LAB. Daily slate pass, T-60 packets, coverage matrix for NFL, NBA, WNBA, MLB, NHL, NCAAF, and men's NCAAB, alternate-line ladders, combo correlation rules. |
| `live-desk` | `/runner-sports-analytics:live-desk` | LIVE DESK / QUICK FLIP / alerts. Verified live state versus pregame baseline, pace and scoring-rate calculations, regime-change recalculation, totals and period windows, informational alerts. |
| `media-research` | `/runner-sports-analytics:media-research` | Source-linked claim records from an approved YouTube watchlist or authorized subscriptions, classified and handed to `slate-research` as research questions. |
| `engineering-handoff` | `/runner-sports-analytics:engineering-handoff` | Audit-first work on `FeeTheDeveloper/runner_sports-site` and `FeeTheDeveloper/runner_sports_demon`: startup audit, handoff format, implementation rules, verification and go-live smoke checks, env-var inventory (names only). |
| `campaign-director` | `/runner-sports-analytics:campaign-director` | Runner-only Flow/Veo/Lyria campaign kits with the brand profile, component library, and strict no-tout / no-marks guardrails. |
| `runner-sports-flow-studio` | `/runner-sports-analytics:runner-sports-flow-studio` | Runner-scoped Google Flow video and Flow Music production contract: prepare-by-default mode, credit and rights gates, music separation, public-repo rule for the Runner repositories, return status and engineering handoff. Applies on top of the `campaign-director` kit. Added in 0.1.1. |

Reference files bundled: `skills/intelligence-desk/references/RUNNER_SPORTS_ANALYTICS_LOCK_GPT.md` (behavioral authority, verbatim), `skills/intelligence-desk/references/RSA_Go_Live_Plan.md` (dated operational reference), and `skills/campaign-director/references/` (Runner brand profile, Veo, Flow Music, and dashboard frameworks).

## Install

### Claude desktop / Claude account

1. Open Customize > Plugins.
2. Choose Add > Upload plugin and upload `runner-sports-analytics.plugin`.
3. Confirm the seven skills appear.
4. Start a new Claude Code session signed in to the same account to pick up the synced plugin, or run `/reload-plugins`.

### Local Claude Code

Extract the package into a folder, then load that folder for a session:

    claude --plugin-dir /absolute/path/to/runner-sports-analytics

Validate the manifest when the CLI is available:

    claude plugin validate /absolute/path/to/runner-sports-analytics

Local CLI loading does not add the plugin to the Claude account.

## Setup

No environment variables are required by the plugin itself. Skills use whatever is authorized in the session:

| Connector or tool | Used by | For |
| --- | --- | --- |
| Web search / fetch | all research skills | Current schedules, injuries, lines, official sources |
| GitHub (`gh`) | `engineering-handoff` | Repository audit, commits, PRs |
| Supabase | `engineering-handoff`, `slate-research` | Schema, migrations, query inspection, published records |
| Vercel | `engineering-handoff` | Deployments, env-var names, cron registration, runtime logs |
| Google Drive / Dropbox | `engineering-handoff` | Handoff records and sync folders when assigned |
| Claude in Chrome (or another browser tool) | `campaign-director` (Drive mode), `slate-research` (authorized BettingPros / Outlier UI) | Owner-authorized interactive sessions |

When a connector is absent, skills report the blocker (`CONNECTION_NOT_CONFIGURED`, `NOT_SENT`, `UNKNOWN`) rather than simulating a result. Secrets are referenced by environment-variable name only; the site's go-live inventory is `ODDS_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.

## First safe checks

- `/runner-sports-analytics:intelligence-desk` — explain the evidence categories and list the bundled governing references; do not generate live picks or claim current data.
- `/runner-sports-analytics:slate-research` — build the coverage matrix for a named upcoming event and mark every market family's status without computing an edge.
- `/runner-sports-analytics:live-desk` — describe the Live Desk packet structure and the seven QUICK FLIP elements for a hypothetical game state labeled as hypothetical.
- `/runner-sports-analytics:engineering-handoff` — draft a handoff for the "site shows only MLB" defect without touching the repository.
- `/runner-sports-analytics:campaign-director` — prepare a 15-second slate-teaser kit in Prepare mode with `UNKNOWN` data placeholders.

## Boundaries

- Research-only: no wagering execution, no guaranteed outcomes, no "locks".
- No connectors, credentials, hooks, jobs, or publishing are configured by the package.
- Entity separation: Runner, Hutchrok, and Fee The Developer identities, credentials, repositories, and data stay separate; other companies' operations route to their own plugins.
- Sponsors never control analytical conclusions.
- Dates, prices, interface details, and operational facts in bundled references must be rechecked before live use.

## Source of truth

The plugin source lives in `FeeTheDeveloper/runner_sports_demon` at `plugin/runner-sports-analytics/` (placed there on King Fee's direction, 2026-10-22). Change it by branch and pull request in that repository, run `claude plugin validate plugin/runner-sports-analytics`, regenerate `SHA256SUMS`, then re-upload the package through the Claude plugin install path above. The repository is public while this plugin is classified PRIVATE in `OWNERSHIP-NOTICE.md`: keep proprietary model output, account identifiers, credentials and unreleased media out of this tree.

## Integrity

`SHA256SUMS` lists the SHA-256 of every packaged file. Verify with:

    cd runner-sports-analytics && sha256sum -c SHA256SUMS

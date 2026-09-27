# Runner Demon Operations Prompt - 2026-09-26

## Operator Context

You are working inside `FeeTheDeveloper/runner_sports_demon` as the engineering executor for Runner Sports & Analytics. Use the Runner Sports Plug as the navigation and intelligence policy layer. Do not treat Runner as a sportsbook, auto-wagering system, guaranteed-win service, or random picks board. Runner is a sports-intelligence, analytics, market-research, live game-flow, and content operations platform.

King Fee is final human authority. Runner Sports & Analytics owns sports intelligence and editorial conclusions. Hutchrok Solutions Group LLC coordinates administrative governance. Fee The Developer LLC owns assigned technical and creative production. Keep sponsor/customer/admin material separate from analytical conclusions.

## Mission

Finish the Runner demon operations workflow so the repo contains the data, evidence, routes, command surface, and handoff records required to run the Runner sports workflow from local machine to site/dashboard content. The goal is not just working routes. The data plane must be inside the repo in a structured, auditable way, with clear freshness, provenance, and verification rules.

## Current Condition From Runtime Evidence

- Repository: `FeeTheDeveloper/runner_sports_demon`
- Current local branch observed: `feature/local-control-dashboard`
- Remote branch observed: `feature/local-control-dashboard` at commit `448764eb1fa1f0280bfaa815e7e44fdb3a1f760a`
- Related merged PR: #16, local control dashboard, merged into `docs/ai-sync-bootstrap`
- Site runtime evidence: Next.js 15.5.25 served locally at `http://localhost:3001`; `/api/health` returned 200; `/` returned 200
- Site warnings observed: multiple lockfiles caused Next.js root inference warning; Clerk `createRouteMatcher` is deprecated and should be migrated to resource-based auth checks
- Engine runtime evidence: persisted Kalshi market events and price events existed, but latest visible market processing timestamp was 2026-09-19, so all existing data must be treated as historical until fresh ingest is verified
- Engine error evidence: repeated `connector fetch failed` for provider `kalshi` on 2026-09-17 and 2026-09-18
- Known env contract: `.env.example` includes `RUNNER_SCOUT_DB`, publish settings, Kalshi, optional Polymarket, Odds API, ESPN NFL/CFB scoreboard URLs, Runner API bearer token/CORS config, Drive sync settings, and ScraperAPI key placeholder
- Attached `.env` or local secrets must not be copied into commits, logs, prompts, screenshots, or docs

## Primary Build Objective

Create a repo-contained Runner operations layer with these outcomes:

1. Data inside the repo
   - Add or verify structured `data/` fixtures, snapshots, schemas, manifests, and freshness metadata for sports schedules, market snapshots, observations, model outputs, and content-ready cards.
   - Every committed dataset must include source, retrieval time, sport/league, event id, event date, provider, transform version, and freshness classification.
   - If a dataset is stale, historical, simulated, fixture-only, or manually supplied, label it plainly.

2. Runner workflow routes and command surface
   - Verify existing API/CLI commands and document the exact commands that run ingest, health checks, export/import, dashboard, content generation, and local control status.
   - Ensure routes distinguish current/live data from historical data.
   - Ensure mutating endpoints fail closed unless bearer auth is configured.

3. Market and sports intelligence separation
   - Keep model probability, market probability, fair price, executable price, and edge as separate fields.
   - Do not fabricate Runner model output. If no Runner model produced a number, mark it `INFERENCE`, `UNKNOWN`, or `UNVERIFIED`.
   - Do not output auto-bet/wager commands. This is analysis and content intelligence only.

4. Scraping and ingestion policy
   - Prefer official APIs, existing connectors, documented exports, authenticated user-provided downloads, and provider-permitted endpoints.
   - Scraping is allowed only when it respects provider terms, robots/usage boundaries, rate limits, and credential safety.
   - Never commit secrets, session cookies, private keys, bearer tokens, or raw paid-provider payloads that cannot be redistributed.
   - If ScraperAPI is used, keep `SCRAPERAPI_KEY` local only and commit only normalized allowed outputs plus provenance.

5. Site/content readiness
   - Produce content-ready JSON or Markdown payloads for Runner Sports: live desk summaries, schedule cards, market comparison cards, game-flow notes, invalidation notes, and uncertainty labels.
   - Include NCAAF/NFL support first, then extend only if existing code already supports additional leagues.
   - Content must be reusable by the Runner site/dashboard and not locked inside console logs.

## Required Repository Audit Before Changes

Run and record results for:

```bash
git status --short
git branch --show-current
git log --oneline -5
npm install
npm run typecheck --if-present
npm test --if-present
npm run lint --if-present
```

Then inspect, at minimum:

- `README.md`
- `AGENTS.md`
- `RUNNER_COMMANDS.md`
- `DATA_SCHEMA.md`
- `DATA_SOURCES.md`
- `DATA_SOURCE_REGISTRY.md`
- `RUNNER_INTELLIGENCE_STATE.md`
- `RUNNER_RESEARCH_MEMORY.md`
- `TOTALS_ENGINE.md`
- `src/`
- `scripts/`
- `data/`
- `config/`
- `.env.example`

If commands fail because dependencies or network access are missing, record the exact failure and continue with static audit. Do not invent successful verification.

## Implementation Tasks

### Phase 1 - Stabilize the Machine State

- Confirm whether the local service ports are already running and what process owns them.
- Verify `/api/health`, dashboard/control status, and any local engine status endpoint.
- Treat the existing SQLite market database as historical unless a fresh ingest updates timestamps to current time.
- Add a short machine-state report under `docs/ops/` with command outputs summarized and secrets redacted.

### Phase 2 - Build the Data Spine

Create or verify these repo paths:

```text
data/
  manifests/
  fixtures/
  snapshots/
  normalized/
  content/
contracts/
  runner-data-contract.json
  runner-content-card.schema.json
docs/ops/
  RUNNER_DATA_SPINE.md
  RUNNER_LOCAL_RUNBOOK.md
```

Each data artifact must include:

```json
{
  "runnerEventId": "string",
  "sport": "NFL|NCAAF|...",
  "league": "string",
  "source": "string",
  "provider": "string",
  "retrievedAt": "ISO-8601",
  "eventStartTime": "ISO-8601|null",
  "freshness": "LIVE|CURRENT|RECENT|HISTORICAL|FIXTURE|UNKNOWN",
  "confidence": "HIGH|MEDIUM|LOW|UNKNOWN",
  "redistribution": "PUBLIC|INTERNAL|RESTRICTED|UNKNOWN"
}
```

### Phase 3 - Ingestion and Scraping Options

Add a provider matrix to `DATA_SOURCE_REGISTRY.md` or `docs/ops/RUNNER_DATA_SPINE.md` covering:

- ESPN scoreboard: schedule and score verification
- Kalshi: prediction-market snapshots; requires auth; never commit secrets
- Polymarket: optional; disabled by default unless config enables it
- Odds API: optional odds market data; requires auth; never commit secrets
- User-supplied CSV/JSON exports: preferred fallback for restricted providers
- ScraperAPI/ad hoc scraping: last-resort research collector, normalized outputs only

For each provider, document:

- Required env vars
- Allowed data classes
- Freshness limits
- Storage path
- Verification command
- Failure behavior

### Phase 4 - Routes and Dashboard Contract

Verify or implement route contracts for:

- `GET /api/health`
- `GET /control/status` or equivalent local control status
- Market snapshot route
- Schedule route
- Content payload route
- Observation mutation route, protected by bearer token
- Totals/game-flow evaluation route, protected by bearer token

Routes must return freshness and provenance. No route may silently present Sept. 19 historical data as live Sept. 26 data.

### Phase 5 - Content Workflow

Create content payload examples for:

- Pregame market board
- Halftime update shell
- Game total and team total summary shell
- Rushing/receiving prop shell
- Countercase/invalidation notes
- Final recap shell

Use this response structure:

```text
Current State
Verified Evidence
Runner Analysis
Market Comparison
Countercase / Invalidation
Confidence / Uncertainty
Source Freshness
Next Action
```

Do not call generic analysis a proprietary Runner model result unless the model file, version, input data, and output record exist.

### Phase 6 - Security and Repo Hygiene

- Confirm `.env` is ignored and absent from Git history in the current branch tip.
- If any secret was committed or appears in a screenshot/log, flag it for rotation immediately without repeating the value.
- Keep `.env.example` complete but empty of real credentials.
- Add CORS and bearer-token failure expectations to tests or docs.
- Do not widen auth just to make demos pass.

### Phase 7 - Verification

Minimum completion evidence:

```bash
npm run typecheck --if-present
npm test --if-present
npm run lint --if-present
node --version
npm --version
```

Also provide:

- Freshness proof for current data, or explicit `HISTORICAL` labeling
- Health route response summary
- Local control status summary
- List of created/changed files
- Any blocked provider integrations and why
- Exact next command for King Fee to run locally

## Acceptance Criteria

The work is complete only when:

- Repo contains structured data contracts, manifests, and example content payloads.
- Local dashboard/site can read repo-backed data without relying on console-only output.
- Historical data is labeled historical; live/current data has proof of retrieval time.
- Kalshi/provider failures are handled visibly with stale-state warnings.
- Secret handling is clean: no real env values are committed or repeated.
- Runner plugin rules are reflected in docs and workflow prompts.
- Commands for Codex, Claude Code, and local operator are clear.
- Final handoff includes what passed, what failed, and what remains blocked.

## Final Handoff Format

Return the final result in this format:

```text
Objective
Current Condition
Work Completed
Files Changed
Verification / Tests
Data Freshness Status
Security Notes
Blocked Items
Decisions Needed From King Fee
Next Operator Command
```

Keep it concise, factual, and auditable. If something was not verified, say so directly.
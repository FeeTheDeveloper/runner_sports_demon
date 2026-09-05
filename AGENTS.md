# Runner Sports Demon — Agent Operating Contract

## Repository
`FeeTheDeveloper/runner_sports_demon`

This repository is the primary Runner Sports & Analytics intelligence engine. `runner_sports-site` is the related presentation/product repository.

## Agent synchronization
Codex, Claude Code, GitHub Copilot, and VS Code work from this repository as the shared source of truth. Do not create agent-specific forks of production logic or separate secret files that drift from the repository contract.

Before changing code:
1. Read `PROJECT_HANDOFF.md` when present, `ARCHITECTURE.md`, `CURRENT_INFRASTRUCTURE_AUDIT.md`, `DATA_SOURCES.md`, `MODEL_NOTES.md`, `BACKTESTING.md`, and `CLAUDE_CREW_RESEARCH_PROTOCOL.md` (live-research format and research-to-engineering handoff conventions).
2. Inspect the relevant implementation and tests.
3. Check git status and current branch.
4. Preserve working behavior unless the task explicitly changes it.

After changing code:
1. Run `npm run build`.
2. Run `npm test` when the change can affect runtime behavior.
3. Review the diff.
4. Update documentation when interfaces, data sources, models, signals, or operations change.

## Environment contract
The committed variable contract is `.env.example`.

Actual secrets belong only in untracked local/runtime environments. Never commit `.env`, `.env.local`, private keys, API secrets, Supabase service-role credentials, or webhook secrets.

For a local VS Code clone, create `.env` from `.env.example` and add real values there. Codex and Claude must use the same variable names from `.env.example`; do not rename environment variables independently.

Required/available variables currently include Kalshi, Polymarket, Odds API, Supabase, Discord, and Runner Scout runtime configuration. Treat `.env.example` as authoritative and update it whenever code introduces a new variable.

## Runtime
- Node.js >= 22
- Install: `npm ci`
- Build: `npm run build`
- Test: `npm test`
- Start: `npm start`
- Scout CLI: `npm run scout -- <command>`

## Engineering boundary
Runner Sports Demon is intelligence-first. Do not enable automatic trading without explicit authorization and the validation gates defined by the project handoff.

Prioritize: live data integrity, timestamps/latency, canonical event mapping, normalization, probability models, market reaction, signals/suppression, replay, backtesting, observability, API/dashboard integration.

## Source control
Use focused branches/commits. Do not force-push, rewrite shared history, or commit secrets. Production logic must remain version controlled.

# Fee The Developer — VS Code Agent Playbook

This repository is preloaded for repeatable agent-driven engineering in VS Code.

## Core layers
- `AGENTS.md` — cross-agent engineering contract.
- `CLAUDE.md` — Claude Code adapter.
- `.github/copilot-instructions.md` — GitHub Copilot repository instructions.
- `.github/agents/` — task-specialized agents.
- `.github/prompts/` — reusable action presets.
- `.vscode/tasks.json` — deterministic local commands.
- `.vscode/extensions.json` — recommended editor enablers.
- `.vscode/settings.json` — shared workspace defaults.
- `.env.example` — environment-variable contract only; secrets stay local.

## Agent routing
| Action | Agent |
|---|---|
| Multi-layer feature / uncertain routing | Runner Orchestrator |
| ESPN/Odds/Kalshi/provider feeds, mapping, storage | Data Pipeline Engineer |
| probabilities, totals, game flow, signals, backtests | Intelligence Engineer |
| broken runtime, missing feed, failing integration | Runtime Debugger |
| final verification, regression audit, release readiness | QA Release Gate |

## Prompt presets
- `implement-feature` — build a feature end-to-end.
- `debug-runtime` — trace and fix a failure.
- `audit-repo` — deep engineering audit plus safe fixes.
- `verify-release` — build/test/diff/release gate.

## VS Code tasks
Use **Terminal -> Run Task**:
- `Runner: Bootstrap` — install, build, test.
- `Runner: Build` — TypeScript build.
- `Runner: Test` — project test suite.
- `Runner: Verify` — build + tests.
- `Runner: Start` — start local scout.
- `Runner: Scout Help` — inspect CLI commands.

## Local setup
1. Pull the branch/repository.
2. Accept recommended extensions.
3. Copy `.env.example` to `.env` locally and populate authorized credentials. Never commit `.env`.
4. Run `Runner: Bootstrap`.
5. Open Copilot Chat Agent mode and select the specialized agent for the action.
6. Use a prompt preset for repeatable work or give the agent the task directly.

## Standard execution loop
`READ -> CLASSIFY -> PLAN -> IMPLEMENT -> TEST -> REVIEW DIFF -> DOCUMENT -> REPORT`

The same source-of-truth documents should be honored by VS Code Copilot, Claude Code, Codex, and human contributors. Do not create competing architecture or agent-specific production forks.

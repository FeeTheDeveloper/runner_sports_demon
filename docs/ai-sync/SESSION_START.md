# Session start

1. Identify the checkout root and read applicable ancestor/root/nested `AGENTS.md` instructions. Read `CLAUDE.md` if present and `README*`.
2. Read this directory's canonical context, manifest, current state, priorities, decisions, roles, handoff log, blockers, security boundaries, architecture, testing/deployment status and session-close checklist.
3. Read root `PROJECT_HANDOFF.md` when present, `ARCHITECTURE.md`, `CURRENT_INFRASTRUCTURE_AUDIT.md`, `DATA_SOURCES.md`, `MODEL_NOTES.md`, and `BACKTESTING.md`. These include historical and aspirational claims: verify against code.
4. Inspect `RUNNER_INTELLIGENCE_STATE.md`, `RUNNER_COMMANDS.md`, `.runner/system-status.json`, applicable work claims/handoffs, and `REPOSITORY_OWNERSHIP.md`. Preserve existing queues; revalidate dated operational status.
5. Inspect branch, status including untracked files, remotes, recent relevant commits, staged and unstaged diffs. Preserve unrelated work. Use focused branches and existing `.runner/work/` claims for shared-component edits.
6. Inspect relevant implementation/tests, package manifest and lockfile, `.env.example` only, CI/build/deployment configuration, entry points, storage/API/auth boundaries, integrations, automation, TODOs and failure evidence. Do not expose real secrets.
7. State the authorized objective and identify reversible local work versus external effects. Use independent engineering lanes when useful; actual agents must have bounded ownership. Do not claim persistent agents or hidden cross-tool access.
8. Implement the objective, run appropriate checks, review the diff, then follow [SESSION_CLOSE.md](SESSION_CLOSE.md). If external authorization is missing, finish the reviewable local result before asking for that final action.

Quick local inspection: `git status --short`, `git branch --show-current`, `git remote -v`, `git log -5 --oneline`, `git diff`, `git diff --cached`. Commands that start runtime services, publish or import data are not discovery substitutes.

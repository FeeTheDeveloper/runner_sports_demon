---
description: Run the shared Runner operations workflow with provenance and freshness gates.
---

Follow AGENTS.md, docs/ai-sync/SESSION_START.md and docs/ops/RUNNER_LOCAL_RUNBOOK.md.
Use Runner Sports Plug policy RUNNER-GPT-LOCK-20260925-V1 as summarized in docs/ops/RUNNER_DATA_SPINE.md.
Audit branch/status, service owners and source receipts before changing files or calling providers.
Run npm test, npm run contracts:validate and npm run data:validate.
Use GET /control/status, /markets/snapshot, /content and /api/health for local evidence.
Preserve FIXTURE/HISTORICAL/UNKNOWN labels. Never substitute fixture estimates for live or proprietary model output.
Keep model probability, market probability, fair price, executable price and edge separate.
Recalculate after material game/market changes; keep sponsor/admin data out of analytical conclusions.
Follow action-specific authority in AGENTS.md. Record work in .runner/work and close via SESSION_CLOSE.md.
Report objective, condition, work, files, tests, freshness, security, blockers, decisions and exact next command.

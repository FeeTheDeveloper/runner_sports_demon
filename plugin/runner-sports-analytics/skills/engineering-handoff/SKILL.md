---
name: engineering-handoff
description: "Audit-first engineering for the Runner Sports & Analytics repositories. This skill should be used when the user asks to \"audit runner_sports-site\", \"audit runner_sports_demon\", \"audit the Demon\", \"create a Runner engineering handoff\", \"take Runner live\", \"fix the Runner site\", \"why is the site only showing MLB\", \"check the Runner deployment\", \"sync Demon and the site\", \"review the Runner cron\", \"add a Supabase migration for Runner\", or asks for implementation, verification, or deployment work on FeeTheDeveloper/runner_sports-site or FeeTheDeveloper/runner_sports_demon. Produces structured handoffs by default and implements only when King Fee has authorized implementation in the session.\n"
metadata:
  version: "0.1.0"
  owner: "Runner Sports & Analytics LLC"
  engineering: "Fee The Developer LLC"
---

# Engineering Handoff

Load `../intelligence-desk/SKILL.md` first and apply its repository lock, entity firewall, security lock, and evidence standards. Read `../intelligence-desk/references/RSA_Go_Live_Plan.md` when the task touches the presentation site's data layer, cron, Supabase schema, or deployment; treat it as a dated plan, not current state.

Engineering authority: Fee The Developer LLC under King Fee. Runner owns the intelligence and editorial conclusions the code serves. Hutchrok governance records are not repositories.

## Repository lock

| Role | Repository | Notes |
| --- | --- | --- |
| Presentation | `FeeTheDeveloper/runner_sports-site` | Next.js App Router, TypeScript, Tailwind. Public domain `werunsportsandanalytics.com`. Renders approved derived records and enforces entitlement; does not duplicate model logic. |
| Intelligence | `FeeTheDeveloper/runner_sports_demon` | Ingestion, normalization, feature, model, replay, and alert layers. Owns raw and derived stores. |
| Historical authority | `rsaa_verse` | Historical assets and records; read-only reference. |

Never scaffold a replacement repository or parallel architecture, overwrite working ingestion or storage, duplicate Game Flow or totals logic, silently substitute mock data, or claim changes, tests, or deployments without evidence. Audit first, extend the existing architecture, preserve working code, make auditable changes, and return changed files, tests, blockers, and next actions.

## Step 1 — Startup audit (always)

1. Confirm repository, branch, objective, and expected outcome with the user if any is missing.
2. Read, where present: `README.md`, `AGENTS.md`, `CLAUDE.md`, `package.json` or `pyproject.toml`, `.env.example`, `vercel.json` or other deployment config, `supabase/migrations/`, `RUNNER_SYNC_AUDIT.md`, `.runner/sync-manifest.json`, `DATA_SOURCES.md`, `DATA_SCHEMA.md`, `MODEL_REGISTRY.json`, `MODEL_NOTES.md`, `BACKTESTING.md`, and the relevant tests.
3. Inspect `git status`, the active branch, recent commits, uncommitted changes, repository structure, and the current build and test commands.
4. Identify the existing architecture, runtime and framework versions, external services, required environment variables (names only), security boundaries, and the current failure point.
5. Protect unrelated work already in the tree. Never reset, discard, force-push, or rewrite history without King Fee's explicit approval.

Use the GitHub CLI, Supabase, and Vercel connectors when they are present and authorized in the session; otherwise report what could not be inspected. A connector's absence is a blocker to record, not a reason to guess.

## Step 2 — Decide: handoff or implement

Default to a structured handoff. Implement only when King Fee has authorized implementation for this task in the current session, or the task is a reversible, clearly required fix inside the approved scope. Even when implementing, write the handoff first; it becomes the plan and the completion record.

Obtain King Fee's approval before: deleting production data; running destructive migrations; rotating credentials; changing billing plans or buying services; sending external messages; publishing public content; merging protected branches; deploying breaking production changes; disabling authentication or security controls; expanding into another repository or company; or replacing a working architecture with a materially different platform.

## Step 3 — Handoff format

Produce every handoff in this order:

1. **Objective** — the business or product result, in one or two sentences.
2. **Current Condition** — verified state from the audit, with evidence (file paths, commands run, outputs, commit SHAs). Separate verified facts from assumptions.
3. **Acceptance Criteria** — testable statements.
4. **Dependencies** — services, data rights, environment variables by name, sibling-repository contracts, scheduled jobs.
5. **Security Considerations** — secrets handling, auth boundaries, CORS, service-role usage, data exposure.
6. **Decisions Needed** — only items King Fee must choose or authorize.
7. **Verification / Tests** — exact commands and checks.
8. **Completion Evidence Required** — what proves the work is done (commit or PR, test output, build output, health-check response, deployment URL, row counts).

When the handoff moves between workspaces, name the file `YYYY-MM-DD__SOURCE-TO-DESTINATION__runner-sports__ACTION__STATUS.md` with status `DRAFT`, `READY`, `ACCEPTED`, `BLOCKED`, `REVIEW`, `COMPLETE`, or `ARCHIVED`, and include handoff ID, timestamp, originating and receiving workspace, company, repository, branch, current owner, next owner, and a decision log. Never include secret values.

## Step 4 — Implementation rules (when authorized)

- Implement the smallest complete change that satisfies the acceptance criteria. No placeholder services, duplicate modules, or unrelated formatting sweeps.
- Keep `lib/data/*` function signatures stable on the site so `app/api/*` routes do not change; move data access behind them.
- Keep raw ingestion, normalized data, and derived intelligence separated in the Demon. Use deterministic IDs and deduplication. Implement retry, timeout, caching, and failure reporting. Record source, retrieval time, and provider status on every stored record. Label stale, delayed, estimated, or synthetic data; synthetic or test data must never appear as real outcomes.
- Constrain database reads. A known root cause of site timeouts was unrestricted Supabase reads followed by in-memory filtering and JSON serialization; push filters, limits, and sport selection into the query and keep multi-sport display working (the site must never collapse to a single sport).
- Declare route revalidation in each route file rather than relying on a shared `force-dynamic` export, per the go-live plan's code-review finding.
- Validate required environment variables at boot with a clear error naming the missing variable.
- Mutating endpoints fail closed without auth. Protect cron routes with a shared-secret header. Keep CORS restrictive. Never import the service-role client into a client component.
- Preserve the responsible-use disclaimer and never introduce "guaranteed", "lock", or similar wording in product copy.
- Commit format: `type(scope): concise outcome` (for example `fix(runner-site): constrain games query by sport and date`).

## Step 5 — Verification

Run, as applicable: formatting, linting, type checking, unit tests, integration tests, `npm run build`, migration validation, endpoint and browser checks, and a security review for auth bypass, missing authorization, injection, XSS, CSRF, IDOR, broad database permissions, exposed service-role keys, unvalidated uploads, sensitive logging, and unprotected admin endpoints. When a check cannot be run, state exactly why.

Go-live and post-deploy smoke checks for the site: `/api/health` returns 200; `/api/games` returns current games, not mock dates; `/api/props` and `/api/edges` reflect the same live game IDs; the odds sync cron has run (table row counts increasing); tracker writes and reads round-trip; the disclaimer renders on every page; no keys are visible in browser network traffic or page source; more than one sport renders with working filters, props, nameplates, and logos.

Local health is not proof of production health. Verify the production deployment, environment variables (by name), health endpoint, integrations, and data freshness before reporting production status.

## Environment-variable inventory (names only)

Site, per the go-live plan: `ODDS_API_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`. Confirm the live inventory from `.env.example` and the deployment platform; never record values anywhere. Demon variables come from its own `.env.example`.

## Known evidence and open risks (dated; re-verify)

From the lock file (2026-09-25): a local Runner Scout API operated; a local site reached ready state with HTTP 200 health and home responses; an NFL schedule validation test passed source, timestamp, canonical-ID, and date checks. Open at that time: a Next.js multiple-lockfile and workspace-root warning, and a Clerk deprecation and security migration warning for route-matcher-based authorization. A separate governing handoff recorded a production deployment failure. Treat all of these as historical until re-checked.

## Report format

End every engineering response with: Outcome, Root Cause (when a defect was involved), Changes Made, Files Affected, Verification Completed, Remaining Risks, Required Environment Variables (names), Deployment Status, Decisions Needed from King Fee, Recommended Next Action. Never claim a commit, push, merge, or deployment occurred unless verified.

## Example request

"Audit runner_sports-site and tell me why only MLB shows." Run the startup audit, trace the data path from the route through `lib/data/*` to the Supabase query, identify where sport filtering or result truncation collapses the set, cite the exact file and line, produce the handoff, and implement only if authorized in the session.

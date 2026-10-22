# Handoff — runner-sports-plug — flow-studio-skill

| Field | Value |
|---|---|
| Handoff ID | 2026-10-22-CLAUDE-TO-FTD-runner-sports-plug-01 |
| Date and timestamp | 2026-10-22 16:05 America/Chicago (supersedes the 14:27 BLOCKED record) |
| Originating workspace | Claude |
| Receiving workspace | FTD Main |
| Company | Runner Sports & Analytics LLC |
| Project | `runner-sports-analytics` Claude plugin (lineage: ChatGPT "Runner Sports Plug" 0.1.4) |
| Repository | FeeTheDeveloper/runner_sports_demon |
| Branch | feat/runner-sports-analytics-plugin-flow-studio @ 3d85ba0 (base main @ 8cc8be7) |
| Status | READY |
| Current owner | Claude |
| Next owner | King Fee (PR review and merge), then the plugin release owner (Claude plugin upload; ChatGPT Runner Sports Plug overlay once its backend ID is resolved) |

## Objective
Give the Runner Sports & Analytics plugin a source-controlled home and insert the Google Flow / Flow Music production skill from the 2026-10-22 Flow portfolio handoff beside the existing `campaign-director`, with no loss of existing skills and the existing Claude upload path unchanged.

## Current verified condition
- VERIFIED — King Fee's direction (2026-10-22 15:51): place the Runner Sports plugin in the demon repo. Earlier search found no plugin source in `runner_sports_demon`, `runner_sports-site`, `runners_enterprise`, `ftd_os`, Dropbox or Drive (see the superseded BLOCKED record for the evidence list).
- VERIFIED — Plugin tree now at `runner_sports_demon/plugin/runner-sports-analytics/` (18 files), seeded from the account-installed 0.1.0 package. Skills 6 → 7 (`runner-sports-flow-studio` added); no removals; `name` fields equal directory names; no duplicates.
- VERIFIED — `.claude-plugin/plugin.json` 0.1.0 → 0.1.1; name, description, author, homepage, license, keywords, `skills: ./skills/` preserved. No ChatGPT/Codex manifest exists for this package (the ChatGPT "Runner Sports Plug" release is a separate account-only package; its backend `plugin_id` / release ID remain unresolved).
- VERIFIED — `campaign-director/SKILL.md` received one additive companion-pointer paragraph. README (component count, skills table, install note, new "Source of truth" section) and PROVENANCE (lineage row, source home, 0.1.1 checksum note) updated. `SHA256SUMS` regenerated with the documented command; `sha256sum -c` → 17 OK.
- VERIFIED — The installed 0.1.0 copy failed its own `SHA256SUMS` on every `skills/*/SKILL.md` (references, README, notices and manifest matched). Cause undetermined; recorded in PROVENANCE. 0.1.1 is the first version whose checksums are verifiable from source control.
- VERIFIED — `claude plugin validate plugin/runner-sports-analytics` passed (Claude Code 2.1.308). `npm ci`, `npm run build`, `npm test` (all 15 suites), `npm run contracts:validate` (10 contracts, 5 handoffs) pass. `npm run audit -- --skip-exec` reports the same pre-existing non-strict FAIL rows as `main` (missing `AGENT_GUIDE.md` referenced by `OPENMONTAGE.md`, stale `system-status.json`, uncalibrated model); regenerated audit outputs were not committed. No runtime code touched.
- VERIFIED — Secret/PII pattern scan of the plugin tree: clean. Fresh-context invocation test of the new skill: C1–C8 PASS, C9 wording defects fixed before commit.
- VERIFIED — Repository visibility is PUBLIC; `OWNERSHIP-NOTICE.md` classifies the plugin PRIVATE with no public redistribution license. Placement was King Fee's call; README now carries the rule that proprietary model output, account identifiers, credentials and unreleased media never enter this tree.
- UNRESOLVED — Whether the ChatGPT Runner Sports Plug (0.1.4) should also receive `runner-sports-flow-studio` via its overlay path; blocked on its backend ID.

## Requested action
Review and merge the PR. Then re-upload `plugin/runner-sports-analytics` through Customize → Plugins (replaces 0.1.0 under the same name) and confirm seven skills appear.

## Acceptance criteria
- [x] Source-controlled plugin home exists (`runner_sports_demon/plugin/runner-sports-analytics/`)
- [x] Full existing skill tree present with checksums re-established
- [x] `runner-sports-flow-studio` added beside `campaign-director`; names unique; no removals
- [x] Version bumped; manifest preserved except version; validator passes
- [x] No cross-tenant data, credentials, betting-account or customer data in the package
- [x] QA records produced (validator, repo CI sequence, secret scan, invocation test)
- [ ] PR merged by King Fee
- [ ] 0.1.1 uploaded to the Claude account with readback (seven skills visible)

## Dependencies
Inbound handoff "Google Flow / Flow Music Portfolio Handoff" (2026-10-22) and `runner-sports-flow-skill-handoff.zip`. ChatGPT-side release depends on resolving the Runner Sports Plug backend ID.

## Environment-variable requirements
None (skills-only plugin). The repository's own contract is `.env.example`; untouched.

## Security considerations
Runner Sports & Analytics is the only tenant in the record. Research-only posture preserved: no wagering execution, no tout language, no league/team/sportsbook marks without clearance, every on-screen figure sourced and timestamped. Public-repo rule stated in the skill and README. No secret values anywhere in the diff.

## Files or systems affected
See the PR: `plugin/runner-sports-analytics/**` (new tree; 18 files), this record at `.runner/handoffs/`.

## Test and verification requirements

| Gate | Verdict | Evidence |
|---|---|---|
| test-review | PASS | `npm test` 15 suites; `contracts:validate` 10/5; `claude plugin validate` passed |
| security-review | PASS WITH NOTES | secret/PII scan clean; note: PRIVATE-classified package now lives in a public repository by owner decision — owner: King Fee (consider making the repo private or accepting the exposure) |
| performance-review | N/A | documentation/package-only change |
| observability-review | N/A | — |
| accessibility-review | N/A | — |
| definition-of-done | DONE PENDING REVIEW | all criteria above except merge and upload |
| ship | NOT RUN | reviewer fan-out not run for a documentation tree; validator + full CI sequence substituted |

## Deployment / publication state
NOT DEPLOYED — PR open; no plugin upload performed.

## Approval requirements
Merge of `main`; Claude plugin upload (replaces the installed 0.1.0); any public publication.

## Blockers
None for the repository change.

## Decision log
- 2026-10-22 15:51 — Home for the Runner Sports plugin source: `runner_sports_demon` (option B) — King Fee — DECIDED
- 2026-10-22 — Seed 0.1.1 from the installed 0.1.0 content despite its failed checksums; regenerate `SHA256SUMS` and record the mismatch in PROVENANCE — Claude — applied
- 2026-10-22 — Do not fabricate a ChatGPT/Codex manifest for this package; the ChatGPT Runner Sports Plug stays a separate account-only release until its backend ID is resolved — Claude — applied
- 2026-10-22 — RECOMMENDED: decide whether `runner_sports_demon` should become private given the PRIVATE classification of the plugin — King Fee — OPEN
- 2026-10-22 — Handoff record not placed in Dropbox: hub `/Fee The Developer/ChatGPT Transfers/` does not exist in the connected Dropbox account — Claude — King Fee to place or approve creating the hub

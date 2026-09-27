# Runner operations completion evidence — 2026-09-26

## Objective

Execute docs/RUNNER_DEMON_OPERATIONS_PROMPT_2026-09-26.md using Runner Sports Plug policy and the existing engine architecture.

## Current condition

Branch `feat/runner-operations-data-spine`, based on `e1c9b22`. Starting tree was clean. Changes are local and uncommitted. Runtime evidence collected from 17:42 UTC with a final service restart/check after validation; service availability is a point-in-time observation.

| Machine check | Observed result |
|---|---|
| Starting ports | 8790 owned by node PID 10864 running dist/cli.js dashboard; no 8787 or 3001 listener |
| Final dashboard | 127.0.0.1:8790, PID 47540; HTTP 200 /, /api/health, /control/status, /markets/snapshot, /content |
| Final API-only service | 127.0.0.1:8787, PID 24460; /api/health HTTP 200, memory-only evaluations |
| Site port 3001 | Not listening; prior Next.js runtime claim in the prompt is historical |
| Database | Readable; 1,413 markets, 39,236 market events, 39,236 prices, 7 observations, 0 totals windows |
| Kalshi receipt | 2026-09-19T08:50:27.924Z; HISTORICAL |
| Polymarket receipt | 2026-09-09T16:03:43.441Z; HISTORICAL |
| Market snapshot | 250 bounded saved rows; HISTORICAL with stale warnings |
| Content route | 20 schema-validated PUBLIC fixture shells; FIXTURE |
| ESPN CFB | September 26 request returned 65 games; receipt 2026-09-26T17:50:32.814Z; CURRENT at inspection, canonical IDs present |
| ESPN NFL | September 26 request returned zero games; game-data freshness UNKNOWN |
| Runtime | Node v24.13.0, npm 11.6.2 |

The dashboard was restarted to load the changes; API-only mode was started with publication disabled. Neither service starts market ingestion. Current ESPN receipt proves a successful retrieval, not independently verified provider-update time. Its 300-second receipt window expires normally.

## Work completed

- Strict data/content schemas; eight NFL/NCAAF fixtures; normalized example; historical snapshot; checksum manifest; twenty JSON/Markdown content shells.
- Preserved separate model probability, market probability, fair price, executable price and edge. Unknown numeric fields remain null; fixtures assert no model execution.
- Added health alias, content and saved-market routes, explicit freshness/provenance and sanitized schedule failures.
- Added API-only mode, schema/content commands, dashboard links and provider failure flags without exposing provider error bodies.
- Preserved bearer fail-closed behavior and restrictive CORS; added regression checks for both failure and authenticated success.
- Enriched all eleven existing raw-season manifest entries; verified original bytes against SHA-256. Raw parquet files were unchanged.
- Added runbook/provider matrix/shared workflow prompt and AI synchronization records.

## Files changed

- Runtime: src/operations/data.ts, src/operations/cli.ts, src/api/server.ts, src/cli.ts, src/dashboard/control.ts, src/dashboard/control-web.ts, src/utils/http.ts.
- Tests/tooling: src/tests/operations.test.ts, src/tests/control-api.test.ts, package.json, package-lock.json, scripts/validate-runner-contracts.mjs, scripts/ingest_nflverse_pbp.py, .gitattributes.
- Contracts/data: contracts/runner-data-contract.json, contracts/runner-content-card.schema.json, data/fixtures/operations.json, data/normalized/operations.json, data/snapshots/historical-state.json, data/content/cards.json, data/content/cards.md, data/manifests/operations.json, data/manifests/ingestion.jsonl.
- Documentation: README.md, RUNNER_COMMANDS.md, DATA_SCHEMA.md, DATA_SOURCE_REGISTRY.md, docs/ops/RUNNER_DATA_SPINE.md, docs/ops/RUNNER_LOCAL_RUNBOOK.md, this report, .github/prompts/runner-operations.prompt.md, docs/ai-sync/{CURRENT_STATE,TESTING_STATUS,HANDOFF_LOG,PROJECT_MANIFEST,ACTIVE_PRIORITIES,BLOCKERS,DEPLOYMENT_STATUS,DECISION_LOG}.md.
- Coordination: .runner/work/operations-data-spine.claim.json. Existing cross-repository handoffs were preserved.

## Verification / tests

| Check | Result |
|---|---|
| Required starting Git status/branch/log | PASS; clean audit branch at e1c9b22 before focused branch creation |
| npm install | PASS; initial audit of six packages: zero vulnerabilities |
| New validator dependencies | Ajv + ajv-formats installed; twelve packages audited, zero vulnerabilities at installation |
| Baseline build/tests | PASS; all original 13 test programs |
| Final npm test / build | PASS; all 14 programs, including schemas, freshness boundaries, bearer/CORS, content routes and sanitized provider errors |
| npm run typecheck --if-present | PASS |
| npm run lint --if-present | SKIPPED; no lint script exists |
| npm run contracts:validate | PASS; 12 contract metadata records and 5 existing handoffs |
| npm run data:validate | PASS; 8 data fixtures, 20 cards, 5 artifact hashes, 11 historical file hashes |
| npm run content:generate | PASS; deterministic fixture JSON/Markdown and inventory |
| npm run system:validate | PASS; three repositories present; Verse has no package.json (expected non-Node repository) |
| Historical acquisition script | Python compile PASS; download/network execution not performed |
| Local HTTP | PASS for health, control, market snapshot and content; live schedule calls described above |
| git diff --check | PASS |
| Browser | Existing emitted-client tests passed; no visual browser inspection performed |

One intermediate regression check failed because a safe warning contained the literal word prohibited by the existing no-secret-field test. The warning was adjusted; the full suite then passed. Initial PowerShell brace expansion and inline Node quoting attempts failed and were corrected; those failures did not alter data or establish false verification.

## Data freshness status

Market data is explicitly HISTORICAL. Examples and generated content are FIXTURE. Existing seasonal data is HISTORICAL, including the partial 2026 acquisition. No fresh market ingest or proprietary model result is claimed. An empty cache or schedule is UNKNOWN. Future/invalid timestamps are UNKNOWN and stored fixture/historical classifications cannot auto-upgrade.

## Security notes

.env and .env.local are ignored, absent from tracked paths and from their path history reachable at HEAD. Only .env.example is tracked among environment files; its credential placeholders remain empty. A bounded pattern scan of repository text found no candidate private keys/common token formats (222 paths inventoried; binary/large files excluded). This is not an exhaustive history-wide secret audit. No actual secret was identified requiring rotation.

Provider HTTP error bodies are no longer copied into ingestion errors. Content serves only PUBLIC cards and strict schemas reject extra raw fields. Synthetic authentication tests never use real credentials. Local read routes retain the existing network boundary; they are not a public multi-tenant API.

## Audit findings

- CRITICAL: None identified in this operations change within the checks performed.
- HIGH: Existing ingestion publisher defaults enabled; local runbook explicitly overrides RUNNER_PUBLISH_ENABLED=false. Public/network deployment requires separate review.
- MEDIUM: Existing setInterval polling can overlap; cross-provider canonical mapping and legacy ESPN sourceTimestamp semantics remain limitations. Receipt-based API labeling now discloses the ESPN issue.
- LOW: No lint script; visual browser layout unverified.
- TESTS REQUIRED: Before public Site consumption, verify deployed auth/network isolation, permitted redistribution, source timestamp semantics and consumer compatibility. Before unattended ingest, test single-flight/idempotency and provider failure recovery.
- RECOMMENDED CHANGES: Follow the existing blocker queue for opt-in publishing, serialized ingest and canonical event mapping. These broader changes are outside the requested operations artifact/route package.

## Blocked items

- Authenticated Kalshi and Odds API live retrieval were not exercised; credential presence does not establish entitlement or working access.
- Polymarket stays optional; no fresh retrieval was requested.
- ScraperAPI has no Demon adapter; source permission/rate-limit review and a defined source are prerequisites.
- Generic CSV imports need a reviewed column mapping; normalized JSON validation and existing engine export/import commands are available.
- Site deployment/consumer acceptance, current Clerk migration and Next.js warnings remain unverified in the sibling repository. The local Demon dashboard consumes the new contracts.
- MODEL_OUTPUT fixtures remain UNKNOWN because no calibrated model result is supplied.

## Decisions needed from King Fee

None for this completed local operations package. External publication/deployment and provider-specific expansion remain separate, explicitly scoped actions.

## Next operator command

```powershell
npm run data:validate
```

The dashboard is already running at http://127.0.0.1:8790. See RUNNER_LOCAL_RUNBOOK.md for restart, authorized evaluation and local-only ingest commands.

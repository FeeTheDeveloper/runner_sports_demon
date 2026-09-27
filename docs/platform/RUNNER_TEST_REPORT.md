# Full-platform test report

September 26, 2026. Source baseline: Demon feat/runner-demon-cockpit at 101ece3; Site release/runner-production at eeee1e3 with pre-existing local work.

| Command / check | Result | What it establishes |
| --- | --- | --- |
| Demon npm test | PASS, all 14 test programs; includes npm run build | Existing normalization/probability/Game Flow/games/totals/publisher/vig/adversity/history/control/operations assertions and compilation |
| Site npm run build | PASS, compilation/type/lint and 32 static page generation reported | Current checkout builds; dynamic route credentials/runtime are not proven |
| Site npm run lint | PASS, no ESLint errors/warnings | Existing lint rules pass |
| Reference browser traversal | PARTIAL | Major desktop page-family controls and relationships observed |
| Reference 390px viewport | NOT VERIFIED | Override did not change inspected slate dimensions; reset performed |
| Production auth/provider tests | NOT RUN | No production correctness claim |
| Site automated runtime suite | NOT AVAILABLE as npm test script | Authorization and cross-user regression coverage still required |

Site tooling reported multiple lockfiles and inferred a parent workspace root. Its next lint command also reported deprecation before Next 16. These did not fail the current build/lint; configure the intended root and maintain lint tooling in an isolated change.

## Required release tests

- Tracker: anonymous/free/subscriber/admin, A reading B's record/list/summary, owner spoofing, missing auth configuration, direct service-role paths and legacy unowned rows.
- Commands: absent/wrong/expired credentials, per-command capability, unauthorized force_publish, concurrent duplicate keys, crash/retry, audit attribution and credential redaction.
- Data: duplicate/out-of-order events, clock skew, separate kickoff/retrieval times, provider offline/partial/rate limit, cross-provider ID collisions.
- Models/prices: missing independent model, stale/suspended quotes, side/line/period mismatch, vig/fees/liquidity, no fake fallback edge.
- Systems: immutable versions, cutoff leakage, reproducible manifests, split denominators, push/void/corrections, malformed rules and bounded evaluation.
- Receipts: original publication preserved, unique outbox delivery, settlements and superseding correction chain.
- UX: real-data full journey, empty/error/stale states, 320/390px and desktop, keyboard/focus, deep links and browser back.
- Recovery: additive migration staging, backup restoration, lease expiry/replay and consumer reconciliation.

No new runtime tests were written for this documentation-only pass. Passing existing tests does not resolve the findings in the diagnostic.


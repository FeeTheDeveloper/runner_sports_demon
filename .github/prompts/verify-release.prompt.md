---
mode: agent
description: Run the release gate and fix straightforward validation failures.
---
Perform the Runner release gate. Inspect current changes, run `npm run build` and `npm test`, review the diff, check for secret leakage and contract/doc drift, and fix straightforward failures. Do not claim external integrations are verified without direct evidence.

Return one status: PASS, PASS WITH EXTERNAL BLOCKER, or FAIL. Include exact validation evidence and remaining action.

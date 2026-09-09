---
mode: agent
description: Reproduce and fix a runtime, provider, data, or integration failure.
---
Debug this failure using evidence, not assumptions. Read `AGENTS.md`; trace configuration -> connection/request -> response -> normalization -> storage -> model -> publication as applicable. Do not print secrets or fabricate successful external data.

Reproduce where possible, isolate root cause, implement the smallest correct fix, add regression protection, run build/tests, inspect the diff, and report evidence.

Failure: ${input:failure:Describe the observed failure or symptom}

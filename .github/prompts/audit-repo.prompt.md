---
mode: agent
description: Perform a full engineering audit and fix high-confidence defects without replacing the architecture.
---
Audit the current repository against `AGENTS.md`, architecture/docs, environment contract, runtime paths, tests, and package scripts.

Inspect for broken integrations, stale or unreachable code, schema drift, missing error handling, unsafe defaults, secret exposure, duplicated logic, performance bottlenecks, missing tests, false health states, and documentation drift. Rank findings by severity. Fix high-confidence defects that can be safely corrected now. Run build/tests and report remaining blockers separately from completed work.

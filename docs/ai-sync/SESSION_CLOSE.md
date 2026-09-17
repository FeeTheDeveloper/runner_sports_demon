# Session close

1. Verify the authorized objective is complete or state the specific remaining blocker. Preserve unrelated working-tree changes.
2. Run `npm run build` after code changes and `npm test` for runtime changes. Run relevant contract/tooling checks when their inputs change; describe actual outcomes and coverage limits.
3. Review the complete diff including new files, whitespace, secret exposure, unintended behavior and documentation accuracy. Do not infer a passing deployment from a passing local build.
4. Update the manifest when stack/boundaries change; current state, priorities, blockers and testing/deployment status when evidence changes; decision/handoff logs for meaningful decisions and continuity.
5. Update the existing `.runner/work/` claim when local integration finishes. Cross-repository handoffs stay under `.runner/handoffs/` and require their consumer confirmation before completion. Do not update operational health from historical assumptions.
6. Keep durable production logic and decisions in version-controlled paths. Use `.ai/local/` only for disposable ignored scratch; do not store a second source of truth there.
7. Report what changed, verification, limitations and the current branch/commit state. Identify any external action still requiring explicit authorization; do not push, merge or deploy by implication.

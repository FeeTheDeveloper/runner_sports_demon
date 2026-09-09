# Fee The Developer — Runner Sports Copilot Contract

Read `AGENTS.md` first. Treat repository documentation and implementation as the source of truth.

## Operating mode
- Continue the existing system; never scaffold a replacement unless explicitly ordered.
- Inspect before editing. Find the runtime path, tests, schemas, environment contract, and downstream consumers.
- Prefer the smallest complete change that solves the task without duplicating architecture.
- Never fabricate live sports, market, provider, test, or deployment results.
- Never expose or commit secrets. `.env.example` defines variable names; local `.env` holds values.
- Preserve the intelligence-engine boundary. No automatic wagering/trading unless explicitly authorized.
- Keep `runner_sports-site` presentation concerns separate from demon intelligence concerns.

## Definition of done
1. Implementation complete.
2. `npm run build` passes.
3. Relevant tests pass; normally run `npm test` for runtime changes.
4. Diff reviewed for regressions, dead code, secret leakage, and duplicated logic.
5. Documentation updated when contracts, sources, schemas, formulas, signals, or operations change.
6. Report exactly what changed, validation performed, and any real blocker.

## Action routing
Use the custom agents in `.github/agents/` when the task matches their specialty. Use prompt presets in `.github/prompts/` for repeatable action types.

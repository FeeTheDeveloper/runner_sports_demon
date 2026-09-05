# Claude Code — Runner Sports Demon

Follow `AGENTS.md` as the shared engineering contract and read the repository handoff/architecture documentation before implementation.

## Mission
Continue the existing Runner Sports Demon implementation. Do not scaffold a replacement project. The daemon is the quantitative/live intelligence layer; `runner_sports-site` is the product/presentation layer.

## Environment
Use the exact environment-variable names declared in `.env.example`. Real values are supplied by Fee The Developer through the local VS Code/runtime environment and must never be committed.

Do not print secret values into logs, patches, chat output, tests, fixtures, or documentation. Validate presence/configuration without echoing credentials.

## Execution
Before claiming a change works, run the relevant build/tests. If an external connection cannot be verified because a credential is missing, implement and test everything possible, then report the exact missing variable or external blocker without inventing a successful connection.

## Coordination
Keep architecture, schemas, formulas, signals, and operational decisions in repository documentation so Codex, Copilot, Claude Code, and future sessions share the same state.

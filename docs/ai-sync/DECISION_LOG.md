# Decision log

2026-09-26: Preserve engine/SQLite architecture; add portable data/content artifacts with immutable fixture/historical labels and separate receipt metadata. Use API-only mode for local evaluation without ingest/publish effects. Keep unknown model fields null and require evidence references for model-output declarations. [Contract](../ops/RUNNER_DATA_SPINE.md).

## 2026-09-16 — Local control center

- Implemented the requested dashboard as a local operator view in Demon, preserving Site ownership of the consumer product.
- Added a separate `dashboard` CLI command, bound to loopback, using read-only saved data. Hosting the dashboard does not implicitly start provider ingestion or cloud publishing.
- Reused existing ESPN schedule services for explicit date/league requests. Search, filters, automatic-refresh controls and JSON export operate on display data.
- Rendered recorded provider freshness and effective totals expiry; never derived provider connectivity from market presence. Historical coordination blockers are labeled for revalidation.
- Used native HTML/CSS/JavaScript served by the existing Node API without new dependencies or remote asset hosts.

## 2026-09-16 — Master-sync bootstrap

- Accepted the owner's authority hierarchy and explicit external-action boundaries. Local reversible implementation can proceed within the objective; external authority remains action-specific.
- Added `docs/ai-sync/` as shared human-readable session continuity. Preserved `.runner/` as the existing work-claim, handoff and machine-status location; no duplicate operational queues.
- Used a focused local branch, `docs/ai-sync-bootstrap`, from clean baseline `ae89200`. Did not push or merge.
- Preserved root product handoff and historical audits. Corrected verified foundation-only descriptions in README, architecture, data-source, model and backtesting notes.
- Recorded implementation risks for follow-up rather than expanding the bootstrap into changes to provider mapping, authentication, or model/runtime behavior.
- Added `.ai/local/` as ignored scratch space. Durable decisions and production logic must remain in version-controlled repository paths; scratch space is not a separate secret store.
- Used two temporary read-only Codex subagents for architecture and operational audits. These were session tools, not Claude, Copilot, persistent workers, or evidence of cross-system synchronization.
- The supplied master-sync attachment ends at the QA section's partial word `regre`. Applied the complete visible requirements; did not infer missing sections.

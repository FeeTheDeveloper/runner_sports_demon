# Decision log

## 2026-09-16 — Master-sync bootstrap

- Accepted the owner's authority hierarchy and explicit external-action boundaries. Local reversible implementation can proceed within the objective; external authority remains action-specific.
- Added `docs/ai-sync/` as shared human-readable session continuity. Preserved `.runner/` as the existing work-claim, handoff and machine-status location; no duplicate operational queues.
- Used a focused local branch, `docs/ai-sync-bootstrap`, from clean baseline `ae89200`. Did not push or merge.
- Preserved root product handoff and historical audits. Corrected verified foundation-only descriptions in README, architecture, data-source, model and backtesting notes.
- Recorded implementation risks for follow-up rather than expanding the bootstrap into changes to provider mapping, authentication, or model/runtime behavior.
- Added `.ai/local/` as ignored scratch space. Durable decisions and production logic must remain in version-controlled repository paths; scratch space is not a separate secret store.
- Used two temporary read-only Codex subagents for architecture and operational audits. These were session tools, not Claude, Copilot, persistent workers, or evidence of cross-system synchronization.
- The supplied master-sync attachment ends at the QA section's partial word `regre`. Applied the complete visible requirements; did not infer missing sections.

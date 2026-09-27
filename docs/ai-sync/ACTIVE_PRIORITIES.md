# Active priorities

2026-09-26 connected-launch priority: resolve verified Clerk/Supabase/Stripe bindings and commercial terms, then review coordinated schema/release actions for the exact Site project. Complete two-account and sandbox lifecycle acceptance before enabling checkout. Next model/agent work is measured usage enforcement, validated model execution and a deployed capability-scoped monitoring worker. [Launch handoff](../ops/CONNECTED_LAUNCH_2026-09-26.md).

2026-09-26 hardening update: opt-in publishing, single-flight polling, receipt-vs-kickoff timing and current NFL provider-name mapping now have local fixes/tests. Next release gates are exact hosting target, Site owner migration/deployment, provider configuration, consumer acceptance and supervised monitoring/recovery. Historical identifier reconciliation and calibrated independent models remain open. [Release candidate](../ops/PRODUCTION_RELEASE_2026-09-26.md).

2026-09-26: Requested local operations/data-spine package is complete; see [evidence](../ops/MACHINE_STATE_2026-09-26.md). Next runtime work remains opt-in publishing, serialized ingestion, provider verification and Site consumer acceptance. Fixture content must remain labelled.

## 2026-09-26 operating-audit additions

Before unattended local ingestion, make Site publishing explicit opt-in and add a single-flight polling guard with focused regression tests. The [Runner Sports Plug audit](RUNNER_PLUGIN_OPERATIONS_2026-09-26.md) records the current read-only operating mode and verification boundary. Existing priorities below remain open.

Updated 2026-09-16. The master-sync bootstrap is complete. These are recommended follow-ups, not newly executed work or external authorization; retain existing `.runner/handoffs/` ownership.

| Priority | Next bounded objective | Evidence / acceptance |
|---|---|---|
| P0 | Align canonical NFL IDs across ESPN and Odds API | ESPN supplies abbreviations; Odds falls back to three letters of the team nickname. Prove the same matchup joins across sources. |
| P0 | Correct freshness semantics | ESPN labels kickoff as `sourceTimestamp`; replace it with a verified provider-update timestamp before treating scoreboard records as live-fresh. |
| P0 | Complete NFL live PBP/drive ingestion | Existing handoff `HO-20260913-002`; verify approved source, timing, mapping and replayable snapshots. |
| P1 | Validate historical import and export completeness | Dedicated Verse loader exists; actual import not checked. General `EXPORT_TABLES` omits historical tables and game-state snapshots; prove intended export/restore coverage. |
| P1 | Build representative replay/calibration | Totals frame replay exists; general backtesting and predictive validation remain incomplete. Retain no-profitability/no-auto-trading gates. |
| P1 | Verify Site consumption and release boundary | Existing handoffs 004/005; validate contracts and private/public exposure before any separately authorized deployment. |
| P2 | Reconcile residual documentation/metadata | Historical `.runner` status needs fresh evidence; package repository metadata points to localhost; operational/deployment runbooks need expansion when a target is selected. |

See [BLOCKERS.md](BLOCKERS.md) for source references and distinctions between implementation gaps and unverified external state.

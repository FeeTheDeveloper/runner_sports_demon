# Active priorities

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

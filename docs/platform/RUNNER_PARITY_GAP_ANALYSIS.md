# Runner parity gaps

September 26, 2026. EXISTS denotes inspected implementation, PARTIAL denotes an incomplete contract, MISSING denotes no complete implementation found. None means production certified.

| Reference capability | Runner equivalent | State | Data / source required | Engine required | UI required | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| Navigation/context | Existing Site shell | PARTIAL | Canonical sports/events | Shared query schema | Persistent sport/date context | P1 |
| Slate and game research | GAME LAB | PARTIAL | ESPN + verified team/availability feeds | Canonical mapping, point-in-time joins | Connect existing game tabs | P1 |
| Prop search/history | PLAYER LAB | PARTIAL | Licensed player logs/roles + Odds API | Player-event mapping and distributions | Player detail and filter results | P1 |
| Strategy directory | Systems Directory | MISSING engine; example UI exists | Rules + accepted historical manifests | Versioned system evaluator | Real directory with no fake metrics | P1 |
| Historical strategy performance | System Backtest | PARTIAL generic foundations | Historical outcomes AND dated prices | Cutoff-safe evaluation, splits, intervals | Run detail, caveats, reproducible chart | P1 |
| Current qualifiers | System Candidates | MISSING | Current event/player/market facts | Explainable rule matching | Candidate table to labs | P1 |
| Ratings | External rating + Runner grade | MISSING complete contract | Approved external feed + independent model | Separate namespaces, grade policy | Attribution and grade explanation | P2 |
| Projections | Runner Projection | PARTIAL heuristic | Supported training/features/validation | Versioned calibrated model | MODEL NOT RUN when absent | P1 |
| Consensus/odds | MARKET LAB | PARTIAL | Odds API/Kalshi comparable quotes | Vig/fees/expiry/liquidity handling | Quote lineage and comparison | P1 |
| Picks discovery | RUNNER BOARD | PARTIAL | Qualified evidence and model/price snapshot | Suppression and publish eligibility | Candidate-to-evidence navigation | P1 |
| Trends/rankings | Research | PARTIAL | Settled canonical history | Point-in-time aggregation, sample guards | Filters, definitions, no false certainty | P2 |
| Saved picks/accounts | Tracker | PARTIAL; critical isolation defect | Auth subject + owner-tagged rows | Server authorization and RLS | Own records only | P0 |
| Live monitoring | LIVE DESK | PARTIAL Game Flow exists | Supported live observations + market feed | Existing state/replay plus regime changes | Live, stale, disconnected states | P2 |
| Historical accountability | Runner Receipts | MISSING complete ledger | Publication + official settlement sources | Append-only receipt/correction chain | Receipt and result detail | P1 |
| Desktop/mobile research | Existing Runner Site | PARTIAL | Same read models | Stable pagination/query contracts | Responsive/accessible full journey | P2 |
| Operational command controls | Existing MCP and command queue | PARTIAL; high boundary risk | Principal/capability/approval evidence | Atomic claim, idempotency, authorization | Secret-free status and failures | P0 |

P0 precedes public expansion. P1 should be delivered as one supported sport/market slice before broader sports. P2 does not justify claiming unsupported data or models.


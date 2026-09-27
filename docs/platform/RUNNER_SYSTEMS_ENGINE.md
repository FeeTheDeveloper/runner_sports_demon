# Runner Systems Engine engineering contract

Status: PROPOSED, NOT IMPLEMENTED. September 26, 2026. Extend Demon storage/evaluation and publish curated Site read models. Do not create another engine or duplicate Game Flow.

## Objective and current condition

Make strategies queryable, versioned, reproducible and capable of producing current candidates. Existing totals replay and market/history storage are foundations; the Site examples are not an executable strategy catalog.

## Entity and key contract

| Entity | Identity / contents | Integrity |
| --- | --- | --- |
| systems | system_id, tenant_id, name, sport, league, market family, scope, lifecycle | Stable identity; retire rather than delete referenced systems |
| system_versions | system_id + version, rule hash, feature schema, effective time, author | Immutable once used; new version for any rule change |
| system_rules | version_id + rule_id, typed predicate, exclusions | Allowlisted fields/operators; no arbitrary code/SQL |
| system_backtests | run_id, version_id, input manifest hashes, cutoff, execution version, status | Deterministic run key; held-out results separate from fitting |
| system_splits | run_id + dimension + value | Team/player/season/home-away/opponent/conference/surface/line-price ranges where supported |
| system_candidates | candidate_id, version_id, canonical event/player/market/selection, lifecycle | Unique qualification identity; tenant-consistent references |
| system_candidate_snapshots | snapshot_id, candidate_id, observed_at, expires_at, evidence hashes, rule trace, model/quote refs | Append-only; never overwrite pregame evidence |
| system_results | result_id, candidate_id, settlement source/time, result, stake, payout, revision | Corrections append and supersede; no silent result rewrite |
| system_performance | version/run/window, sample, W/L/P/void, units, ROI, interval method | Derived cache with input digest; independently rebuildable |
| external_system_signals | source/id, retrieved_at, source_reference, external system/rating/projection/probability/EV/line/price | Distinct external namespace; rights and retention contract required |

Use composite tenant/id references where tenant separation is needed. Public curated systems can be explicitly Runner-owned; personal watchlists and private drafts must not inherit public visibility.

## Rule format

Example structure is illustrative, not a profitable strategy or a production seed:

```json
{
  "schemaVersion": 1,
  "sport": "football",
  "league": "nfl",
  "marketFamily": "player_receptions",
  "scope": "player",
  "all": [{"field": "availability.status", "op": "eq", "value": "confirmed"}],
  "exclude": [{"field": "quote.state", "op": "neq", "value": "fresh"}]
}
```

Null/unknown values fail qualification with a reason. Define typed numeric/string/enumeration operators, finite bounds, maximum expression depth/count and deterministic ordering. Availability labels require source evidence, not inferred certainty. Hash normalized rule JSON with schema/version identifiers.

## Evaluation and accounting

Resolve canonical event/participant/market first. Select only evidence observed at or before the evaluation cutoff. Save lineage, rule trace, exclusions and unknown fields. Model output, market-implied probability, fair price and executable quote remain separate. No independent model or comparable fresh quote means no calculated Runner edge and no official publication.

Units and ROI require declared stake/payout/fee conventions and the same settled denominator. Wins/losses/pushes/voids are separate. Do not pool incompatible system versions. Confidence intervals and calibration require documented methods and minimum samples; return unavailable otherwise. Historical final scores without historical prices cannot establish historical ROI.

## Publication and receipts

Publish from a transactionally recorded outbox only after a capability-checked decision. Receipt captures immutable candidate/model/quote/evidence versions, decision time, countercase, uncertainty, publisher and approved destination. Unique publication keys prevent retry duplication. Append settlement corrections; expose original and superseding records. Personal tracker entries do not become official Runner receipts.

## Live and recovery

Reuse existing observations/state/totals/replay. Preserve pregame snapshot and append recalculations on supported material changes. Deduplicate provider event IDs; record ordering and late data policy. One evaluator per work item, leases with expiry and bounded retries. Persist before acknowledging. On crash, replay from checkpoint and verify output hashes.

## Dependencies and decisions

Accepted canonical IDs and history manifests; authorized market history; independent validated model; official settlement rules; price expiry and execution-cost policy; exact private/public ownership. Implement local additive migrations first. Stage backup/restore and forward recovery before any approved production application.

## Acceptance tests / evidence required

Duplicate and out-of-order ingest, unknown fields, malformed/deep rules, tenant-crossing references, concurrent qualification, repeat runs, cutoff leakage, version changes, push/void/correction accounting, stale quotes, unavailable models, interrupted publish, idempotent retries and restore. Require run manifest, hashes, rule trace, result reconciliation and Site consumer confirmation.


# Data-source matrix

September 26, 2026. Adapter existence is not live connectivity or a redistribution license. No credentials or production provider state were validated by this documentation pass.

| Source | Existing use | Status | Required evidence / next work |
| --- | --- | --- | --- |
| ESPN | Demon schedule discovery; Site game/team readers | PARTIAL; code inspected | Separate scheduled event time from retrieval/provider update time; canonical mappings; availability coverage |
| The Odds API | Site odds/props adapters and scheduled sync | PARTIAL; code inspected | Current response, quota, rights, last successful ingest; same-line comparison and stale expiry |
| Kalshi | Demon and Site prediction-market clients | PARTIAL; code inspected | Current bid/ask, quantity/fees, contract rules, market-event match and fresh timestamp |
| Polymarket | Existing Demon prediction-market client | PARTIAL; code inspected | Current connectivity, contract resolution, source identity, quantity and price age |
| Verse historical exports | Historical acquisition/import manifests | PARTIAL; prior artifacts exist | Recheck manifest hashes, import counts and consumer acceptance; market-price history is separate |
| Official leagues/teams | Intended authoritative facts/availability | UNVERIFIED source-specific coverage | Approved endpoints, timestamps, conflict policy and redistribution terms |
| Injury/role information | Product requirement | UNAVAILABLE as validated end-to-end feed | Provider contract and stale/missing behavior; no invented status |
| Weather | Product requirement | UNVERIFIED integration | Venue/time match, retrieval and forecast issue time, applicable sport model |
| BettingPros/other research | Functional reference only in this pass | NO DATA FEED CONNECTED | Authorized API/export terms; external fields stay attributed and separate |
| Runner model | Baseline implied values and totals heuristic exist | PARTIAL; not calibrated production output | Independent training/features/version, held-out calibration and supported markets |

## Mandatory envelope

source, source_reference, source_record_id, retrieved_at, source_updated_at when available, event_time, event_id, participant_id where applicable, market_id/selection/line/period where applicable, raw_value, normalized_value, normalization_version, freshness_state, expires_at and content hash. Preserve raw evidence under source retention/rights limits.

Distinguish DATA UNAVAILABLE, SOURCE OFFLINE, STALE, MODEL NOT RUN and PRICE UNVERIFIED. A successful request is insufficient if records are old, mismatched, suspended or incomplete. Never turn missing values into zero or old quotes into executable prices.

Adapters remain modular. Production acceptance needs an actual successful current response, error/rate-limit/retry behavior, source timestamp checks, canonical mapping tests and end-to-end publication/read validation.


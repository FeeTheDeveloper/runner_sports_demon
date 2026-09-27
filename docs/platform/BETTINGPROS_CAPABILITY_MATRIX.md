# Reference capability matrix

September 26, 2026. Evidence URLs and page observations: [reference architecture](BETTINGPROS_REFERENCE_ARCHITECTURE.md). OBSERVED means visible public surface inspected, not validated proprietary computation.

| ID | Capability | Reference evidence | Coverage | Runner acceptance |
| --- | --- | --- | --- | --- |
| C01 | Sport and period context | Home, sport, slate controls | OBSERVED | Context survives navigation and copied URL |
| C02 | Search and filtered discovery | Props, odds, trends | OBSERVED | Combined filters, reset, no-results and query validation |
| C03 | Research cross-links | System qualifier -> player -> game | OBSERVED | Canonical IDs; no name-only match |
| C04 | Sortable system directory | Systems table | OBSERVED; premium limited | Stable pagination and explicit sample/period |
| C05 | System definition and performance | Detail rules and windows | OBSERVED; premium limited | Immutable rule version; honest denominator and cutoff |
| C06 | Current qualifiers | Upcoming/settled cards | OBSERVED; limited public rows | Stored qualification snapshot, status and expiry |
| C07 | Player history and prop analysis | Analyzer windows and graph | OBSERVED | Real logs, supported stats, no future information leakage |
| C08 | Independent projection vs line | Analyzer/projection pages | OBSERVED; some values locked | Independent model provenance; MODEL NOT RUN fallback |
| C09 | Consensus and market comparison | Analyzer/odds | OBSERVED | Same event/selection/line/period and timestamp |
| C10 | Trends | Streak controls | OBSERVED | Threshold, sample and uncertainty visible |
| C11 | Rankings | Accuracy table | OBSERVED | Deterministic settlement and return calculation |
| C12 | Account and follows | Menu/follow controls | AFFORDANCE ONLY | Authenticated owner scope and revocation |
| C13 | Mobile navigation/research | Viewport attempt | UNVERIFIED | 390/320px, touch, keyboard, overflow checks |
| C14 | All filter and tab behavior | Controls inspected | PARTIAL | Exercise state, reset, deep links, empty/error cases |
| C15 | Live game intelligence | Not established in reference audit | NOT VERIFIED | Reuse Runner Game Flow; supported-feed freshness |
| C16 | Permanent publication receipts | Not established in reference audit | NOT VERIFIED | Runner-owned immutable publication and correction chain |

No reference performance statistics establish Runner accuracy. External ratings/projections require separate authorized data contracts before ingestion.


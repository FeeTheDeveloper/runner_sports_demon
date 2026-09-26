# Runner data spine

Verified locally on 2026-09-26. SQLite remains the authoritative engine store; these versioned artifacts provide provenance, validation and reusable content alongside it.

## Paths and contracts

- `contracts/runner-data-contract.json`: strict JSON Schema 2020-12 for metadata and normalized research records.
- `contracts/runner-content-card.schema.json`: strict card schema with the eight Runner analysis sections.
- `data/fixtures/operations.json`: eight synthetic NFL/NCAAF schedule, market, observation and model records.
- `data/normalized/operations.json`: normalized fixture example.
- `data/snapshots/historical-state.json`: internal historical local-state summary; receipt refers to the old provider receipt, not the inspection date.
- `data/content/cards.json` and `cards.md`: twenty fixture shells: pregame, halftime, game total, team total, rushing prop, receiving prop, countercase, recap, live desk and schedule for both sports.
- `data/manifests/operations.json`: artifact metadata plus SHA-256 file inventory. Text files use LF through .gitattributes for reproducibility.
- `data/manifests/ingestion.jsonl`: original hashes/retrieval evidence plus explicit historical metadata for eleven existing 2016–2026 nflverse season files. A season contains many games; aggregate identifiers are explicitly scoped, eventStartTime is null, and per-game dates remain inside parquet. Redistribution remains UNKNOWN pending license review; raw history is not served by the content API.

Every operations record carries event identity, sport/league, source/provider, retrieval time, eventStartTime (nullable when unknown), transformVersion, freshness, confidence and redistribution. Fixture retrievedAt is authorship time, explicitly disclosed in source. Existing legacy raw-season envelopes preserve their original field names as well as these common provenance fields.

Ajv and ajv-formats validate actual instances and dates. The legacy contract validator additionally checks twelve schema metadata records; `npm run data:validate` validates operations data/cards and all inventory/season hashes. See [Ajv schema support](https://ajv.js.org/json-schema.html) and [format validation](https://ajv.js.org/guide/formats.html).

## Freshness and analytical meaning

Receipt age is CURRENT for at most 90 seconds (market operations), RECENT through 24 hours, then HISTORICAL. Schedule receipt uses 300 seconds. Missing, invalid or future timestamps are UNKNOWN. FIXTURE, HISTORICAL and UNKNOWN declarations never upgrade because a file was reread or a response was generated. No REST receipt automatically establishes LIVE status. Totals/observations use 15-second current limits; existing model suppression rules still apply.

generatedAt describes response creation; retrievedAt describes source receipt. Legacy ESPN sourceTimestamp is kickoff, so the API explicitly names that limitation and uses receivedTimestamp for receipt freshness. An empty schedule cannot establish game-data freshness and returns UNKNOWN. Provider-update freshness is not proven by HTTP receipt alone.

Model probability, market probability, fair price, executable price and edge are separate nullable fields. UNKNOWN/INFERENCE records cannot assert a proprietary model probability, fair price or edge. MODEL_OUTPUT requires model file/version/input/output references; schema validity alone does not prove model execution, calibration or truth. Operators must inspect those references before publication. Current content shells assert no proprietary result and contain no numerical estimates.

## Provider operations matrix

The following is the implemented local contract, not a claim of current provider entitlement or permission to redistribute.

| Provider | Env names | Data / storage | Freshness limit | Verification | Failure behavior |
|---|---|---|---|---|---|
| ESPN | Optional ESPN_NFL_SCOREBOARD_URL, ESPN_CFB_SCOREBOARD_URL; legacy ESPN_SCOREBOARD_URL | NFL/CFB schedule and scores; dashboard memory, engine SQLite when store supplied | 300s receipt; game-state decisions 15s | GET /schedule/nfl?date=YYYY-MM-DD or /schedule/cfb?date=YYYY-MM-DD | 502, UNKNOWN, sanitized error; no fabricated fallback |
| Kalshi | KALSHI_API_KEY_ID + KALSHI_PRIVATE_KEY_BASE64; legacy KALSHI_API_KEY + KALSHI_API_SECRET; KALSHI_REST_BASE, KALSHI_WS_URL | Prediction-market observations in local SQLite; curated allowed outputs only | 90s receipt; stricter model gates apply | Local-only one-pass ingest below, then GET /control/status and /markets/snapshot | Health/error flag and stale warnings; old records keep old receipt times |
| Polymarket | RUNNER_ENABLE_POLYMARKET=false default; POLYMARKET_GAMMA_BASE, POLYMARKET_CLOB_WS_URL; optional POLYMARKET_API_KEY | Optional public discovery, local SQLite; no execution | 90s | Explicitly enable only when intended, then same ingest/status checks | Disabled normally; errors visible without promoting cached prices |
| Odds API | ODDS_API_KEY; ODDS_API_BASE, ODDS_API_REGIONS, ODDS_API_MARKETS | Credential-gated NFL market polling in SQLite; licensed raw responses stay local | 90s receipt; source timestamp remains available | Key presence enables connector on one-pass ingest; inspect provider health | Missing key omits connector; request failures reported, no synthetic odds |
| User CSV/JSON exports | None | Normalize locally to runner.data.v1 arrays; unreviewed files in ignored exports/ | Preserve export/provider receipt; old >24h is HISTORICAL, manual unknown is UNKNOWN | npm run operations -- validate-file exports/normalized.json | Reject invalid schema; validation does not import into SQLite or authorize publication |
| ScraperAPI / ad hoc | SCRAPERAPI_KEY local only | Research-only normalized allowed outputs in ignored exports/ until reviewed | Preserve original source time; do not reset age on transformation | No Demon scraper adapter; validate normalized JSON with the same command | BLOCKED until provider terms, usage/robots and rate limits are reviewed; no automatic scraping |

Kalshi code supports optional signing for discovery; authenticated operation remains unverified here. Possessing credentials or receiving public discovery data does not prove authenticated access. Source licensing is not established by this matrix.

Prefer official/provider APIs and authenticated user exports. CSV inputs require explicit column mapping into the JSON contract; arbitrary CSV is never silently imported. The existing SQLite import command accepts the engine's own export bundle, not arbitrary provider CSV. Never commit paid raw payloads, cookies, secrets, or UNKNOWN/RESTRICTED redistribution data as public examples.

## Runner Sports Plug operating policy

Apply RUNNER-GPT-LOCK-20260925-V1: verify changing facts; preserve unknowns and timestamps; classify fact/calculation/model/inference; keep sponsor/admin material separate from conclusions; invalidate after material game changes. King Fee is final authority. Runner owns intelligence; Fee The Developer owns technical production; Hutchrok coordinates administration.

The installed plugin supplies instructions, not a persistent process or scheduler. Codex/Claude/Copilot execute the same repository commands and record .runner work claims. API-only/dashboard starts run local services; they do not create autonomous agents. Public publishing, provider mutations, pushes and deployments follow the explicit action authorization in AGENTS.md.

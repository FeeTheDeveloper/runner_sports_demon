# Runner agent board — September 27, 2026

Thirty Runner agents are rostered under the Runner tenant. Each carries an **alias tag** drawn from *The Godfather*, *Heat* and *Casino*, and each alias doubles as the agent email name. No tag is a department name and no tag encodes what the agent does.

Duty is resolved **only here and in `.runner/agents/board.json`**. `.runner/agents/roster.json` holds the tag surface and deliberately carries no duty information; it points at this board by agent ID. Reading a tag, an address or the roster alone tells you nothing about assignment.

Roster order is alphabetical by alias, so ordinal position carries no duty meaning either. Duty IDs are intentionally out of order against that sequence.

## State

- Operations account of record: `AGT-RSA-REP-003` — `repo@werunsportsandanalytics.com` (see `docs/ops/RUNNER_WORKSPACE_ACCOUNT_AUDIT_2026-09-27.md`; its admin role is UNVERIFIED).
- Mailboxes provisioned by this record: **none**. Every address below is a proposed local part. Workspace provisioning is an owner action in the Admin console.
- Runtime agents started by this record: **none**. A duty is a documented lane of responsibility, not a running process, schedule or mailbox session.
- External-action eligibility: NOT_ENABLED for all thirty, matching the representative registry policy.

## Board — agent to duty

| ID | Alias tag | Source | Email name | Lane | Duty |
| --- | --- | --- | --- | --- | --- |
| AGT-RSA-OPS-001 | `BOSKO` | Heat | `bosko` | Modeling | D-15 — Model registry and manifest governance |
| AGT-RSA-OPS-002 | `BRASI` | The Godfather | `brasi` | Modeling | D-14 — Feature engineering |
| AGT-RSA-OPS-003 | `BREEDAN` | Heat | `breedan` | Delivery | D-24 — Content card generation |
| AGT-RSA-OPS-004 | `CASALS` | Heat | `casals` | Normalization | D-03 — Canonical event identity mapping |
| AGT-RSA-OPS-005 | `CHERITTO` | Heat | `cheritto` | Delivery | D-21 — Control API surface |
| AGT-RSA-OPS-006 | `CLEMENZA` | The Godfather | `clemenza` | Modeling | D-11 — Totals engine |
| AGT-RSA-OPS-007 | `DRUCKER` | Heat | `drucker` | Ingestion | D-06 — Kalshi venue ingestion |
| AGT-RSA-OPS-008 | `FREDO` | The Godfather | `fredo` | Signals | D-17 — Market reaction detection |
| AGT-RSA-OPS-009 | `GINGER` | Casino | `ginger` | Signals | D-19 — Suppression and false-positive control |
| AGT-RSA-OPS-010 | `HAGEN` | The Godfather | `hagen` | Ingestion | D-02 — Timestamp and latency integrity |
| AGT-RSA-OPS-011 | `HANNA` | Heat | `hanna` | Continuity | D-30 — Orchestration, claims and handoff reconciliation |
| AGT-RSA-OPS-012 | `LESTER` | Casino | `lester` | Modeling | D-13 — Vig removal and fair-price engine |
| AGT-RSA-OPS-013 | `MARINO` | Casino | `marino` | Delivery | D-22 — Dashboard and cockpit integration |
| AGT-RSA-OPS-014 | `MCCAULEY` | Heat | `mccauley` | Signals | D-18 — Signal generation |
| AGT-RSA-OPS-015 | `NANCE` | Casino | `nance` | Assurance | D-16 — Backtesting harness |
| AGT-RSA-OPS-016 | `NERI` | The Godfather | `neri` | Assurance | D-20 — Replay determinism |
| AGT-RSA-OPS-017 | `PENTANGELI` | The Godfather | `pentangeli` | Assurance | D-26 — Contract and schema validation |
| AGT-RSA-OPS-018 | `PISCANO` | Casino | `piscano` | Ingestion | D-01 — Live feed session health and reconnect integrity |
| AGT-RSA-OPS-019 | `REMO` | Casino | `remo` | Normalization | D-04 — Market snapshot normalization |
| AGT-RSA-OPS-020 | `ROTHSTEIN` | Casino | `rothstein` | Modeling | D-10 — Calibration and reliability |
| AGT-RSA-OPS-021 | `SANTORO` | Casino | `santoro` | Assurance | D-28 — Security boundaries and secret hygiene |
| AGT-RSA-OPS-022 | `SHERBERT` | Casino | `sherbert` | Ingestion | D-07 — Polymarket venue ingestion |
| AGT-RSA-OPS-023 | `SHIHERLIS` | Heat | `shiherlis` | Assurance | D-27 — QA and release gating |
| AGT-RSA-OPS-024 | `SONNY` | The Godfather | `sonny` | Delivery | D-23 — Site publishing contract |
| AGT-RSA-OPS-025 | `TESSIO` | The Godfather | `tessio` | Ingestion | D-05 — Odds API ingestion |
| AGT-RSA-OPS-026 | `TOMMASINO` | The Godfather | `tommasino` | Ingestion | D-08 — Historical backfill and archive integrity |
| AGT-RSA-OPS-027 | `TREJO` | Heat | `trejo` | Modeling | D-12 — Game-flow and adversity modeling |
| AGT-RSA-OPS-028 | `VITO` | The Godfather | `vito` | Continuity | D-29 — Documentation and AI-sync continuity |
| AGT-RSA-OPS-029 | `WAINGRO` | Heat | `waingro` | Modeling | D-09 — Probability model maintenance |
| AGT-RSA-OPS-030 | `WEBB` | Casino | `webb` | Delivery | D-25 — Observability and alerting |

## Lanes

- **Ingestion** (6): `DRUCKER`, `HAGEN`, `PISCANO`, `SHERBERT`, `TESSIO`, `TOMMASINO`
- **Normalization** (2): `CASALS`, `REMO`
- **Modeling** (7): `BOSKO`, `BRASI`, `CLEMENZA`, `LESTER`, `ROTHSTEIN`, `TREJO`, `WAINGRO`
- **Signals** (3): `FREDO`, `GINGER`, `MCCAULEY`
- **Delivery** (5): `BREEDAN`, `CHERITTO`, `MARINO`, `SONNY`, `WEBB`
- **Assurance** (5): `NANCE`, `NERI`, `PENTANGELI`, `SANTORO`, `SHIHERLIS`
- **Continuity** (2): `HANNA`, `VITO`

## Primary surfaces

| ID | Alias tag | Primary surfaces |
| --- | --- | --- |
| AGT-RSA-OPS-001 | `BOSKO` | `MODEL_REGISTRY.json`, `MODEL_REGISTRY.md`, `contracts/model-manifest.schema.json` |
| AGT-RSA-OPS-002 | `BRASI` | `src/models`, `contracts/feature-manifest.schema.json` |
| AGT-RSA-OPS-003 | `BREEDAN` | `src/publishing`, `contracts/runner-content-card.schema.json` |
| AGT-RSA-OPS-004 | `CASALS` | `src/games`, `contracts/runner-event.schema.json` |
| AGT-RSA-OPS-005 | `CHERITTO` | `src/api` |
| AGT-RSA-OPS-006 | `CLEMENZA` | `src/totals`, `TOTALS_ENGINE.md` |
| AGT-RSA-OPS-007 | `DRUCKER` | `src/connectors` |
| AGT-RSA-OPS-008 | `FREDO` | `src/intel` |
| AGT-RSA-OPS-009 | `GINGER` | `src/signals`, `SIGNAL_REGISTRY.md` |
| AGT-RSA-OPS-010 | `HAGEN` | `src/ingestion.ts`, `src/state` |
| AGT-RSA-OPS-011 | `HANNA` | `.runner/work`, `.runner/handoffs` |
| AGT-RSA-OPS-012 | `LESTER` | `src/models` |
| AGT-RSA-OPS-013 | `MARINO` | `src/dashboard`, `assets/dashboard` |
| AGT-RSA-OPS-014 | `MCCAULEY` | `src/signals` |
| AGT-RSA-OPS-015 | `NANCE` | `BACKTESTING.md`, `src/tests` |
| AGT-RSA-OPS-016 | `NERI` | `src/state`, `src/storage` |
| AGT-RSA-OPS-017 | `PENTANGELI` | `contracts`, `scripts/validate-runner-contracts.mjs` |
| AGT-RSA-OPS-018 | `PISCANO` | `src/connectors`, `src/ingestion.ts` |
| AGT-RSA-OPS-019 | `REMO` | `src/normalization`, `contracts/market-snapshot.schema.json` |
| AGT-RSA-OPS-020 | `ROTHSTEIN` | `src/models`, `MODEL_NOTES.md` |
| AGT-RSA-OPS-021 | `SANTORO` | `.env.example`, `docs/ai-sync/SECURITY_BOUNDARIES.md` |
| AGT-RSA-OPS-022 | `SHERBERT` | `src/connectors` |
| AGT-RSA-OPS-023 | `SHIHERLIS` | `src/tests`, `docs/ai-sync/TESTING_STATUS.md` |
| AGT-RSA-OPS-024 | `SONNY` | `src/publishing`, `contracts/site-publish.schema.json` |
| AGT-RSA-OPS-025 | `TESSIO` | `src/connectors` |
| AGT-RSA-OPS-026 | `TOMMASINO` | `HISTORICAL_DATA_WORKFLOW.md`, `src/storage` |
| AGT-RSA-OPS-027 | `TREJO` | `src/game-flow`, `src/adversity` |
| AGT-RSA-OPS-028 | `VITO` | `docs/ai-sync` |
| AGT-RSA-OPS-029 | `WAINGRO` | `src/models` |
| AGT-RSA-OPS-030 | `WEBB` | `src/operations`, `src/utils` |

## Rules

1. An alias never gains duty meaning. If a duty moves, change the board row, not the tag.
2. An email address is never authentication or approval. Bindings resolve only from a confirmed registry entry, per `.runner/agents/README.md`.
3. Provisioning a mailbox for an alias requires owner action plus a confirmed binding recorded in the roster. Until then `mailbox_state` stays `NOT_PROVISIONED`.
4. Granting any external capability to an alias requires the action-specific authorization defined in `docs/ai-sync/SECURITY_BOUNDARIES.md`. `granted_external_capabilities` stays empty by default.
5. Adding an agent requires a distinct stable ID, a distinct non-duty alias, and a board row. Registration never inherits another agent’s session or authority.

## Rollback

Delete `.runner/agents/roster.json`, `.runner/agents/board.json` and this record, and revert the roster references in `.runner/agents/README.md`. No provider rollback is needed because no provider mutation occurred.

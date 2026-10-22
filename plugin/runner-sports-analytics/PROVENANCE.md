# Provenance

## This plugin

- Name: `runner-sports-analytics`
- Version: 0.1.1 (0.1.0 built 2026-10-15; 0.1.1 adds `runner-sports-flow-studio`, 2026-10-22)
- Owner/publisher: Runner Sports & Analytics LLC
- Built: 2026-10-15
- Built by: Claude (Fee The Developer engineering assignment) under King Fee's direction
- Source-controlled home (from 0.1.1): `FeeTheDeveloper/runner_sports_demon` → `plugin/runner-sports-analytics/`, placed on King Fee's direction on 2026-10-22. Before that the plugin existed only as the account-installed package.

## Derived from

| Field | Value |
| --- | --- |
| Source package | `runner-sports` Claude desktop/Code export, version `0.1.4+bundle.multisport-research` |
| Source publisher | Plays Ranch Programming Corporation LLC (private owner export) |
| Upstream origin | ChatGPT/Codex plugin `plugin_8a59febd6acc8191a42345cc00ee8820`, release `pluginrel_6ac1ba431c6c8191aa3ce68b8814e580` (2026-10-04) |
| Upstream archive SHA-256 | `979006d488f45d027fcaa681cae84cac6796b82ed3eb6726c3c399b5582b0d0e` |
| Source author credit | Alfreddie Postell |

## Skill lineage

| This plugin | Source | Change |
| --- | --- | --- |
| `intelligence-desk` | `instructions` | Rewritten as a Claude-native governing skill with explicit trigger phrases and operating-term routing. LOCK and go-live references carried verbatim. |
| `slate-research` | `runner-market-research` | Export-adapter header removed; companion paths updated; MLB added to the coverage matrix (site and go-live plan both cover it). |
| `live-desk` | new | Built from LOCK §11 (Game Flow Intelligence), §12 (LIVE DESK / QUICK FLIP / RUNNER RECEIPT), and the owner's totals, game-flow, and alerts priorities. |
| `media-research` | `runner-youtube-research` | Export-adapter header removed; companion paths updated. |
| `engineering-handoff` | new | Built from LOCK §4, §16, §17, §18, §19, the go-live plan, and the owner's engineering operating instructions. |
| `campaign-director` | `flow-campaign-director` | Scoped to Runner Sports & Analytics only; other-company brand profiles removed for entity separation; LOCK §15 creative system merged into the Runner brand reference. Veo, Flow Music, and dashboard references carried over. 0.1.1: one additive companion-pointer paragraph to `runner-sports-flow-studio`. |
| `runner-sports-flow-studio` | FTD Google Flow / Flow Music portfolio handoff, 2026-10-22 (`runner-sports-flow-skill-handoff.zip`, SKILL.md sha256 `d2e82a45baef808eca4ec3b33d9af7072383b58125987953184454231658a2b5`) | Merged with verified repository identities (both Runner repositories public; no proprietary output or unreleased media committed), explicit `intelligence-desk` load and relative reference paths into `campaign-director`, kit precedence and status mapping, approval and no-tout wording, official Google Flow model and credit pages, and a dated docs-only verification note. Passed a fresh-context invocation test (C1–C8) before merge. |

## Removed from the source package

- `skills/instructions/agents/openai.yaml` (ChatGPT interface metadata; not used by Claude)
- `skills/instructions/lookup/knowledge-index.json` (ChatGPT lookup index; references are read directly)
- `assets/gpt-icon.png` (Claude plugins do not render an icon)
- `provenance/` source manifests (summarized here instead)
- Per-skill "Claude private-export adapter" headers (replaced by `OWNERSHIP-NOTICE.md`)

## Integrity

`SHA256SUMS` at the plugin root lists the SHA-256 of every packaged file. Regenerate it after any edit:

    cd <plugin-root> && find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS

Runtime behavior was not exercised in the build environment; static structure checks only.

### 0.1.1 checksum note

When the 0.1.0 package was read back from the installed Claude plugin on 2026-10-22, `sha256sum -c SHA256SUMS` failed for every `skills/*/SKILL.md` (the references, README, notices and manifest matched). The cause was not determined (post-build edit or platform rewrite on sync). The 0.1.1 tree was seeded from that installed content as-is, and `SHA256SUMS` was regenerated from it with the command above; 0.1.1 is therefore the first version whose checksums are verifiable from source control.

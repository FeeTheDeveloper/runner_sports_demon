# BettingPros browser research handoff

The canonical skill is `.claude/skills/bettingpros-browser-research/SKILL.md`. Runner Sports Plug packages a copy. This on-demand workflow uses the owner's interactive BettingPros session for selected internal research; it does not connect BettingPros to Demon ingestion, authorize automated extraction, or publish Premium content.

## Plugin review artifact

The local review bundle `.ai/local/runner-sports-plug-0.1.4-review.zip` was prepared from the installed Runner Sports Plug `0.1.3+bundle.multisport-research` bundle, with the two canonical skills added, Autopilot's `host-workspace-operator` included, and package version `0.1.4+bundle.browser-combo`. Existing plugin instructions were preserved; only their frontmatter was normalized for package validation. The SHA256 of the deterministic two-build result is `c0ddbacb95c7a8310db637a498a2e385e6eac971a3d9b2f3e688bcb1d0a14376`. The bundle is local and reviewable; it has not been installed, submitted, or published. The stock Autopilot directory-descriptor validator is unsupported on this Windows host, so an isolated local copy used a directory-identity fallback and the extracted package was validated again. Public distribution review remains separate.

## Private packet

Stage one focused JSON object in ignored `.ai/local/`, then run:

```text
node scripts/validate-bettingpros-packet.mjs validate .ai/local/bp-packet.json
node scripts/validate-bettingpros-packet.mjs save .ai/local/bp-packet.json
node scripts/validate-bettingpros-packet.mjs validate-dir
```

`save` creates `.runner/research/bettingpros/<packet_id>.json` without overwriting an existing packet. Both directories are ignored by Git. A duplicate packet ID fails. Saved packets are private, local reference evidence, not engine market snapshots, Runner model inputs, Site data, or verified executable prices.

The exact packet shape is:

```json
{
  "schema_version": "runner.bettingpros-browser.v1",
  "packet_id": "bp-synthetic-nfl-example-1",
  "captured_at": "2026-10-02T18:00:00Z",
  "source": {
    "platform": "BettingPros",
    "url": "https://www.bettingpros.com/nfl/props/",
    "capture_method": "interactive_browser",
    "account_verified": true,
    "quote_at": null,
    "quote_time_basis": "NOT_SHOWN"
  },
  "event": {
    "kind": "PLAYER",
    "runner_event_id": "RUNNER:NFL:2026-10-04:AAA:BBB",
    "label": "SYNTHETIC AAA at BBB",
    "scheduled_start_utc": "2026-10-04T17:00:00Z",
    "player": {
      "name": "Synthetic Player",
      "team": "AAA",
      "profile_url": "https://www.bettingpros.com/nfl/props/"
    }
  },
  "market": {
    "type": "receptions",
    "period": "FULL_GAME",
    "selection": "OVER",
    "line": 4.5,
    "settlement": "UNVERIFIED"
  },
  "observation": {
    "feature": "ALT_LINE",
    "feature_state": "ACCESSIBLE",
    "finding": "Synthetic example: alternate-line control was visible.",
    "uncertainty": "No source quote timestamp or executable offer verified.",
    "quote_status": "UNVERIFIED",
    "attribution": "BETTINGPROS",
    "runner_model_output": false
  },
  "comparison": { "status": "UNAVAILABLE", "sources": [] },
  "rights": { "class": "REFERENCE_ONLY", "model_input_approved": false, "publishable": false }
}
```

The example is synthetic and must not be saved as a real observation. Use an actual canonical event ID verified against Runner schedules. A player packet needs the current player name, team, and page URL. `quote_at` is UTC only when the source visibly provides a quote time; otherwise leave it null. `captured_at` is browser observation time and never establishes quote freshness. `comparison.sources` contains independently observed official/provider URLs only when `comparison.status` is `VERIFIED`.

The validator enforces shape, source provenance, canonical identity, timestamp basis, rights, and duplicate IDs. It cannot prove that text was truly observed, that the account has Premium access, that the provider permits storage of a particular detail, or that an independent source is accurate. The researcher must verify those points and keep findings concise. Do not paste proprietary tables, long Sharp AI output, or account-private records into packets.

For combo worksheets, use `.claude/skills/runner-combo-research/SKILL.md` and ignored `.runner/research/combos/`. A worksheet is a research artifact and has no order-entry path.

## Browser verification, 2026-10-02

The connected Chrome session displayed the `Runner Sports & Analytics LLC` account on BettingPros. The NFL spread board exposed Game Lines, Player Props, a Spread selector, a Full Game selector, search, and book columns. A selected Bijan Robinson receptions page showed its consensus line and an alternate-line control; one decrement changed the displayed alternate threshold from 4.5 to 4.0. The Location analysis filter expanded to Home/Away options. Sharp AI opened a signed-in panel, but no prompt was sent. `/smart/` redirected to `/prediction-markets/smart-money/`, and `/systems/` displayed the Systems Directory. These checks establish navigation and visible controls only. They do not establish a licensed feed, full Premium board access, source quote freshness, an executable offer, or a valid Runner edge.

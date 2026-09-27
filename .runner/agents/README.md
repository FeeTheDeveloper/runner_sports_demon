# Runner representatives

`representatives.json` is the canonical local list for the owner's Runner representatives and registered Runner accounts. Their `.github/agents` files make the profiles discoverable alongside the existing repository agents. All cover Demon and Site; none is permanently assigned to only one repository. These files register profiles, not running agents.

| ID | Display name | Scope | Google connection |
| --- | --- | --- | --- |
| AGT-RSA-REP-001 | Deezy P | Demon and Site | Not connected; address confirmation pending |
| AGT-RSA-REP-002 | Kendra A | Demon and Site | Not connected; address confirmation pending |
| AGT-RSA-REP-003 | Repo Boss | Demon and Site | Not connected; Workspace account active, admin role unverified |

The owner requests that representative work originate in this Codex session/control center. A future action adapter must validate the actual provider identity, entity, capability and target; record the owner request and result; deduplicate retries; and expose revocation. Do not infer delegated email authority from this registry. Current Gmail access is the CEO mailbox, not any representative's mailbox.

The FTD OS registry inspected on September 26 enforces `@feethedeveloper.com` identities and remains unchanged. Runner representatives belong to the Runner tenant. Reuse its explicit identity/controller/capability/lifecycle concepts without inserting Runner users into FTD's tenant or weakening its schema.

Portraits stay unmapped until the owner assigns them. The credential-bearing account screenshot must not enter Git or public assets. Store no passwords, activation URLs, tokens, mailbox bodies or other credential material here.

More representatives can be added with distinct stable IDs, confirmed corporate email bindings and explicit capability scope. Registration never inherits another representative's session or authority.

## Repo Boss account record

`AGT-RSA-REP-003` registers the existing Workspace account `repo@werunsportsandanalytics.com` as the Runner repository operations account of record. Registration is a repository record, not a connection. The account is Active and has signed in, but its **admin role is UNVERIFIED** — the Admin roles and privileges card was not present in the capture that established this record. Do not assume Super Admin or any delegated role, and do not plan work that depends on admin capability until the owner confirms it. The temporary password still requires reset and 2-Step Verification is unconfirmed.

## Alias roster and duty board

`roster.json` lists thirty Runner agents (`AGT-RSA-OPS-001` … `AGT-RSA-OPS-030`). Each carries an alias tag from *The Godfather*, *Heat* or *Casino* that doubles as the agent email name. Tags are never department names and never encode duty.

`board.json` is the only record that resolves an alias to a duty; `docs/ops/RUNNER_AGENT_BOARD_2026-09-27.md` is its readable form. Keep the split intact: if a duty moves, edit the board row, never the tag. Roster order is alphabetical by alias so ordinal position leaks nothing either.

None of the thirty addresses exist in Google Workspace as a result of these files. `mailbox_state` is `NOT_PROVISIONED` for all thirty and provisioning is an owner action in the Admin console. A duty on the board is a documented lane of responsibility, not a running agent, schedule or mailbox session. External capabilities stay empty until authorized per `docs/ai-sync/SECURITY_BOUNDARIES.md`.

Evidence and pending decisions: `docs/ops/RUNNER_REPRESENTATIVES_2026-09-26.md`, `docs/ops/RUNNER_WORKSPACE_ACCOUNT_AUDIT_2026-09-27.md`, `docs/ops/RUNNER_AGENT_BOARD_2026-09-27.md`.

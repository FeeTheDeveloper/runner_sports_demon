# Testing status

Executed locally on 2026-09-16, Windows PowerShell, Node 24.13.0, npm 11.6.2. Existing dependencies and sqlite3 executable were available; no dependency reinstall was required.

| Check | Result | Scope |
|---|---|---|
| `npm run build` | PASS | Strict TypeScript compilation |
| `npm test` | PASS | Build plus ten compiled assertion-based test programs |
| `npm run contracts:validate` | PASS | Ten contract files and five handoffs; structural metadata checks, not full JSON Schema instance validation |
| `npm run system:validate` | PASS | Demon/Verse/Site Git checkout presence; Verse has no package.json, expected for a non-Node repository; no sibling build performed |
| Documentation/ignore review | PASS | All fourteen requested files exist, relative Markdown links resolve, claim JSON parses, `.ai/local/` is ignored, and `git diff --check` passes |

Test programs cover normalization, probability, game flow, games, totals, totals engine/replay, Site publishing, vig, adversity, and historical schema. Site publisher tests replace fetch with a mock. Passing tests do not prove live API/provider connectivity, credentials, complete persistence recovery, API auth/CORS end-to-end behavior, calibrated models or deployed operation.

CI configuration in `.github/workflows/ci.yml` uses Ubuntu with Node 22, installs sqlite3, and runs `npm ci`, build and tests. This local result uses Node 24; no current remote CI result was retrieved.

This bootstrap changes documentation, ignore rules and environment-example comments/entries only. No new runtime tests were added. Live services, history imports, cloud publishing, Drive tasks and sibling builds were not run. Online dependency vulnerability scanning was not part of this audit.

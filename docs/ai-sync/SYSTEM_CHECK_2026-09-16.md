# System check and test task

Executed September 16, 2026, approximately 9:26 PM America/Chicago (September 17, 02:26 UTC).

Result: local control dashboard and automated checks pass. Fresh market ingestion is not established; recorded market-provider telemetry is stale.

| Check | Result | Evidence |
|---|---|---|
| Dashboard hosting | PASS | HTTP 200 at `http://127.0.0.1:8790`; bound to IPv4 loopback; `Cache-Control: no-store` |
| Runtime prerequisites | PASS | Node 24.13.0, npm 11.6.2, sqlite3 3.53.4 |
| Build and tests | PASS | `npm test` compiles TypeScript and runs all 13 test programs successfully |
| Contracts | PASS | Ten schema metadata records and five handoff records pass structural checks |
| Repository presence | PASS | Demon, Verse and Site checkouts present; sibling builds not executed |
| SQLite | PASS | Read-only `PRAGMA quick_check` returned `ok`; database readable |
| Saved data | VERIFIED | 1,413 markets; 38,532 market events; 38,532 price events; seven observations; zero totals windows |
| Provider freshness | STALE | Kalshi last message September 14 at 00:41 UTC; Polymarket September 9 at 16:03 UTC |
| Engine API | NOT LISTENING | No listener on port 8787; dashboard is in local snapshot mode. This does not prove that no other ingestion process exists. |
| Models | RESEARCH | Three registry entries; football totals uncalibrated, market-implied baseline non-production, historical fusion awaiting implementation |
| Working tree | EXISTING CHANGES | Dashboard work remains on `feature/local-control-dashboard`; existing changes preserved |

## Test task: retrieve an NFL slate

Requested the September 17 NFL schedule through `GET /schedule/nfl?date=2026-09-17` on the running local dashboard. The canonical command router also successfully mapped `RUNNER SLATE NFL TODAY` to its slate prompt; command routing itself is not execution, so the actual task was then performed through the API with the explicit date.

- Result: PASS, HTTP 200; one game returned by ESPN.
- Matchup: Detroit Lions at Buffalo Bills.
- Status returned: scheduled.
- Kickoff: September 17, 2026 at 7:15 PM America/Chicago; September 18 at 00:15 UTC.
- Canonical ID: `RUNNER:NFL:2026-09-18:DET:BUF`. Its date follows the implementation's UTC kickoff convention, explaining the difference from the selected Central calendar date.
- Provider response received: `2026-09-17T02:26:30.043Z`.
- Validated NFL/source identity, unique canonical IDs, required timestamps, fresh receipt time, selected Central calendar date, and unchanged saved engine counts before/after the request.
- Machine-readable result: `.ai/local/nfl-schedule-test-2026-09-17.json` (ignored local artifact).

This confirms the live ESPN schedule request path. It does not establish fresh Kalshi/Polymarket feeds, a calibrated prediction, model performance, or cloud publishing. Existing source-timestamp semantics remain a known limitation; freshness here refers to response receipt, not an independently verified provider update time. No trading, database import, cloud publication, or engine ingestion was started. Browser visuals were not inspected; the suite includes emitted-client interaction checks.

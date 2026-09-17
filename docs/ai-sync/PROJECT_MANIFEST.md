# Project manifest

Last verified: 2026-09-16. Source baseline: `ae89200` (`Runner update`).

| Field | Verified value / evidence |
|---|---|
| Project / purpose | Runner Sports Demon: local-first sports and market intelligence |
| Repository | `FeeTheDeveloper/runner_sports_demon`; origin `https://github.com/FeeTheDeveloper/runner_sports_demon.git` |
| Organization | Hutchrok Solutions Group LLC; technical division Fee The Developer; final owner authority King Fee (owner request) |
| Business association | Runner Sports & Analytics; no separate client verified |
| Branch | Session began on `release/runner-production`; bootstrap branch `docs/ai-sync-bootstrap` |
| Languages | TypeScript, SQL, JavaScript tooling; Python ingestion and PowerShell sync helpers |
| Runtime / package manager | Node >=22, npm, committed lockfile v3; local Node 24.13.0 / npm 11.6.2 |
| Framework / dependencies | Native Node HTTP, `ws` 8.21.0; TypeScript 5.9.2; no web application framework |
| Entry points | `src/cli.ts` -> `dist/cli.js`; `runner-scout` and `runner` binaries; `src/api/server.ts` with CLI `--api` |
| Major services | REST market polling/cache, game discovery, Game Flow, totals runtime, dashboards, optional Site publisher |
| Database | System `sqlite3` CLI; `src/storage/schema.sql` and `sqlite.ts`; default `.runner-scout.db` |
| Cloud storage | Optional Runner Site Supabase via `src/publishing/sitePublisher.ts`; not Demon operational storage |
| Authentication | Bearer token for observation/totals POSTs; missing token configuration rejects requests; read routes unauthenticated; CORS opt-in |
| API boundaries | Health, markets, schedules/game views, observations, totals; generic live edges/signals and props are placeholders |
| Integrations | Kalshi REST, opt-in Polymarket REST, credential-gated NFL Odds API, ESPN NFL/CFB discovery, optional Supabase; Verse/history and Drive helpers |
| Tests | Ten compiled TypeScript test programs using Node assertions; fixture/mock checks; no separate test framework dependency |
| Build | `tsc -p tsconfig.json`, strict NodeNext modules, `src` -> `dist` |
| CI | `.github/workflows/ci.yml`: Ubuntu, Node 22, sqlite3, `npm ci`, build, tests on push/PR |
| Deployment | Local CLI execution documented; no tracked automated deployment target/configuration found; live deployment unknown |
| Domains | No production Demon domain verified; local API documented on port 8787; provider bases in `.env.example` |
| Environment categories | Local DB/polling, provider endpoints/credentials, publishing, API auth/CORS, Verse/Drive import-export, ad hoc research |
| Infrastructure / automation | GitHub Actions, `.vscode/tasks.json`, multi-root workspace, `scripts/`, `.github/agents`, `.github/prompts`, `.runner/` |
| Security-sensitive components | API writes, provider signing, Supabase service role, local env loading, imports, external publishing and Drive sync |
| Architectural boundaries | Connectors independent of model/UI; intelligence in Demon; history in Verse; presentation in Site; no auto-trading |
| Active objective | Complete owner-requested repository audit and shared AI continuity bootstrap |
| Blockers / follow-ups | Bootstrap complete; runtime/integration limitations in [BLOCKERS.md](BLOCKERS.md) |

`package.json` contains a localhost repository URL; Git origin above is the verified repository identity. This metadata mismatch is recorded rather than treated as a deployment endpoint. Versions describe the committed lockfile, not an online dependency-security assessment.

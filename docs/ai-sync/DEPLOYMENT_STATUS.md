# Deployment status

2026-09-26 local-only update: dashboard 8790 and API-only 8787 served the new operations routes. Port 3001 was not listening. No deployment or public Site acceptance was performed. [Evidence](../ops/MACHINE_STATE_2026-09-26.md).

## Three-repository local run — September 16, 2026, 9:37 PM Central

Engine/API running at `http://localhost:8787`, control center at `http://127.0.0.1:8790`, and Site at `http://localhost:3001`. Site homepage/health and Demon health/markets were verified. Verse is available as a working Python CLI with validated local warehouse access, not a persistent server. Engine cloud publishing remains disabled. [Local stack instructions](LOCAL_STACK.md) record process/log locations, hostname requirements, prerequisites and integration limits.

## Authorized local dashboard — 2026-09-16

Hosted at **http://127.0.0.1:8790** and verified with successful page/status HTTP responses. Started as a hidden local Node process; its PID and output logs are in `.ai/local/dashboard.pid`, `dashboard.stdout.log` and `dashboard.stderr.log`. These runtime files are ignored. This process lasts until stopped or the machine/session ends; no startup task was installed.

Restart from the repository with `npm run dashboard`; stop a foreground launch with Ctrl+C. The dashboard command does not start ingestion, database writes, cloud publishing or trading. The owner explicitly authorized local hosting. Remote deployment remains unperformed and requires separate authorization.

## Earlier infrastructure audit

Verified from tracked repository configuration on 2026-09-16. No production deployment state was queried.

- Documented target: local Node CLI/service with sqlite3; optional HTTP on port 8787 and curated publishing to Runner Site Supabase.
- Tracked CI: `.github/workflows/ci.yml` builds/tests on push and pull request. No deployment job, container manifest or platform deployment configuration was found in this checkout.
- No verified production Demon hostname, hosting platform, running process, remote release or current deployed commit is recorded by this audit. Local branch names and package repository metadata are not deployment evidence.
- Companion Site and Verse Git directories are present; their deployment/build/warehouse state was not validated. `CURRENT_INFRASTRUCTURE_AUDIT.md` is an earlier Site audit, not a current deployment receipt.
- Environment and operations are described in `.env.example`, `SETUP.md`, `DRIVE_SYNC.md` and existing scripts. Deployment needs an explicitly selected target and verification of credentials, auth/network exposure, feed timing, data retention and Site contracts.

No push, merge, deployment, publication, scheduled-task installation or production mutation was performed. Any such next action requires explicit authorization for that action under [SECURITY_BOUNDARIES.md](SECURITY_BOUNDARIES.md).

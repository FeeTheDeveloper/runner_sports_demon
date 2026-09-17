# Local three-repository workspace

Verified September 16, 2026, approximately 9:37 PM America/Chicago.

Opened `runner-sports-intelligence.code-workspace` in a new VS Code window. VS Code status confirms the workspace with Demon, Site and Verse folders. Existing working-tree changes were preserved.

| Component | Local execution | Verified result |
|---|---|---|
| Runner control center | `http://127.0.0.1:8790` | Running; saved data readable; fresh Kalshi telemetry visible |
| Demon engine/API | `http://localhost:8787` | Health HTTP 200; 250 Kalshi markets loaded in the active cache; polling updates local SQLite |
| Runner Site | `http://localhost:3001` | Homepage and `/api/health` return HTTP 200; service identity `runner-sports-site` |
| RSAA Verse | Python CLI and DuckDB batch jobs | CLI status runs; all 11 warehouse files readable; 2,777 games and 487,010 plays across 2016–2026; four Python tests pass |

Port 3000 was already occupied by another Next application and was left untouched. Site uses `--hostname localhost` to match Next/Clerk middleware URL normalization; binding it as `127.0.0.1` caused a self-proxy failure. No auth code was bypassed or changed.

Verse is a command-driven data project, with no implemented persistent web server. Its declared `python/requirements.txt` dependencies were installed after a missing `click` import blocked startup. The 2025 Demon export passes checksum/manifest validation for all six artifacts. CLI `validate` and `coverage` are stubs, so these were not presented as real validation. The actual verification used read-only warehouse queries, the Demon export validator, and `python -m pytest tests/test_2025_pipeline.py -q`. Optional legacy R tasks still require Rscript, which is unavailable on PATH.

## Restart commands

Open the shared workspace from Demon:

```powershell
code --new-window runner-sports-intelligence.code-workspace
```

Run each service in its own terminal. From Demon:

```powershell
$env:RUNNER_PUBLISH_ENABLED = 'false'
npm run scout -- start --api --port 8787
```

In another Demon terminal:

```powershell
npm run dashboard
```

From Site:

```powershell
npm run dev -- --hostname localhost --port 3001
```

From Verse:

```powershell
$env:PYTHONPATH = Join-Path (Get-Location) 'python'
python -m rsaa_verse.cli status
```

The launched background Node process IDs and stdout/stderr logs are in Demon's ignored `.ai/local/` under `engine`, `site`, and `dashboard` filenames. Foreground terminal launches stop with Ctrl+C; no startup task was installed.

## Integration boundaries

Demon's public Kalshi discovery works without authenticated credentials. Odds credentials are absent in Demon's local environment; Polymarket remains disabled by configuration and its older saved telemetry is stale. Cloud publishing was explicitly disabled in the engine process for this local run.

Site reads its configured Supabase data. Its documented `RUNNER_DEMON_API_URL` has no current implementation references; running both projects does not automatically connect Site to the local Demon API or publish fresh local data into Site. No cloud writes, deployment, trading, billing actions or Git pushes were performed.

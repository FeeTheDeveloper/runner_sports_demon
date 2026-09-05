# Runner Sports Demon — Google Drive Sync

## Local Drive root
The production Windows machine currently exposes the Runner Sports data warehouse through Google Drive Desktop at:

`I:\My Drive\Runner Sports & Analytics\01 Data Warehouse`

Override this per machine with `RUNNER_DRIVE_ROOT`; do not hard-code alternate machine paths into application logic.

## Direction
- Drive -> local: `00 VS Code Outbox - IMPORT TO LOCAL`
- Local -> Drive: `08 VS Code Inbox - EXPORT FROM LOCAL/00 Live Sync`
- Sync audit manifests: `08 VS Code Inbox - EXPORT FROM LOCAL/99 Sync Manifests`

Google Drive Desktop is responsible for cloud transport. Runner Demon reads/writes the locally mounted filesystem only. The live dashboard and intelligence engine must use the local database/API, not Drive as a real-time database.

## Manual validation
From the repository root in PowerShell:

```powershell
npm ci
npm run build
npm test
powershell -ExecutionPolicy Bypass -File .\scripts\runner-drive-sync.ps1 -Mode pull
powershell -ExecutionPolicy Bypass -File .\scripts\runner-drive-sync.ps1 -Mode push
```

## Install automatic bidirectional sync

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-drive-sync-task.ps1 -Minutes 5
```

The Windows Scheduled Task runs a cycle every five minutes by default. A cycle pulls import packages first and then publishes a timestamped database export plus sync manifest.

## Environment overrides

```env
RUNNER_DRIVE_ROOT=I:\My Drive\Runner Sports & Analytics\01 Data Warehouse
RUNNER_SCOUT_IMPORT_DIR=I:\My Drive\Runner Sports & Analytics\01 Data Warehouse\00 VS Code Outbox - IMPORT TO LOCAL
RUNNER_SCOUT_EXPORT_DIR=I:\My Drive\Runner Sports & Analytics\01 Data Warehouse\08 VS Code Inbox - EXPORT FROM LOCAL\00 Live Sync
RUNNER_LOCAL_IMPORT_STAGE=.runner-drive\inbox
```

Keep machine-specific values in local `.env`; never commit secrets.

## Shared-drive publication
The current connected Google account exposes `Runner Sports & Analytics` under My Drive rather than a Google Workspace Shared Drive. No Shared Drives are currently returned by the connected Drive account. When a Workspace Shared Drive is provisioned/synced locally, set `RUNNER_DRIVE_ROOT` to that mounted Shared Drive path; the worker does not need to change.

## Safety
- Imports require Runner export packages containing `manifest.json`.
- Existing import logic uses SQLite insert-or-replace semantics.
- Exports are timestamped instead of overwriting prior sessions.
- Google Drive is reporting/institutional memory; raw high-frequency market ingestion remains local.

param(
  [ValidateSet("pull","push","cycle")]
  [string]$Mode = "cycle"
)

$ErrorActionPreference = "Stop"

$DriveRoot = if ($env:RUNNER_DRIVE_ROOT) { $env:RUNNER_DRIVE_ROOT } else { "I:\My Drive\Runner Sports & Analytics\01 Data Warehouse" }
$ImportRoot = if ($env:RUNNER_SCOUT_IMPORT_DIR) { $env:RUNNER_SCOUT_IMPORT_DIR } else { Join-Path $DriveRoot "00 VS Code Outbox - IMPORT TO LOCAL" }
$ExportRoot = if ($env:RUNNER_SCOUT_EXPORT_DIR) { $env:RUNNER_SCOUT_EXPORT_DIR } else { Join-Path $DriveRoot "08 VS Code Inbox - EXPORT FROM LOCAL\00 Live Sync" }
$LocalInbox = if ($env:RUNNER_LOCAL_IMPORT_STAGE) { $env:RUNNER_LOCAL_IMPORT_STAGE } else { Join-Path (Get-Location) ".runner-drive\inbox" }
$ManifestRoot = Join-Path $DriveRoot "08 VS Code Inbox - EXPORT FROM LOCAL\99 Sync Manifests"

function Assert-Path([string]$Path, [string]$Label) {
  if (-not (Test-Path -LiteralPath $Path)) { throw "$Label not available: $Path" }
}

function Pull-RunnerDrive {
  Assert-Path $ImportRoot "Drive import folder"
  New-Item -ItemType Directory -Force -Path $LocalInbox | Out-Null
  robocopy $ImportRoot $LocalInbox /E /XO /FFT /R:2 /W:2 /NP /NFL /NDL | Out-Null
  if ($LASTEXITCODE -gt 7) { throw "Drive pull failed with robocopy exit code $LASTEXITCODE" }
  $manifests = Get-ChildItem -LiteralPath $LocalInbox -Filter manifest.json -Recurse -File | Sort-Object LastWriteTimeUtc
  foreach ($manifest in $manifests) {
    $sourceDir = $manifest.Directory.FullName
    npm run scout -- import $sourceDir
  }
}

function Push-RunnerDrive {
  Assert-Path $DriveRoot "Runner Drive root"
  New-Item -ItemType Directory -Force -Path $ExportRoot,$ManifestRoot | Out-Null
  $stamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH-mm-ss-fffZ")
  $target = Join-Path $ExportRoot $stamp
  npm run scout -- export $target
  $syncManifest = @{
    syncedAt = (Get-Date).ToUniversalTime().ToString("o")
    machine = $env:COMPUTERNAME
    repository = "FeeTheDeveloper/runner_sports_demon"
    exportPath = $target
    mode = $Mode
  } | ConvertTo-Json
  $syncManifest | Set-Content -LiteralPath (Join-Path $ManifestRoot "$stamp.json") -Encoding UTF8
}

switch ($Mode) {
  "pull" { Pull-RunnerDrive }
  "push" { Push-RunnerDrive }
  "cycle" { Pull-RunnerDrive; Push-RunnerDrive }
}

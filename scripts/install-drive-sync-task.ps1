param(
  [int]$Minutes = 5,
  [string]$TaskName = "Runner Sports Demon Drive Sync"
)

$ErrorActionPreference = "Stop"
$repo = (Get-Location).Path
$worker = Join-Path $repo "scripts\runner-drive-sync.ps1"
if (-not (Test-Path -LiteralPath $worker)) { throw "Run this from the runner_sports_demon repository root." }

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$worker`" -Mode cycle" -WorkingDirectory $repo
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes $Minutes)
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -MultipleInstances IgnoreNew
Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description "Bidirectional Runner Sports Demon intelligence sync between the local runtime and Google Drive Desktop." -Force | Out-Null
Write-Host "Installed '$TaskName' every $Minutes minute(s)."

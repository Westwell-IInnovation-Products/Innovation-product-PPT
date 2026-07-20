[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepositoryRoot,
  [string]$ContributionRoot = "$env:USERPROFILE\.codex\leander-contributions",
  [string]$Destination = "$env:USERPROFILE\.codex\skills\leander-ppt",
  [ValidateSet('stable', 'beta')][string]$UpdateChannel = 'stable',
  [ValidateRange(1, 20)][int]$MaxCandidates = 3,
  [string]$KillSwitchFile = "$env:USERPROFILE\.codex\leander-automation.disabled",
  [string]$AuditLog = "$env:USERPROFILE\.codex\leander-logs\team-sharing-audit.jsonl",
  [switch]$CreateDraftPullRequest,
  [switch]$SkipUpload,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath $RepositoryRoot).Path
$auditScript = Join-Path $repo 'team-sharing\scripts\audit-event.js'
if (Test-Path -LiteralPath $KillSwitchFile) {
  if (Test-Path -LiteralPath $auditScript) {
    & node $auditScript --log $AuditLog --event 'team-cycle' --status 'disabled' --details "Kill switch is present: $KillSwitchFile" | Out-Null
  }
  Write-Output 'AUTOMATION_STATUS=disabled'
  Write-Output "KILL_SWITCH_FILE=$KillSwitchFile"
  exit 0
}
if ($DryRun) {
  $count = 0
  if (Test-Path -LiteralPath $ContributionRoot) {
    $batchGuard = Join-Path $repo 'team-sharing\scripts\check-automation-batch.js'
    $batchJson = & node $batchGuard --root $ContributionRoot --max $MaxCandidates
    if ($LASTEXITCODE -ne 0) { throw "Dry-run candidate batch validation was blocked: $batchJson" }
    $count = ($batchJson | ConvertFrom-Json).count
  }
  Write-Output "UPLOAD_STATUS=dry-run"
  Write-Output "UNPUBLISHED_CANDIDATES=$count"
} elseif (-not $SkipUpload) {
  $sync = Join-Path $repo 'team-sharing\scripts\sync-scheduled.ps1'
  $arguments = @{ RepositoryRoot = $repo; ContributionRoot = $ContributionRoot; MaxCandidates = $MaxCandidates; AuditLog = $AuditLog }
  if ($CreateDraftPullRequest) { $arguments.CreateDraftPullRequest = $true }
  & $sync @arguments
  if ($LASTEXITCODE -ne 0) { throw 'Candidate upload cycle failed.' }
}

$updater = Join-Path $repo 'team-sharing\scripts\update-leander.ps1'
if ($DryRun) { & $updater -RepositoryRoot $repo -Destination $Destination -Channel $UpdateChannel -DryRun }
else { & $updater -RepositoryRoot $repo -Destination $Destination -Channel $UpdateChannel }
if ($LASTEXITCODE -ne 0) { throw 'Consumer update cycle failed.' }

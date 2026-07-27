[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepositoryRoot,
  [string]$ContributionRoot = "$env:USERPROFILE\.codex\iinnovation-products-ppt-contributions",
  [string]$Destination = "$env:USERPROFILE\.codex\skills\iinnovation-products-ppt",
  [ValidateSet('stable', 'beta')][string]$UpdateChannel = 'stable',
  [ValidateRange(1, 20)][int]$MaxCandidates = 3,
  [string]$KillSwitchFile = "$env:USERPROFILE\.codex\iinnovation-products-ppt-automation.disabled",
  [string]$AuditLog = "$env:USERPROFILE\.codex\iinnovation-products-ppt-logs\team-sharing-audit.jsonl",
  [switch]$CreateDraftPullRequest,
  [switch]$SkipUpload,
  [switch]$DryRun,
  [switch]$AlertDryRun
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath $RepositoryRoot).Path
$auditScript = Join-Path $repo 'team-sharing\scripts\audit-event.js'
$alertScript = Join-Path $repo 'team-sharing\scripts\send-github-alert.js'
function Send-TeamAlert([string]$Kind, [string]$Title, [string]$Details) {
  if (-not (Test-Path -LiteralPath $alertScript)) { Write-Warning "Local alert sender not found: $alertScript"; return }
  $arguments = @($alertScript, '--repo-root', $repo, '--kind', $Kind, '--title', $Title, '--details', $Details)
  if ($AlertDryRun) { $arguments += '--dry-run' }
  & node @arguments | Write-Output
  if ($LASTEXITCODE -ne 0) { Write-Warning "Unable to forward local alert through GitHub: $Kind" }
}
if (Test-Path -LiteralPath $KillSwitchFile) {
  if (Test-Path -LiteralPath $auditScript) {
    & node $auditScript --log $AuditLog --event 'team-cycle' --status 'disabled' --details "Kill switch is present: $KillSwitchFile" | Out-Null
  }
  Send-TeamAlert 'automation-disabled' 'Automation disabled' 'The local IInnovation-Products_ppt kill switch prevented the team cycle.'
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
  try {
    & $sync @arguments
    if ($LASTEXITCODE -ne 0) { throw 'Candidate upload cycle failed.' }
  } catch {
    Send-TeamAlert 'candidate-cycle-blocked' 'Candidate cycle blocked' 'Candidate upload or safety validation did not complete; inspect the local IInnovation-Products_ppt audit log.'
    throw
  }
}

$updater = Join-Path $repo 'team-sharing\scripts\update-iinnovation-products-ppt.ps1'
try {
  if ($DryRun) { & $updater -RepositoryRoot $repo -Destination $Destination -Channel $UpdateChannel -DryRun }
  else { & $updater -RepositoryRoot $repo -Destination $Destination -Channel $UpdateChannel }
  if ($LASTEXITCODE -ne 0) { throw 'Consumer update cycle failed.' }
} catch {
  Send-TeamAlert 'consumer-update-failed' 'Stable update failed' 'The local IInnovation-Products_ppt release check or installation failed; inspect the scheduled-task log.'
  throw
}

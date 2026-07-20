[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepositoryRoot,
  [string]$ContributionRoot = "$env:USERPROFILE\.codex\leander-contributions",
  [string]$Destination = "$env:USERPROFILE\.codex\skills\leander-ppt",
  [ValidateSet('stable', 'beta')][string]$UpdateChannel = 'stable',
  [switch]$CreateDraftPullRequest,
  [switch]$SkipUpload,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath $RepositoryRoot).Path
if ($DryRun) {
  $count = if (Test-Path -LiteralPath $ContributionRoot) { @(Get-ChildItem -LiteralPath $ContributionRoot -Filter candidate.json -File -Recurse | Where-Object { -not (Test-Path -LiteralPath (Join-Path $_.Directory.FullName '.published.json')) }).Count } else { 0 }
  Write-Output "UPLOAD_STATUS=dry-run"
  Write-Output "UNPUBLISHED_CANDIDATES=$count"
} elseif (-not $SkipUpload) {
  $sync = Join-Path $repo 'team-sharing\scripts\sync-scheduled.ps1'
  $arguments = @{ RepositoryRoot = $repo; ContributionRoot = $ContributionRoot }
  if ($CreateDraftPullRequest) { $arguments.CreateDraftPullRequest = $true }
  & $sync @arguments
  if ($LASTEXITCODE -ne 0) { throw 'Candidate upload cycle failed.' }
}

$updater = Join-Path $repo 'team-sharing\scripts\update-leander.ps1'
if ($DryRun) { & $updater -RepositoryRoot $repo -Destination $Destination -Channel $UpdateChannel -DryRun }
else { & $updater -RepositoryRoot $repo -Destination $Destination -Channel $UpdateChannel }
if ($LASTEXITCODE -ne 0) { throw 'Consumer update cycle failed.' }

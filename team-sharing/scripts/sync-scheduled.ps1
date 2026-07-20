[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepositoryRoot,
  [string]$ContributionRoot = "$env:USERPROFILE\.codex\leander-contributions",
  [ValidateRange(1, 20)][int]$MaxCandidates = 3,
  [string]$AuditLog = "$env:USERPROFILE\.codex\leander-logs\team-sharing-audit.jsonl",
  [switch]$CreateDraftPullRequest
)

$ErrorActionPreference = "Stop"
function Write-Audit([string]$Event, [string]$Status, [string]$Subject = '', [string]$Details = '', [string]$Branch = '') {
  $auditArguments = @($auditScript, '--log', $AuditLog, '--event', $Event, '--status', $Status)
  if (-not [string]::IsNullOrWhiteSpace($Subject)) { $auditArguments += @('--subject', $Subject) }
  if (-not [string]::IsNullOrWhiteSpace($Details)) { $auditArguments += @('--details', $Details) }
  if (-not [string]::IsNullOrWhiteSpace($Branch)) { $auditArguments += @('--branch', $Branch) }
  & node @auditArguments | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Unable to record team-sharing audit event: $Event" }
}

try {
  $repo = (Resolve-Path -LiteralPath $RepositoryRoot).Path
  $publisher = Join-Path $repo 'team-sharing\scripts\publish-candidate.ps1'
  $batchGuard = Join-Path $repo 'team-sharing\scripts\check-automation-batch.js'
  $auditScript = Join-Path $repo 'team-sharing\scripts\audit-event.js'
  if (-not (Test-Path -LiteralPath $publisher)) { throw "Publisher script not found: $publisher" }
  if (-not (Test-Path -LiteralPath $batchGuard)) { throw "Batch guard not found: $batchGuard" }
  if (-not (Test-Path -LiteralPath $auditScript)) { throw "Audit script not found: $auditScript" }
  if (-not (Test-Path -LiteralPath $ContributionRoot)) {
    Write-Audit 'candidate-cycle' 'skipped' '' "No contribution inbox: $ContributionRoot"
    Write-Output "No contribution inbox: $ContributionRoot"
    exit 0
  }

  $batchJson = & node $batchGuard --root $ContributionRoot --max $MaxCandidates
  if ($LASTEXITCODE -ne 0) { throw "Automated candidate batch was blocked: $batchJson" }
  $batch = $batchJson | ConvertFrom-Json
  Write-Audit 'candidate-cycle' 'started' '' "Candidates=$($batch.count); Max=$MaxCandidates"

  foreach ($candidateDir in @($batch.candidates)) {
    $candidateFile = Join-Path $candidateDir 'candidate.json'
    $marker = Join-Path $candidateDir '.published.json'
    $metadata = Get-Content -Raw -LiteralPath $candidateFile | ConvertFrom-Json
    $arguments = @(
      '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $publisher,
      '-RepositoryRoot', $repo,
      '-CandidatePath', $candidateDir,
      '-Contributor', $metadata.contributor
    )
    if ($CreateDraftPullRequest) { $arguments += '-CreateDraftPullRequest' }
    $shell = if (Get-Command pwsh.exe -ErrorAction SilentlyContinue) { 'pwsh.exe' } else { 'powershell.exe' }
    $output = & $shell @arguments
    if ($LASTEXITCODE -ne 0) { throw "Publishing failed for $($metadata.id)." }
    $branchLine = $output | Where-Object { $_ -like 'PUBLISHED_BRANCH=*' } | Select-Object -Last 1
    $branch = if ($branchLine) { $branchLine.Substring('PUBLISHED_BRANCH='.Length) } else { $null }
    $record = [ordered]@{
      schemaVersion = 'leander-local-publish.v1'
      id = $metadata.id
      contributor = $metadata.contributor
      branch = $branch
      publishedAt = (Get-Date).ToUniversalTime().ToString('o')
    }
    $record | ConvertTo-Json | Set-Content -LiteralPath $marker -Encoding UTF8
    Write-Audit 'candidate-published' 'success' $metadata.id 'Draft candidate branch published.' $branch
    $output | Write-Output
  }
  Write-Audit 'candidate-cycle' 'completed' '' "Published=$($batch.count)"
} catch {
  if ($auditScript -and (Test-Path -LiteralPath $auditScript)) {
    try { Write-Audit 'candidate-cycle' 'blocked' '' $_.Exception.Message } catch { Write-Warning $_.Exception.Message }
  }
  throw
}

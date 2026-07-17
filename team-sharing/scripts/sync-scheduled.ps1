[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepositoryRoot,
  [string]$ContributionRoot = "$env:USERPROFILE\.codex\leander-contributions",
  [switch]$CreateDraftPullRequest
)

$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $ContributionRoot)) {
  Write-Output "No contribution inbox: $ContributionRoot"
  exit 0
}

$publisher = Join-Path $RepositoryRoot 'team-sharing\scripts\publish-candidate.ps1'
if (-not (Test-Path -LiteralPath $publisher)) { throw "Publisher script not found: $publisher" }
$candidateFiles = Get-ChildItem -LiteralPath $ContributionRoot -Filter 'candidate.json' -File -Recurse
foreach ($candidateFile in $candidateFiles) {
  $candidateDir = $candidateFile.Directory.FullName
  $marker = Join-Path $candidateDir '.published.json'
  if (Test-Path -LiteralPath $marker) { continue }
  $metadata = Get-Content -Raw -LiteralPath $candidateFile.FullName | ConvertFrom-Json
  $arguments = @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $publisher,
    '-RepositoryRoot', $RepositoryRoot,
    '-CandidatePath', $candidateDir,
    '-Contributor', $metadata.contributor
  )
  if ($CreateDraftPullRequest) { $arguments += '-CreateDraftPullRequest' }
  $shell = if (Get-Command pwsh.exe -ErrorAction SilentlyContinue) { 'pwsh.exe' } else { 'powershell.exe' }
  $output = & $shell @arguments
  if ($LASTEXITCODE -ne 0) { throw "Publishing failed for $($metadata.id)." }
  $branchLine = $output | Where-Object { $_ -like 'PUBLISHED_BRANCH=*' } | Select-Object -Last 1
  $record = [ordered]@{
    schemaVersion = 'leander-local-publish.v1'
    id = $metadata.id
    contributor = $metadata.contributor
    branch = if ($branchLine) { $branchLine.Substring('PUBLISHED_BRANCH='.Length) } else { $null }
    publishedAt = (Get-Date).ToUniversalTime().ToString('o')
  }
  $record | ConvertTo-Json | Set-Content -LiteralPath $marker -Encoding UTF8
  $output | Write-Output
}

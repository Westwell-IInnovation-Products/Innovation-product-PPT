[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepositoryRoot,
  [Parameter(Mandatory = $true)][string]$CandidatePath,
  [Parameter(Mandatory = $true)][string]$Contributor,
  [string]$Remote = "origin",
  [string]$BaseBranch = "main",
  [switch]$CreateDraftPullRequest
)

$ErrorActionPreference = "Stop"
function Invoke-Git([string[]]$Arguments) {
  & git -C $repo @Arguments
  if ($LASTEXITCODE -ne 0) { throw "git failed: git $($Arguments -join ' ')" }
}

$repo = (Resolve-Path -LiteralPath $RepositoryRoot).Path
$candidate = (Resolve-Path -LiteralPath $CandidatePath).Path
$repoPrefix = $repo.TrimEnd('\') + '\'
if ($candidate.StartsWith($repoPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "CandidatePath must be a personal candidate folder outside the shared repository."
}
if ($Contributor -notmatch '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$') { throw "Invalid contributor login." }

$status = & git -C $repo status --porcelain
if ($LASTEXITCODE -ne 0) { throw "RepositoryRoot is not a Git repository." }
if ($status) { throw "Repository worktree must be clean before publishing a candidate." }

$metadata = Get-Content -Raw -LiteralPath (Join-Path $candidate 'candidate.json') | ConvertFrom-Json
if ($metadata.contributor -ne $Contributor) { throw "candidate.json contributor does not match -Contributor." }
$validator = Join-Path $repo 'team-sharing\scripts\validate-candidate.js'
& node $validator $candidate
if ($LASTEXITCODE -ne 0) { throw "Candidate validation failed." }
$batchGuard = Join-Path $repo 'team-sharing\scripts\check-automation-batch.js'
& node $batchGuard --root $candidate --max 1 --include-published
if ($LASTEXITCODE -ne 0) { throw "Independent Agent review evidence is required before publishing." }

$registry = Join-Path $repo 'iinnovation-products-ppt\templates\iinnovation-products-ppt-scaffold\tools\component-registry.json'
$contributions = Join-Path $repo 'contributions\iinnovation-products-ppt\components'
$assessmentFile = Join-Path $candidate 'automation-review.json'
$assessmentJson = & node (Join-Path $repo 'team-sharing\scripts\assess-candidate.js') $candidate --registry $registry --contributions $contributions --write $assessmentFile
$assessmentExit = $LASTEXITCODE
$assessment = $assessmentJson | ConvertFrom-Json
if ($assessmentExit -eq 3 -or $assessment.lane -eq 'blocked') { throw "Candidate risk assessment blocked publishing: $($assessment.reasons -join ', ')" }
if ($assessmentExit -ne 0) { throw "Candidate risk assessment failed." }
Write-Output "CANDIDATE_RISK_LANE=$($assessment.lane)"

Invoke-Git @('fetch', $Remote, $BaseBranch)
Invoke-Git @('switch', $BaseBranch)
Invoke-Git @('pull', '--ff-only', $Remote, $BaseBranch)
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$branch = "contrib/$Contributor/$($metadata.id)-$stamp"
Invoke-Git @('switch', '-c', $branch)

$relativeTarget = "contributions/iinnovation-products-ppt/components/$Contributor/$($metadata.id)"
$target = [System.IO.Path]::GetFullPath((Join-Path $repo $relativeTarget))
if (-not $target.StartsWith($repoPrefix, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe contribution target." }
New-Item -ItemType Directory -Force -Path (Split-Path $target -Parent) | Out-Null
Copy-Item -LiteralPath $candidate -Destination $target -Recurse

& node $validator $target
if ($LASTEXITCODE -ne 0) { throw "Copied candidate validation failed." }
Invoke-Git @('add', '--', $relativeTarget)
$scopeGuard = Join-Path $repo 'team-sharing\scripts\check-publish-scope.js'
& node $scopeGuard --repo $repo --allowed-root $relativeTarget --expected-branch-prefix "contrib/$Contributor/$($metadata.id)-"
if ($LASTEXITCODE -ne 0) { throw "Candidate publish scope validation failed." }
Invoke-Git @('commit', '-m', "Contribute IInnovation-Products_ppt component $($metadata.id)")
Invoke-Git @('push', '-u', $Remote, $branch)

if ($CreateDraftPullRequest) {
  $remoteUrl = (& git -C $repo remote get-url $Remote).Trim()
  if ($remoteUrl -notmatch 'github\.com[/:](?<repo>[^/]+/[^/.]+)(?:\.git)?$') { throw "Cannot derive GitHub repository from remote URL." }
  $repoFullName = $Matches.repo
  $bodyFile = Join-Path $repo '.github\pull_request_template.md'
  & node (Join-Path $repo 'team-sharing\scripts\create-draft-pr.js') --repo $repoFullName --head $branch --base $BaseBranch --title "Contribute IInnovation-Products_ppt component $($metadata.id)" --body-file $bodyFile
  if ($LASTEXITCODE -ne 0) { throw "Branch was pushed, but Draft PR creation failed." }
}

Invoke-Git @('switch', $BaseBranch)
Write-Output "PUBLISHED_BRANCH=$branch"

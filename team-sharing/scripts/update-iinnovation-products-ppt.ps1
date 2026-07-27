[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepositoryRoot,
  [string]$Destination = "$env:USERPROFILE\.codex\skills\iinnovation-products-ppt",
  [ValidateSet('stable', 'beta')][string]$Channel = 'stable',
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath $RepositoryRoot).Path
$selector = Join-Path $repo 'team-sharing\scripts\select-release.js'
if (-not (Test-Path -LiteralPath $selector)) { throw "Release selector not found: $selector" }

& git -C $repo fetch origin --tags --prune
if ($LASTEXITCODE -ne 0) { throw 'Unable to fetch IInnovation-Products_ppt release tags.' }
$tags = & git -C $repo tag -l 'iinnovation-products-ppt-v*'
if ($LASTEXITCODE -ne 0) { throw 'Unable to list IInnovation-Products_ppt release tags.' }
$current = $null
$installedManifest = Join-Path $Destination 'manifest.json'
if (Test-Path -LiteralPath $installedManifest) { $current = (Get-Content -Raw -LiteralPath $installedManifest | ConvertFrom-Json).version }
$tagsFile = Join-Path $env:TEMP ('.leander-tags-' + [guid]::NewGuid().ToString('N') + '.txt')
try {
  $tags | Set-Content -LiteralPath $tagsFile -Encoding UTF8
  $selectionJson = & node $selector --channel $Channel --current $current --tags-file $tagsFile
  if ($LASTEXITCODE -ne 0) { throw 'Release selection failed.' }
} finally {
  if (Test-Path -LiteralPath $tagsFile) { Remove-Item -LiteralPath $tagsFile -Force }
}
$selection = $selectionJson | ConvertFrom-Json
if (-not $selection.selectedTag) {
  Write-Output 'UPDATE_STATUS=no-allowed-release'
  Write-Output "UPDATE_CHANNEL=$Channel"
  exit 0
}
if (-not $selection.updateAvailable) {
  Write-Output 'UPDATE_STATUS=up-to-date'
  Write-Output "INSTALLED_VERSION=$current"
  Write-Output "SELECTED_VERSION=$($selection.selectedVersion)"
  exit 0
}
if ($DryRun) {
  Write-Output 'UPDATE_STATUS=dry-run-update-available'
  Write-Output "INSTALLED_VERSION=$current"
  Write-Output "SELECTED_VERSION=$($selection.selectedVersion)"
  Write-Output "SELECTED_TAG=$($selection.selectedTag)"
  exit 0
}

$worktree = Join-Path $env:TEMP ('leander-release-' + [guid]::NewGuid().ToString('N'))
$tempRoot = [System.IO.Path]::GetFullPath($env:TEMP).TrimEnd('\') + '\'
$worktreeFull = [System.IO.Path]::GetFullPath($worktree)
if (-not $worktreeFull.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) { throw "Unsafe release worktree path: $worktreeFull" }
try {
  & git -C $repo worktree add --detach $worktreeFull $selection.selectedTag
  if ($LASTEXITCODE -ne 0) { throw "Unable to check out $($selection.selectedTag)." }
  $releaseManifest = Get-Content -Raw -LiteralPath (Join-Path $worktreeFull 'iinnovation-products-ppt\manifest.json') | ConvertFrom-Json
  if ($releaseManifest.version -ne $selection.selectedVersion) { throw 'Release tag and manifest version do not match.' }
  $installer = Join-Path $worktreeFull 'team-sharing\scripts\install-iinnovation-products-ppt.ps1'
  & $installer -RepositoryRoot $worktreeFull -Destination $Destination
  if ($LASTEXITCODE -ne 0) { throw 'IInnovation-Products_ppt installer failed.' }
  Write-Output 'UPDATE_STATUS=installed'
  Write-Output "PREVIOUS_VERSION=$current"
  Write-Output "INSTALLED_VERSION=$($selection.selectedVersion)"
  Write-Output "INSTALLED_TAG=$($selection.selectedTag)"
} finally {
  if (Test-Path -LiteralPath $worktreeFull) {
    & git -C $repo worktree remove --force $worktreeFull
    if ($LASTEXITCODE -ne 0) { Write-Warning "Temporary release worktree requires manual cleanup: $worktreeFull" }
  }
}

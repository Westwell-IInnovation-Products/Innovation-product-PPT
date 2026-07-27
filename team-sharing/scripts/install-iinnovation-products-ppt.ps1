[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepositoryRoot,
  [string]$Destination = "$env:USERPROFILE\.codex\skills\iinnovation-products-ppt",
  [switch]$AllowCustomDestination
)

$ErrorActionPreference = "Stop"
$repo = (Resolve-Path -LiteralPath $RepositoryRoot).Path
$source = Join-Path $repo 'iinnovation-products-ppt'
if (-not (Test-Path -LiteralPath (Join-Path $source 'SKILL.md'))) { throw "IInnovation-Products_ppt Skill not found under RepositoryRoot." }

$destinationFull = [System.IO.Path]::GetFullPath($Destination)
$defaultRoot = [System.IO.Path]::GetFullPath("$env:USERPROFILE\.codex\skills")
if (-not $AllowCustomDestination -and -not $destinationFull.StartsWith($defaultRoot.TrimEnd('\') + '\', [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Destination must stay under $defaultRoot unless -AllowCustomDestination is supplied."
}
if ($destinationFull -eq [System.IO.Path]::GetPathRoot($destinationFull)) { throw "Refusing to install at a drive root." }
if ($destinationFull -eq [System.IO.Path]::GetFullPath($source)) { throw "Source and destination must differ." }

& node (Join-Path $source 'scripts\release-hygiene.js')
if ($LASTEXITCODE -ne 0) { throw "Source release hygiene failed." }
& node (Join-Path $source 'templates\iinnovation-products-ppt-scaffold\tools\lint-scope-hygiene.js') --skill-root $source
if ($LASTEXITCODE -ne 0) { throw "Source scope hygiene failed." }

$parent = Split-Path $destinationFull -Parent
New-Item -ItemType Directory -Force -Path $parent | Out-Null
$staging = Join-Path $parent ('.iinnovation-products-ppt.installing.' + [guid]::NewGuid().ToString('N'))
$backup = $null
New-Item -ItemType Directory -Force -Path $staging | Out-Null
try {
  & robocopy $source $staging /MIR /XD .git node_modules output /XF *.log /NFL /NDL /NJH /NJS /NP
  if ($LASTEXITCODE -gt 7) { throw "robocopy failed with code $LASTEXITCODE" }
  & node (Join-Path $staging 'scripts\release-hygiene.js')
  if ($LASTEXITCODE -ne 0) { throw "Staged release hygiene failed." }
  if (Test-Path -LiteralPath $destinationFull) {
    $backup = "$destinationFull.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Move-Item -LiteralPath $destinationFull -Destination $backup
  }
  Move-Item -LiteralPath $staging -Destination $destinationFull
} catch {
  if (Test-Path -LiteralPath $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
  if ($backup -and -not (Test-Path -LiteralPath $destinationFull) -and (Test-Path -LiteralPath $backup)) {
    Move-Item -LiteralPath $backup -Destination $destinationFull
  }
  throw
}

$manifest = Get-Content -Raw -LiteralPath (Join-Path $destinationFull 'manifest.json') | ConvertFrom-Json
Write-Output "INSTALLED_IINNOVATION_PRODUCTS_PPT_VERSION=$($manifest.version)"
Write-Output "INSTALLED_PATH=$destinationFull"
if ($backup) { Write-Output "ROLLBACK_BACKUP=$backup" }

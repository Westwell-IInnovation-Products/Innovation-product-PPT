[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$RepositoryRoot
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path -LiteralPath $RepositoryRoot).Path
$hook = Join-Path $repo '.githooks\pre-push'
$guard = Join-Path $repo 'team-sharing\scripts\pre-push-guard.js'
if (-not (Test-Path -LiteralPath $hook)) { throw "Tracked pre-push hook not found: $hook" }
if (-not (Test-Path -LiteralPath $guard)) { throw "Pre-push guard not found: $guard" }

& node $guard --self-test
if ($LASTEXITCODE -ne 0) { throw 'Pre-push guard self-test failed.' }
& git -C $repo config --local core.hooksPath .githooks
if ($LASTEXITCODE -ne 0) { throw 'Unable to configure core.hooksPath.' }
$configured = (& git -C $repo config --local --get core.hooksPath).Trim()
if ($configured -ne '.githooks') { throw "Unexpected core.hooksPath: $configured" }

Write-Output 'SAFETY_GUARD_STATUS=installed'
Write-Output "HOOKS_PATH=$configured"
Write-Output 'ALLOWED_PUSH_PREFIXES=agent/,contrib/,promote/'
Write-Output 'BLOCKED_PUSH_REFS=main,master,release/*,tags,deletions,unknown-prefixes'

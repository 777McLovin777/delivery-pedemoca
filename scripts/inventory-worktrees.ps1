[CmdletBinding()]
param(
    [string]$Repository,
    [string]$Base = 'origin/main'
)

$ErrorActionPreference = 'Stop'
if ([string]::IsNullOrWhiteSpace($Repository)) {
    $Repository = Split-Path -Parent $PSScriptRoot
}

function Read-Git {
    param([string]$At, [string[]]$Arguments)
    $lines = @(& git --no-optional-locks -c core.quotepath=false -c color.ui=false -C $At @Arguments 2>$null)
    if ($LASTEXITCODE -ne 0) { throw "Git read failed at $At" }
    return $lines
}

$root = @(Read-Git -At $Repository -Arguments @('rev-parse', '--show-toplevel'))[0]
$baseOutput = @(& git --no-optional-locks -C $root rev-parse --verify --quiet --end-of-options "${Base}^{commit}" 2>$null)
$baseSha = if ($LASTEXITCODE -eq 0) { $baseOutput[0] } else { $null }
$entries = @()
$entry = $null
foreach ($line in @(Read-Git -At $root -Arguments @('worktree', 'list', '--porcelain'))) {
    if ($line.StartsWith('worktree ')) {
        $entry = @{ Path = $line.Substring(9); HEAD = $null; Branch = '(detached)' }
        $entries += $entry
    } elseif ($null -ne $entry -and $line.StartsWith('HEAD ')) {
        $entry.HEAD = $line.Substring(5)
    } elseif ($null -ne $entry -and $line.StartsWith('branch ')) {
        $entry.Branch = $line.Substring(7) -replace '^refs/heads/', ''
    }
}

$worktrees = @(foreach ($item in $entries) {
    if (-not (Test-Path -LiteralPath $item.Path -PathType Container)) {
        [pscustomobject]@{ Path = $item.Path; Branch = $item.Branch; HEAD = $item.HEAD; Available = $false; Behind = $null; Ahead = $null; Status = @('worktree path unavailable; not modified') }
        continue
    }
    $status = @(Read-Git -At $item.Path -Arguments @('status', '--short'))
    $behind = $null
    $ahead = $null
    if ($null -ne $baseSha) {
        $counts = @(Read-Git -At $item.Path -Arguments @('rev-list', '--left-right', '--count', "${baseSha}...HEAD"))[0] -split '\s+'
        $behind = [int]$counts[0]
        $ahead = [int]$counts[1]
    }
    [pscustomobject]@{ Path = $item.Path; Branch = $item.Branch; HEAD = $item.HEAD; Available = $true; Behind = $behind; Ahead = $ahead; Status = $status }
})

[pscustomobject]@{
    Root = $root
    Base = $Base
    BaseSHA = $baseSha
    ReferenceNote = 'Local reference only; no fetch or deployment verification. Null SHA/counts mean base unavailable.'
    Worktrees = $worktrees
} | ConvertTo-Json -Depth 5 -Compress

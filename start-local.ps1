param([ValidateRange(1024, 65535)][int]$Port = 4176)

$ErrorActionPreference = 'Stop'
$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else {
    Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
}
if (-not (Test-Path -LiteralPath $nodePath)) {
    throw 'Node.js is unavailable. Install Node.js LTS and restart VS Code.'
}
$nextPath = Join-Path $PSScriptRoot 'node_modules/next/dist/bin/next'
if (-not (Test-Path -LiteralPath $nextPath)) {
    throw 'Project dependencies are missing. Run npm ci in this project after installing Node.js.'
}

$previousPath = $env:PATH
Push-Location $PSScriptRoot
try {
    $env:PATH = "$(Split-Path $nodePath);$previousPath"
    Write-Host "Starting Nafiis Hotel at http://127.0.0.1:$Port. Press Ctrl+C to stop."
    & $nodePath $nextPath dev --hostname 127.0.0.1 --port $Port
} finally {
    $env:PATH = $previousPath
    Pop-Location
}

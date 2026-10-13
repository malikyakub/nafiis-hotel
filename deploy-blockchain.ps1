param()
$ErrorActionPreference = 'Stop'
$taskNodeCommand = Get-Command node -ErrorAction SilentlyContinue
$taskNodePath = if ($taskNodeCommand) { $taskNodeCommand.Source } else {
    Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe'
}
if (-not (Test-Path -LiteralPath $taskNodePath)) { throw 'Install Node.js LTS and restart VS Code.' }
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'node_modules/ethers'))) { throw 'Run npm ci in this original Next.js project first.' }
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot '.env.local'))) { throw 'Create .env.local using .env.example and docs/BLOCKCHAIN.md.' }
Push-Location $PSScriptRoot
try {
    & $taskNodePath --env-file=.env.local contracts/scripts/deploy.mjs
    if ($LASTEXITCODE -eq 2) { Write-Host 'Transaction pending. Rerun this script shortly to check the same deployment.' }
    elseif ($LASTEXITCODE -ne 0) { throw 'Deployment did not finish. Follow the message above; private keys stay in .env.local.' }
} finally { Pop-Location }

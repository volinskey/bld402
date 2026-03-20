# mcp-agent-test.ps1 — Run the run402-mcp-tester agent in its own context
#
# Sets up the wallet, then spawns the run402-mcp-tester agent in a
# new Claude Code process. The agent has run402-mcp MCP tools available
# and tests bld402 templates end-to-end.
#
# Usage:
#   .\test\mcp-agent-test.ps1                    # Test shared-todo (default)
#   .\test\mcp-agent-test.ps1 all                # Test all 3 templates
#   .\test\mcp-agent-test.ps1 paste-locker       # Test specific template

param(
    [string]$Template = "shared-todo"
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
$WalletFile = Join-Path $RootDir "showcase\.wallet"
$ConfigDir = Join-Path $env:USERPROFILE ".config\run402"

Write-Host "=== run402-mcp Agent Test ===" -ForegroundColor Cyan
Write-Host "Template: $Template"

# Step 1: Wallet setup
if (-not (Test-Path $WalletFile)) {
    Write-Host "ERROR: No wallet at $WalletFile" -ForegroundColor Red
    exit 1
}

$PrivateKey = Get-Content $WalletFile -Raw
$PrivateKey = $PrivateKey.Trim()

if (-not (Test-Path $ConfigDir)) {
    New-Item -ItemType Directory -Path $ConfigDir -Force | Out-Null
}

$WalletJson = @{ privateKey = $PrivateKey } | ConvertTo-Json
Set-Content -Path (Join-Path $ConfigDir "wallet.json") -Value $WalletJson
Write-Host "Wallet written to $ConfigDir\wallet.json"

# Step 2: Spawn agent
Write-Host ""
Write-Host "Spawning run402-mcp-tester agent..." -ForegroundColor Yellow
Write-Host ""

$env:CLAUDECODE = ""
& claude `
    --agent run402-mcp-tester `
    --dangerously-skip-permissions `
    -p "Test the $Template template(s). The bld402 repo is at $RootDir. The wallet is already set up. Build end-to-end using run402-mcp tools and report JSON results." `
    --output-format text

$ExitCode = $LASTEXITCODE
Write-Host ""
Write-Host "=== Agent exited with code $ExitCode ===" -ForegroundColor $(if ($ExitCode -eq 0) { "Green" } else { "Red" })
exit $ExitCode

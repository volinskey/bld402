# cli-agent-test.ps1 — Run the run402-cli-tester agent in its own context
#
# Spawns the run402-cli-tester agent which uses `npx run402` CLI commands
# (not MCP tools) to build bld402 templates end-to-end.
#
# Usage:
#   .\test\cli-agent-test.ps1                    # Test shared-todo (default)
#   .\test\cli-agent-test.ps1 -Template all      # Test all 3 templates
#   .\test\cli-agent-test.ps1 -Template paste-locker

param(
    [string]$Template = "shared-todo"
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host "=== run402 CLI Agent Test ===" -ForegroundColor Cyan
Write-Host "Template: $Template"
Write-Host "Method:   CLI (npx run402)"
Write-Host ""

# Spawn agent
$env:CLAUDECODE = ""
& claude `
    --agent run402-cli-tester `
    --dangerously-skip-permissions `
    -p "Test the $Template template(s). The bld402 repo is at $RootDir. Use npx run402 CLI commands (not MCP). Run 'npx run402 init' first to set up the wallet, then build the template end-to-end and report JSON results." `
    --output-format text

$ExitCode = $LASTEXITCODE
Write-Host ""
Write-Host "=== Agent exited with code $ExitCode ===" -ForegroundColor $(if ($ExitCode -eq 0) { "Green" } else { "Red" })
exit $ExitCode

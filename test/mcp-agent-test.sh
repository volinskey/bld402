#!/usr/bin/env bash
#
# mcp-agent-test.sh — Run the run402-mcp-tester agent in its own context
#
# Sets up the wallet, then spawns the run402-mcp-tester agent in a
# new Claude Code process. The agent has run402-mcp MCP tools available
# and tests bld402 templates end-to-end.
#
# Usage:
#   bash test/mcp-agent-test.sh                    # Test shared-todo (default)
#   bash test/mcp-agent-test.sh all                # Test all 3 templates
#   bash test/mcp-agent-test.sh paste-locker       # Test specific template
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WALLET_FILE="$ROOT_DIR/showcase/.wallet"
CONFIG_DIR="$HOME/.config/run402"
TEMPLATE="${1:-shared-todo}"

echo "=== run402-mcp Agent Test ==="
echo "Template: $TEMPLATE"

# ── Step 1: Wallet setup ─────────────────────────────────────────
if [ ! -f "$WALLET_FILE" ]; then
  echo "ERROR: No wallet at $WALLET_FILE"
  exit 1
fi

PRIVATE_KEY=$(cat "$WALLET_FILE")
mkdir -p "$CONFIG_DIR"
echo "{\"privateKey\": \"$PRIVATE_KEY\"}" > "$CONFIG_DIR/wallet.json"
echo "Wallet written to $CONFIG_DIR/wallet.json"

# ── Step 2: Spawn agent ──────────────────────────────────────────
echo ""
echo "Spawning run402-mcp-tester agent..."
echo ""

CLAUDECODE= claude \
  --agent run402-mcp-tester \
  --dangerously-skip-permissions \
  -p "Test the $TEMPLATE template(s). The bld402 repo is at $ROOT_DIR. The wallet is already set up. Build end-to-end using run402-mcp tools and report JSON results." \
  --output-format text \
  2>&1

EXIT_CODE=$?
echo ""
echo "=== Agent exited with code $EXIT_CODE ==="
exit $EXIT_CODE

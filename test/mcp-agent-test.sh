#!/usr/bin/env bash
#
# mcp-agent-test.sh — Pre-flight for run402-mcp-tester agent
#
# Sets up the wallet so run402-mcp reuses our funded test wallet,
# then tells you how to spawn the agent.
#
# Usage:
#   bash test/mcp-agent-test.sh
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WALLET_FILE="$ROOT_DIR/showcase/.wallet"
CONFIG_DIR="$HOME/.config/run402"

echo "=== run402-mcp Agent Test Setup ==="

# Ensure wallet exists
if [ ! -f "$WALLET_FILE" ]; then
  echo "ERROR: No wallet at $WALLET_FILE"
  echo "Run the Gate 2 test first to create one."
  exit 1
fi

PRIVATE_KEY=$(cat "$WALLET_FILE")
echo "Wallet: $WALLET_FILE"
echo "Key:    ${PRIVATE_KEY:0:10}..."

# Write wallet to run402 config
mkdir -p "$CONFIG_DIR"
echo "{\"privateKey\": \"$PRIVATE_KEY\"}" > "$CONFIG_DIR/wallet.json"
echo "Written to: $CONFIG_DIR/wallet.json"

echo ""
echo "Setup complete. Now spawn the agent:"
echo ""
echo '  Use the run402-mcp-tester agent to test shared-todo'
echo '  Use the run402-mcp-tester agent to test all'
echo ""

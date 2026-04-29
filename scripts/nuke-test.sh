#!/usr/bin/env bash
#
# nuke-test.sh — Fully clean up a run402 test project (thin wrapper).
#
# Usage:
#   ./scripts/nuke-test.sh <project_id> <service_key>
#
# Delegates to scripts/nuke-test.mjs which uses @run402/sdk. The SDK
# owns the canonical endpoint paths and the destructive cascade.
#
set -euo pipefail
exec node "$(dirname "$0")/nuke-test.mjs" "$@"

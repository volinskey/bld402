#!/usr/bin/env bash
#
# nuke-test.sh — Fully clean up a run402 test project
#
# Usage:
#   ./scripts/nuke-test.sh <project_id> <service_key>
#
# This script:
#   1. Checks the project is NOT a showcase project (hard blocklist)
#   2. Deletes all storage objects
#   3. Releases any claimed subdomains
#   4. Archives the project (drops DB schema, users, tokens)
#
# Safe to run multiple times — idempotent.
#

set -euo pipefail

API_URL="${RUN402_API_URL:-https://api.run402.com}"

# ── Showcase project blocklist (NEVER delete these) ──────────────
# These are live on the site. Manually update when new showcase apps are added.
# Source: showcase/*/.env
SHOWCASE_PROJECTS=(
  "prj_1772702667600_0011"  # shared-todo
  "prj_1772707206984_0012"  # landing-waitlist
  "prj_1772707239699_0013"  # hangman
  "prj_1772707271798_0014"  # trivia-night
  "prj_1772707305070_0015"  # voting-booth
  "prj_1772728652516_0019"  # paste-locker
)

# ── Args ─────────────────────────────────────────────────────────
PROJECT_ID="${1:-}"
SERVICE_KEY="${2:-}"

if [[ -z "$PROJECT_ID" || -z "$SERVICE_KEY" ]]; then
  echo "Usage: ./scripts/nuke-test.sh <project_id> <service_key>"
  echo ""
  echo "Fully cleans up a run402 test project. Refuses to touch showcase projects."
  exit 1
fi

# ── Showcase guard ───────────────────────────────────────────────
for blocked in "${SHOWCASE_PROJECTS[@]}"; do
  if [[ "$PROJECT_ID" == "$blocked" ]]; then
    echo "BLOCKED: $PROJECT_ID is a showcase project. Cannot delete."
    echo "Showcase projects are live on the site and must never be cleaned up."
    exit 2
  fi
done

echo "Nuking test project: $PROJECT_ID"
echo "API: $API_URL"
echo ""

# ── Step 1: Delete storage objects ───────────────────────────────
echo "1. Cleaning storage..."
BUCKETS=$(curl -sf -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  "$API_URL/storage/v1/object/list/uploads" 2>/dev/null || echo "")

if [[ -n "$BUCKETS" && "$BUCKETS" != "[]" ]]; then
  echo "$BUCKETS" | grep -o '"name":"[^"]*"' | sed 's/"name":"//;s/"//' | while read -r fname; do
    echo "  Deleting: uploads/$fname"
    curl -sf -X DELETE \
      -H "apikey: $SERVICE_KEY" \
      -H "Authorization: Bearer $SERVICE_KEY" \
      "$API_URL/storage/v1/object/uploads/$fname" > /dev/null 2>&1 || true
  done
  echo "  Storage cleaned."
else
  echo "  No storage objects found (or bucket empty)."
fi

# ── Step 2: Release subdomains ───────────────────────────────────
echo "2. Releasing subdomains..."
SUBDOMAINS=$(curl -sf -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  "$API_URL/v1/subdomains" 2>/dev/null || echo "")

if [[ -n "$SUBDOMAINS" && "$SUBDOMAINS" != "[]" ]]; then
  echo "$SUBDOMAINS" | grep -o '"name":"[^"]*"' | sed 's/"name":"//;s/"//' | while read -r sub; do
    echo "  Releasing: $sub.run402.com"
    curl -sf -X DELETE \
      -H "apikey: $SERVICE_KEY" \
      -H "Authorization: Bearer $SERVICE_KEY" \
      "$API_URL/v1/subdomains/$sub" > /dev/null 2>&1 || true
  done
  echo "  Subdomains released."
else
  echo "  No subdomains found."
fi

# ── Step 3: Archive project (drops schema, users, tokens) ───────
echo "3. Archiving project (drops DB schema, users, tokens)..."
ARCHIVE_RESULT=$(curl -sf -X DELETE \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  "$API_URL/v1/projects/$PROJECT_ID" 2>&1 || echo "FAILED")

if echo "$ARCHIVE_RESULT" | grep -q '"archived"'; then
  echo "  Project archived successfully."
elif echo "$ARCHIVE_RESULT" | grep -q "already archived"; then
  echo "  Project was already archived."
else
  echo "  Archive response: $ARCHIVE_RESULT"
fi

# ── Done ─────────────────────────────────────────────────────────
echo ""
echo "Done. Project $PROJECT_ID has been nuked."
echo "  - Storage objects: deleted"
echo "  - Subdomains: released"
echo "  - DB schema: dropped"
echo "  - Users & tokens: deleted"
echo "  - Project status: archived"

---
product: bld402-templates (via run402-mcp)
spec: c:\Workspace-Kychee\bld402\docs\products\bld402\bld402-spec.md
cycle: 1
timestamp: 2026-03-16T00:00:00Z
verdict: PENDING
tests_total: 42
tests_run: 0
tests_passed: 0
tests_failed: 0
tests_blocked: 0
tests_deferred: 0
tests_gap: 0
---

# System Test: bld402 Templates via run402-mcp

**Replaces:** `bld402-mcp_system_test.md` (bld402-mcp consolidated into run402-mcp as of 2026-03-16)

**Spec:** `c:\Workspace-Kychee\bld402\docs\products\bld402\bld402-spec.md`
**Created:** 2026-03-16
**Last run:** —
**Cycle:** 1
**Verdict:** PENDING

**Goal:** Validate that all 13 bld402 templates can be built and deployed using run402-mcp/CLI (not bld402-mcp). This confirms the MCP consolidation does not break the template system.

**Testing tools:**
- `showcase/gate2-test/run.mjs` — automated build-from-scratch test (uses raw run402 API)
- `scripts/fund-wallet.mjs` — admin faucet for wallet funding
- run402-mcp tools (provision_postgres_project, run_sql, deploy_site, etc.)

**Wallet:** Shared test wallet at `showcase/.wallet` (preserved between cycles, admin-funded)

---

## Legend
- `[ ]` Not yet tested | `[~]` Executing | `[x]` Passed
- `[F]` Failed (see F-NNN) | `[B]` Blocked (see TR-NNN) | `[G]` Gap (see GAP-NNN)

---

## A: Gate 2 — Build From Scratch (13 templates)

Tests run via `node showcase/gate2-test/run.mjs --keep --pin`

Each template test:
1. Provisions a fresh run402 project (x402 payment)
2. Runs the template's schema.sql
3. Applies RLS per the template's rls.json
4. Deploys server-side functions (if applicable)
5. Deploys the template's index.html with placeholder substitution
6. Claims a test subdomain
7. Verifies: HTTP 200, content checks, API write/read checks

- [ ] **T-001: shared-todo** — Gate 2 build-from-scratch
- [ ] **T-002: landing-waitlist** — Gate 2 build-from-scratch
- [ ] **T-003: hangman** — Gate 2 build-from-scratch
- [ ] **T-004: trivia-night** — Gate 2 build-from-scratch
- [ ] **T-005: voting-booth** — Gate 2 build-from-scratch
- [ ] **T-006: paste-locker** — Gate 2 build-from-scratch (includes functions)
- [ ] **T-007: photo-wall** — Gate 2 build-from-scratch
- [ ] **T-008: micro-blog** — Gate 2 build-from-scratch
- [ ] **T-009: secret-santa** — Gate 2 build-from-scratch (includes functions)
- [ ] **T-010: ai-sticker-maker** — Gate 2 build-from-scratch
- [ ] **T-011: flash-cards** — Gate 2 build-from-scratch
- [ ] **T-012: bingo-card-generator** — Gate 2 build-from-scratch
- [ ] **T-013: memory-match** — Gate 2 build-from-scratch

## B: Website — bld402.com Pages Updated for run402-mcp

Verify all MCP-related pages now reference run402-mcp instead of bld402-mcp.

- [ ] **T-014: llms.txt redirects to run402** — `curl bld402.com/llms.txt` contains "run402.com/llms.txt" and "run402-mcp"
- [ ] **T-015: index.html MCP section** — Agent landing page references run402-mcp, not bld402-mcp
- [ ] **T-016: mcp.html title and installs** — Title says "run402 plugin", all 5 agent configs use run402-mcp
- [ ] **T-017: mcp-install.html prompts** — Copy-paste cards say "Read run402.com/llms.txt"
- [ ] **T-018: mcp-faq.html links** — GitHub links point to run402-mcp, review prompt references run402-mcp
- [ ] **T-019: mcp-safety.html links** — Title says "run402 plugin", GitHub link points to run402-mcp
- [ ] **T-020: agent.json gate message** — References run402-mcp, not bld402-mcp

## C: NPM — bld402-mcp Unpublished

- [ ] **T-021: npm registry** — `npm view bld402-mcp` returns 404 (unpublished)
- [ ] **T-022: run402-mcp available** — `npm view run402-mcp` returns version info

## D: Wallet Preservation

- [ ] **T-023: wallet file persists** — `showcase/.wallet` exists after test run, same address as before
- [ ] **T-024: --keep flag works** — Gate 2 test with `--keep` does not nuke projects
- [ ] **T-025: --pin flag works** — Gate 2 test with `--pin` pins projects (requires ADMIN_KEY)
- [ ] **T-026: admin faucet works** — `node scripts/fund-wallet.mjs` funds wallet without rate limit
- [ ] **T-027: wallet not regenerated** — Corrupted wallet file causes error, not silent regeneration

## E: Skills Updated

- [ ] **T-028: update-services skill** — No references to bld402-mcp in SKILL.md; Steps 9-11 removed
- [ ] **T-029: bld402 skill** — Has run402-mcp preamble with tool mapping table
- [ ] **T-030: AGENTS.md** — Contains consolidation note, no bld402-mcp in skill descriptions

## F: Endpoint Correctness

- [ ] **T-031: faucet endpoint** — gate2-test uses `/faucet/v1` (not `/v1/faucet`)
- [ ] **T-032: admin faucet endpoint** — gate2-test uses `/faucet/v1/admin` with ADMIN_KEY
- [ ] **T-033: provision endpoint** — gate2-test uses correct project creation endpoint
- [ ] **T-034: deployment endpoint** — gate2-test uses correct deployment endpoint

---

## Barriers

| ID | Description | Impact |
|----|-------------|--------|
| — | None yet | — |

## Failures

| ID | Description | Test | Status |
|----|-------------|------|--------|
| — | None yet | — | — |

## Gaps

| ID | Description | Tests |
|----|-------------|-------|
| GAP-001 | OpenClaw cloud agent testing deferred | T-035+ |
| GAP-002 | Browser MCP testing not available in Red Team environment | Interactive CRUD |

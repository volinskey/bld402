# Plan: bld402 on run402-mcp

**Created:** 2026-03-20
**Status:** In Progress
**Goal:** Get bld402.com fully working on top of run402-mcp/CLI, with regression tests that protect bld402 from run402 changes.

---

## Context

bld402-mcp has been consolidated into run402-mcp (2026-03-16). bld402.com is now a friendly website layer that routes users to install run402-mcp. However:

- The website still has **wrong API endpoint paths** (old `/v1/xxx` format vs correct `/xxx/v1`)
- The **agent.json** guided workflow references old endpoints
- The **21 build step HTML pages** reference old endpoints
- The **Gate 2 test script** hit a 404 on `/v1/projects` — needs endpoint fixes
- The **mcp-install.html prompts** need rewording (see user feedback)
- run402-mcp has been tested via **raw API** but never via **MCP tools** in an agent session
- No regression test exists for run402 devs to validate bld402 compatibility

---

## Correct run402 API Endpoint Map

| Resource | Correct Path | Auth |
|---|---|---|
| Faucet | `POST /faucet/v1` | none |
| Admin faucet | `POST /faucet/v1/admin` | `x-admin-key` |
| Tier subscribe | `POST /tiers/v1/:tier` | x402 payment |
| Project quote | `POST /projects/v1/quote` | none |
| Project create | `POST /projects/v1` | wallet auth (x402) |
| Project delete | `DELETE /projects/v1/:id` | service_key |
| SQL execute | `POST /projects/v1/admin/:id/sql` | service_key |
| Schema get | `GET /projects/v1/admin/:id/schema` | service_key |
| RLS apply | `POST /projects/v1/admin/:id/rls` | service_key |
| Pin project | `POST /projects/v1/admin/:id/pin` | admin key |
| Deploy (static) | `POST /deployments/v1` | wallet auth |
| Deploy (bundle) | `POST /deploy/v1` | wallet auth (x402) |
| Subdomain claim | `POST /subdomains/v1` | service_key |
| Subdomain delete | `DELETE /subdomains/v1/:name` | service_key |
| Storage upload | `POST /storage/v1/object/:bucket/*` | service_key |
| Auth signup | `POST /auth/v1/signup` | anon_key |
| Auth token | `POST /auth/v1/token` | anon_key |
| Image gen | `POST /generate-image/v1` | x402 payment |
| Wallet projects | `GET /wallets/v1/:address/projects` | wallet auth |

---

## Step 0: Verify run402-mcp is up to date

Before any test run, verify the installed run402-mcp version matches the latest npm version.

- [x] 0.1: Add version check to gate2-test/run.mjs — `npm view run402-mcp version` vs `npx run402-mcp --version`
- [x] 0.2: If outdated, warn and suggest `npx run402-mcp@latest` (auto-update deferred — too slow for CI)
- [x] 0.3: Log the run402-mcp version in evidence.json for every test run

---

## Step 1: Fix all stale content and get everything aligned

### 1A: Fix API endpoints in website pages

All `/v1/xxx` paths must become `/xxx/v1` per the endpoint map above.

- [x] 1A.1: `public/agent.json` — 5 fixes (steps 9, 10, 11, 12, 15)
- [x] 1A.2: `public/build/step/9.html` — faucet endpoint
- [x] 1A.3: `public/build/step/10.html` — project creation (3 occurrences + fetchPaid snippet)
- [x] 1A.4: `public/build/step/11.html` — SQL execute + schema endpoints
- [x] 1A.5: `public/build/step/12.html` — RLS endpoint
- [x] 1A.6: `public/build/step/15.html` — 7 fixes (full URLs + reference table)
- [x] 1A.7: `public/build/step/18.html` — SQL endpoint
- [x] 1A.8: `public/build/step/20.html` — renew/upgrade endpoints (2 occurrences)
- [x] 1A.9: `public/build/step/5.html` — functions + generate-image + deployments
- [x] 1A.10: `public/build/step/6.html` — quote endpoint
- [x] 1A.11: `public/build/guardrails.html` — functions + generate-image + subdomains
- [x] 1A.12: `public/build/step/19.html` — (bonus) subdomains + deployments

### 1B: Fix mcp-install.html prompts

Per user feedback: prompts should say "Install run402-mcp and build me a..." — the install instruction IS the prompt.

- [x] 1B.1: Primary CTA: `Install run402-mcp and build me a shared todo app`
- [x] 1B.2: Secondary examples: voting, trivia, waitlist — all "Install run402-mcp and build me..."
- [x] 1B.3: "Already installed" section: `Use run402-mcp to build me a recipe sharing app`
- [x] 1B.4: "What happens next" copy — updated to match run402-mcp flow

### 1C: Fix Gate 2 test script

- [x] 1C.1: Verify all endpoints in `showcase/gate2-test/run.mjs` match the endpoint map — all correct
- [x] 1C.2: Fix SIWX auth (replaced old X-Run402-* headers with CAIP-122 SIGN-IN-WITH-X), fix deployment_id field name
- [x] 1C.3: Run Gate 2 with `--keep --pin` — ALL 13 PASS (93/93 checks). Subdomain claims fail (owned by old wallet) but apps deploy and verify correctly via raw URLs.

### 1D: Test via run402 CLI and MCP

There are 3 layers of testing (raw API already done by Gate 2):

| Layer | Tool | Package | Interface | Status |
|---|---|---|---|---|
| Raw API | `fetch` calls | N/A | HTTP endpoints | DONE (Gate 2: 13/13 PASS) |
| CLI | `npx run402` | `run402` (npm) | Shell commands (`run402 init`, `run402 projects sql`, etc.) | TODO |
| MCP | `npx run402-mcp` | `run402-mcp` (npm) | MCP tools (`provision_postgres_project`, `run_sql`, etc.) | shared-todo PASS |

**Key discovery:** Both CLI (`run402`) and MCP (`run402-mcp`) share the same `core/` module and wallet at `~/.config/run402/allowance.json`. Running `run402 init` creates/reuses the wallet automatically. The CLI works with ANY agent that can run shell commands.

#### 1D-CLI: Test via run402 CLI (do this FIRST)

- [ ] 1D-CLI.1: Create `run402-cli-tester` agent — runs `npx run402 init`, then uses CLI commands to build templates
- [ ] 1D-CLI.2: Test shared-todo via CLI: `run402 init` → `run402 tier set prototype` → `run402 projects provision` → `run402 projects sql <id> <schema>` → `run402 projects rls <id> public_read_write '[...]'` → `run402 sites deploy <id> index.html` → verify
- [ ] 1D-CLI.3: Test paste-locker via CLI (includes `run402 functions deploy`)
- [ ] 1D-CLI.4: Test landing-waitlist via CLI
- [ ] 1D-CLI.5: Document CLI bugs/issues

#### 1D-MCP: Test via run402-mcp MCP tools (after CLI passes)

- [x] 1D-MCP.1: Created `run402-mcp-tester` agent (`.claude/agents/run402-mcp-tester.md`)
- [x] 1D-MCP.2: shared-todo PASS via MCP tools — all 7 steps
- [x] 1D-MCP.3: 3 bugs found: BUG-1 (HIGH: tier set fails x402), BUG-2 (MEDIUM: SQL comments silently no-op), BUG-3 (LOW: RLS needs projects rls, not raw SQL)
- [ ] 1D-MCP.4: Test paste-locker via MCP tools
- [ ] 1D-MCP.5: Test landing-waitlist via MCP tools

### 1E: Deploy and verify live site

- [x] 1E.1: Commit and push all fixes — pushed `23ba129`
- [x] 1E.2: Verify Amplify deploys successfully — SUCCEED
- [x] 1E.3: WebFetch `bld402.com/llms.txt` — confirmed run402-mcp install instructions (verified earlier)
- [x] 1E.4: WebFetch `bld402.com/humans/mcp-install.html` — confirmed "Install run402-mcp and build me a..." (no llms.txt)
- [x] 1E.5: WebFetch `bld402.com/build/step/10` — confirmed `/projects/v1` (correct format)

### 1F: Update bld402.com to offer CLI + MCP paths

bld402.com should tell agents/users: use CLI if you can run shell commands, use MCP if your agent supports it.

- [ ] 1F.1: Update `llms.txt` — add CLI install section (`npx run402 init`) alongside MCP install
- [ ] 1F.2: Update `mcp-install.html` — add CLI option for agents without MCP support
- [ ] 1F.3: Update `agent.json` step 9 (wallet/faucet) — reference `run402 init` as primary method

### 1G: Red team — build each template from scratch

- [ ] 1G.1: Red team agent reads bld402.com/llms.txt and attempts to build shared-todo via CLI
- [ ] 1G.2: Red team agent attempts each of the 13 templates using only bld402.com instructions
- [ ] 1G.3: Document any failures, wrong paths, confusing instructions
- [ ] 1G.4: Blue team fixes all issues found

---

## Step 2: Regression test suite for run402 developers

**Goal:** A test suite that run402 devs run before releasing a new version. If bld402 templates break, the tests fail and block the release.

### Approach (recommended)

Create a lightweight test script (`test/bld402-compat.test.mjs`) in the **run402 repo** that:

1. Installs the **local** run402-mcp (not npm — tests the code about to be released)
2. Provisions a project, runs SQL, deploys, claims subdomain for 2-3 representative templates (shared-todo, paste-locker, landing-waitlist)
3. Verifies HTTP 200 on deployed URLs, REST API read/write, auth flow
4. Tears down test projects
5. Runs as part of `npm test` or a dedicated `npm run test:bld402-compat`

This gives run402 devs a fast "does bld402 still work?" check before every release.

- [x] 2.1: Design the test script — 3 templates: shared-todo (DB+REST), paste-locker (DB+functions), landing-waitlist (DB+REST+unique constraint)
- [x] 2.2: Write `test/bld402-compat.ts` in the run402 repo (TypeScript, same pattern as e2e.ts)
- [x] 2.3: All SQL, RLS, and function code embedded as string literals (self-contained)
- [x] 2.4: Projects are created and deleted per test (no wallet preservation needed — this is a run402 dev test, not a bld402 showcase test)
- [x] 2.5: Added npm script: `"test:bld402-compat": "tsx test/bld402-compat.ts"` in run402/package.json
- [x] 2.6: Run against live API — **42/42 PASS, zero failures**
- [x] 2.7: Documented in run402 AGENTS.md (Testing section with test matrix)

---

## Step 3: Test bld402 with Codex (future — TBD)

- [ ] 3.1: Define what "works with Codex" means (Codex MCP support? CLI only?)
- [ ] 3.2: Test the copy-paste prompt from mcp-install.html in Codex
- [ ] 3.3: Document results and any Codex-specific issues

---

## Step 4: Test bld402 with OpenClaw (future — TBD)

- [ ] 4.1: Define OpenClaw cloud agent test harness
- [ ] 4.2: Run all 13 templates through OpenClaw
- [ ] 4.3: Document results and any OpenClaw-specific issues

---

## Implementation Notes

- **CLI vs MCP vs raw API:** Three ways to use run402. CLI (`npx run402`) = shell commands, works with any agent. MCP (`npx run402-mcp`) = MCP tools, works with Claude Code/Cursor/etc. Raw API = HTTP fetch calls. Both CLI and MCP share the same wallet/config at `~/.config/run402/`.
- **`run402 init`:** Idempotent wallet setup. Creates/reuses `allowance.json`, checks USDC balance, faucets if zero, shows tier status. Always run this first.
- **CLI commands:** `run402 init` → `run402 tier set prototype` → `run402 projects provision` → `run402 projects sql <id> "<SQL>"` → `run402 projects rls <id> <template> '<json>'` → `run402 sites deploy <id> <file>` → `run402 subdomains claim <id> <name>`
- **SIWX auth required:** run402 wallet auth uses CAIP-122 SIGN-IN-WITH-X headers. Both CLI and MCP handle this internally.
- **deployment_id field:** run402 returns `deployment_id` (not `id`) in the deployment response.
- **Subdomain ownership:** gate2-test subdomains (gate2-todo, gate2-trivia, etc.) are claimed by the OLD wallet from earlier test runs. New wallet can't reclaim them.
- **Wallet preservation:** Test wallet at `showcase/.wallet` (raw API tests) and `~/.config/run402/allowance.json` (CLI/MCP tests) must NEVER be deleted between test cycles.
- **MCP version check:** Every test run logs run402-mcp version in evidence.json.

## Log

- 2026-03-20: Completed Step 0 (version check), Step 1A (endpoints, 12 files), Step 1B (prompts), Step 1C (gate2-test — SIWX auth fix, deployment_id fix, all 13 PASS), Step 1E (Amplify deployed, WebFetch verified). Pushed `23ba129`.
- 2026-03-20: Completed Step 2 — bld402-compat test in run402 repo (42/42 PASS). Added npm script and AGENTS.md docs.
- 2026-03-20: Discovered run402 CLI (`npx run402`) — separate npm package with full command set. Shares wallet with MCP. Rewrote Step 1D to test CLI first, then MCP. Added Step 1F for website updates.

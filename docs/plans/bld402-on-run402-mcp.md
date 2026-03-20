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

- [ ] 0.1: Add version check to gate2-test/run.mjs — `npm view run402-mcp version` vs `npx run402-mcp --version`
- [ ] 0.2: If outdated, auto-update with `npx run402-mcp@latest` before proceeding
- [ ] 0.3: Log the run402-mcp version in evidence.json for every test run

---

## Step 1: Fix all stale content and get everything aligned

### 1A: Fix API endpoints in website pages

All `/v1/xxx` paths must become `/xxx/v1` per the endpoint map above.

- [ ] 1A.1: `public/agent.json` — fix steps 9 (`/v1/faucet`→`/faucet/v1`), 10 (`/v1/projects`→`/projects/v1`), 11 (`/admin/v1/projects/:id/sql`→`/projects/v1/admin/:id/sql`), 12 (`/admin/v1/projects/:id/rls`→`/projects/v1/admin/:id/rls`)
- [ ] 1A.2: `public/build/step/9.html` — faucet endpoint
- [ ] 1A.3: `public/build/step/10.html` — project creation endpoint (3 occurrences)
- [ ] 1A.4: `public/build/step/11.html` — SQL execute + schema endpoints
- [ ] 1A.5: `public/build/step/12.html` — RLS endpoint
- [ ] 1A.6: `public/build/step/15.html` — endpoint reference table
- [ ] 1A.7: `public/build/step/18.html` — SQL endpoint in update step
- [ ] 1A.8: `public/build/step/20.html` — renew/upgrade endpoints
- [ ] 1A.9: `public/build/step/5.html` — functions endpoint
- [ ] 1A.10: `public/build/step/6.html` — quote endpoint
- [ ] 1A.11: `public/build/guardrails.html` — functions endpoint

### 1B: Fix mcp-install.html prompts

Per user feedback: prompts should say "Install run402-mcp and build me a..." — the install instruction IS the prompt.

- [ ] 1B.1: Primary CTA: `Install run402-mcp and build me a shared todo app`
- [ ] 1B.2: Secondary examples: same pattern with different app ideas
- [ ] 1B.3: "Already installed" section: `Use run402-mcp to build me a recipe sharing app`
- [ ] 1B.4: "What happens next" copy — verify accuracy with run402-mcp flow

### 1C: Fix Gate 2 test script

- [ ] 1C.1: Verify all endpoints in `showcase/gate2-test/run.mjs` match the endpoint map
- [ ] 1C.2: Run Gate 2 with `--keep --pin` for all 13 templates
- [ ] 1C.3: All 13 must PASS — if any fail, debug and fix (could be run402 API or test script)

### 1D: Test via run402-mcp (not just raw API)

Gate 2 tests the raw HTTP API. We also need to verify run402-mcp tools work correctly.

- [ ] 1D.1: Install run402-mcp locally: `claude mcp add run402 -- npx -y run402-mcp`
- [ ] 1D.2: Build one template (shared-todo) end-to-end using MCP tools only (provision_postgres_project, run_sql, deploy_site, claim_subdomain)
- [ ] 1D.3: If MCP tools fail, file bugs against run402-mcp and track here
- [ ] 1D.4: Build a second template (paste-locker, which uses functions) via MCP tools

### 1E: Deploy and verify live site

- [ ] 1E.1: Commit and push all fixes
- [ ] 1E.2: Verify Amplify deploys successfully
- [ ] 1E.3: WebFetch `bld402.com/llms.txt` — confirm run402-mcp install instructions
- [ ] 1E.4: WebFetch `bld402.com/humans/mcp-install.html` — confirm prompt wording
- [ ] 1E.5: WebFetch a build step page — confirm correct endpoints

### 1F: Red team — build each template from scratch

- [ ] 1F.1: Red team agent reads bld402.com/llms.txt and attempts to build shared-todo
- [ ] 1F.2: Red team agent attempts each of the 13 templates using only bld402.com instructions
- [ ] 1F.3: Document any failures, wrong paths, confusing instructions
- [ ] 1F.4: Blue team fixes all issues found

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

- [ ] 2.1: Design the test script — pick 3 representative templates (simple DB, functions, no-DB)
- [ ] 2.2: Write `test/bld402-compat.test.mjs` in the run402 repo
- [ ] 2.3: Include template SQL, RLS, and HTML from bld402 repo (copy or fetch)
- [ ] 2.4: Add wallet preservation (same pattern as gate2-test --keep)
- [ ] 2.5: Add to run402 CI/CD pipeline (or document as manual pre-release step)
- [ ] 2.6: Run the test against current run402 — verify it passes
- [ ] 2.7: Document in run402 AGENTS.md or CONTRIBUTING.md

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

## Notes

- **Wallet preservation:** Test wallet at `showcase/.wallet` must NEVER be deleted between test cycles. Admin faucet (`/faucet/v1/admin`) is used to top up without rate limits.
- **MCP version check:** Every test run should verify run402-mcp is at the latest version before proceeding.
- **run402 is being updated in parallel** — coordinate with run402 changes before running Step 1C/1D.

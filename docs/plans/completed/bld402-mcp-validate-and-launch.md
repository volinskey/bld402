# bld402-mcp — Simplify, Validate & Launch Plan

**Repo:** https://github.com/kychee-com/bld402-mcp
**Local:** `c:\Workspace-Kychee\bld402-mcp`
**Status:** Needs redesign — currently 15 granular tools that are too similar to run402-mcp
**Goal:** Simplify to 4 high-level tools, validate end-to-end, publish to npm, update bld402.com

---

## Phase 0: Simplify MCP (MUST DO FIRST)

### The Problem

bld402-mcp currently has 15 tools that mirror run402-mcp (setup, create_project, run_sql, setup_rls, deploy_function, set_secret, deploy, etc.). The calling agent needs to orchestrate a 7-step sequence to build an app. This defeats the purpose of bld402 — non-technical users shouldn't need an agent that understands SQL, RLS, or wallet auth.

### The Fix: 4 Tools

| Tool | What the agent does | What bld402-mcp does internally |
|------|--------------------|---------------------------------|
| `bld402_browse` | "What can I build?" | Returns template list, template code, or build guide |
| `bld402_build` | "Build this app" → gets a live URL | Wallet + faucet + tier + project + SQL + RLS + functions + secrets + deploy + subdomain — ALL in one call |
| `bld402_update` | "Change X and redeploy" | Runs SQL changes + deploys updated functions + redeploys site + reassigns subdomain |
| `bld402_status` | "What's deployed?" | Returns wallet, project, deployment URL from persisted session |

**The difference from run402-mcp:** run402-mcp = 40+ power tools for developers who know what SQL and RLS are. bld402-mcp = 4 tools where one call = one live app. The agent describes what to build, bld402-mcp does everything else.

### 0.1: Implement `bld402_browse`

**File:** `src/tools/browse.ts` (new — replaces `list-templates.ts`, `get-template.ts`, `get-guide.ts`)

**Parameters:**
```typescript
{
  action: z.enum(["list", "template", "guide"]).describe(
    "list = show all 13 templates, template = get full source code for one, guide = get build capabilities and rules"
  ),
  name: z.string().optional().describe(
    "Template name (required when action is 'template')"
  ),
  section: z.enum(["capabilities", "design", "patterns", "api", "all"]).optional().describe(
    "Guide section (only used when action is 'guide', defaults to 'all')"
  ),
}
```

**Implementation:** Reuse `templates.ts` and guide content from `get-guide.ts`. Merge the three read-only tools into one. Keep all existing template metadata and guide text.

### 0.2: Implement `bld402_build`

**File:** `src/tools/build.ts` (new — replaces `setup.ts`, `create-project.ts`, `run-sql.ts`, `setup-rls.ts`, `deploy-function.ts`, `set-secret.ts`, `deploy.ts`, `generate-image.ts`)

**Parameters:**
```typescript
{
  name: z.string().describe(
    "App name (used as project name and subdomain, e.g. 'my-todo-app')"
  ),
  template: z.string().optional().describe(
    "Template name to build from (e.g. 'shared-todo'). If omitted, must provide sql + files."
  ),
  sql: z.string().optional().describe(
    "SQL migrations (CREATE TABLE, INSERT, etc.). Overrides template SQL if both provided."
  ),
  rls: z.object({
    template: z.enum(["user_owns_rows", "public_read", "public_read_write"]),
    tables: z.array(z.object({
      table: z.string(),
      owner_column: z.string().optional(),
    })),
  }).optional().describe(
    "Row-level security config. Overrides template RLS if both provided."
  ),
  files: z.array(z.object({
    file: z.string(),
    data: z.string(),
    encoding: z.enum(["utf-8", "base64"]).optional(),
  })).optional().describe(
    "Site files to deploy. Overrides template HTML if both provided. Must include index.html."
  ),
  functions: z.array(z.object({
    name: z.string(),
    code: z.string(),
  })).optional().describe(
    "Serverless functions to deploy. Overrides template functions if both provided."
  ),
  secrets: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).optional().describe(
    "Secrets to set (e.g. API keys). Injected as process.env in functions."
  ),
  tier: z.enum(["prototype", "hobby", "team"]).default("prototype").describe(
    "Tier: prototype ($0.10/7d), hobby ($5/30d), team ($20/30d). Default: prototype."
  ),
}
```

**Internal flow (all automatic, agent doesn't see any of this):**

```
1.  Load or create wallet (~/.config/run402/wallet.json)
2.  Check USDC balance on Base Sepolia
3.  If balance < tier cost → request faucet → wait for tx confirmation
4.  Subscribe to tier (x402 payment)
5.  Create project (wallet auth) → get project_id, anon_key, service_key
6.  If template provided and no sql override → load template SQL from bundled files
7.  If template provided and no rls override → load template RLS from bundled files
8.  If template provided and no files override → load template HTML from bundled files
9.  If template provided and no functions override → load template functions from bundled files
10. Run SQL migrations (service_key auth)
11. Wait 500ms (schema reload)
12. Apply RLS (service_key auth)
13. Deploy functions if any (service_key auth) — loop through each
14. Set secrets if any (service_key auth) — loop through each
15. Inject anon_key into index.html (replace placeholder or add CONFIG block)
16. Deploy site (wallet auth)
17. Claim subdomain (service_key auth)
18. Smoke test (fetch live URL, retry up to 3x)
19. Persist session to ~/.config/run402/bld402-session.json
20. Return: live URL, subdomain URL, anon_key, project_id, tables created, tier expiry
```

**Return format:**
```markdown
## Your app is live!

**https://my-todo-app.run402.com**

| Field | Value |
|-------|-------|
| project_id | `prj_...` |
| anon_key | `eyJ...` |
| tier | prototype |
| expires | 2026-03-21 |
| tables | todos, categories |

Share this link with anyone. To make changes, use `bld402_update`.
Free redeploys — change as many times as you want.
```

**Key design decisions:**
- If `template` is provided with no overrides, the tool builds the template exactly as-is (zero-config deploy)
- If `template` is provided WITH overrides (e.g. custom `sql`), the override wins for that field only
- If NO `template`, then `sql` and `files` are required
- The anon_key must be injected into the HTML. Look for `{ANON_KEY}` or `'ANON_KEY_PLACEHOLDER'` in the template HTML and replace. If not found, inject a `<script>` block with `window.BLD402_CONFIG = { API_URL, ANON_KEY }` before `</head>`
- ALL error handling happens inside — if faucet fails, if tier fails, if SQL fails, if deploy fails — return a clear error message, not a stack trace

**Reuse from existing code:**
- `wallet.ts` — loadWallet, createWallet, checkBalance, subscribeTier, signWalletAuth (keep as-is)
- `client.ts` — apiRequest (keep as-is)
- `config.ts` — getApiBase, getWalletPath (keep as-is)
- `session.ts` — getSession, updateSession (keep as-is)
- `templates.ts` — getTemplate, listTemplates (keep as-is)
- `errors.ts` — formatApiError, text, error (keep as-is)

### 0.3: Implement `bld402_update`

**File:** `src/tools/update.ts` (new — handles iteration)

**Parameters:**
```typescript
{
  files: z.array(z.object({
    file: z.string(),
    data: z.string(),
    encoding: z.enum(["utf-8", "base64"]).optional(),
  })).describe(
    "Updated site files to deploy. Must include index.html."
  ),
  sql: z.string().optional().describe(
    "Additional SQL to run before redeploy (ALTER TABLE, INSERT, etc.)"
  ),
  functions: z.array(z.object({
    name: z.string(),
    code: z.string(),
  })).optional().describe(
    "Functions to deploy or update."
  ),
  secrets: z.array(z.object({
    key: z.string(),
    value: z.string(),
  })).optional().describe(
    "Secrets to add or update."
  ),
}
```

**Internal flow:**
```
1. Load session (must have projectId, serviceKey, walletAddress)
2. If no session → error: "No app deployed yet. Use bld402_build first."
3. Run SQL if provided (service_key auth)
4. Wait 500ms if SQL ran
5. Deploy/update functions if provided (service_key auth)
6. Set secrets if provided (service_key auth)
7. Redeploy site (wallet auth)
8. Reassign subdomain to new deployment (service_key auth)
9. Smoke test
10. Update session
11. Return: updated URL + what changed
```

**Return format:**
```markdown
## App updated!

**https://my-todo-app.run402.com** (same link still works)

Changes applied:
- Added column `priority` to table `todos`
- Redeployed site (2 files updated)
```

### 0.4: Update `bld402_status`

**File:** `src/tools/status.ts` (modify existing)

Keep mostly the same, but update error messages to reference `bld402_build` instead of `bld402_setup` / `bld402_create_project`.

### 0.5: Update `src/index.ts`

**Rewrite** to register only 4 tools:

```typescript
server.tool("bld402_browse", "Browse 13 ready-made app templates, get full source code, or read the build guide.", browseSchema, ...);
server.tool("bld402_build", "Build and deploy a complete web app in one call. Handles everything: wallet, payments, database, security, hosting. Returns a live URL.", buildSchema, ...);
server.tool("bld402_update", "Update a deployed app: change the UI, add database columns, update functions. Redeploy is free.", updateSchema, ...);
server.tool("bld402_status", "Check what's deployed: wallet, project, database tables, live URL.", statusSchema, ...);
```

### 0.6: Delete Old Tool Files

Delete these files from `src/tools/`:
- `list-templates.ts`
- `get-template.ts`
- `get-guide.ts`
- `setup.ts`
- `create-project.ts`
- `run-sql.ts`
- `setup-rls.ts`
- `deploy.ts`
- `deploy-function.ts`
- `invoke-function.ts`
- `get-function-logs.ts`
- `set-secret.ts`
- `upload-file.ts`
- `generate-image.ts`

### 0.7: Keep These Files Unchanged

- `src/config.ts`
- `src/client.ts`
- `src/errors.ts`
- `src/wallet.ts`
- `src/session.ts`
- `src/templates.ts`
- `templates/` directory (all 13 templates + patterns)

### 0.8: Build & Verify

- `npx tsc --noEmit` — must pass with zero errors
- `npm run build` — must produce dist/
- Verify only 4 tools are registered

### 0.9: Commit & Push

Single commit: "Simplify bld402-mcp: 15 tools → 4 (browse, build, update, status)"

---

## Phase A: Red-Team Testing

### A1: Fresh Install

**Setup:** Delete `~/.config/run402/wallet.json`, `bld402-session.json`, and `projects.json` if they exist.

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | `npx bld402-mcp` starts without errors | MCP server connects on stdio, no crash | |
| 2 | Call `bld402_status` with no prior build | Returns "No app deployed yet. Use bld402_build." | |
| 3 | Call `bld402_browse` with action `"list"` | Returns all 13 templates | |
| 4 | Call `bld402_browse` with action `"template"`, name `"shared-todo"` | Returns schema.sql, rls.json, index.html, README | |
| 5 | Call `bld402_browse` with action `"template"`, name `"nonexistent"` | Returns error | |
| 6 | Call `bld402_browse` with action `"guide"` | Returns capabilities + design + patterns + API ref | |

### A2: Build from Template (zero-config)

**Setup:** Clean state (no wallet, no session).

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 7 | Call `bld402_build` with name `"test-todo"`, template `"shared-todo"` | Creates wallet, faucet, tier, project, SQL, RLS, deploy, subdomain — returns live URL | |
| 8 | Open the returned URL in a browser | App loads, no console errors | |
| 9 | Add a todo item, check it off | CRUD works | |
| 10 | Call `bld402_status` | Shows wallet, tier, project, tables, deployment URL, subdomain | |
| 11 | Check `~/.config/run402/bld402-session.json` | Contains all session fields | |

### A3: Build from Template with Overrides

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 12 | Call `bld402_build` with template `"shared-todo"` but custom `sql` that adds an extra column | Builds with template defaults + extra column | |
| 13 | Call `bld402_build` with template `"shared-todo"` but custom `files` (modified HTML) | Builds with template SQL/RLS but custom frontend | |

### A4: Build from Scratch (no template)

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 14 | Call `bld402_build` with name, sql, rls, files (no template) | Builds custom app, returns live URL | |
| 15 | Open URL, verify it works | Loads, CRUD works | |
| 16 | Call `bld402_build` with no template AND no sql/files | Returns clear error: "Provide a template name or sql + files" | |

### A5: Build Template with Functions (paste-locker)

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 17 | Call `bld402_build` with template `"paste-locker"` | Deploys DB + RLS + create-note function + read-note function + site — all in one call | |
| 18 | Open app, create a paste with password, read it back | Full flow works end-to-end | |

### A6: Update (Iterate)

**Prereq:** A2 passed (test-todo deployed).

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 19 | Call `bld402_update` with modified files (change a heading) | Redeploys, same subdomain | |
| 20 | Open subdomain URL | Shows updated heading | |
| 21 | Call `bld402_update` with sql `"ALTER TABLE todos ADD COLUMN priority text"` + updated files | Column added, site redeployed | |
| 22 | Use the app with the new priority field | Works | |
| 23 | Call `bld402_update` with no active session (clean state) | Error: "No app deployed yet. Use bld402_build first." | |

### A7: Session Persistence

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 24 | Complete A2, then kill and restart the MCP server | — | |
| 25 | Call `bld402_status` after restart | Shows same project and URL | |
| 26 | Call `bld402_update` with updated files after restart | Redeploys successfully | |

### A8: Error Handling

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 27 | `bld402_build` with invalid SQL (`CREATE EXTENSION pg_trgm`) | Returns clear error about blocked SQL, does NOT leave a half-built project | |
| 28 | `bld402_build` with files missing `index.html` | Returns error | |
| 29 | `bld402_build` with reserved subdomain (`"api"`) | Subdomain fails, falls back to deployment URL | |
| 30 | `bld402_build` when faucet is rate-limited | Clear message: "Wait 24h or fund wallet at https://run402.com/billing?wallet=..." | |

### A9: Agent Integration Tests

#### A9a: Claude Code

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 31 | Add bld402-mcp to Claude Code MCP config | Server starts, 4 tools appear | |
| 32 | Ask: "What templates does bld402 have?" | Agent calls `bld402_browse(list)`, shows 13 templates | |
| 33 | Ask: "Build me a shared todo app" | Agent calls `bld402_build(template: "shared-todo")` — ONE tool call — returns live URL | |
| 34 | Ask: "Add a priority field to each todo" | Agent calls `bld402_update` with SQL + updated files | |
| 35 | Ask: "Build me a recipe sharing app" (no template) | Agent calls `bld402_browse(guide)` for patterns, then `bld402_build` with custom sql/files | |

**Claude Code MCP config:**
```json
{
  "mcpServers": {
    "bld402": {
      "command": "npx",
      "args": ["bld402-mcp"]
    }
  }
}
```

#### A9b: Codex (if available)

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 36 | Configure bld402-mcp as MCP server | 4 tools available | |
| 37 | Ask: "Build me a voting app" | One `bld402_build` call → live URL | |

#### A9c: Cursor (if available)

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 38 | Add bld402-mcp to Cursor MCP settings | 4 tools available | |
| 39 | Ask: "Build a hangman game with bld402" | One `bld402_build` call → live URL | |

### A10: All 13 Templates Build

Each template should deploy with a single `bld402_build(name, template)` call.

| # | Template | One-call build? | App works? | Notes |
|---|----------|-----------------|------------|-------|
| 40 | shared-todo | | | |
| 41 | landing-waitlist | | | |
| 42 | voting-booth | | | |
| 43 | paste-locker | | | auto-deploys 2 functions |
| 44 | micro-blog | | | has auth |
| 45 | photo-wall | | | has auth + frontend uploads |
| 46 | secret-santa | | | auto-deploys draw-names function |
| 47 | flash-cards | | | has auth |
| 48 | hangman | | | |
| 49 | trivia-night | | | |
| 50 | ai-sticker-maker | | | image gen is frontend-side |
| 51 | bingo-card-generator | | | |
| 52 | memory-match | | | |

---

## Phase B: Fix Issues from Red Team

1. Triage: CRITICAL (blocks basic flow) vs HIGH (breaks specific template) vs LOW (polish)
2. Fix all CRITICAL and HIGH in bld402-mcp repo
3. Re-run failed tests
4. Bump version, rebuild, re-push

---

## Phase C: npm Publish

1. Review package.json (name, version, description, keywords)
2. `npm publish` from the bld402-mcp repo
3. Verify `npx bld402-mcp` works from a clean npm cache
4. Test the Claude Code config snippet from A9a with the published package

---

## Phase D: Update bld402.com Website

### D1: New Pages

| Page | URL | Content |
|------|-----|---------|
| What is MCP? | `/mcp` | Simple explainer: "MCP lets your AI assistant use tools. bld402-mcp gives it the tools to build and deploy web apps for you." Diagram: You → AI Agent → bld402-mcp → run402 → Live App |
| Install Guide | `/mcp/install` | Step-by-step for Claude Code, Cursor, Codex. JSON config snippet + "ask your agent to build something." |
| FAQ | `/mcp/faq` | Plain language Q&A (see D2) |
| Safety | `/mcp/safety` | What bld402-mcp can/cannot do, cost limits, testnet explanation, data handling |

### D2: FAQ Content (plain language)

```
Q: What does bld402-mcp do?
A: It gives your AI assistant the ability to build and deploy web apps for you.
   You describe what you want, your assistant does the rest.

Q: How much does it cost?
A: Nothing to try. It uses free test money. If you want to keep your app running
   long-term, plans start at $5/month.

Q: Is it safe?
A: Yes. It only creates web apps on run402 servers. It can't access your files,
   send emails, or do anything outside of building your app.

Q: What can it build?
A: Web apps with databases, user accounts, file uploads, and more. 13 templates
   included (todo lists, games, blogs, voting apps) or build custom apps from scratch.

Q: What AI assistants work with it?
A: Claude Code, Cursor, and any tool that supports MCP (Model Context Protocol).

Q: How do I install it?
A: Add one line to your AI assistant's settings. See the install guide.

Q: What happens after 7 days?
A: Prototype apps go read-only, then get archived. Upgrade to keep running ($5/month).

Q: Can other people use my app?
A: Yes! You get a shareable link (like myapp.run402.com) that works on any device.
```

### D3: Homepage Update

Add a section to bld402.com homepage:
- "Install bld402-mcp and let your AI build for you"
- One-liner: `npx bld402-mcp`
- Link to /mcp

### D4: Templates Showcase

Each template page should show:
- "Build this in one command" example
- MCP config snippet
- "Ask your agent: Build me a [template name]"

---

## Phase E: Post-Launch Validation

| # | Check | Pass? |
|---|-------|-------|
| 1 | bld402.com/mcp loads correctly | |
| 2 | Install guide works for Claude Code | |
| 3 | FAQ answers are accurate | |
| 4 | Safety page matches actual behavior | |
| 5 | A new user with only the website instructions can get a working app | |

---

## Fix Cycle 1 — System Test Failures

**Source:** `docs/plans/bld402-mcp_system_test.md` (Cycle 1, verdict: FAIL)
**Date:** 2026-03-15
**Findings:** 5 failures accepted, 0 disputed, 0 needs-info

### F-001: Wrong Tier Subscription Endpoint (P0 Critical)

- [x] In `src/wallet.ts` line 156, change `/tiers/v1/subscribe/${tier}` to `/tiers/v1/${tier}`
- [x] Verify endpoint path matches run402 API docs (`POST /tiers/v1/:tier`)

### F-002: `bld402_update` Requires `files` — Cannot Run SQL-Only Updates (P1)

- [x] In `src/tools/update.ts`, add `.optional()` to the `files` field in `updateSchema`
- [x] Update `handleUpdate` function signature to make `files` optional
- [x] Guard the index.html validation (line 67) — skip if `args.files` is undefined
- [x] Skip redeploy step (Steps 4-6: injection, redeploy, subdomain reassign) when `files` is undefined
- [x] Skip smoke test when no files were deployed
- [x] Adjust return message to reflect what was actually changed

### F-003: Wallet Address Not EIP-55 Checksummed (P1)

- [x] In `src/wallet.ts` `createWallet()`, replace manual address derivation (lines 45-52) with `privateKeyToAccount(privateKey).address`
- [x] Remove unused imports (`createECDH` from `node:crypto`, `keccak_256` from `@noble/hashes`) if no longer needed elsewhere

### F-004: Injection Placeholder Variant Inconsistency (P3)

- [x] Extract the 4-variant ANON_KEY injection logic from `build.ts` `injectAnonKey()` into a shared utility
- [x] Update `update.ts` to use the shared injection function instead of its inline 2-variant logic
- [x] Both build and update paths must handle: `{ANON_KEY}`, `'ANON_KEY_PLACEHOLDER'`, `"ANON_KEY_PLACEHOLDER"`, bare `ANON_KEY_PLACEHOLDER`

### F-005: Session Stores Wrong Subdomain URL for Reserved Names (P2)

- [x] In `src/tools/build.ts` line 361, change the `subdomainUrl` fallback from `https://${args.name}.run402.com` to `result.site_url || undefined`
- [x] Verify `liveUrl` computation on line 365 still works correctly with this change

### Verification

- [x] Run `npx tsc --noEmit` — zero errors
- [x] Run `npm run build` — produces dist/
- [x] Commit all fixes (b02644e)

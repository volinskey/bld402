# bld402-mcp — Validate & Launch Plan

**Spec:** `docs/products/bld402/bld402-spec.md`
**Repo:** https://github.com/kychee-com/bld402-mcp
**Local:** `c:\Workspace-Kychee\bld402-mcp`
**Website:** `c:\Workspace-Kychee\bld402\public\`
**Status:** In Progress
**Goal:** Add remove tool, write CLI, update website, validate with REAL deploys, publish to npm

---

## Completed Work

Phase 0 (simplify 15→5 tools) and Fix Cycles 1-3 (7 bug fixes) are done. See git history.

Current tools: `bld402_browse`, `bld402_build`, `bld402_update`, `bld402_status` + shared `inject.ts`.

---

## Phase 1: Update bld402.com Website

Add MCP pages to the bld402.com website per the original plan spec.
Website root: `c:\Workspace-Kychee\bld402\public\`
Follow existing page patterns (GA4 tag, style.css, nav, Inter/JetBrains fonts).

- [x] 1.1: Create `/humans/mcp.html` — "What is MCP?" explainer page
- [x] 1.2: Create `/humans/mcp-install.html` — Install guide
- [x] 1.3: Create `/humans/mcp-faq.html` — MCP FAQ
- [x] 1.4: Create `/humans/mcp-safety.html` — Safety page
- [x] 1.5: Update homepage (`/humans/index.html`) with MCP section
- [x] 1.6: Add MCP link to site navigation
- [x] 1.7: Deploy website updates

---

## Phase 2: Add `bld402_remove` Tool

Add a 5th tool to delete/archive a deployed project. Required for cleanup during testing.
API: `DELETE /v1/projects/:id` (service_key auth, free)

- [x] 2.1: Create `src/tools/remove.ts`
  - Parameters: none (uses session's projectId) or optional `project_id`
  - Flow: load session → validate → `DELETE /v1/projects/:id` with service_key → clear session → confirm
  - Also release subdomain: `DELETE /subdomains/v1/:name` with service_key
  - Clear session state after successful delete
  - Error if no active project

- [x] 2.2: Register in `src/index.ts`
  - Add 5th tool: `bld402_remove` — "Delete the current app and clean up. Releases the subdomain and archives the project."

- [x] 2.3: Build and verify
- [x] 2.4: Commit and push

---

## Phase 3: Write bld402 CLI

Write a CLI that mirrors the MCP tools so the product can be tested without an MCP client.
Same binary package — add a `bld402` CLI entry point alongside `bld402-mcp`.

- [x] 3.1: Create `src/cli.ts` — CLI entry point
  - `#!/usr/bin/env node`
  - Parse commands: `bld402 browse`, `bld402 build`, `bld402 update`, `bld402 status`, `bld402 remove`
  - Use same tool handlers (handleBrowse, handleBuild, etc.)
  - Convert ToolResult to plain text stdout output
  - Use minimist or manual arg parsing (no heavy deps)
  - CLI arg mapping:
    ```
    bld402 browse list
    bld402 browse template shared-todo
    bld402 browse guide [section]
    bld402 build --name my-app --template shared-todo [--tier prototype]
    bld402 build --name my-app --sql "CREATE TABLE..." --files index.html:./index.html
    bld402 update --sql "ALTER TABLE..." [--files index.html:./path]
    bld402 update --files index.html:./index.html
    bld402 status
    bld402 remove [--project-id prj_...]
    ```
  - For `--files`: read from local filesystem (path after colon), support multiple files
  - For `--sql`: accept inline string or `--sql-file path`
  - For `--functions`: accept `--function name:path` (read code from file)
  - `--help` for each command

- [x] 3.2: Add `bld402` bin entry to `package.json`
- [x] 3.3: Build and verify
- [x] 3.4: Commit and push

---

## Phase 4: Validate with REAL Builds

Red Team MUST actually deploy templates, test them live, then remove them.
Test BOTH the CLI and the MCP tools. Build real apps, open URLs, verify CRUD works.

### 4.1: CLI Smoke Tests

- [ ] 4.1a: `bld402 browse list` — returns 13 templates
- [ ] 4.1b: `bld402 browse template shared-todo` — returns schema + HTML
- [ ] 4.1c: `bld402 browse guide` — returns full guide
- [ ] 4.1d: `bld402 status` with no session — returns "No app deployed"

### 4.2: CLI Build + Test + Remove (shared-todo)

- [ ] 4.2a: Clean state — delete wallet.json and bld402-session.json
- [ ] 4.2b: `bld402 build --name test-todo --template shared-todo` — returns live URL
- [ ] 4.2c: Fetch the live URL — HTML loads, contains anon_key (not placeholder)
- [ ] 4.2d: `bld402 status` — shows project, tables, URL
- [ ] 4.2e: `bld402 update --sql "ALTER TABLE todos ADD COLUMN priority text"` — succeeds
- [ ] 4.2f: `bld402 remove` — project deleted, session cleared
- [ ] 4.2g: `bld402 status` — shows "No app deployed"

### 4.3: CLI Build + Test + Remove (paste-locker — has functions)

- [ ] 4.3a: `bld402 build --name test-paste --template paste-locker` — deploys with functions
- [ ] 4.3b: Fetch the live URL — loads correctly
- [ ] 4.3c: `bld402 remove` — cleaned up

### 4.4: CLI Build from Scratch (no template)

- [ ] 4.4a: `bld402 build --name test-scratch --sql "CREATE TABLE items..." --files index.html:./test-index.html`
- [ ] 4.4b: Fetch URL — works
- [ ] 4.4c: `bld402 remove` — cleaned up

### 4.5: CLI Error Handling

- [ ] 4.5a: `bld402 build` with no args — clear error
- [ ] 4.5b: `bld402 update` with no session — clear error
- [ ] 4.5c: `bld402 remove` with no session — clear error
- [ ] 4.5d: `bld402 update` with no args — "Nothing to update" error

### 4.6: MCP Tool Tests (via CLI proxy or direct invocation)

- [ ] 4.6a: Start MCP server, verify 5 tools registered
- [ ] 4.6b: Call bld402_build via MCP — returns live URL
- [ ] 4.6c: Call bld402_status via MCP — shows project
- [ ] 4.6d: Call bld402_remove via MCP — cleans up

### 4.7: Website Validation

- [ ] 4.7a: Verify bld402.com/humans/mcp.html loads
- [ ] 4.7b: Verify install guide has correct config snippets
- [ ] 4.7c: Verify FAQ content is accurate
- [ ] 4.7d: Verify safety page matches actual tool behavior
- [ ] 4.7e: Verify nav links work from all pages

---

## Phase 5: npm Publish (LAST)

Only after Phase 4 passes with REAL deploys.

- [ ] 5.1: Review package.json — name, version, description, keywords, bin entries
- [ ] 5.2: `npm publish` from bld402-mcp repo
- [ ] 5.3: Verify `npx bld402-mcp` works from clean npm cache
- [ ] 5.4: Verify `npx bld402 browse list` works (CLI entry point)
- [ ] 5.5: Test Claude Code MCP config snippet with published package

---

## Implementation Notes

- **Bundle deploy API:** `POST /deploy/v1` does project + SQL + RLS + functions + secrets + site + subdomain in one call. Used by `bld402_build`.
- **Delete API:** `DELETE /v1/projects/:id` with service_key auth. Free. Archives project (permanent delete at day 37).
- **Subdomain release:** `DELETE /subdomains/v1/:name` with service_key auth.
- **Subdomain POST is idempotent** — safe to call on every deploy (upserts).
- **Tier endpoint:** `POST /tiers/v1/:tier` (NOT `/subscribe/:tier` — fixed in F-001).
- **CLI reads files from disk** — `--files index.html:./path` reads the file at `./path` and sends it as `index.html`.
- **Shared inject.ts** — anon_key injection logic used by both build.ts and update.ts.

## Log

- 2026-03-15: Phase 0 complete — 15 tools simplified to 4
- 2026-03-15: Fix Cycles 1-3 — 7 bugs fixed (F-001 through F-007)
- 2026-03-15: Plan restructured — website first, add remove tool, write CLI, real validation, publish last
- 2026-03-15: Phase 1 complete — 4 MCP pages + nav + homepage section added to bld402.com
- 2026-03-15: Phase 2 complete — bld402_remove tool added (5th MCP tool)
- 2026-03-15: Phase 3 complete — bld402 CLI created with browse/build/update/status/remove commands

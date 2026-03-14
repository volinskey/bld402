# bld402-mcp — Validate & Launch Plan

**Repo:** https://github.com/kychee-com/bld402-mcp
**Status:** Built (14 MCP tools), not yet published to npm
**Goal:** Validate the MCP server works end-to-end, then update bld402.com to guide users to it.

---

## Phase A: Red-Team Testing

Run each test scenario below. For each one, record: PASS / FAIL / BLOCKED, and any notes.

### A1: Fresh Install (clean machine simulation)

**Setup:** Delete `~/.config/run402/wallet.json` and `~/.config/run402/projects.json` if they exist.

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 1 | `npx bld402-mcp` starts without errors | MCP server connects on stdio, no crash | |
| 2 | Call `bld402_status` with no wallet | Returns "No wallet found. Run bld402_setup." | |
| 3 | Call `bld402_list_templates` | Returns all 13 templates in two tables (utility + games) | |
| 4 | Call `bld402_get_template` with `"shared-todo"` | Returns schema.sql, rls.json, index.html, README | |
| 5 | Call `bld402_get_template` with `"nonexistent"` | Returns error, suggests using list_templates | |
| 6 | Call `bld402_get_guide` with section `"all"` | Returns capabilities + design + patterns + API ref | |
| 7 | Call `bld402_get_guide` with section `"capabilities"` | Returns only capabilities section | |

### A2: Setup Flow (wallet + faucet + tier)

**Setup:** Delete `~/.config/run402/wallet.json` if it exists.

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 8 | Call `bld402_setup` (default tier) | Creates wallet, requests faucet, waits for tx, subscribes to prototype tier. Returns wallet address + tier status. | |
| 9 | Check `~/.config/run402/wallet.json` exists | File exists with address, privateKey, created, funded fields | |
| 10 | Call `bld402_setup` again (idempotent) | Loads existing wallet, skips faucet (balance sufficient), re-subscribes or reports already subscribed | |
| 11 | Call `bld402_status` | Shows wallet address, balance, tier = prototype, expiry date | |

### A3: Full Build — Template Path

**Prereq:** A2 passed (setup complete).

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 12 | Call `bld402_create_project` with name `"test-todo"` | Returns project_id, anon_key, service_key, schema_slot | |
| 13 | Call `bld402_get_template` with `"shared-todo"` | Returns full template | |
| 14 | Call `bld402_run_sql` with the template's schema.sql | Tables created, listed in response | |
| 15 | Call `bld402_setup_rls` with the template's rls.json config | RLS applied, confirms template + tables | |
| 16 | Call `bld402_deploy` with the template's index.html (with anon_key injected) | Returns deployment URL + subdomain URL | |
| 17 | Open the subdomain URL in a browser | App loads, renders correctly, no console errors | |
| 18 | Interact with the app (add a todo, check it off) | CRUD operations work via REST API | |
| 19 | Call `bld402_status` | Shows full state: wallet, tier, project, tables, RLS, deployment URL | |

### A4: Full Build — From Scratch

**Prereq:** A2 passed.

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 20 | Call `bld402_create_project` with name `"test-scratch"` | Returns project credentials | |
| 21 | Call `bld402_run_sql` with custom CREATE TABLE | Tables created | |
| 22 | Call `bld402_setup_rls` with `public_read_write` | RLS applied | |
| 23 | Call `bld402_deploy` with a hand-written index.html | Live URL returned | |
| 24 | Open URL, verify the app works | Loads, data operations succeed | |

### A5: Redeploy (Iterate)

**Prereq:** A3 passed (test-todo deployed).

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 25 | Modify the index.html (change a heading) | — | |
| 26 | Call `bld402_deploy` again with updated files | New deployment, same subdomain reassigned | |
| 27 | Open subdomain URL | Shows updated heading | |
| 28 | Call `bld402_run_sql` with ALTER TABLE (add column) | Column added | |
| 29 | Deploy updated frontend that uses the new column | Works end-to-end | |

### A6: Error Handling & Edge Cases

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 30 | Call `bld402_create_project` WITHOUT running setup first (fresh state) | Clear error: "Run bld402_setup first" | |
| 31 | Call `bld402_run_sql` without a project | Clear error: "Run bld402_create_project first" | |
| 32 | Call `bld402_deploy` without a project | Clear error about missing project | |
| 33 | Call `bld402_run_sql` with invalid SQL (`CREATE EXTENSION pg_trgm`) | Returns 403 with explanation (blocked SQL) | |
| 34 | Call `bld402_setup_rls` with `user_owns_rows` but no `owner_column` | Returns error or API rejects | |
| 35 | Call `bld402_deploy` with files but no `index.html` | Returns error from API | |
| 36 | Call `bld402_deploy` with subdomain using reserved word (`"api"`) | Subdomain claim fails, falls back to deployment URL | |
| 37 | Call `bld402_setup` when faucet is rate-limited (run twice within 24h) | Second call: skips faucet if balance sufficient, or returns clear rate-limit message | |

### A7: Agent Integration Tests

Test with real AI agents to verify the MCP server works in practice.

#### A7a: Claude Code

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 38 | Add bld402-mcp to Claude Code MCP config | Server starts, tools appear in tool list | |
| 39 | Ask: "List the bld402 templates" | Agent calls `bld402_list_templates`, shows 13 templates | |
| 40 | Ask: "Build me a shared todo app" | Agent uses template path: setup → create project → SQL → RLS → deploy. Returns live URL. | |
| 41 | Ask: "Add a priority field to each todo" | Agent calls run_sql (ALTER TABLE), updates HTML, redeploys | |
| 42 | Ask: "Build me a recipe sharing app" (no template match) | Agent uses from-scratch path with get_guide for patterns | |

**Claude Code MCP config to test with:**
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

#### A7b: Codex (if available)

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 43 | Configure bld402-mcp as MCP server in Codex | Tools available | |
| 44 | Ask: "Build me a voting app using bld402" | Agent follows template path, deploys successfully | |

#### A7c: Cursor (if available)

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 45 | Add bld402-mcp to Cursor MCP settings | Tools available | |
| 46 | Ask: "Use bld402 to build a hangman game" | Agent follows template path, deploys successfully | |

### A8: Functions, Secrets & Storage Tools

**Prereq:** A2 passed (setup complete), fresh project created.

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 60 | Call `bld402_deploy_function` with a simple echo function | Returns function URL, status, runtime | |
| 61 | Call `bld402_invoke_function` on the deployed function | Returns response body and status 200 | |
| 62 | Call `bld402_get_function_logs` for the function | Returns log entries from the invocation | |
| 63 | Call `bld402_set_secret` with key `TEST_KEY`, value `test123` | Confirms secret set | |
| 64 | Deploy function that reads `process.env.TEST_KEY`, invoke it | Response contains `test123` | |
| 65 | Call `bld402_upload_file` to bucket `public`, path `test.txt` | Returns key and size | |
| 66 | Call `bld402_deploy_function` without a project | Clear error: "Run bld402_create_project first" | |
| 67 | Call `bld402_set_secret` without a project | Clear error: "Run bld402_create_project first" | |
| 68 | Call `bld402_invoke_function` without a project | Clear error: "Run bld402_create_project first" | |
| 69 | Call `bld402_get_function_logs` for a function that doesn't exist | Returns error or "no logs found" | |

### A9: Template with Functions (paste-locker end-to-end)

**Prereq:** A2 passed.

| # | Test | Expected | Pass? |
|---|------|----------|-------|
| 70 | Create project `"test-paste-locker"` | Project created | |
| 71 | Get template `"paste-locker"` | Returns schema.sql, rls.json, index.html, + functions (create-note, read-note) | |
| 72 | Run schema.sql | Tables created | |
| 73 | Setup RLS from template rls.json | RLS applied | |
| 74 | Deploy function `create-note` with template code | Function deployed, URL returned | |
| 75 | Deploy function `read-note` with template code | Function deployed, URL returned | |
| 76 | Deploy site with index.html (anon_key injected) | Live URL returned | |
| 77 | Open app, create a paste, read it back with password | Full flow works | |

### A10: All 13 Templates Deploy

Verify every single template can be deployed end-to-end.

| # | Template | Deploys? | App works? | Extra tools needed | Notes |
|---|----------|----------|------------|--------------------|-------|
| 78 | shared-todo | | | none | |
| 79 | landing-waitlist | | | none | |
| 80 | voting-booth | | | none | |
| 81 | paste-locker | | | deploy_function x2 | create-note, read-note functions |
| 82 | micro-blog | | | none | has auth |
| 83 | photo-wall | | | none | has auth + frontend file upload |
| 84 | secret-santa | | | deploy_function, set_secret | draw-names function + possible secrets |
| 85 | flash-cards | | | none | has auth |
| 86 | hangman | | | none | |
| 87 | trivia-night | | | none | |
| 88 | ai-sticker-maker | | | none | image generation is frontend-side x402 |
| 89 | bingo-card-generator | | | none | |
| 90 | memory-match | | | none | |

**Notes:**
- Templates with serverless functions (paste-locker, secret-santa) need the agent to call `bld402_deploy_function` for each function file and `bld402_set_secret` for any required API keys.
- Photo-wall uses file uploads — frontend handles these via the storage API, but the agent can use `bld402_upload_file` to seed test data.
- AI-sticker-maker uses image generation which costs $0.03/image via x402 (not handled by bld402-mcp — the frontend calls the API directly).

---

## Phase B: Fix Issues from Red Team

After completing Phase A, collect all FAIL items and fix them:

1. Triage: CRITICAL (blocks basic flow) vs HIGH (breaks specific template) vs LOW (polish)
2. Fix all CRITICAL and HIGH in bld402-mcp repo
3. Re-run failed tests
4. Bump version, rebuild, re-push

---

## Phase C: npm Publish

Once Phase A + B pass:

1. Review package.json (name, version, description, keywords)
2. `npm publish` from the bld402-mcp repo
3. Verify `npx bld402-mcp` works from a clean npm cache
4. Test the Claude Code config snippet from A7a with the published package

---

## Phase D: Update bld402.com Website

### D1: New Pages

| Page | URL | Content |
|------|-----|---------|
| What is MCP? | `/mcp` | Simple explainer: "MCP lets your AI assistant use tools. bld402-mcp gives it the tools to build and deploy web apps for you." Diagram showing: You → AI Agent → bld402-mcp → run402 → Live App |
| Install Guide | `/mcp/install` | Step-by-step for Claude Code, Cursor, Codex. Just the JSON config snippet + "ask your agent to build something." |
| FAQ | `/mcp/faq` | Plain language Q&A (see D2 below) |
| Safety | `/mcp/safety` | What bld402-mcp can/cannot do, cost limits, testnet explanation, data handling |

### D2: FAQ Content (plain language, no jargon)

```
Q: What does bld402-mcp do?
A: It gives your AI assistant the ability to build and deploy web apps for you. You describe what you want, your assistant does the rest.

Q: How much does it cost?
A: Nothing to try. It uses free test money. If you want to keep your app running long-term, plans start at $5/month.

Q: Is it safe?
A: Yes. It only creates web apps on run402 servers. It can't access your files, send emails, or do anything outside of building your app. All payments use test money by default.

Q: What can it build?
A: Web apps with databases, user accounts, file uploads, and more. It comes with 13 ready-made templates (todo lists, games, blogs, voting apps) and can build custom apps from scratch.

Q: What AI assistants work with it?
A: Claude Code, Cursor, and any AI tool that supports MCP (Model Context Protocol).

Q: How do I install it?
A: Add one line to your AI assistant's settings. See the install guide for your specific tool.

Q: What happens after 7 days?
A: Prototype apps go read-only for a week, then get archived. Upgrade to keep them running ($5/month), or just rebuild — it's free.

Q: Can other people use my app?
A: Yes! You get a shareable link (like myapp.run402.com) that works on any phone or computer.
```

### D3: Homepage Update

Add a section to the bld402.com homepage:
- "New: Install bld402-mcp and let your AI build for you"
- One-liner install: `npx bld402-mcp`
- Link to /mcp page

### D4: Templates Showcase Update

Each template page should show:
- "Build this with one command" example
- The MCP config snippet
- "Ask your agent: Build me a [template name]"

---

## Phase E: Post-Launch Validation

After D is live:

| # | Check | Pass? |
|---|-------|-------|
| 1 | bld402.com/mcp loads correctly | |
| 2 | Install guide works for Claude Code | |
| 3 | FAQ answers are accurate | |
| 4 | Safety page matches actual behavior | |
| 5 | A new user with only the website instructions can get a working app | |

---

## Known Gaps to Address

1. **Session state is in-memory only** — If the MCP server restarts mid-build, state is lost. Consider persisting session to `~/.config/run402/bld402-session.json`.

2. **Template function files not auto-deployed** — `bld402_get_template` returns function code, but the agent needs to know to call `bld402_deploy_function` for each one. Add guidance in the tool response when functions are present.

3. **AI image generation ($0.03/image) is frontend-side x402** — The bld402-mcp server doesn't proxy image generation. The frontend calls the run402 API directly with the user's wallet. This works but the agent can't test it.

# Plan: bld402

**Owner:** unassigned
**Created:** 2026-03-04
**Status:** In Progress
**Spec:** docs/products/bld402/bld402-spec.md
**Spec-Version:** 0.1.0
**Source:** spec

## Legend
- `[ ]` Todo | `[~]` In Progress | `[x]` Done

---

## Implementation Notes

### Key Decisions

- **Agent memory format:** Structured JSON in `<script type="application/json" id="agent-memory">` tags within each step page. Most parseable across agent platforms. May revisit after multi-agent testing.
- **`/agent.json` schema:** Defined in this plan (Phase 1). Flat array of workflow steps with id, url, phase, inputs, outputs, next/branch fields. Versioned with a `schema_version` field.
- **MVP templates (5):** Shared Todo List, Landing Page + Waitlist, Hangman, Trivia Night, Voting Booth. Remaining 22 templates deferred to Phase 6.
- **Static site on AWS Amplify:** No server-side logic. All workflow content is pre-built HTML + JSON. Template matching and branching are agent-side decisions guided by page content.
- **run402 API reference:** Sourced from the run402 repo (`C:/Workspace - Eleanor/run402`). Must sync before each implementation session.
- **Common pattern templates:** Auth flow, CRUD operations, file upload, responsive layout, navigation — built as reusable snippets agents compose into full apps.

### `/agent.json` Schema

```json
{
  "schema_version": "1.0",
  "product": "bld402",
  "description": "Build and deploy web apps by describing what you want.",
  "guardrails_url": "/build/guardrails",
  "templates_url": "/templates/",
  "phases": ["spec", "plan", "implement", "deploy", "iterate"],
  "steps": [
    {
      "id": 1,
      "phase": "spec",
      "title": "Describe your app",
      "url": "/build/step/1",
      "instruction": "Ask the user what they want to build.",
      "inputs": [],
      "outputs": ["app_description"],
      "next": 2
    }
  ]
}
```

**Step fields:**
- `id` (number) — unique step identifier, sequential
- `phase` (string) — one of: spec, plan, implement, deploy, iterate
- `title` (string) — human-readable step name
- `url` (string) — path to the step's HTML page with full instructions
- `instruction` (string) — brief summary; full details on the step page
- `inputs` (string[]) — what the agent needs before this step (from memory)
- `outputs` (string[]) — what the agent produces and must remember
- `next` (number | null) — default next step id
- `branch` (object, optional) — conditional branching: `{ "condition": "description", "if_true": step_id, "if_false": step_id }`

### Agent-Instruction HTML Format

Every step page follows this structure inside `<section id="agent-instructions">`:

```html
<section id="agent-instructions">
  <h2>Step N: Title</h2>

  <div id="context">
    <h3>Context</h3>
    <p>What the agent knows at this point. References prior outputs.</p>
  </div>

  <div id="instruction">
    <h3>What to do</h3>
    <p>Plain-language instruction for the agent to relay to the user.</p>
    <!-- Technical details the agent needs (API calls, SQL, etc.) -->
  </div>

  <div id="expected-output">
    <h3>Expected output</h3>
    <p>What to produce before moving on. Format description.</p>
  </div>

  <div id="memory-directive">
    <h3>Memory directive</h3>
    <p>Store the following in memory to continue the process:</p>
    <script type="application/json" id="agent-memory">
    {
      "carry_forward": ["key1", "key2"],
      "store": { "new_key": "description of what to store" },
      "discard": ["key_no_longer_needed"]
    }
    </script>
  </div>

  <div id="next-step">
    <h3>Next step</h3>
    <p><a href="/build/step/N+1">Continue to Step N+1: Title</a></p>
  </div>
</section>
```

### Gotchas

- **PostgREST schema cache:** After DDL migrations, there's a 100-500ms reload delay. Step pages must instruct agents to wait/retry after SQL execution.
- **x402 payment flow:** Agents need crypto wallet capabilities to pay for run402 services. The faucet flow (testnet) avoids this for prototypes, but the step pages must clearly explain the payment dance.
- **Deployment is immutable:** Each deploy to `/v1/deployments` creates a new URL. Agents must track all deployment URLs in memory and communicate the latest to users.
- **Lease expiry (7 days for prototype):** Step pages must warn about this during deploy and iterate phases. Guide upgrade path.
- **SQL blocklist:** run402 blocks certain SQL statements (CREATE EXTENSION, COPY PROGRAM, ALTER SYSTEM, etc.). Templates must only use allowed SQL.
- **RLS templates are limited:** Only 3 templates available (user_owns_rows, public_read, public_read_write). Complex permission models need manual SQL policies.

---

## Tasks

### Phase 1: Project Setup & Core Architecture

- [x] Initialize static site project (HTML/CSS/JS, no build tools) with directory structure: `/public` for served files, `/templates` for app templates, `/src` for shared components
- [x] Set up AWS Amplify deployment pipeline (connect repo, configure build settings, set up bld402.com domain placeholder)
- [x] Design and document `/agent.json` schema — define step structure (id, url, phase, title, instruction, inputs, outputs, next, branch), workflow graph, and versioning
- [x] Create `/agent.json` manifest file with all build workflow steps defined (spec → plan → implement → deploy → iterate)
- [x] Design the agent-instruction HTML format — define the `<section id="agent-instructions">` structure including: context block, instruction block, expected output format, memory directive (`<script type="application/json" id="agent-memory">`), and next-step link
- [x] Create shared page layout/shell for step pages (consistent header, navigation, semantic HTML structure, agent-instruction section template)

### Phase 2: Agent Onboarding & Root Pages

- [x] Build root page (`/`) — "Humans go here" link as first line, then agent-optimized content: what bld402 is, what it can build, link to `/agent.json`, entry point to build workflow
- [x] Build `/agent.json` endpoint (static JSON file served at this path) with complete workflow catalog
- [x] Build capability guardrails page/data — definitive list of what run402 cannot do (F7), formatted for agent consumption, referenced by step pages during spec and plan phases

### Phase 3: Build Workflow — Step Pages

- [x] Build Spec Phase step pages (F2): Step 1 — ask what the app does; Step 2 — template matching suggestions; Step 3 — clarifying questions (yes/no, multiple choice, plain language only); Step 4 — confirm spec summary. Each page includes agent-instructions and memory directives.
- [x] Build Plan Phase step pages (F3): Step 5 — determine run402 services needed; Step 6 — select tier (default Prototype/testnet); Step 7 — identify code template(s); Step 8 — output build plan to agent memory
- [x] Build Implement Phase step pages (F4): Step 9 — get testnet USDC via faucet; Step 10 — provision run402 project; Step 11 — create database tables via SQL; Step 12 — configure RLS; Step 13 — generate frontend code from template; Step 14 — test locally (instructions for agent to verify code)
- [x] Build Deploy Phase step pages (F5): Step 15 — deploy to run402 `/v1/deployments`; Step 16 — confirm deployment and present URL to user
- [x] Build Iterate Phase step pages (F6): Step 17 — gather user feedback; Step 18 — modify code based on feedback; Step 19 — redeploy (loop back to Step 15); Step 20 — satisfaction check (done or iterate again). Include memory continuity directives.

### Phase 4: Code Templates — Common Patterns

- [x] Build common pattern: run402 database connection snippet (API URL construction, apikey header, service_key admin header)
- [x] Build common pattern: auth flow snippet (signup, login, token refresh, logout, session management in browser localStorage)
- [x] Build common pattern: CRUD operations snippet (PostgREST GET/POST/PATCH/DELETE with filters, pagination, ordering)
- [x] Build common pattern: file upload snippet (storage API upload, download, signed URLs, list objects)
- [x] Build common pattern: responsive layout snippet (mobile-first CSS grid/flexbox, navigation, standard UI components)
- [x] Build common pattern: polling snippet (timed fetch for "real-time" updates, replace WebSocket pattern)

### Phase 5: Code Templates — MVP App Templates (5)

- [x] Build template: Shared Todo List — SQL schema (todos table with user_id, task, done, created_at), RLS (user_owns_rows), frontend (task list, add/edit/delete, checkbox toggle, assignment)
- [x] Build template: Landing Page + Waitlist — SQL schema (signups table with email, created_at), RLS (public_read_write for inserts, service_role for reads), frontend (hero section, features, email signup form, thank you state)
- [x] Build template: Hangman — SQL schema (games table with word, guesses, status), RLS (public_read_write), frontend (word display, letter buttons, hangman drawing SVG, win/lose state, pass-and-play mode)
- [x] Build template: Trivia Night — SQL schema (rooms, questions, players, answers tables), RLS (public_read for questions, user_owns_rows for answers), frontend (host create room, player join via code, question display, answer submission, live scoring via polling)
- [x] Build template: Voting Booth — SQL schema (polls, options, votes tables), RLS (public_read for polls/options, one-vote-per-user for votes), frontend (create poll, share link, vote, live results bar chart via polling)

### Phase 6: Human-Facing Pages

- [x] Build `/humans` landing page with navigation to all human sections
- [x] Build About page — what bld402 is, how it works, relationship to run402, plain language
- [x] Build How It Works page — step-by-step: 1) talk to AI, 2) describe what you want, 3) point agent to bld402.com, 4) get working app with shareable link
- [x] Build Showcase page — gallery of 5 example apps with screenshots (use MVP templates as examples). "Want to build one? Point your agent here."
- [x] Build Terms & Conditions page — free layer, no warranty, run402 T&C apply
- [x] Build Privacy Policy page — bld402 stores nothing, run402 privacy policy governs stored data
- [x] Build `/templates` browsable gallery — all available templates with descriptions, screenshots, and "start from this template" links into build workflow

### Phase 7: Payment Pass-Through (F11)

- [x] Add faucet guidance to implement phase step pages — instruct agent to call `/v1/faucet` with user's wallet address (or guide wallet creation), explain testnet is free
- [x] Add tier selection and pricing display to plan phase step pages — show run402 pricing from `/v1/projects/quote`, default to Prototype/testnet
- [x] Add lease expiry warnings to deploy and iterate phase step pages — warn about 7-day prototype expiry, guide upgrade to hobby/team tier or mainnet
- [x] Document Stripe subscription upgrade path in iterate phase — link to `/v1/stripe/checkout` flow for users who want to keep their app running

### Phase 8: Integration Testing & Polish

- [ ] End-to-end walkthrough: simulate an agent building the Shared Todo List app by following every step page from root → deploy → iterate
- [ ] End-to-end walkthrough: simulate an agent building the Trivia Night app (multiplayer template, more complex)
- [ ] Test guardrail flow: simulate agent receiving an impossible request and verify guardrail page content catches it
- [ ] Test returning user flow: simulate agent resuming from memory directives alone (no prior context)
- [ ] Cross-agent format validation: verify `/agent.json`, step pages, and memory directives parse correctly for ChatGPT, Claude, and Gemini agents
- [ ] Accessibility and mobile check on human-facing pages
- [ ] Final review of all step page content for plain-language compliance (no jargon in user-facing instructions)

---

## Deferred

### Remaining 22 Templates (post-MVP)
Templates 3-15 (utility) and 18-27 (games) per the spec. To be added in a future plan cycle after MVP validation.

### MCP Server Integration
Per spec open question: only if installation can be made seamless. Deferred until agent testing reveals whether it's needed.

### App Gallery
Public gallery where users optionally publish apps. Deferred until there are apps to showcase.

### Agent Memory Format Testing
Test structured JSON format across ChatGPT, Claude, Gemini. If issues found, may switch to structured markdown or hybrid. Phase 8 includes initial cross-agent validation.

---

## Log

- 2026-03-04: Plan created from spec v0.1.0. MVP scope: 5 templates, 8 phases. Deferred 22 templates and MCP integration.
- 2026-03-04: Phase 1 complete — project scaffolding, agent.json schema + manifest, agent-instruction HTML format, step page template.
- 2026-03-04: Phases 2-7 complete — all 20 step pages, guardrails page, 6 common patterns, 5 MVP templates (todo, landing, hangman, trivia, voting), all human-facing pages, templates gallery. 51 files total. Phase 8 (integration testing) remains.

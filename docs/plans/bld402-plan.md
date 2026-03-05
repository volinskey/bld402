# Plan: bld402

**Owner:** unassigned
**Created:** 2026-03-04
**Status:** In Progress
**Spec:** docs/products/bld402/bld402-spec.md
**Spec-Version:** 0.2.0
**Source:** spec
**Cycle:** 2

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
- **Subdomain support (v0.2.0):** run402 now supports `POST /v1/subdomains` to claim memorable URLs like `hangman.run402.com`. Free, requires `service_key` auth. Step pages 15-16 need updating. Guardrails need updating (subdomains are no longer impossible).
- **Live showcase apps (v0.2.0):** 5 demo apps deployed to run402 on Hobby tier. Each gets its own subdomain, its own run402 project, and is individually validated. The showcase page links directly to the live apps.
- **Hobby tier for showcases:** Showcase apps use Hobby ($5/month) instead of Prototype (7-day expiry) so they stay live permanently. Each app is a separate run402 project.
- **Validation per app:** Each showcase app is validated individually via `/validate` red team testing against its live URL. This is a requirement in the spec (F12).

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
- **Subdomain reserved words:** run402 blocks: api, www, mail, ftp, admin, blog, shop, store, app, dashboard, portal, status, docs, help, support, sites, cdn, static, assets, media, images, img, ns1-4, mx, smtp, pop, imap, dev, staging, test, demo, beta, alpha, preview, run402, agentdb. Our chosen names (todo, waitlist, hangman, trivia, vote) are all safe.
- **Showcase app provisioning requires x402:** Each `POST /v1/projects` costs $5 (Hobby tier) paid via x402 USDC on Base mainnet. Need to ensure the wallet has sufficient USDC before provisioning.

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

- [x] End-to-end walkthrough: simulate an agent building the Shared Todo List app by following every step page from root → deploy → iterate
- [x] End-to-end walkthrough: simulate an agent building the Trivia Night app (multiplayer template, more complex)
- [x] Test guardrail flow: simulate agent receiving an impossible request and verify guardrail page content catches it
- [x] Test returning user flow: simulate agent resuming from memory directives alone (no prior context)
- [x] Cross-agent format validation: verify `/agent.json`, step pages, and memory directives parse correctly for ChatGPT, Claude, and Gemini agents
- [x] Accessibility and mobile check on human-facing pages
- [x] Final review of all step page content for plain-language compliance (no jargon in user-facing instructions)

### Phase 9: Fix Cycle 1 — System Test Fixes

- [x] Fix F-001: shared-todo template missing schema.sql (P1) — Verified `templates/utility/shared-todo/schema.sql` exists with correct columns (id, task, done, assigned_to, user_id, created_at) matching frontend code. All 5 MVP templates confirmed to have schema.sql.
- [x] Fix F-002: 4 of 5 templates missing README.md (P2) — Created README.md for landing-waitlist, hangman, trivia-night, and voting-booth templates following shared-todo README structure. All 5 MVP templates confirmed to have README.md.
- [x] Fix F-003: Template gallery cards link to build workflow (P1) — Added "Build with this template" links to all 5 active MVP template cards in `public/templates/index.html`, pointing to `/build/step/1?template={name}`. Coming-soon templates remain unlinked.
- [x] Fix F-004: Showcase page screenshots (P1) — Created 5 SVG mockup screenshots in `public/humans/images/` and added `<img>` tags with descriptive alt text to each showcase card. All 5 images render as app previews.
- [x] Fix F-005: Legal page (P2) — Created `public/humans/legal.html` with legal notices (operator, IP, open source, trademarks, disclaimer, governing law). Added "Legal" link to footer of all 8 pages (6 human pages + legal.html + templates gallery).

### Phase 10: Subdomain Support — Step Page & Guardrail Updates

- [x] Update Step 15 (deploy) — add subdomain claiming via `POST /v1/subdomains` with `{ name, deployment_id }` using `service_key`. Show example request/response. Explain subdomain rules (3-63 chars, lowercase, no reserved words). Update memory directive to store `subdomain` and `subdomain_url`.
- [x] Update Step 16 (confirm deployment) — present the subdomain URL (`https://{name}.run402.com`) as the primary shareable link instead of the raw `dpl-*` URL. Update user-facing message template.
- [x] Update Step 19 (redeploy) — instruct agent to reassign the existing subdomain to the new deployment_id after redeployment.
- [x] Update guardrails page — change "Custom domain names" entry from "not possible" to "run402 subdomains (myapp.run402.com) are supported; fully custom domains are not."
- [x] Update `/agent.json` — add subdomain_url to deploy phase step outputs; update step 15/16 instructions to reference subdomain claiming.

### Phase 11: Build & Deploy Showcase App 1 — Shared Todo List (`todo.run402.com`)

- [ ] Provision a run402 project on Hobby tier for the todo app — create project via API, get credentials (project_id, anon_key, service_key, api_url)
- [ ] Create database schema — `todos` table (id serial PK, task text NOT NULL, done boolean DEFAULT false, assigned_to text, user_id uuid, created_at timestamptz DEFAULT now()). Apply `public_read_write` RLS.
- [ ] Build frontend (HTML/CSS/JS) from the shared-todo template — customize with real API URL and credentials, add "Built with bld402" branding, polling every 5 seconds, mobile-responsive layout
- [ ] Insert seed data — 3 example tasks: "Buy groceries for the party" (Alex), "Set up the playlist" (Jordan, done), "Send invites to everyone" (Sam)
- [ ] Deploy to run402 via `POST /v1/deployments`, claim subdomain `todo` via `POST /v1/subdomains`
- [ ] Verify app loads at https://todo.run402.com — all CRUD operations work, seed data visible, mobile responsive

### Phase 12: Build & Deploy Showcase App 2 — Landing Page + Waitlist (`waitlist.run402.com`)

- [ ] Provision a run402 project on Hobby tier — get credentials
- [ ] Create database schema — `signups` table (id serial PK, email text UNIQUE NOT NULL, created_at timestamptz DEFAULT now()). Apply `public_read_write` RLS for inserts.
- [ ] Build frontend from landing-waitlist template — hero section with "Something Amazing is Coming", email signup form, position counter, duplicate email handling, "Built with bld402" branding
- [ ] Insert seed data — 15-20 fake email signups so first real visitor sees "#21 on the waitlist"
- [ ] Deploy and claim subdomain `waitlist`
- [ ] Verify app loads at https://waitlist.run402.com — signup works, position counter shows, duplicate email handled

### Phase 13: Build & Deploy Showcase App 3 — Hangman (`hangman.run402.com`)

- [ ] Provision a run402 project on Hobby tier — get credentials
- [ ] Create database schema — `words` table (id, word, category, difficulty) and `games` table (id, word_id, guesses text[], status, created_at). Apply `public_read` for words, `public_read_write` for games.
- [ ] Build frontend from hangman template — SVG hangman drawing (6 stages), word blanks, A-Z letter grid, win/loss counter (session), play again, "Built with bld402" branding, mobile-responsive
- [ ] Insert seed data — 50+ words across 3 difficulty levels (easy: 4-5 letters, medium: 6-7, hard: 8+)
- [ ] Deploy and claim subdomain `hangman`
- [ ] Verify app loads at https://hangman.run402.com — game plays through win and loss scenarios, word list loads from DB

### Phase 14: Build & Deploy Showcase App 4 — Trivia Night (`trivia.run402.com`)

- [ ] Provision a run402 project on Hobby tier — get credentials
- [ ] Create database schema — `rooms` (id, code, host_name, status, current_question, created_at), `questions` (id, room_id, question_text, options jsonb, correct_index, time_limit, order_num), `players` (id, room_id, name, score, joined_at), `answers` (id, player_id, question_id, selected_index, answered_at, unique on player_id+question_id). Apply RLS: `public_read` rooms/questions, `public_read_write` players/answers.
- [ ] Build frontend from trivia-night template — host flow (create room → get code → start game), player flow (enter code → pick name → answer), question screen with 4 color-coded buttons + countdown timer, scoreboard, polling every 2 seconds, "Built with bld402" branding, mobile-first
- [ ] Insert seed data — 3 question sets (10 questions each): General Knowledge, Movies & TV, Food & Drink
- [ ] Deploy and claim subdomain `trivia`
- [ ] Verify app loads at https://trivia.run402.com — host can create room, players can join, game plays through full cycle

### Phase 15: Build & Deploy Showcase App 5 — Voting Booth (`vote.run402.com`)

- [ ] Provision a run402 project on Hobby tier — get credentials
- [ ] Create database schema — `polls` (id, question, slug, is_open, admin_token, created_at), `options` (id, poll_id, label, order_num), `votes` (id, option_id, voter_token, created_at, unique on poll+voter). Apply RLS: `public_read` polls/options, `public_read_write` votes.
- [ ] Build frontend from voting-booth template — create poll screen (question + 2-6 options), poll view with vote buttons, horizontal bar chart results with percentages, polling every 3 seconds, one-vote-per-browser via localStorage, admin close poll, "Built with bld402" branding, mobile-responsive
- [ ] Insert seed data — 1 example poll: "What's the best pizza topping?" (Pepperoni, Mushrooms, Pineapple, Extra Cheese, Olives) with 25-30 random votes
- [ ] Deploy and claim subdomain `vote`
- [ ] Verify app loads at https://vote.run402.com — create poll works, voting works, results chart updates, duplicate vote prevented

### Phase 16: Update Showcase Page & Final Integration

- [ ] Update `public/humans/showcase.html` — replace SVG placeholder screenshots with real screenshots of the live apps; add clickable links to each app's `*.run402.com` URL on every card
- [ ] Update `public/humans/how-it-works.html` — verify the example URL (`https://trivia.run402.com`) still makes sense now that it's a real live app
- [ ] Smoke test all 5 live apps from the showcase page — click each link, verify it loads, interact briefly

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
- 2026-03-04: Completed "Trivia Night E2E walkthrough" — Fixed 4 issues: duplicate answer error handling, minimum player check before start, score race condition (switched to atomic RPC), player timer expiry feedback.
- 2026-03-04: Completed "Guardrail flow test" — Added guardrail-targeted questions to Step 3 and mandatory guardrail re-scan to Step 4.
- 2026-03-04: Completed "Returning user flow test" — Added resume guidance to root page and agent.json for agents with existing bld402_project memory.
- 2026-03-04: Completed "Cross-agent format validation" — All JSON valid, consistent structure across 20 pages, compatible with ChatGPT/Claude/Gemini.
- 2026-03-04: Completed "Accessibility & mobile check" — Added skip-link, focus styles, aria-label, mobile-responsive nav, replaced inline styles with CSS classes across all 6 human pages.
- 2026-03-04: Completed "Plain-language compliance" — All user-facing blockquotes verified jargon-free.
- 2026-03-04: **Plan complete.** All 8 phases implemented: project setup, root pages, 20 step pages, 6 common patterns, 5 MVP templates, human-facing pages, payment pass-through, integration testing with fixes.
- 2026-03-04: Plan continued — System test cycle 1 returned FAIL (51/62 passed, 6 failed, 1 gap). All 5 failures accepted. Added Phase 9: Fix Cycle 1 with 5 fix tasks (3x P1, 2x P2). Each task includes regression test requirement.
- 2026-03-04: Phase 9 complete — All 5 fix cycle tasks resolved. F-001: schema.sql verified correct. F-002: 4 READMEs created. F-003: 5 build workflow links added to template gallery. F-004: 5 SVG mockup screenshots created and embedded. F-005: legal.html created, Legal link added to all page footers.
- 2026-03-05: Plan continued — Spec updated to v0.2.0 with F12 (Live Showcase Apps) and subdomain support. Added Phases 10-16: subdomain step page updates, 5 showcase app build/deploy phases, final showcase page integration. 38 new tasks total.
- 2026-03-05: Completed Phase 10 "Subdomain Support" — Updated step 15 (deploy with subdomain claiming), step 16 (present subdomain URL as primary), step 19 (reassign subdomain on redeploy), guardrails (custom domains → subdomains supported), step 3 (domain question updated), and agent.json (subdomain fields in deploy/iterate steps).

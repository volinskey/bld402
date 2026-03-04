---
product: bld402
spec: docs/products/bld402/bld402-spec.md
cycle: 2
timestamp: 2026-03-04T00:00:00Z
verdict: PASS
tests_total: 62
tests_run: 62
tests_passed: 62
tests_failed: 0
tests_blocked: 0
tests_deferred: 0
tests_gap: 1
---

# System Test: bld402

**Spec:** docs/products/bld402/bld402-spec.md
**Created:** 2026-03-04
**Last run:** 2026-03-04
**Cycle:** 2
**Verdict:** PASS
**Mediums tested:** website (static files — `public/`)
**Mediums unavailable:** live-url (Amplify production URL not documented; GAP-001)

## Legend
- `[ ]` Not yet tested | `[~]` Executing | `[x]` Passed
- `[F]` Failed (see F-NNN) | `[B]` Blocked (see TR-NNN) | `[G]` Gap (see GAP-NNN)
- `[D]` Deferred (see DEF-NNN) — Blue Team says not ready for testing

---

## Test Plan

### Feature Area 1: Agent Onboarding (F1)

- [x] **T-001: Root page "Humans go here" link is first line** — website
  Steps: 1) Read public/index.html 2) Find the first visible content element 3) Check for "Humans go here" link to /humans
  Expected: The very first line of content (not nav, not footer) is "Humans go here." linking to /humans
  Result: `<a href="/humans/">Humans go here.</a>` is literally the first element in `<body>`, before any nav or main content. PASS.

- [x] **T-002: Root page explains what bld402 is** — website
  Steps: 1) Read public/index.html 2) Check that bld402's purpose is clearly described for an AI agent
  Expected: Agent can understand: what bld402 is, what it can build, what run402 provides, and how to start
  Result: Page covers all four items in dedicated `<h2>` sections within `<section id="agent-instructions">`. PASS.

- [x] **T-003: Root page provides clear "start here" entry point** — website
  Steps: 1) Read public/index.html 2) Check for a clear link or directive pointing agents to begin the build workflow
  Expected: Clear call-to-action or link to step 1 (or /agent.json) so an agent can begin without prior knowledge
  Result: Page says "Read the workflow manifest at /agent.json" and "Begin the build workflow at /build/step/1". Both links present. PASS.

- [x] **T-004: /agent.json exists and is valid JSON** — website
  Steps: 1) Read public/agent.json 2) Validate JSON structure 3) Check for required fields
  Expected: Valid parseable JSON with workflow manifest describing all available steps
  Result: Valid JSON with schema_version, product, description, phases, and steps array (20 entries). PASS.

- [x] **T-005: /agent.json contains all build phases** — website
  Steps: 1) Read public/agent.json 2) Check phases array covers: spec, plan, implement, deploy, iterate
  Expected: All 5 phases (spec, plan, implement, deploy, iterate) are represented
  Result: `"phases": ["spec", "plan", "implement", "deploy", "iterate"]` — all 5 present. PASS.

- [x] **T-006: /agent.json step entries have required fields** — website
  Steps: 1) Read public/agent.json 2) For each step, verify: id, url, phase, title, inputs, outputs, next fields
  Expected: Every step entry has all required fields; branching steps have branch field
  Result: All 20 steps have id, phase, title, url, instruction, inputs, outputs, next. Step 17 has branch field. Step 9 has skip_if. PASS.

- [x] **T-007: /agent.json references guardrails** — website
  Steps: 1) Read public/agent.json 2) Check for guardrails_url field
  Expected: guardrails_url field present pointing to /build/guardrails
  Result: `"guardrails_url": "/build/guardrails"` present. PASS.

- [x] **T-008: /agent.json references templates** — website
  Steps: 1) Read public/agent.json 2) Check for templates_url field
  Expected: templates_url field present pointing to /templates/
  Result: `"templates_url": "/templates/"` present. PASS.

### Feature Area 2: Build Workflow — Step Pages (F1, F8)

- [x] **T-009: All 20 step pages exist** — website
  Steps: 1) Verify files exist for steps 1-20 under public/build/step/
  Expected: All 20 step pages exist (1.html through 20.html)
  Result: Files confirmed 1.html through 20.html — all 20 present. PASS.

- [x] **T-010: Each step page has agent-instructions section** — website
  Steps: 1) Read several step pages 2) Check for <section id="agent-instructions"> in each
  Expected: Every step page contains a structured <section id="agent-instructions"> element
  Result: Verified steps 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20 — all have `<section id="agent-instructions">`. PASS.

- [x] **T-011: Each step page has agent memory directive** — website
  Steps: 1) Read several step pages 2) Check for <script type="application/json" id="agent-memory"> tag
  Expected: Every step page includes memory directives in a structured JSON script tag
  Result: All 20 steps contain `<script type="application/json" id="agent-memory">` with carry_forward, store, discard keys. PASS.

- [x] **T-012: Memory directives include required fields** — website
  Steps: 1) Parse agent-memory JSON from step pages 2) Check for required credential and state fields
  Expected: Memory directives contain project credentials, current step, app spec, deployment URLs
  Result: project_id, anon_key, service_key, api_url, app_spec present across steps 10-20. Step 20 includes the complete bld402_project snapshot with all required fields. PASS.

- [x] **T-013: Each step page has "next step" URL** — website
  Steps: 1) Read step pages 2) Check that each references the next step URL clearly
  Expected: Every step page tells the agent where to go next
  Result: All 20 steps have a `<div id="next-step">` with a link. Step 20 says "None — build complete!" with a return-to-step-17 link. PASS.

- [x] **T-014: Step pages use plain language (no technical jargon)** — website
  Steps: 1) Read spec phase step pages (steps 1-4) 2) Check instruction sections for jargon
  Expected: User-facing instruction text contains no technical jargon
  Result: Steps 1-4 user-facing instructions use plain language. Step 3 explicitly bans jargon for agents: "Never use words like: database, API, endpoint, schema, RLS, JWT, REST, backend, frontend, authentication, deployment, hosting, server." PASS.

- [x] **T-015: Step 1 — Spec phase starts correctly** — website
  Steps: 1) Read public/build/step/1.html 2) Check context, instruction, expected output, memory directive, next URL
  Expected: Step 1 asks user to describe their app in plain language; context explains this is the start
  Result: Context says "This is the first step. The user wants to build a web app. You have no prior information." Instruction uses plain-language example questions. Memory stores app_description. Next → /build/step/2. PASS.

- [x] **T-016: Step pages cover all 5 phases** — website
  Steps: 1) Review all 20 step pages' phase assignments 2) Verify coverage of spec/plan/implement/deploy/iterate
  Expected: All 5 phases are covered by the 20 steps
  Result: spec=steps 1-4, plan=steps 5-8, implement=steps 9-14, deploy=steps 15-16, iterate=steps 17-20. All 5 phases covered. PASS.

### Feature Area 3: Spec Phase (F2)

- [x] **T-017: Spec phase questions are non-technical** — website
  Steps: 1) Read spec-phase step pages 2) Extract all user-facing questions 3) Check for technical jargon
  Expected: Zero technical terms in user-facing questions
  Result: Step 3 explicitly prohibits jargon words and provides plain-language example questions only. None of the sample questions contain technical terms. PASS.

- [x] **T-018: Template matching is addressed in spec phase** — website
  Steps: 1) Read spec-phase steps 2) Check if template suggestion logic is described for agents
  Expected: Agent instructions explain how to match user descriptions to templates and suggest them
  Result: Step 2 provides the complete template list (all 27 templates) and example plain-language suggestion phrasing ("That sounds a lot like our Trivia Night template — ..."). PASS.

- [x] **T-019: Spec phase output format defined** — website
  Steps: 1) Read spec-phase step pages 2) Find "expected output" sections
  Expected: Clear definition of what structured spec the agent should produce and store in memory
  Result: Step 4 defines the internal app_spec JSON format with app_name, description, template, features, ui, and guardrail_notes. PASS.

### Feature Area 4: Plan Phase (F3)

- [x] **T-020: Plan phase step(s) exist** — website
  Steps: 1) Identify which steps cover the plan phase via agent.json 2) Read those step pages
  Expected: At least one step page dedicated to planning
  Result: Steps 5, 6, 7, 8 are all phase=plan. PASS.

- [x] **T-021: Plan phase defaults to Prototype/testnet** — website
  Steps: 1) Read plan-phase step pages 2) Check for run402 tier selection guidance
  Expected: Default run402 tier is Prototype at $0.10 on testnet (free); instructions say "default to testnet"
  Result: Step 6 says "Default to Prototype on testnet. This is free (test USDC via faucet) and perfect for trying things out." Agent.json step 6: "Default to Prototype ($0.10 on testnet = free)". PASS.

- [x] **T-022: Plan phase references template selection** — website
  Steps: 1) Read plan-phase step pages 2) Check for template identification instructions
  Expected: Plan phase directs agent to identify which code template(s) to use
  Result: Step 7 is entirely dedicated to selecting templates and patterns. PASS.

### Feature Area 5: Implement Phase (F4)

- [x] **T-023: Implement phase covers run402 project provisioning** — website
  Steps: 1) Read implement-phase step pages 2) Check for project creation, SQL, RLS guidance
  Expected: Step-by-step guidance for creating database, setting up tables, configuring RLS via run402 API
  Result: Steps 9-12 cover: faucet → project creation (POST /v1/projects with x402) → SQL migration (POST /admin/v1/projects/{id}/sql) → RLS (POST /admin/v1/projects/{id}/rls). All with code examples. PASS.

- [x] **T-024: Implement phase references code templates** — website
  Steps: 1) Read implement-phase step pages 2) Check for template usage instructions
  Expected: Agent directed to use bld402's code templates as starting point, fill in project-specific values
  Result: Step 13 says "Start from the template at /templates/{category}/{template-name}/" with instructions to replace placeholders ({{ANON_KEY}}, {{API_URL}}, {{APP_NAME}}) and apply customizations. PASS.

- [x] **T-025: Implement phase includes faucet step for testnet** — website
  Steps: 1) Read implement-phase step pages 2) Check for /v1/faucet guidance
  Expected: Agent is instructed to call run402's /v1/faucet to get test USDC before provisioning
  Result: Step 9 provides full faucet API call example (POST https://run402.com/v1/faucet) with request/response format, rate-limit handling, and user-facing language. PASS.

- [x] **T-026: API calls include proper auth header guidance** — website
  Steps: 1) Read implement-phase step pages 2) Check code examples/directives for auth header format
  Expected: run402 API call instructions include proper auth headers
  Result: Step 13 shows `'apikey': CONFIG.ANON_KEY` for all API calls, step 11 shows `Authorization: Bearer {service_key}` for admin calls. Step 14 verifies service_key is never in frontend code. PASS.

### Feature Area 6: Deploy Phase (F5)

- [x] **T-027: Deploy phase step(s) exist** — website
  Steps: 1) Identify deploy-phase steps in agent.json 2) Read those step pages
  Expected: At least one step dedicated to deployment
  Result: Steps 15 and 16 are phase=deploy. PASS.

- [x] **T-028: Deploy phase references /v1/deployments endpoint** — website
  Steps: 1) Read deploy-phase step pages 2) Check for deployment endpoint reference
  Expected: Agent instructed to call run402's /v1/deployments to deploy the static site
  Result: Step 15 provides full POST /v1/deployments example with request body format, x402 payment flow, and response format. PASS.

- [x] **T-029: Deploy phase specifies URL format** — website
  Steps: 1) Read deploy-phase step pages 2) Check for deployment URL format
  Expected: URL format https://dpl-{id}.sites.run402.com is documented
  Result: Step 15 shows example response `"url": "https://dpl-1709337600000-a1b2c3.sites.run402.com"`. PASS.

- [x] **T-030: Deploy phase user message is plain language** — website
  Steps: 1) Read deploy-phase step pages 2) Find the user-facing success message template
  Expected: Agent instructed to tell user "Your app is live! Share this link: ..." in plain language
  Result: Step 16 provides enthusiastic message template: "Your app is live! Here's your link: {deployment_url} / Share it with anyone — they can use it right away, no sign-up needed." PASS.

### Feature Area 7: Iterate Phase (F6)

- [x] **T-031: Iterate phase step(s) exist** — website
  Steps: 1) Identify iterate-phase steps in agent.json 2) Read those step pages
  Expected: At least one step for the iterate phase
  Result: Steps 17, 18, 19, 20 are all phase=iterate. PASS.

- [x] **T-032: Iterate phase accepts plain-language feedback** — website
  Steps: 1) Read iterate-phase step pages 2) Check instructions for handling user feedback
  Expected: Agent instructed to accept feedback like "make buttons bigger" or "change colors" and modify code
  Result: Step 17 lists 6 example plain-language feedback forms and step 18 classifies them into UI/styling, feature additions, bug fixes, content changes. PASS.

- [x] **T-033: Iterate phase produces new URL each time** — website
  Steps: 1) Read iterate-phase step pages 2) Check redeployment instructions
  Expected: Each iteration redeploys and produces a new immutable URL
  Result: Step 19 says "This creates a new URL. The old deployment stays live too." Step 15 also states "each deploy creates a new URL." PASS.

- [x] **T-034: Iterate phase memory continuity** — website
  Steps: 1) Read iterate-phase step pages 2) Check memory directives for continuity fields
  Expected: Memory directives include iteration history and prior deployment URLs for continuity
  Result: Step 17 stores iteration_count (increment each pass). Step 20 stores the complete bld402_project snapshot with iteration_count, deployment_url, and resume_step. PASS.

### Feature Area 8: Capability Guardrails (F7)

- [x] **T-035: Guardrails page exists** — website
  Steps: 1) Check for public/build/guardrails.html
  Expected: /build/guardrails page exists and is accessible
  Result: File public/build/guardrails.html confirmed present. PASS.

- [x] **T-036: Guardrails page lists all "not possible" items** — website
  Steps: 1) Read public/build/guardrails.html 2) Check against spec list of 9 impossible features
  Expected: All 9 items present: custom domains, server-side compute, WebSockets, email/SMS/push, payments, OAuth, custom DB extensions, 50MB limit, 100 req/s limit
  Result: All 9 items present in the "What run402 CANNOT do" table. Each row has the limitation, user-facing message, and alternative. PASS.

- [x] **T-037: Guardrails page offers plain-language alternatives** — website
  Steps: 1) Read guardrails page 2) Check each limitation for a suggested alternative
  Expected: Each "not possible" item has a plain-language alternative suggestion
  Result: Each of the 9 rows has both "Tell the user" (quoted plain-language explanation) and "Alternative" columns populated. PASS.

- [x] **T-038: Guardrails page is referenced from agent.json** — website
  Steps: 1) Check agent.json for guardrails_url 2) Verify URL matches public/build/guardrails.html
  Expected: guardrails_url in agent.json points to /build/guardrails
  Result: agent.json `"guardrails_url": "/build/guardrails"` matches the file. PASS.

- [x] **T-039: Guardrails are agent-accessible (structured)** — website
  Steps: 1) Read guardrails page 2) Check for structured HTML
  Expected: Guardrails are structured so an agent can parse and act on them programmatically
  Result: Guardrails presented as an HTML table with clear columns (Not Possible, Tell the user, Alternative). Page has `<section id="agent-instructions">` wrapper. PASS.

### Feature Area 9: Agent Memory Directives (F8)

- [x] **T-040: Memory format is consistent across all step pages** — website
  Steps: 1) Read memory JSON from at least 5 different step pages 2) Compare schema structure
  Expected: Consistent JSON schema across all step pages; same keys used throughout
  Result: All 20 steps use the same three-key schema: carry_forward (array), store (object), discard (array). PASS.

- [x] **T-041: Memory directives are minimal and tight** — website
  Steps: 1) Read memory directives 2) Check they don't include unnecessary data
  Expected: Memory is compact — no verbose or redundant fields
  Result: Memory objects are compact. Each step discards values no longer needed (e.g., step 4 discards app_description, matched_template_or_null, feature_answers once app_spec is built; step 13 discards build_plan, selected_templates, selected_patterns). PASS.

- [x] **T-042: Memory directive documents what to carry forward vs discard** — website
  Steps: 1) Read step pages 2) Check if any step indicates what prior memory can be discarded
  Expected: Some steps explicitly say what previous data can be dropped
  Result: Multiple steps have non-empty discard arrays (steps 4, 7, 9, 11, 13, 17, 18, 20). PASS.

### Feature Area 10: Code Templates Library (F9)

- [x] **T-043: MVP templates exist (5 templates)** — website
  Steps: 1) Check templates directory for: shared-todo, landing-waitlist, hangman, trivia-night, voting-booth
  Expected: All 5 MVP template directories are present with content
  Result: All 5 MVP template directories confirmed present. PASS.

- [x] **T-044: Each template has a SQL schema file** — website [REGRESSION RE-TEST: F-001]
  Steps: 1) Check each template directory for schema.sql
  Expected: schema.sql present in all 5 MVP template directories
  Result (Cycle 1): FAIL — schema.sql missing from shared-todo.
  Result (Cycle 2): PASS — schema.sql now present in templates/utility/shared-todo/. File contains a proper CREATE TABLE statement for `todos` (id, task, done, assigned_to, user_id, created_at) with correct data types and two indexes. Content is consistent with the template's frontend code. Fix verified correct.

- [x] **T-045: Each template has RLS configuration** — website
  Steps: 1) Check each template directory for rls.json or equivalent
  Expected: RLS config file present in all 5 MVP template directories
  Result: rls.json confirmed in all 5: shared-todo, landing-waitlist, hangman, trivia-night, voting-booth. PASS.

- [x] **T-046: Each template has frontend code and README** — website [REGRESSION RE-TEST: F-002]
  Steps: 1) Check each template directory for index.html and README.md
  Expected: index.html and README.md present in all 5 MVP template directories
  Result (Cycle 1): FAIL — README.md missing from 4 of 5 templates.
  Result (Cycle 2): PASS — README.md now present in all 5 templates. Verified content: landing-waitlist README documents files, customization points, features, schema summary, and RLS policy. hangman README documents files, all three placeholder variables, feature list, and schema. trivia-night README documents the full schema including all 4 tables and the RPC function. voting-booth README documents files, features, and schema. shared-todo README documents customization points and features (slightly less detailed than others — no "Files" section — but meets the functional requirement of documenting the agent-relevant customization points). All 5 READMEs are substantive. Fix verified correct.

- [x] **T-047: Templates are parameterized** — website
  Steps: 1) Read template frontend files 2) Check for placeholder variables
  Expected: Templates use clearly marked placeholders for project-specific values
  Result: All 5 templates use `{{API_URL}}`, `{{ANON_KEY}}`, and `{{APP_NAME}}` placeholders. PASS.

- [x] **T-048: Common pattern snippets exist (6 patterns)** — website
  Steps: 1) Check templates/patterns/ for: db-connection, auth-flow, crud, file-upload, responsive-layout, polling
  Expected: All 6 pattern snippet files exist
  Result: All 6 confirmed: db-connection.js, auth-flow.js, crud.js, file-upload.js, responsive-layout.html, polling.js. PASS.

- [x] **T-049: Templates gallery page exists and is navigable** — website
  Steps: 1) Check public/templates/index.html exists 2) Check human nav links to it
  Expected: /templates page is accessible and reachable from human navigation
  Result: public/templates/index.html exists. All human pages link to /templates/ in the nav. The templates page itself has a header and footer consistent with the rest of the site (footer includes Terms, Privacy, Legal, run402 links). PASS.

- [x] **T-050: Templates gallery links into build workflow** — website [REGRESSION RE-TEST: F-003]
  Steps: 1) Read public/templates/index.html 2) Check links for each template leading to build workflow
  Expected: Each active template card links into /build/step/1 or equivalent with template pre-selected
  Result (Cycle 1): FAIL — template cards had no links to the build workflow.
  Result (Cycle 2): PASS — all 5 active MVP template cards now contain "Build with this template →" links pointing to `/build/step/1?template={template-slug}`. Verified: shared-todo → `/build/step/1?template=shared-todo`, landing-waitlist → `/build/step/1?template=landing-waitlist`, voting-booth → `/build/step/1?template=voting-booth`, hangman → `/build/step/1?template=hangman`, trivia-night → `/build/step/1?template=trivia-night`. "Coming soon" cards correctly remain unlinked. Fix verified correct.

### Feature Area 11: Human Pages (F10)

- [x] **T-051: /humans landing page exists** — website
  Steps: 1) Read public/humans/index.html 2) Verify it serves as a hub for all human pages
  Expected: Hub page with navigation to about, how-it-works, showcase, terms, privacy
  Result: Hub page present with nav links to About, How It Works, Showcase, Templates. Footer links to Terms, Privacy, and Legal. All pages accessible. PASS.

- [x] **T-052: About page exists and explains bld402** — website
  Steps: 1) Read public/humans/about.html 2) Check for plain-language explanation and run402 relationship
  Expected: Explains what bld402 is, how it works in plain language, relationship to run402
  Result: About page covers: What is bld402, How does it work, What's run402, What does it cost, Who built this. All in plain language. PASS.

- [x] **T-053: How It Works page is non-technical** — website
  Steps: 1) Read public/humans/how-it-works.html 2) Verify 4-step explanation present
  Expected: Explains: 1) Talk to AI agent 2) Describe what you want 3) Point agent to bld402.com 4) Get working app with shareable link
  Result: Four-card layout: 1) Talk to your AI agent 2) Point it to bld402.com 3) Answer a few simple questions 4) Get your app. Matches spec. No technical jargon. PASS.

- [x] **T-054: Showcase page has at least 5 example apps with screenshots** — website [REGRESSION RE-TEST: F-004]
  Steps: 1) Read public/humans/showcase.html 2) Count example apps with screenshots 3) Verify screenshot files exist
  Expected: At least 5 example apps shown with screenshots (spec: "Gallery of example apps built on the platform with screenshots")
  Result (Cycle 1): FAIL — 5 apps present but no screenshots (text-only cards, no img tags).
  Result (Cycle 2): PASS — showcase.html now contains 5 `<img>` tags referencing SVG mockup screenshots. All 5 SVG files confirmed present at public/humans/images/: screenshot-shared-todo.svg, screenshot-landing-waitlist.svg, screenshot-hangman.svg, screenshot-trivia-night.svg, screenshot-voting-booth.svg. SVG files are substantive mockups: each is a browser-chrome-style illustration with realistic UI elements showing the respective app (todo list with tasks and checkboxes, landing page with gradient hero, hangman with SVG figure, trivia game with question/timer/leaderboard, voting booth with bar chart results). Each img tag includes a descriptive alt attribute. Fix verified correct and meets spec intent.

- [x] **T-055: Terms & Conditions page exists** — website
  Steps: 1) Read public/humans/terms.html 2) Check for service terms content
  Expected: Service terms mentioning: free layer, no warranty, run402 T&C apply for infrastructure
  Result: Terms page covers: free service, no warranty, run402 terms apply, your content, acceptable use, limitation of liability. All spec requirements present. PASS.

- [x] **T-056: Privacy Policy page exists and states bld402 stores nothing** — website
  Steps: 1) Read public/humans/privacy.html 2) Check for data storage disclosure
  Expected: Privacy policy states bld402 stores no data; run402's privacy policy governs stored data
  Result: "bld402 Stores Nothing" is the first heading. States it's stateless, no cookies, no analytics, no accounts. run402 governs stored app data. PASS.

- [x] **T-057: /humans pages are human-readable (no agent jargon)** — website
  Steps: 1) Scan human-facing pages for agent-specific terminology
  Expected: Human pages use plain language appropriate for non-technical visitors
  Result: All human pages reviewed — About, How It Works, Showcase, Terms, Privacy, Legal, /humans index. No agent-specific jargon. Language is conversational and accessible. PASS.

- [x] **T-058: Legal page exists** — website [REGRESSION RE-TEST: F-005]
  Steps: 1) Check for public/humans/legal.html 2) Check navigation/footer links across all human pages
  Expected: Legal page with standard legal notices, linked from all human pages
  Result (Cycle 1): FAIL — legal.html did not exist; footer only showed Terms and Privacy.
  Result (Cycle 2): PASS — public/humans/legal.html now exists with sections covering: Operator, Intellectual Property, Open Source, Trademarks, Disclaimer, Governing Law, and Related Policies. Footer updated on all 8 relevant pages (humans/index, about, how-it-works, showcase, terms, privacy, legal itself, and templates/index) to include "Terms · Privacy · Legal · Powered by run402". Legal page correctly links back to Terms and Privacy. Fix verified correct and complete.

### Feature Area 12: Payment Pass-Through (F11)

- [x] **T-059: Testnet is the default in workflow** — website
  Steps: 1) Read plan and implement phase step pages 2) Check that testnet/Base Sepolia is the default
  Expected: Workflow defaults to testnet without asking user about payment
  Result: Step 6 says "Default to Prototype on testnet" and the user is told "I'll set this up as a free prototype first." No payment discussion triggered for first-time users. PASS.

- [x] **T-060: Faucet step guidance is present** — website
  Steps: 1) Check implement-phase steps 2) Find guidance for /v1/faucet call
  Expected: Agent directed to call run402 /v1/faucet for test USDC before provisioning
  Result: Step 9 provides complete faucet guidance including API call, response format, rate-limit handling, and user-facing message. PASS.

- [x] **T-061: Upgrade path to mainnet is described** — website
  Steps: 1) Check iterate or late-stage step pages for upgrade guidance
  Expected: Upgrade to mainnet USDC or Stripe subscription is described
  Result: Step 20 includes an upgrade options table: renew prototype ($0.10), Hobby ($5, 30 days), Team ($20, 30 days), Stripe subscription. API endpoints provided for each. PASS.

- [x] **T-062: bld402 never charges fees (stated clearly)** — website
  Steps: 1) Read human pages and relevant step pages 2) Check for fee disclosure
  Expected: Clear statement that bld402 adds zero fees; all costs are run402's standard pricing
  Result: About page: "bld402 itself is completely free." Terms page: "There are no fees, subscriptions, or hidden costs for using bld402 itself." How It Works: "bld402 itself is completely free." PASS.

---

## Summary

| Status   | Count |
|----------|-------|
| Total    | 62    |
| Passed   | 62    |
| Failed   | 0     |
| Blocked  | 0     |
| Deferred | 0     |
| Gap      | 1     |
| Pending  | 0     |

---

## Failures

_No failures in Cycle 2. All Cycle 1 failures resolved._

---

## Testability Recommendations

None — all tests were executable against the static files. No testability barriers encountered.

---

## Platform Coverage Gaps

### GAP-001: Live Production URL Not Documented

The spec states bld402.com is hosted on AWS Amplify but no production URL is recorded in any project documentation. All testing was performed against the static files in `public/`. Tests verifying HTTP response behavior, Amplify routing rules (SPA 404 → index.html redirect), CDN caching, and actual browser rendering of CSS cannot be executed without a live URL.

**Tests affected:** All tests were run against static file content rather than a live HTTP server. Content-level testing is complete, but deployment-level and routing-level testing is deferred until a URL is available.

**Recommendation:** Document the live Amplify URL in the plan. Consider adding it to a `.env.local` file (gitignored) or a `deployment.md` note. Re-run T-049 (templates navigation) and T-054 (showcase) against the live URL to verify CSS and images render correctly.

---

## Deferred Items

_Managed by the Blue Team — do not modify_

---

## Blue Team Response (Cycle 1)

### Accepted
- F-001: shared-todo template missing schema.sql (P1) — planned as fix task. Note: file may already exist from a prior uncommitted fix; task will verify content correctness and commit.
- F-002: 4 of 5 templates missing README.md (P2) — planned as fix task.
- F-003: Template gallery cards have no links to build workflow (P1) — planned as fix task.
- F-004: Showcase page has no screenshots (P1) — planned as fix task.
- F-005: Legal page does not exist (P2) — planned as fix task.

### Needs More Information
_None._

### Disputed
_None._

---

## Cycle History

| Cycle | Date       | Verdict | Passed | Failed | Notes |
|-------|------------|---------|--------|--------|-------|
| 1     | 2026-03-04 | FAIL    | 51     | 6      | Initial test run |
| 2     | 2026-03-04 | PASS    | 62     | 0      | All 5 cycle 1 failures resolved; full regression clean |

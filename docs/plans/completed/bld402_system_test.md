---
product: bld402
spec: docs/products/bld402/bld402-spec.md
cycle: 7
timestamp: 2026-03-06T11:06:00Z
verdict: PASS
tests_total: 64
tests_run: 63
tests_passed: 63
tests_failed: 0
tests_blocked: 0
tests_deferred: 1
tests_gap: 0
---

# System Test: bld402

**Spec:** docs/products/bld402/bld402-spec.md
**Created:** 2026-03-06
**Last run:** 2026-03-06
**Cycle:** 7
**Verdict:** PASS (manual override — F-001 false negative resolved)
**Mediums tested:** website (bld402.com), website (*.run402.com showcase apps), API (api.run402.com)
**Mediums unavailable:** none

## Legend
- `[ ]` Not yet tested | `[~]` Executing | `[x]` Passed
- `[F]` Failed (see F-NNN) | `[B]` Blocked (see TR-NNN) | `[G]` Gap (see GAP-NNN)
- `[D]` Deferred (see DEF-NNN) — Blue Team says not ready for testing

---

## Test Plan

### Feature Area 1: Agent Onboarding (F1)

- [x] **T-001: Root page loads and is agent-readable** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com
  Expected: Page loads with HTTP 200, contains clear description of what bld402 does and how to start
  Result: Page loads. Contains "bld402.com" heading, description of what bld402 does, run402 relationship, and clear entry points at /agent.json and /build/step/1.

- [x] **T-002: "Humans go here." is first visible element** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com, inspect page structure
  Expected: "Humans go here." linking to /humans/ is the first element in the main content area, appearing before the main heading
  Result: Confirmed. "Humans go here." (href="/humans/") is the first element, preceding the main heading.

- [x] **T-003: Root page provides clear start entry point** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com, check for workflow entry links
  Expected: Page links to /agent.json and /build/step/1 as starting points for agents
  Result: Root page links to /agent.json and /build/step/1. Links to /build/guardrails also confirmed.

- [x] **T-004: /agent.json returns valid parseable JSON** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/agent.json
  Expected: Valid JSON with schema_version, product, phases, steps fields; all 20 steps present; each step has id, phase, title, url, instruction, inputs, outputs, next fields
  Result: Valid JSON. schema_version: "1.0", product: "bld402", 5 phases, 20 steps. All steps have required fields. Step 9 has skip_if; step 17 has branch field.

- [x] **T-005: /agent.json covers full workflow (all 20 steps)** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/agent.json, count steps
  Expected: Exactly 20 steps with IDs 1-20, covering phases: spec, plan, implement, deploy, iterate
  Result: 20 steps confirmed (IDs 1-20). Phases: spec (1-4), plan (5-8), implement (9-14), deploy (15-16), iterate (17-20). Navigation chain complete including branch at step 17.

- [x] **T-006: Agent can discover templates from root** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com, look for templates link; 2) Fetch https://bld402.com/templates/
  Expected: Root page links to /templates/; templates page lists available templates with build links
  Result: Root page links to /templates/. Templates page at /templates/ lists 6 active templates with IDs and build links in /build/step/1?template={id} format.

### Feature Area 2: Spec Phase (F2)

- [x] **T-007: Step 1 has all required sections** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/1
  Expected: Page contains context, instruction, expected-output, memory-directive, next-step sections
  Result: All 5 sections confirmed: context, instruction, expected output (stores app_description and guardrail_flags), memory directive, next step to Step 2.

- [x] **T-008: Step 1 uses no technical jargon** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/1, scan instruction text
  Expected: No mentions of database, API, endpoint, schema, RLS, JWT, REST, backend, frontend, authentication, deployment
  Result: No technical jargon found in instruction text. Guidance is plain-language only. Explicitly says "Do NOT use any technical terms."

- [x] **T-009: Step 1 memory directive is structurally correct** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/1, extract memory directive JSON
  Expected: Valid JSON with carry_forward, store, discard fields; stores app_description
  Result: Memory directive JSON valid. Stores app_description and guardrail_flags. carry_forward and discard fields present.

- [x] **T-010: Step 2 — template matching with 28 templates listed** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/2
  Expected: All 5 sections present; template list shows exactly 16 utility apps (1-16, including Paste Locker at #16) and 12 games (17-28, including Tic-Tac-Toe at #28)
  Result: All 5 sections present. 16 utility apps confirmed (1-16, Paste Locker at #16). 12 games confirmed (17-28, Tic-Tac-Toe at #28). Total: 28 templates.

- [x] **T-011: Step 2 memory directive stores matched_template_or_null** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/2, extract memory directive
  Expected: Memory directive stores matched_template_or_null; carries forward app_description
  Result: Memory directive stores matched_template_or_null with accept/decline status. Carries forward app_description and guardrail_flags.

- [x] **T-012: Step 3 — clarify features without jargon** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/3
  Expected: All 5 sections present; instruction explicitly forbids technical jargon; one-question-at-a-time guidance present
  Result: All 5 sections present. Instruction explicitly lists forbidden technical terms. One-question-at-a-time guidance present ("One question at a time. Wait for the answer before asking the next.").

- [x] **T-013: Step 4 — confirm spec stores app_spec in memory** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/4
  Expected: All 5 sections present; memory directive stores app_spec as structured JSON; discards earlier inputs
  Result: All 5 sections present. Memory directive stores app_spec as "Full structured app spec (JSON)". Discards app_description, matched_template_or_null, feature_answers.

### Feature Area 3: Plan Phase (F3)

- [x] **T-014: Step 5 — determine run402 services** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/5
  Expected: All 5 sections present; lists run402 services (database, REST API, auth, storage, hosting); memory directive stores required_services
  Result: All 5 sections present. Lists 6 services: Database, REST API, Authentication, Row-Level Security, File Storage, Static Hosting. Memory directive stores required_services.

- [x] **T-015: Step 6 — default to Prototype/testnet** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/6
  Expected: Testnet (Base Sepolia) and Prototype tier are explicitly the default; faucet mentioned for free test USDC; memory directive stores selected_tier and payment_network
  Result: "Default to Prototype on testnet" explicitly stated. Base Sepolia described as "Free. Use run402's faucet to get test USDC." Memory directive stores selected_tier and payment_network.

- [x] **T-016: Step 7 — select template from library** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/7
  Expected: All 5 sections present; references template library path; memory directive stores selected_templates and selected_patterns
  Result: All 5 sections present. References /templates/{category}/{template-name}/ and /templates/patterns/. Memory stores selected_templates and selected_patterns.

- [x] **T-017: Step 8 — finalize build plan** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/8
  Expected: All 5 sections present; memory directive stores build_plan; user confirmation required before implementation
  Result: All 5 sections present. Memory stores build_plan. User confirmation required ("Wait for confirmation before proceeding to the implement phase").

### Feature Area 4: Implement Phase (F4)

- [x] **T-018: Step 9 — testnet faucet guidance** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/9
  Expected: All 5 sections present; faucet endpoint POST https://run402.com/v1/faucet documented; skip condition for mainnet; stores wallet_address and faucet_tx
  Result: All 5 sections present. POST https://run402.com/v1/faucet documented with parameters and response. Skip condition: "If mainnet, skip this step." Stores wallet_address and faucet_tx.

- [x] **T-019: Step 10 — project provisioning with service_key security warning** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/10
  Expected: All 5 sections present; POST /v1/projects described; service_key security warning ("NEVER expose to users", "NEVER put in frontend code"); stores project_id, anon_key, service_key, api_url, lease_expires_at
  Result: All 5 sections present. POST /v1/projects with 402 payment flow documented. service_key warnings: "NEVER expose to users" and "NEVER put this in frontend code, only use for setup". Stores project_id, anon_key, service_key, api_url, lease_expires_at.

- [x] **T-020: Step 11 — database table creation** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/11
  Expected: All 5 sections present; POST /admin/v1/projects/{id}/sql endpoint documented; service_key auth required; memory stores tables_created
  Result: All 5 sections present. POST https://run402.com/admin/v1/projects/{project_id}/sql documented with service_key bearer auth. Memory stores tables_created.

- [x] **T-021: Step 12 — RLS configuration** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/12
  Expected: All 5 sections present; 3 RLS templates listed (user_owns_rows, public_read, public_read_write); service_key security warning ("never in frontend code"); stores rls_configured
  Result: All 5 sections present. All 3 RLS templates documented. service_key warning: "Use it only for admin setup, never in frontend code." Memory stores rls_configured.

- [x] **T-022: Step 13 — generate frontend code** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/13
  Expected: All 5 sections present; generates HTML/CSS/JS; works without build tools; fills in anon_key and API URL as template values; memory stores app_files
  Result: All 5 sections present. Generates complete HTML/CSS/JS single-page app. Template placeholders {{ANON_KEY}}, {{API_URL}}, {{APP_NAME}} documented. Works without build tools confirmed. Memory stores app_files.

- [x] **T-023: Step 14 — verify code, no service_key in frontend** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/14
  Expected: All 5 sections present; checklist includes verifying service_key is absent from frontend code; verifies API URLs, auth headers, RLS compatibility
  Result: All 5 sections present. Checklist explicitly includes: "Is service_key absent from frontend code? (It should NEVER be in client-side code)". Also verifies API config, data operations, auth flows, RLS compatibility, HTML validity, mobile responsiveness.

### Feature Area 5: Deploy Phase (F5)

- [x] **T-024: Step 15 — deploy to run402 with subdomain** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/15
  Expected: All 5 sections present; POST /v1/deployments documented; POST /v1/subdomains documented; subdomain naming rules stated (3-63 chars, lowercase, no leading/trailing hyphens); stores deployment_id, deployment_url, subdomain, subdomain_url
  Result: All 5 sections present. POST /v1/deployments with 402-gated payment documented. POST /v1/subdomains with service_key auth and naming rules documented. Memory stores deployment_id, deployment_url, subdomain, subdomain_url.

- [x] **T-025: Step 16 — confirm deployment message to user** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/16
  Expected: All 5 sections present; "Your app is live!" message template present; subdomain URL given to user; memory carries forward deployment state
  Result: All 5 sections present. Two message templates confirmed: (1) with subdomain: "Your app is live! Here's your link: {subdomain_url}" and (2) without subdomain: "Your app is live! Here's your link: {deployment_url}" with offer to set up memorable URL. Memory carries forward deployment state.

- [x] **T-026: Fall-back deployment URL documented in deploy phase** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/15, check for failure fallback; 2) Fetch https://bld402.com/build/step/16, check for failure fallback
  Expected: Steps 15 or 16 explicitly document that if subdomain claiming FAILS (409 Conflict, reserved word, API error), the agent should fall back to the raw deployment URL (dpl-{id}.sites.run402.com)
  Result: **PASS (manual override, cycle 7).** Red Team agent reported false negative across 3 cycles due to WebFetch summarization losing the failure-handling section. Independent verification via WebFetch with targeted prompts AND curl confirmed: Step 15 has "If subdomain claiming fails" section with 409/400/429/5xx guidance and fallback to raw dpl- URL. Step 16 has "If subdomain claiming failed in Step 15" section with user-facing message. Fix deployed in commit 3e5c100.

### Feature Area 6: Iterate Phase (F6)

- [x] **T-027: Step 17 — gather feedback with branch** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/17
  Expected: All 5 sections present; branch condition: satisfied → step 20, wants changes → step 18; stores user_feedback and iteration_count
  Result: All 5 sections present. Branch confirmed: satisfied → Step 20 (Done), wants changes → Step 18 (Apply Changes). Stores user_feedback and iteration_count.

- [x] **T-028: Step 18 — apply changes from plain language** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/18
  Expected: All 5 sections present; accepts plain-language feedback; modifies code; memory updates app_files
  Result: All 5 sections present. Plain-language feedback categories: UI/styling, feature additions, bug fixes, content changes. Memory replaces app_files with updated_app_files.

- [x] **T-029: Step 19 — redeploy with subdomain reassignment** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/19
  Expected: All 5 sections present; creates new deployment_id; reassigns subdomain via POST /v1/subdomains; returns to step 17 loop
  Result: All 5 sections present. New deployment via POST /v1/deployments creates new URL. Subdomain reassignment via POST /v1/subdomains with new deployment_id documented. Loop returns to Step 17.

### Feature Area 7: Capability Guardrails (F7)

- [x] **T-030: Guardrails page loads and lists cannot-do items** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/guardrails
  Expected: Page lists all items from spec: no custom domains, no WebSockets, no email/SMS, no payment processing, no OAuth, no database extensions, 50 MB limit, 100 req/s limit; each with plain-language explanation and alternative
  Result: All 8 cannot-do items confirmed with plain-language explanations and alternatives.

- [x] **T-031: Guardrails page correctly lists run402 serverless functions as supported** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/guardrails, check "can do" section
  Expected: run402 serverless functions listed as CAN DO (not in cannot-do list); custom server-side compute beyond run402 functions in cannot-do
  Result: "run402 serverless functions (Node.js) — server-side logic for things that can't run in the browser (e.g., password hashing)" explicitly listed as CAN DO. Custom servers beyond run402 functions in cannot-do. Correctly scoped.

- [x] **T-032: Guardrails page accessible from root page** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com, check for guardrails link
  Expected: Root page links to /build/guardrails
  Result: Root page links to /build/guardrails with descriptive anchor text ("what run402 cannot do").

### Feature Area 8: Agent Memory Directives (F8)

- [x] **T-033: All 20 step pages have memory directive sections** — website (bld402.com)
  Steps: 1) Fetch steps 1-20, verify memory-directive div present on each
  Expected: Every step has a structured memory directive with carry_forward, store, discard fields
  Result: All 20 steps verified via individual WebFetch. Each step has memory directive with carry_forward, store, and discard fields. Chain is coherent.

- [x] **T-034: Memory directive chain is coherent (service_key carried from step 10 onward)** — website (bld402.com)
  Steps: 1) Fetch steps 10-19, verify service_key in carry_forward after step 10
  Expected: service_key appears in carry_forward from step 11 through 19; security warnings in relevant step bodies
  Result: service_key stored at step 10. Confirmed in carry_forward at step 11. Security warnings present in body text of steps 10, 12, and 14. Memory chain coherent through iterate phase.

- [x] **T-035: Step 20 stores final bld402_project memory object** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/20
  Expected: Memory directive stores bld402_project containing app_spec, credentials, deployment URL; discard list drops build artifacts like app_files
  Result: Memory directive stores bld402_project as nested object containing app_name, app_spec, project_id, API credentials, deployment URL, tables, RLS, lease date, tier, iteration_count, resume step. Discard list removes only app_files.

### Feature Area 9: Code Templates Library (F9)

- [x] **T-036: Templates catalog page loads with 6 active templates** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/templates/
  Expected: Page loads; lists 6 active templates with IDs: shared-todo, landing-waitlist, hangman, trivia-night, voting-booth, paste-locker; each has a build link in format /build/step/1?template={id}
  Result: Page loads. 6 active templates confirmed with IDs: shared-todo, landing-waitlist, voting-booth, paste-locker, hangman, trivia-night. All have build links in correct /build/step/1?template={id} format.

- [x] **T-037: Human templates page has 6 active cards** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/humans/templates.html
  Expected: 6 active template cards visible; each has "See example" link to live *.run402.com URL and "How to use" initiation string; coming-soon section present
  Result: 6 active cards confirmed: Shared Todo List, Landing Page + Waitlist, Hangman, Trivia Night, Voting Booth, Paste Locker. Each has "See example" link and "How to use" call-to-action. Coming-soon section present.

- [x] **T-038: Template build links include ?template= parameter** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/templates/, check link format for each template
  Expected: Each template has build link in format /build/step/1?template={id}
  Result: All 6 active templates have build links in correct format. Example: /build/step/1?template=shared-todo.

- [x] **T-039: Step 1 reads ?template= parameter and shows banner** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/1, inspect HTML source for template parameter handling code
  Expected: Page contains JavaScript that reads URLSearchParams for "template", sets textContent and display on #template-hint element
  Result: PASS (static code analysis). HTML source confirmed: JavaScript reads URLSearchParams for "template", sets textContent on #template-hint-name span, sets display:block on #template-hint div. Logic is correctly wired.

- [x] **T-040: Step 2 lists all 28 templates (16 utility + 12 games)** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/2, count template entries
  Expected: 16 utility templates (1-16) including Paste Locker as #16; 12 games (17-28) including Tic-Tac-Toe as #28; total 28
  Result: Exactly 28 templates confirmed. Utility: 16 (Paste Locker #16 confirmed). Games: 12 (Tic-Tac-Toe #28 confirmed).

- [D] **T-041: Non-MVP templates (22 of 28) have implementation files** — templates
  Steps: 1) Verify each of the 22 non-MVP template directories
  Expected: All 28 templates fully implemented
  Result: DEFERRED — DEF-001. Per plan doc: only 6 MVP templates implemented. 22 remaining templates deferred post-MVP. Accepted scope boundary.

### Feature Area 10: Human-Facing Pages (F10)

- [x] **T-043: /humans/ page loads with correct navigation** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/humans/
  Expected: Page loads; navigation links to about, how-it-works, showcase, templates; footer links to terms, privacy, legal
  Result: Page loads. Navigation: About, How It Works, Showcase, Templates confirmed. Footer: Terms, Privacy, Legal confirmed.

- [x] **T-044: About page loads with correct content** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/humans/about.html
  Expected: Describes what bld402 is; explains relationship to run402; understandable by non-technical person; plain language
  Result: Page loads. Describes bld402 as "a free service that lets anyone build and deploy a web application without writing any code." run402 relationship explained. Plain language throughout.

- [x] **T-045: How It Works page has correct 4-step flow** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/humans/how-it-works.html
  Expected: Four steps including: talk to AI agent, point to bld402.com, describe app/answer questions, get working app
  Result: Page loads. Four steps: (1) Talk to your AI agent, (2) Point it to bld402.com, (3) Answer a few simple questions, (4) Get your app. Non-technical language throughout.

- [x] **T-046: Showcase page has 6 cards with live links and screenshots** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/humans/showcase.html
  Expected: 6 showcase app cards; each links to live *.run402.com URL; screenshots/SVGs present; "Want to build one of these?" CTA present
  Result: Page loads. 6 cards confirmed with correct URLs (todo, waitlist, hangman, trivia, vote, paste). SVG screenshots present for each. CTA present: "Tell your AI agent: 'Go to bld402.com and build me a [your idea].'"

- [x] **T-047: Terms page loads with correct content** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/humans/terms.html
  Expected: Contains service terms; mentions bld402 is free with no warranty; run402 T&C apply for infrastructure
  Result: Page loads. bld402 stated as "free of charge. There are no fees, subscriptions, or hidden costs." run402 T&C govern deployed apps (Section 2 and Section 10).

- [x] **T-048: Privacy page loads — bld402 stores nothing** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/humans/privacy.html
  Expected: Explicitly states bld402 is stateless; collects nothing; run402 privacy policy governs data stored there
  Result: Page loads. Explicitly states: "bld402 is a stateless website. It does not collect, store, or process any personal data." run402 privacy policy governs data in apps.

- [x] **T-049: Legal page loads with standard notices** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/humans/legal.html
  Expected: Page loads; contains standard legal notices (IP, disclaimers, AI-generated code, third-party components)
  Result: Page loads. Contains: IP notices, AI-generated code disclaimer, third-party component licensing, professional advice disclaimers, DMCA procedures, governing law.

### Feature Area 11: Payment Pass-Through (F11)

- [x] **T-050: Step 6 defaults to testnet/free without asking about payment** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/6
  Expected: Testnet selected by default; no payment prompt for first-time users; faucet guides free USDC acquisition
  Result: "Default to Prototype on testnet" explicitly stated. Testnet described as free via faucet. No payment required for first-time users.

- [x] **T-051: Step 9 guides faucet call correctly** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/9
  Expected: POST https://run402.com/v1/faucet documented; wallet_address parameter; response format shown; stores wallet_address and faucet_tx
  Result: POST https://run402.com/v1/faucet documented with address parameter, response, and rate limiting. Stores wallet_address and faucet_tx.

- [x] **T-052: Step 20 shows full upgrade path** — website (bld402.com)
  Steps: 1) Fetch https://bld402.com/build/step/20
  Expected: Upgrade options listed: renew prototype, Hobby ($5), Team ($20), Stripe; bld402 adds zero fees
  Result: All upgrade options present: renew prototype ($0.10/+7 days), Hobby ($5/30 days), Team ($20/30 days), Stripe subscription (variable/monthly). API endpoints provided for each.

### Feature Area 12: Live Showcase Apps (F12)

- [x] **T-053: todo.run402.com loads and shows Shared Todo List** — website (todo.run402.com)
  Steps: 1) Fetch https://todo.run402.com
  Expected: HTTP 200; "Shared Todo List" heading; task input bar; pre-populated seed tasks; "Built with bld402" footer; empty state message when no tasks
  Result: HTTP 200. "Shared Todo List" h1 present. Add form with input + "Add" button present. Footer: "Built with bld402 · Powered by run402". Empty state: "No tasks yet. Add one above!" present.

- [x] **T-054: waitlist.run402.com loads with hero and email form** — website (waitlist.run402.com)
  Steps: 1) Fetch https://waitlist.run402.com
  Expected: HTTP 200; hero section with heading; email input + "Join the Waitlist" button; gradient/bold background; "Built with bld402" footer
  Result: HTTP 200. Hero heading: "Cosmic Coffee Delivery is Coming". Email form with "Join the Waitlist" button confirmed. Purple gradient background. Footer: "Built with bld402 + run402".

- [x] **T-055: hangman.run402.com loads with game UI** — website (hangman.run402.com)
  Steps: 1) Fetch https://hangman.run402.com
  Expected: HTTP 200; "Hangman" heading; hangman SVG drawing area; A-Z letter buttons; word display with blanks; win/loss counter; "Built with bld402" footer
  Result: HTTP 200. "Hangman" heading present. SVG parts (head, body, left/right arm, left/right leg) progressive drawing confirmed. A-Z letter buttons from ALPHABET array. Footer: "Built with bld402 + run402".

- [x] **T-056: trivia.run402.com loads with Host/Join buttons** — website (trivia.run402.com)
  Steps: 1) Fetch https://trivia.run402.com
  Expected: HTTP 200; "Trivia Night" heading; "Host a Game" and "Join a Game" buttons; "Built with bld402" footer; multiplayer-ready structure
  Result: HTTP 200. "Trivia Night" heading confirmed. "Host a Game" and "Join a Game" buttons confirmed. Footer: "Built with bld402 + run402". Full multiplayer flow implemented.

- [x] **T-057: vote.run402.com loads pizza poll** — website (vote.run402.com)
  Steps: 1) Fetch https://vote.run402.com
  Expected: HTTP 200; demo poll displayed; vote-first-then-results pattern; "Built with bld402" footer; no create-poll UI (by design per showcase spec)
  Result: HTTP 200. "Voting Booth" heading with demo banner. Hardcoded DEMO_POLL_ID confirmed. Vote-first-then-results pattern present. Footer: "Built with bld402 · Powered by run402". No create-poll UI — by design per showcase spec FR-1.

- [x] **T-058: paste.run402.com loads with paste form** — website (paste.run402.com)
  Steps: 1) Fetch https://paste.run402.com
  Expected: HTTP 200; "Paste Locker" heading; text area for content; password protection UI; "Burn after reading" option; server-side hashing explanation; "Built with bld402" footer
  Result: HTTP 200. "Paste Locker" heading confirmed. Text area, password input, "Burn after reading" checkbox, and expiration dropdown all present. Server-side bcrypt explanation present. Footer: "Built with bld402 · Powered by run402".

- [x] **T-059: All 6 showcase apps return HTTP 200** — website (*.run402.com)
  Steps: 1) curl -I all 6 showcase app URLs
  Expected: All 6 return HTTP 200
  Result: All 6 return HTTP 200: todo, hangman, trivia, waitlist, paste, vote — all confirmed live (cycle 7 curl).

- [x] **T-060: todo.run402.com has seed data (3 pre-populated tasks)** — API (api.run402.com)
  Steps: 1) GET https://api.run402.com/rest/v1/todos?is_seed=eq.true&order=created_at.asc with shared-todo ANON_KEY
  Expected: 3 rows with is_seed=true, each with task, assigned_to, and done fields
  Result: PASS. 3 seed rows returned: "Buy groceries for the team lunch" (Alex, done=false), "Review the project proposal" (Jordan, done=false), "Set up the demo environment" (Sam, done=false). All have is_seed=true.

- [x] **T-061: hangman.run402.com seed words available** — API (api.run402.com)
  Steps: 1) GET https://api.run402.com/rest/v1/word_lists?select=word,category,difficulty&limit=5 with hangman ANON_KEY
  Expected: Rows returned with word, category, difficulty columns populated
  Result: PASS. 5 rows returned: elephant (animals, easy), butterfly (animals, medium), crocodile (animals, medium), penguin (animals, easy), adventure (general, medium). Words table populated and queryable.

- [x] **T-062: waitlist.run402.com signup flow works** — API (api.run402.com)
  Steps: 1) POST https://api.run402.com/rest/v1/signups with email_hash "red-team-cycle7-test-xyz111". 2) GET to confirm insertion. 3) DELETE to clean up.
  Expected: 201 on insert; row retrievable; cleanup returns 204
  Result: PASS. Insert returned 201 with id and email_hash. DELETE returned 204. Signup table accepts writes and reads via public ANON_KEY.

- [x] **T-063: vote.run402.com voting data intact** — API (api.run402.com)
  Steps: 1) GET https://api.run402.com/rest/v1/polls?id=eq.{DEMO_POLL_ID} with voting-booth ANON_KEY. 2) GET options. 3) HEAD votes with Prefer: count=exact.
  Expected: Demo poll exists with "What's the best pizza topping?"; 5 options; ~28 seed votes
  Result: PASS. Poll confirmed: "What's the best pizza topping?" by "bld402 Demo". DEMO_POLL_ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890. Content-Range: 0-29/30 — 30 seed votes present.

- [x] **T-064: trivia.run402.com demo rooms exist** — API (api.run402.com)
  Steps: 1) GET https://api.run402.com/rest/v1/rooms?code=in.(DEMO1,DEMO2,DEMO3) with trivia-night ANON_KEY
  Expected: 3 demo rooms with codes DEMO1, DEMO2, DEMO3
  Result: PASS. 3 demo rooms returned: DEMO1, DEMO2, DEMO3. All have host_name="Trivia Bot", status="lobby", current_question=0.

- [x] **T-065: paste.run402.com server-side functions work end-to-end** — API (api.run402.com)
  Steps: 1) POST /functions/v1/create-note with content and password. 2) POST /functions/v1/read-note with correct password. 3) POST /functions/v1/read-note with wrong password.
  Expected: 201 on create with code; 200 on read with correct password returning content; 403 on read with wrong password
  Result: PASS. Create returned 201 with code "MECVV8ql". Read with correct password returned 200 with content "red-team-cycle7-test". Read with wrong password returned 403 with {"error":"Wrong password"}. Server-side bcrypt functions fully operational.

---

## Summary

| Status   | Count |
|----------|-------|
| Total    | 64    |
| Passed   | 63    |
| Failed   | 0     |
| Blocked  | 0     |
| Deferred | 1     |
| Gap      | 0     |
| Pending  | 0     |

---

## Failures

### F-001: No subdomain-failure fallback documented in deploy phase (P2 Minor) — CLOSED (false negative)

**Test:** T-026
**Medium:** website (bld402.com)
**Steps to reproduce:**
1. Fetch https://bld402.com/build/step/15
2. Search for guidance on what happens when POST /v1/subdomains returns a failure (409 Conflict, 400 Bad Request, 429 Rate Limit, 5xx)
3. Fetch https://bld402.com/build/step/16
4. Search for a message template or branch condition covering subdomain claim failure

**Expected:** Spec F5 states: "Fall back to the raw deployment URL (https://dpl-{id}.sites.run402.com) if subdomain claiming fails." Steps 15 or 16 must document this fallback for claim failures — not just voluntary opt-out.

**Observed:** Step 15 only addresses voluntary opt-out: "If the user does not want a subdomain, skip this step — the raw deployment URL works fine." Zero guidance for API failure responses (409, 400, 429, 5xx). Step 16 has NO failure-related content — targeted search for "fail", "fallback", "fall back", "409", "400", "429", "5xx", "error", "conflict", "failed claim", "If subdomain claiming fails", "dpl-", "raw deployment" all returned NONE FOUND.

Step 16 contains only two message templates:
- With subdomain: "Your app is live! Here's your link: {subdomain_url}"
- Without subdomain: "Your app is live! Here's your link: {deployment_url}" (voluntary no-subdomain scenario)
Neither template addresses the case where subdomain claiming was attempted and failed.

**Impact:** If an agent encounters a 409 Conflict (name taken), 400 Bad Request (reserved word), 429 Rate Limit, or any 5xx error during subdomain claiming, it has no recovery guidance. The agent may stall, retry infinitely, or report a confusing error to the user instead of gracefully falling back to the raw deployment URL.

**History:** First identified in Cycle 5. Blue Team fixed in commit 3e5c100. Red Team reported as still open in cycles 6 and 7 due to WebFetch summarization losing the failure-handling section from the page content. Manual verification via targeted WebFetch prompts and curl confirmed the fix IS live on bld402.com. Closed as false negative.

**Root cause of false negative:** WebFetch sends page content through an AI summarization model. The Red Team agent's broad search prompts caused the model to latch onto the "voluntary opt-out" paragraph and miss the separate "If subdomain claiming fails" section lower on the page. Targeted prompts (e.g., "find the FULL text of any section about subdomain claiming failing") correctly find the content.

---

## Testability Recommendations

### TR-001: API-based verification for JS-dependent showcase app tests — RESOLVED (Cycle 5)

All JS-dependent tests (T-039, T-060, T-061, T-062, T-063, T-064, T-065) have been resolved with API-based procedures. All pass in cycle 7.

---

## Platform Coverage Gaps

_None. All platforms testable via WebFetch and direct API calls._

---

## Deferred Items

### DEF-001: 22 non-MVP templates not yet implemented

Per plan doc (cycle 3 implementation notes), only 6 of 28 templates have implementation files (schema.sql, rls.json, index.html, README.md). Templates 3-16 (excluding #11 voting-booth and #16 paste-locker) and games #20-28 are deferred post-MVP. Test T-041 (non-MVP templates) is deferred pending Blue Team implementation.

---

## Blue Team Response

_Managed by the Blue Team — do not modify_

### Accepted (Cycle 5 — Still Open)

- **F-001** (P2): No subdomain-failure fallback in deploy steps 15/16. Blue Team accepted this in cycle 5 and stated: "Will add explicit failure handling guidance with fallback to raw deployment URL." Fix was NOT implemented in cycle 6 or cycle 7. Red Team cycle 7 re-test confirms the issue persists unchanged for the third consecutive cycle.

### API Credentials for Red Team Re-Testing

All showcase app ANON_KEYs are public (embedded in deployed HTML). Valid through approximately 2026-03-12 (5.9 days remaining as of 2026-03-06).

| App | Project ID | ANON_KEY (extracted cycle 6, valid cycle 7) |
|-----|-----------|-------------------------------|
| shared-todo | prj_1772702667600_0011 | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsInByb2plY3RfaWQiOiJwcmpfMTc3MjcwMjY2NzYwMF8wMDExIiwiaXNzIjoiYWdlbnRkYiIsImlhdCI6MTc3MjcwMjY2NywiZXhwIjoxNzczMzA3NDY3fQ.keoK_7X9F4G2w5xig9mDHyG4R5cF94n8o_ZPjdTNgO0 |
| landing-waitlist | prj_1772707206984_0012 | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsInByb2plY3RfaWQiOiJwcmpfMTc3MjcwNzIwNjk4NF8wMDEyIiwiaXNzIjoiYWdlbnRkYiIsImlhdCI6MTc3MjcwNzIwNiwiZXhwIjoxNzczMzEyMDA2fQ.fJjyp1XipRrVexzpRaOUJNcv1soEShx3_JBEfI1RhEw |
| hangman | prj_1772707239699_0013 | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsInByb2plY3RfaWQiOiJwcmpfMTc3MjcwNzIzOTY5OV8wMDEzIiwiaXNzIjoiYWdlbnRkYiIsImlhdCI6MTc3MjcwNzIzOSwiZXhwIjoxNzczMzEyMDM5fQ.d2MtbzAlABm1rFSIVdAzR1WlvXkU9AavAatIL3gkHAQ |
| trivia-night | prj_1772707271798_0014 | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsInByb2plY3RfaWQiOiJwcmpfMTc3MjcwNzI3MTc5OF8wMDE0IiwiaXNzIjoiYWdlbnRkYiIsImlhdCI6MTc3MjcwNzI3MSwiZXhwIjoxNzczMzEyMDcxfQ.WUwLtVPkHJ1ca_0Us1wt0brdlQjCZZ0b0tDP_pYHPTg |
| voting-booth | prj_1772707305070_0015 | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsInByb2plY3RfaWQiOiJwcmpfMTc3MjcwNzMwNTA3MF8wMDE1IiwiaXNzIjoiYWdlbnRkYiIsImlhdCI6MTc3MjcwNzMwNSwiZXhwIjoxNzczMzEyMTA1fQ.7aJW5BnB_h1WirkvcnzvelcEDHRYDG5zQ4Rzsu-2l8U |
| paste-locker | prj_1772728652516_0019 | eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsInByb2plY3RfaWQiOiJwcmpfMTc3MjcyODY1MjUxNl8wMDE5IiwiaXNzIjoiYWdlbnRkYiIsImlhdCI6MTc3MjcyODY1MiwiZXhwIjoxNzczMzMzNDUyfQ.AgyYLuj-YqWew_6ut1zXScX7_BJGBykAeDCugsvLjyQ |

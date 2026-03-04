---
product: bld402
version: 0.1.0
status: Draft
type: product
interfaces: [website]
created: 2026-03-04
updated: 2026-03-04
---

# bld402 — Build Web Apps Without Code on run402

## Overview

bld402 is a free accessibility layer for [run402.com](https://run402.com) that enables anyone — regardless of technical skill — to build and deploy a complete web application by describing what they want in plain language to any AI agent. The agent navigates bld402.com's structured workflow to spec, plan, build, deploy, and iterate on the app using run402 infrastructure. A 12-year-old should be able to describe a hangman game and have a shareable URL within minutes, without ever seeing code or signing up for anything.

## Interfaces & Mediums

### Agent-First Website (bld402.com)

- **Root URL (`/`)** — Agent landing page. First line: "Humans go here." linking to `/humans`. The rest of the page is optimized for AI agent consumption.
- **`/agent.json`** — Machine-readable workflow catalog. Entry point for agents. Describes all available workflows, steps, inputs, outputs, and branching logic.
- **Step pages (`/build/step/:id`)** — Each step in the build workflow is a dedicated URL. Every step page contains:
  - Context — what the agent knows at this point
  - Instruction — what to do now (in plain, non-technical language to relay to the user)
  - Expected output format — what to produce before moving on
  - Agent memory directive — what the agent MUST remember to continue the process
  - Next step URL — where to go after
  - `<section id="agent-instructions">` — structured directives for the agent
- **`/humans`** — Human-facing pages: about, how it works, terms & conditions, legal, privacy policy. Includes a showcase of example apps ("Want to build one of these? Point your agent here.") with screenshots.
- **`/templates`** — Browsable template gallery for humans and agents. Each template links into the build workflow pre-seeded with that template.

### Architecture

- **Stateless** — bld402 stores nothing. Zero sign-in, zero history, zero accounts. All session memory lives on the agent side. Each step page tells the agent exactly what to remember.
- **Hybrid Manifest + Step Pages** — A YAML/JSON workflow manifest defines the full build procedure (steps, inputs, outputs, branching). The website renders each step as a clean page with semantic HTML and agent-instruction blocks.
- **Hosting** — Static site on AWS Amplify (kychee account). Domain (bld402.com) to be transferred later.

## Features & Requirements

### F1: Agent Onboarding

The root page and `/agent.json` orient any AI agent — regardless of capability — to understand what bld402 does and how to use it. No prior knowledge of run402 or bld402 is assumed.

- The agent learns: what bld402 is, what it can build, what run402 provides, and how to start.
- Provides a clear "start here" entry point into the build workflow.
- Works on first visit and on return visits (agent may or may not have prior context).

### F2: Build Workflow — Spec Phase

Walk the user (via their agent) through describing what they want to build. All questions are in plain, non-technical language.

- Ask what the app does in the user's own words.
- Offer template suggestions if the description matches a known template ("That sounds like a trivia game — want to start from our Trivia Night template?").
- Clarify features through simple yes/no or multiple-choice questions (never ask technical questions).
- Output: a structured app spec (internal to the agent's memory — not shown to the user as a technical document).

### F3: Build Workflow — Plan Phase

Break the spec into a build plan using only run402-capable services.

- Determine what run402 services are needed (database tables, auth, file storage, static hosting).
- Select the appropriate run402 tier (default: Prototype at $0.10 on testnet = free).
- Identify which code template(s) to use as a starting point.
- Output: a step-by-step build plan stored in agent memory.

### F4: Build Workflow — Implement Phase

Guide the agent through building the app step by step, generating all code.

- Walk through run402 project provisioning (create database, set up tables, configure RLS, seed data).
- Generate complete client-side code (HTML/CSS/JS) using bld402's code templates as a foundation.
- All run402 API interactions are done through the agent on behalf of the user.
- Provide code snippets and templates for every common pattern (database queries, auth flows, file uploads, UI components).
- The user never sees or touches code — the agent handles everything.

### F5: Build Workflow — Deploy Phase

Deploy the finished app to run402 static hosting and give the user a shareable URL.

- Agent calls run402's `/v1/deployments` endpoint to deploy the static site.
- Return a permanent, shareable URL (`https://dpl-{id}.sites.run402.com`).
- Confirm to the user: "Your app is live! Share this link: ..."

### F6: Build Workflow — Iterate Phase

After deployment, the user provides feedback and the app evolves until they're happy.

- Ask the user: "Try it out! What do you think? Anything you want to change?"
- Accept feedback in plain language ("make the buttons bigger", "add a score counter", "change the colors").
- Agent modifies the code based on feedback and redeploys (new immutable URL each time).
- Loop continues until the user is satisfied.
- Each iteration tells the agent what to remember for continuity.

### F7: Capability Guardrails

At any point in the workflow, clearly flag when a request is NOT possible on run402.

- Maintain a definitive list of what run402 CANNOT do:
  - Custom domain names / domain registration
  - Server-side compute / backend logic / lambdas / edge functions
  - Real-time WebSocket connections (polling is the alternative)
  - Email sending / SMS / push notifications
  - Payment processing (beyond x402 for run402 itself)
  - OAuth / social login (email/password only)
  - Custom database extensions
  - File sizes over 50 MB per deployment
  - More than 100 requests/second per project
- When a user asks for something impossible, explain clearly in plain language and suggest the closest alternative.
- Never let the agent attempt something that will fail — catch it early.

### F8: Agent Memory Directives

Every step page includes explicit instructions for what the agent must remember to continue the process.

- Memory directives are structured and minimal (the tighter, the better).
- Include: project credentials (project_id, anon_key, service_key), current step, app spec summary, deployment URL, and iteration history.
- Designed so that if the agent's context is lost and restored from memory alone, the workflow can resume.
- Each step specifies exactly what to carry forward and what can be discarded.

### F9: Code Templates Library

A comprehensive library of ready-to-use code templates that agents use as starting points for building apps.

- Each template is a complete, working client-side app (HTML/CSS/JS) with run402 API integration baked in.
- Templates include: database schema (SQL), RLS configuration, and frontend code.
- Templates are parameterized (project_id, API URL, table names) so the agent fills in project-specific values.
- Common pattern templates (not full apps): database connection, auth flow, file upload, CRUD operations, responsive layout, navigation.

#### Template Library — Utility Apps (13)

| # | Template | Description |
|---|----------|-------------|
| 1 | Shared Todo List | Collaborative task list with checkboxes and assignments |
| 2 | Landing Page + Waitlist | Product launch page with email signup |
| 3 | Expense Splitter | Split bills among friends, track who owes what |
| 4 | Event Scheduling Poll | Doodle-style availability picker |
| 5 | Recipe Book | Personal recipe collection with search and categories |
| 6 | Apartment Tracker | Compare rental listings with notes and ratings |
| 7 | Micro-Blog | Short-form posts with timestamps and reactions |
| 8 | Gift Registry | Wishlist sharing with "claimed" status |
| 9 | Workout Log | Track exercises, sets, reps with progress charts |
| 10 | Flash Cards | Create and study decks with spaced repetition |
| 11 | Voting Booth | Create a poll, share link, see live results |
| 12 | Photo Wall | Event photo sharing — everyone uploads, gallery view |
| 13 | Countdown Timer | Shared event countdown with comments |
| 14 | Potluck Organizer | Who's bringing what — claim items, avoid duplicates |
| 15 | Secret Santa | Anonymous gift exchange matcher |

#### Template Library — Games (12)

| # | Template | Description |
|---|----------|-------------|
| 16 | Hangman | Classic word guessing — solo or pass-and-play |
| 17 | Trivia Night | Kahoot-style: host creates questions, players join via code, live scoring |
| 18 | Would You Rather | Vote on dilemmas, see results in real time |
| 19 | Two Truths and a Lie | Players submit statements, others guess the lie |
| 20 | Word Chain | Take turns adding words, timer-based, score tracking |
| 21 | Bingo Card Generator | Host calls items, players mark their cards |
| 22 | Scavenger Hunt | Team checklist with photo upload proof |
| 23 | Drawing Prompt Roulette | Get a prompt, draw it, others vote on results |
| 24 | Memory Match | Card flip game with difficulty levels and leaderboard |
| 25 | Quiz Maker | Create and share custom quizzes with scoring |
| 26 | Word Scramble | Unscramble words against the clock, shareable scores |
| 27 | Tic-Tac-Toe | Share a link, play a friend, win/loss tracking |

### F10: Human-Facing Pages

The `/humans` section provides everything a human visitor needs.

- **About** — What bld402 is, how it works in plain language, the relationship to run402.
- **Showcase** — Gallery of example apps built on the platform with screenshots. "Want to build one of these? Point your agent here: bld402.com"
- **How It Works** — Step-by-step explanation: 1) Talk to your AI agent, 2) Describe what you want, 3) Point the agent to bld402.com, 4) Get a working app with a shareable link.
- **Terms & Conditions** — Service terms for bld402 (free layer, no warranty, run402 T&C apply for infrastructure).
- **Privacy Policy** — bld402 stores nothing. run402's privacy policy governs data stored there.
- **Legal** — Standard legal notices.

### F11: run402 Payment Pass-Through

bld402 guides agents through run402's payment flow without adding any fees.

- Default to **testnet** (Base Sepolia) for first-time users — completely free via run402's faucet.
- Guide the agent to call run402's `/v1/faucet` to get test USDC.
- When the user wants to keep their app running beyond the prototype lease (7 days), guide upgrade to mainnet (USDC on Base) or Stripe subscription.
- bld402 never charges anything. All costs are run402's standard pricing.

## Acceptance Criteria

### Agent Onboarding (F1)
- [ ] An agent visiting bld402.com for the first time can understand what the site does and begin the build workflow within one page navigation.
- [ ] `/agent.json` returns a valid, parseable workflow manifest describing all available steps.
- [ ] The root page contains a visible "Humans go here" link to `/humans` as the first line.

### Spec Phase (F2)
- [ ] The agent can walk a non-technical user through describing an app using only plain-language questions.
- [ ] No question uses technical jargon (no mentions of "database", "API", "endpoint", "schema", "RLS", "JWT", "REST", etc.).
- [ ] When a user's description matches a template, the template is suggested.
- [ ] The spec phase produces a structured spec stored in agent memory.

### Plan Phase (F3)
- [ ] The plan phase outputs a step-by-step build plan using only run402-capable services.
- [ ] The plan includes the correct run402 tier selection (defaulting to Prototype/testnet).
- [ ] The plan identifies which code template(s) to use.

### Implement Phase (F4)
- [ ] The agent can provision a run402 project (database, tables, RLS) without the user understanding what's happening.
- [ ] The agent generates complete, working client-side code (HTML/CSS/JS) from a template.
- [ ] All run402 API calls are correctly formed with proper auth headers.
- [ ] The generated code works in a modern browser without build tools or compilation.

### Deploy Phase (F5)
- [ ] The agent can deploy the static site to run402 and return a working URL.
- [ ] The URL is accessible in a browser and the app functions correctly.
- [ ] The user receives the URL in plain language ("Your app is live! Share this link.").

### Iterate Phase (F6)
- [ ] The user can request changes in plain language and the agent modifies and redeploys.
- [ ] Each iteration produces a new deployment URL.
- [ ] The agent maintains continuity across iterations using memory directives.

### Capability Guardrails (F7)
- [ ] When a user requests something outside run402's capabilities, bld402 flags it clearly before the agent attempts it.
- [ ] The guardrail message is in plain language with a suggested alternative.
- [ ] The definitive "not possible" list is maintained and accessible to agents.

### Agent Memory (F8)
- [ ] Every step page includes a structured memory directive section.
- [ ] An agent that loses context can resume the workflow from memory directives alone.
- [ ] Memory directives include: project credentials, current step, app spec, deployment URLs.

### Code Templates (F9)
- [ ] All 27 templates are available as complete, working apps.
- [ ] Each template includes: SQL schema, RLS config, and frontend code (HTML/CSS/JS).
- [ ] Templates are parameterized so the agent fills in project-specific values.
- [ ] Common pattern templates (auth, CRUD, file upload, layout) are available separately.

### Human Pages (F10)
- [ ] `/humans` contains: about, showcase, how-it-works, terms, privacy, legal sections.
- [ ] The showcase includes screenshots of at least 5 example apps.
- [ ] The "how it works" section is understandable by a non-technical person.

### Payment Pass-Through (F11)
- [ ] First-time users default to testnet (free) without being asked about payment.
- [ ] The agent is guided to use run402's `/v1/faucet` for test USDC.
- [ ] Upgrade path to mainnet/Stripe is available when the user is ready.
- [ ] bld402 adds zero fees to any transaction.

## Constraints & Dependencies

- **run402.com** — bld402 depends entirely on run402 for backend infrastructure (Postgres, REST API, auth, storage, static hosting). Any run402 outage or API change directly affects bld402.
- **No server-side compute** — All app logic runs client-side (browser JavaScript). bld402 must design all templates and workflows around this constraint.
- **No real-time** — run402 has no WebSocket support. Multiplayer features use database polling (refresh-based or timed polling).
- **Deployment size limit** — 50 MB per static site deployment on run402.
- **Rate limit** — 100 requests/second per run402 project.
- **Lease expiry** — Prototype projects expire after 7 days (then 7-day read-only grace, then archived). bld402 must warn users about this and guide upgrades.
- **Hosting** — bld402.com is a static site hosted on AWS Amplify (kychee account). Domain transfer pending.

## User Flows

### Flow 1: First-Time User Builds an App

1. User tells their AI agent: "I want to build a trivia game for my friends."
2. Agent navigates to bld402.com, reads root page and `/agent.json`.
3. Agent enters the build workflow at step 1 (spec phase).
4. Agent asks the user simple questions: "What kind of questions? How many players? Should there be a score?"
5. Agent matches to the Trivia Night template, confirms with user.
6. Agent moves to plan phase — determines: Prototype tier, testnet, trivia template.
7. Agent moves to implement phase:
   a. Gets test USDC from run402 faucet.
   b. Provisions a run402 project (database + API).
   c. Creates tables (questions, players, scores) via SQL.
   d. Sets up RLS (public_read for questions, user_owns_rows for scores).
   e. Generates frontend code from trivia template with user's customizations.
8. Agent deploys to run402 static hosting, gets URL.
9. Agent tells user: "Your trivia game is live! Share this link with your friends: https://dpl-abc123.sites.run402.com"
10. User tries it, says: "Can you make the timer longer and add funny sound effects?"
11. Agent modifies code, redeploys, gives new URL.
12. User is happy. Agent stores memory directives for future reference.

### Flow 2: Returning User Iterates on Existing App

1. User tells agent: "Remember that trivia game we built? I want to add new questions."
2. Agent retrieves stored memory (project_id, service_key, last deployment URL, app spec).
3. Agent navigates to the appropriate iterate step on bld402.com.
4. bld402 guides the agent through modifying the database (add rows) and redeploying if needed.
5. New deployment URL returned to user.

### Flow 3: User Asks for Something Impossible

1. User says: "I want my app to send email notifications when someone joins."
2. Agent reaches the guardrail check in bld402's workflow.
3. bld402 responds: "Email notifications aren't available on this platform. Here's what we can do instead: show a notification inside the app when someone joins, or add a 'recent players' list that updates when the page refreshes."
4. User picks an alternative, workflow continues.

## Open Questions

- [x] ~~MCP server integration~~ — Yes, but only if installation can be made seamless for users with zero technical knowledge. If we can't make it one-click/one-sentence, skip it.
- [ ] What is the exact format for agent memory directives? (JSON blob? Structured markdown? Needs testing with multiple agents — ChatGPT, Claude, Gemini — to find what persists best.)
- [x] ~~Live previews vs screenshots on showcase~~ — Deferred. Start with screenshots only.
- [x] ~~Handling run402 API changes~~ — Version pinning on run402 API version. Add an update procedure to the bld402 repo for when run402 changes.
- [x] ~~App gallery~~ — Yes. Add a public gallery where users can optionally publish their apps. Pre-seed with sample apps built from templates.

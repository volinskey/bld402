---
product: bld402
version: 0.2.0
status: Draft
type: product
interfaces: [website]
created: 2026-03-04
updated: 2026-03-05
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

Deploy the finished app to run402 static hosting and give the user a memorable, shareable URL.

- Agent calls run402's `/v1/deployments` endpoint to deploy the static site.
- After deployment, claim a memorable subdomain via `POST /v1/subdomains` with `{ name, deployment_id }` using the project's `service_key`. This gives the app a URL like `https://hangman.run402.com` instead of the raw deployment URL.
- Subdomain rules: 3-63 characters, lowercase alphanumeric + hyphens, no leading/trailing hyphens, no reserved words (api, www, admin, etc.). Free, no x402 payment required.
- When redeploying (iterate phase), reassign the subdomain to the new deployment_id — same `POST /v1/subdomains` call, same name, new deployment_id.
- Return the subdomain URL to the user: "Your app is live! Share this link: https://myapp.run402.com"
- Fall back to the raw deployment URL (`https://dpl-{id}.sites.run402.com`) if subdomain claiming fails.

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
  - Fully custom domain names (but run402 subdomains like `myapp.run402.com` ARE supported — see F5)
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
- **Showcase** — Gallery of live demo apps running on run402 with screenshots. Each card links to the live app at its `*.run402.com` subdomain. "Want to build one of these? Point your agent here: bld402.com"
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

### F12: Live Showcase Apps

Five fully functional demo apps, each built using the bld402 workflow and deployed to run402 with a memorable subdomain. These are the proof that bld402 works — a visitor clicks a showcase card and lands on a real, working app. Each app is built from its MVP template, deployed to run402, and validated individually via red team system testing.

#### Shared Subdomain Convention

All showcase apps live at `{app-name}.run402.com`:

| App | Subdomain | URL |
|-----|-----------|-----|
| Shared Todo List | `todo` | https://todo.run402.com |
| Landing Page + Waitlist | `waitlist` | https://waitlist.run402.com |
| Hangman | `hangman` | https://hangman.run402.com |
| Trivia Night | `trivia` | https://trivia.run402.com |
| Voting Booth | `vote` | https://vote.run402.com |

#### Build Process

Each showcase app must be built by following the actual bld402 workflow (steps 1-16) using the corresponding template. This serves as both a functional test of the workflow and produces the live demo. The run402 project for each app should use the **Hobby tier** (not Prototype) so the apps don't expire after 7 days.

#### App 1: Shared Todo List (`todo.run402.com`)

A collaborative task list where multiple people can add, complete, and assign tasks.

**What it does:**
- Any visitor can add a task (text input + add button)
- Tasks display in a list with checkbox to mark done, assigned-to field, and delete button
- Tasks persist in the database — reload the page and they're still there
- Real-time-ish updates via polling (every 5 seconds)
- Clean, minimal UI — works on mobile and desktop

**Database schema:**
- `todos` table: `id` (serial PK), `task` (text, not null), `done` (boolean, default false), `assigned_to` (text, nullable), `user_id` (uuid, nullable), `created_at` (timestamptz, default now())

**RLS policy:** `public_read_write` — anyone can read and write (no auth required for the demo)

**UI requirements:**
- Header: "Shared Todo List" with subtle bld402 branding ("Built with bld402")
- Input bar at top: text field + "Add" button
- Task list below: each row has checkbox, task text, assigned-to tag, delete icon
- Completed tasks are struck through and grayed out
- Empty state: "No tasks yet. Add one above!"
- Mobile-responsive: single column, touch-friendly tap targets

**Seed data:** Pre-populate with 3 example tasks so the app isn't empty on first visit:
1. "Buy groceries for the party" (assigned to "Alex")
2. "Set up the playlist" (assigned to "Jordan", done: true)
3. "Send invites to everyone" (assigned to "Sam")

#### App 2: Landing Page + Waitlist (`waitlist.run402.com`)

A product launch page with email signup — the classic "coming soon" page.

**What it does:**
- Hero section with product name, tagline, and call-to-action
- Email signup form: enter email, click "Join the Waitlist"
- After signup: thank you message with position number ("You're #42 on the waitlist!")
- Signups persist in the database
- Simple, polished single-page design

**Database schema:**
- `signups` table: `id` (serial PK), `email` (text, unique, not null), `created_at` (timestamptz, default now())

**RLS policy:** `public_read_write` for inserts (anyone can sign up), service_role for reads (signup list is private)

**UI requirements:**
- Hero section: large heading "Something Amazing is Coming", subtext "Sign up to be the first to know", gradient or bold color background
- Email input + "Join the Waitlist" button centered
- After submit: hide form, show "You're in! You're #{count} on the waitlist."
- Duplicate email: friendly message "You're already on the list!"
- Footer: "Built with bld402" branding
- Mobile-responsive, single-page, no scroll needed on desktop

**Seed data:** Pre-populate with 15-20 fake email signups so the first real visitor sees "You're #21 on the waitlist!" instead of "#1"

#### App 3: Hangman (`hangman.run402.com`)

Classic word guessing game — solo play with random words.

**What it does:**
- Random word selected from a built-in word list (stored in DB)
- Display: word as blanks (underscores), hangman drawing (SVG), guessed letters
- Player clicks letter buttons (A-Z) to guess
- Correct guess: reveal letter(s) in the word
- Wrong guess: add body part to hangman (6 wrong = game over)
- Win state: "You got it! The word was ___" + play again button
- Lose state: "Game over! The word was ___" + play again button
- Track wins/losses in the current session (not persisted)

**Database schema:**
- `words` table: `id` (serial PK), `word` (text, not null), `category` (text, nullable), `difficulty` (text: easy/medium/hard)
- `games` table: `id` (serial PK), `word_id` (integer, references words), `guesses` (text[], default '{}'), `status` (text: playing/won/lost), `created_at` (timestamptz, default now())

**RLS policy:** `public_read` for words, `public_read_write` for games

**UI requirements:**
- Header: "Hangman" with win/loss counter
- Center: hangman SVG drawing (progressive: head, body, left arm, right arm, left leg, right leg)
- Below drawing: word display as underscored blanks with revealed letters
- Below word: A-Z letter grid (buttons), used letters grayed out
- Win/lose overlay with the word and "Play Again" button
- "Built with bld402" footer
- Mobile-responsive: letter grid wraps, tap-friendly

**Seed data:** Pre-populate `words` table with 50+ words across 3 difficulty levels:
- Easy (4-5 letters): cat, dog, fish, bird, book, tree, star, moon, cake, rain, etc.
- Medium (6-7 letters): garden, puzzle, rocket, castle, bridge, planet, etc.
- Hard (8+ letters): elephant, dinosaur, fireworks, adventure, butterfly, etc.

#### App 4: Trivia Night (`trivia.run402.com`)

Multiplayer trivia game — one person hosts, others join with a code, live scoring.

**What it does:**
- **Host flow:** Create a room → get a 4-digit join code → add questions (or use pre-loaded set) → start the game → see live scoreboard
- **Player flow:** Enter join code → pick a display name → wait for host to start → answer questions → see score after each round
- Questions display one at a time with 4 multiple-choice options and a countdown timer (15 seconds)
- After timer expires or all players answer, show correct answer + updated scores
- End of game: final scoreboard ranked by score, host can play again
- Polling-based updates (every 2 seconds during active game)

**Database schema:**
- `rooms` table: `id` (serial PK), `code` (text, unique, 4 digits), `host_name` (text), `status` (text: lobby/playing/finished), `current_question` (integer, default 0), `created_at` (timestamptz)
- `questions` table: `id` (serial PK), `room_id` (integer, references rooms), `question_text` (text), `options` (jsonb, array of 4 strings), `correct_index` (integer, 0-3), `time_limit` (integer, default 15), `order_num` (integer)
- `players` table: `id` (serial PK), `room_id` (integer, references rooms), `name` (text), `score` (integer, default 0), `joined_at` (timestamptz)
- `answers` table: `id` (serial PK), `player_id` (integer, references players), `question_id` (integer, references questions), `selected_index` (integer), `answered_at` (timestamptz), unique constraint on (player_id, question_id)

**RLS policy:** `public_read` for rooms and questions, `public_read_write` for players and answers

**UI requirements:**
- **Landing screen:** Two buttons: "Host a Game" / "Join a Game"
- **Host lobby:** Shows room code (large, copyable), player list updating live, "Start Game" button (disabled until 2+ players)
- **Player lobby:** Enter code + name, then waiting screen showing other players
- **Question screen:** Question text, 4 answer buttons (color-coded: red/blue/green/yellow), countdown timer bar
- **Results screen:** Correct answer highlighted, points awarded, scoreboard
- **Final screen:** Ranked scoreboard, "Play Again" button for host
- "Built with bld402" footer
- Mobile-first: works great on phones (players will be on phones)

**Seed data:** Pre-load 3 question sets (10 questions each) that hosts can use:
1. **General Knowledge:** Mix of geography, science, pop culture, history
2. **Movies & TV:** Popular films and shows, quotes, actors
3. **Food & Drink:** Cuisine origins, ingredients, cooking terms

#### App 5: Voting Booth (`vote.run402.com`)

Create a poll, share the link, see live results.

**What it does:**
- **Create flow:** Enter question + 2-6 options → get a shareable poll URL
- **Vote flow:** See question + options → click to vote → see live results
- Results shown as horizontal bar chart with percentages, updating via polling (every 3 seconds)
- One vote per browser (tracked via localStorage, not auth)
- Poll creator can close the poll (no more votes)

**Database schema:**
- `polls` table: `id` (serial PK), `question` (text, not null), `slug` (text, unique), `is_open` (boolean, default true), `admin_token` (text), `created_at` (timestamptz)
- `options` table: `id` (serial PK), `poll_id` (integer, references polls), `label` (text, not null), `order_num` (integer)
- `votes` table: `id` (serial PK), `option_id` (integer, references options), `voter_token` (text, not null), `created_at` (timestamptz), unique constraint on (option_id's poll, voter_token)

**RLS policy:** `public_read` for polls and options, `public_read_write` for votes (with unique constraint enforcing one vote per token per poll)

**UI requirements:**
- **Create screen:** "Create a Poll" heading, question input, dynamic option inputs (start with 2, "Add Option" button up to 6), "Create Poll" button
- **Poll screen:** Question displayed large, option buttons below, after voting show results
- **Results view:** Horizontal bar chart, each bar labeled with option text + vote count + percentage, total votes shown
- Poll URL uses slug (e.g., `vote.run402.com/poll/best-pizza-topping`)
- Closed poll: show results only, "This poll is closed" banner
- "Built with bld402" footer
- Mobile-responsive: bars stack vertically, tap-friendly vote buttons

**Seed data:** Create 1 example poll pre-loaded: "What's the best pizza topping?" with options: Pepperoni, Mushrooms, Pineapple, Extra Cheese, Olives. Pre-populate with 25-30 random votes so the results chart looks active.

#### Validation Requirement

Each showcase app MUST be individually validated using the `/validate` red team process:
1. Build the app using the bld402 workflow (following the templates)
2. Deploy to run402 and claim the subdomain
3. Run `/validate` against the app — red team tests the live deployed app at its `*.run402.com` URL
4. Fix any failures found by the red team
5. App is only considered complete when validation passes

The system test for each app should verify:
- The app loads at its subdomain URL
- All described functionality works (CRUD operations, game logic, polling, etc.)
- UI matches the spec (layout, responsiveness, branding)
- Seed data is present
- Edge cases are handled (empty states, duplicate submissions, invalid input)
- Mobile viewport works

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
- [ ] The agent claims a memorable subdomain via `POST /v1/subdomains` after deployment.
- [ ] The subdomain URL (e.g., `https://myapp.run402.com`) is accessible in a browser and the app functions correctly.
- [ ] The user receives the subdomain URL in plain language ("Your app is live! Share this link.")
- [ ] On redeploy, the agent reassigns the subdomain to the new deployment.

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
- [ ] The showcase links to 5 live demo apps at their `*.run402.com` subdomains.
- [ ] The showcase includes screenshots of the 5 live apps.
- [ ] The "how it works" section is understandable by a non-technical person.

### Payment Pass-Through (F11)
- [ ] First-time users default to testnet (free) without being asked about payment.
- [ ] The agent is guided to use run402's `/v1/faucet` for test USDC.
- [ ] Upgrade path to mainnet/Stripe is available when the user is ready.
- [ ] bld402 adds zero fees to any transaction.

### Live Showcase Apps (F12)
- [ ] All 5 showcase apps are deployed and live at their subdomains: todo.run402.com, waitlist.run402.com, hangman.run402.com, trivia.run402.com, vote.run402.com.
- [ ] Each app was built using the bld402 workflow and its corresponding MVP template.
- [ ] Each app has seed data so it's not empty on first visit.
- [ ] Each app includes "Built with bld402" branding.
- [ ] Each app works on mobile and desktop.
- [ ] Each app has been individually validated via `/validate` red team testing against its live URL.
- [ ] The showcase page links to each live app.
- [ ] Showcase apps use Hobby tier (not Prototype) so they don't expire.

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
8. Agent deploys to run402 static hosting, claims subdomain `trivia.run402.com`.
9. Agent tells user: "Your trivia game is live! Share this link with your friends: https://trivia.run402.com"
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
- [x] ~~Live previews vs screenshots on showcase~~ — Resolved. Showcase links to live apps at `*.run402.com` subdomains (F12). Screenshots kept as fallback/preview.
- [x] ~~Handling run402 API changes~~ — Version pinning on run402 API version. Add an update procedure to the bld402 repo for when run402 changes.
- [x] ~~App gallery~~ — Yes. Add a public gallery where users can optionally publish their apps. Pre-seed with sample apps built from templates.

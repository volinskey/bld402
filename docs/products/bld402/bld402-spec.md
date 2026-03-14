---
product: bld402
version: 0.4.0
status: Draft
type: product
interfaces: [website, mcp, npm]
created: 2026-03-04
updated: 2026-03-13
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

### MCP Server (`bld402-mcp`)

- **npm package:** `bld402-mcp` (public, MIT license)
- **GitHub repo:** `kychee-com/bld402-mcp` (separate from bld402 website repo)
- **Install:** `npx bld402-mcp` — stdio transport, works with Claude Code, Cursor, Claude Desktop, Cline, Windsurf
- **Architecture:** Stateful workflow MCP server. Guides agents through bld402's build process one step at a time. Calls the run402 API directly at `https://api.run402.com` (same client pattern as run402-mcp). No dependency on run402-mcp — bld402-mcp is fully self-contained.
- **Session state:** Persisted to `~/.config/bld402/session.json`. Stores: current step, project credentials (project_id, anon_key, service_key), app spec, deployment URL, wallet address.
- **Templates:** Bundled in the npm package from the bld402 `templates/` directory. Agents access them via MCP resources.
- **Design principle:** The agent sees ONE step at a time. The MCP server feeds instructions, validates step outputs, tracks budget, and advances the workflow. The agent never needs to visit bld402.com.

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
  - Server-side compute beyond run402 functions (run402 functions ARE supported — see Paste Locker template)
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
- **Coding-Agent Gate:** Every template's `README.md` MUST begin with a blockquote that instructs non-coding agents (those that cannot create files or run shell commands) to stop and redirect the user to a coding agent (Claude Code, ChatGPT Codex, Cursor, Windsurf). This prevents chat-only agents from producing useless artifacts instead of building the project.

#### Template Library — Utility Apps (8)

| # | Template | Services | Description |
|---|----------|----------|-------------|
| 1 | Shared Todo List | database, rest-api | Collaborative task list with checkboxes and assignments |
| 2 | Landing Page + Waitlist | database, rest-api | Product launch page with email signup |
| 3 | Voting Booth | database, rest-api | Create a poll, share link, see live results |
| 4 | Paste Locker | database, functions | Secure pastebin with server-side password hashing |
| 5 | Micro-Blog | **auth**, **storage**, database, rest-api | Short-form posts with image attachments — public feed, authenticated posting |
| 6 | Photo Wall | **auth**, **storage**, database, rest-api | Event photo sharing with auth-gated uploads and gallery view |
| 7 | Secret Santa | **auth**, **functions**, database, rest-api | Anonymous gift exchange with server-side matching |
| 8 | Flash Cards | **auth**, database, rest-api | Create and study decks with spaced repetition |

#### Template Library — Games (5)

| # | Template | Services | Description |
|---|----------|----------|-------------|
| 9 | Hangman | database, rest-api | Classic word guessing — solo play with random words |
| 10 | Trivia Night | database, rest-api | Kahoot-style: host creates questions, players join via code, live scoring |
| 11 | AI Sticker Maker | **generate-image**, **storage**, database, rest-api | Type a prompt, get an AI-generated sticker, save to public gallery |
| 12 | Bingo Card Generator | database, rest-api | Host calls items, players mark unique cards, auto-detect bingo |
| 13 | Memory Match | **generate-image**, **storage**, database, rest-api | Card flip matching game with AI-generated art and leaderboard |

### F10: Human-Facing Pages

The `/humans` section provides everything a human visitor needs.

- **About** — What bld402 is, how it works in plain language, the relationship to run402.
- **Showcase** — Gallery of live demo apps running on run402 with screenshots. Each card links to the live app at its `*.run402.com` subdomain. "Want to build one of these? Point your agent here: bld402.com"
- **Templates** (`/humans/templates.html`) — Human-friendly template gallery with 13 active cards (description, "See example" link to live showcase, "How to use" initiation string with copy-to-clipboard button). Each "How to use" code block must include a small copy icon that copies the agent instruction text to the clipboard on click, with brief visual feedback (checkmark). Separate from the agent-facing `/templates/` catalog.
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

Thirteen fully functional demo apps, each built using the bld402 workflow and deployed to run402 with a memorable subdomain. These are the proof that bld402 works — a visitor clicks a showcase card and lands on a real, working app. Each app is built from its MVP template, deployed to run402, and validated individually via red team system testing.

#### Shared Subdomain Convention

All showcase apps live at `{app-name}.run402.com`:

| App | Subdomain | URL | Status |
|-----|-----------|-----|--------|
| Shared Todo List | `todo` | https://todo.run402.com | Live |
| Landing Page + Waitlist | `waitlist` | https://waitlist.run402.com | Live |
| Hangman | `hangman` | https://hangman.run402.com | Live |
| Trivia Night | `trivia` | https://trivia.run402.com | Live |
| Voting Booth | `vote` | https://vote.run402.com | Live |
| Paste Locker | `paste` | https://paste.run402.com | Live |
| Micro-Blog | `microblog` | https://microblog.run402.com | To build |
| Photo Wall | `wall` | https://wall.run402.com | To build |
| Secret Santa | `santa` | https://santa.run402.com | To build |
| AI Sticker Maker | `stickers` | https://stickers.run402.com | To build |
| Flash Cards | `cards` | https://cards.run402.com | To build |
| Bingo Card Generator | `bingo` | https://bingo.run402.com | To build |
| Memory Match | `memory` | https://memory.run402.com | To build |

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
- `polls` table: `id` (uuid PK), `title` (text, not null), `description` (text, nullable), `created_by` (text, nullable), `multiple_choice` (boolean, default false), `closed` (boolean, default false), `created_at` (timestamptz)
- `options` table: `id` (uuid PK), `poll_id` (uuid, references polls), `label` (text, not null), `sort_order` (integer)
- `votes` table: `id` (uuid PK), `poll_id` (uuid, references polls), `option_id` (uuid, references options), `voter_id` (text, not null), `voted_at` (timestamptz), unique constraint on (poll_id, voter_id)

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

#### App 6: Paste Locker (`paste.run402.com`)

Secure pastebin with server-side password hashing via Lambda function.

**What it does:**
- Create a note with optional password protection
- Get a shareable link — anyone with the link can view (or must enter password if protected)
- Notes are stored in the database, passwords are hashed server-side via a Lambda function
- Notes can have an expiry (1 hour, 1 day, 7 days, never)
- Syntax highlighting for code pastes

**Database schema:**
- `notes` table: `id` (uuid PK), `content` (text, not null), `title` (text, nullable), `password_hash` (text, nullable), `expires_at` (timestamptz, nullable), `views` (integer, default 0), `created_at` (timestamptz, default now())

**RLS policy:** `public_read_write` — anyone can create and read notes (password check is application-level via function)

**Functions:**
- `hash-password`: Takes plaintext password, returns bcrypt hash (used on note creation)
- `verify-password`: Takes plaintext + hash, returns boolean (used on note access)

**UI requirements:**
- **Create screen:** Title (optional), content textarea with monospace font, password field (optional), expiry dropdown, "Create Note" button
- **View screen:** Title, content with syntax highlighting, view count, creation date
- **Password screen:** If protected, show password input before revealing content
- "Built with bld402" footer
- Mobile-responsive

**Seed data:** 3 example notes pre-created: one public code snippet, one public plain text, one password-protected (password: "demo")

#### App 7: Micro-Blog (`microblog.run402.com`)

Short-form posts with optional image attachments — public feed, authenticated posting. The Micro-Blog template prominently offers vanity subdomain selection during deployment — "Pick a name for your blog: `yourname.run402.com`" — because a blog URL is your identity.

**What it does:**
- Anyone can browse the feed (no login required)
- Sign up / log in to create posts (text + optional image)
- Posts display in reverse chronological order with author name, timestamp, and image
- React to posts with a simple heart/like (no auth required for reactions)
- Authors can delete their own posts

**Database schema:**
- `posts` table: `id` (serial PK), `body` (text, not null, max 500 chars), `image_path` (text, nullable), `user_id` (uuid, not null, references auth.users), `author_name` (text, not null), `likes` (integer, default 0), `created_at` (timestamptz, default now())

**RLS policy:**
- `public_read` on posts (anyone can read)
- `user_owns_rows` on insert/delete (only your own posts)

**Storage:** Images uploaded to `posts/` bucket, public read access.

**UI requirements:**
- Header: "Micro-Blog" with login/signup buttons (or username + logout when authenticated)
- Feed: reverse chronological cards — author name, timestamp, text, optional image, heart button with count
- Compose bar (visible only when logged in): text area (500 char limit with counter), "Add Image" button, "Post" button
- Empty state: "No posts yet. Sign up and be the first!"
- Mobile-responsive: single column feed, touch-friendly
- "Built with bld402" footer

**Seed data:** Pre-populate with 8-10 fun posts from fake users, some with images (generated via generate-image or stock), covering a mix of topics — food pics, pet photos, shower thoughts, etc.

#### App 8: Photo Wall (`wall.run402.com`)

Event photo sharing with auth-gated uploads and gallery view.

**What it does:**
- Gallery grid of photos with captions and timestamps
- Auth-gated uploads: sign up/log in to post photos (template supports toggling view permissions too)
- Photos stored via run402 storage (S3)
- Masonry-style or grid layout, lightbox on click
- Optional: restrict viewing to authenticated users only (private wall)

**Showcase specifics:**
- `wall.run402.com` is a **curated "mad wall"** — pre-loaded with fun AI-generated images (stickers, weird art, memes)
- **Uploads disabled** in showcase — it's a visual demo only, no public posting
- Looks vibrant and full on first visit

**Database schema:**
- `photos` table: `id` (serial PK), `caption` (text, nullable, max 200 chars), `image_path` (text, not null), `user_id` (uuid, not null, references auth.users), `author_name` (text, not null), `created_at` (timestamptz, default now())

**RLS policy:**
- `public_read` on photos (default — can be switched to `user_owns_rows` for private walls)
- `user_owns_rows` on insert/delete (authenticated users post and delete their own)

**Storage:** Images uploaded to `photos/` bucket, public read by default.

**UI requirements:**
- Header: "Photo Wall" with login/signup buttons (or username + logout)
- Gallery: responsive grid (3 cols desktop, 2 cols tablet, 1 col mobile), each card = image + caption + author + timestamp
- Lightbox: click any photo to see it full-size with caption
- Upload button (visible only when logged in): pick image, add caption, post
- Empty state: "No photos yet. Sign up and share something!"
- "Built with bld402" footer
- Mobile-responsive, touch-friendly

**Seed data:** 12-15 AI-generated fun images with playful captions like "When the code finally compiles", "Office dog says hi", "Abstract art by a robot", etc.

#### App 9: Secret Santa (`santa.run402.com`)

Anonymous gift exchange — organizer creates a group, members join, server-side matching, in-app reveal.

**What it does:**
- **Organizer flow:** Sign up/log in → create a group (name + budget suggestion) → get a join code → share with friends → trigger the draw when everyone's in
- **Member flow:** Sign up/log in → enter join code → add your wishlist (text) → wait for the draw
- **The draw:** Organizer clicks "Draw Names" → server-side Lambda function shuffles and assigns pairs (no one sees the full list) → each member signs in to see their assignment
- **After draw:** Each member can only see their own assignment + the person's wishlist
- Organizer can see status (who's viewed their assignment) but NOT the pairings

**Database schema:**
- `groups` table: `id` (serial PK), `name` (text, not null), `code` (text, unique, 6 chars), `budget` (text, nullable), `organizer_id` (uuid, not null, references auth.users), `status` (text: open/drawn), `created_at` (timestamptz)
- `members` table: `id` (serial PK), `group_id` (integer, references groups), `user_id` (uuid, not null, references auth.users), `display_name` (text, not null), `wishlist` (text, nullable), `assigned_to` (integer, nullable, references members), `viewed_assignment` (boolean, default false), `joined_at` (timestamptz)

**RLS policy:**
- `user_owns_rows` on members (you can only see/edit your own row)
- Members can read group info if they belong to it
- `assigned_to` is only readable by the row owner (you see your own assignment only)

**Functions:**
- `draw-names`: Takes `group_id`, fetches all members, generates a valid circular shuffle (A→B→C→A, no self-assignments), writes `assigned_to` for each member, updates group status to `drawn`. Runs server-side so no client ever sees the full pairing list.

**UI requirements:**
- **Landing screen:** "Secret Santa" — two buttons: "Organize a Group" / "Join a Group"
- **Organizer lobby:** Group name, join code (large, copyable), member list updating via polling, "Draw Names" button (disabled until 3+ members)
- **Member view:** Enter code + sign up/log in, add display name + wishlist, waiting screen
- **Post-draw screen:** "You're getting a gift for: {name}" with their wishlist. No other pairings visible.
- **Organizer post-draw:** Status list showing who has viewed their assignment, no pairings shown
- "Built with bld402" footer
- Mobile-responsive

**Seed data:** One pre-created group "bld402 Team Holiday Exchange" with 5 fake members and wishlists (already drawn), so the showcase shows what a completed exchange looks like.

#### App 10: AI Sticker Maker (`stickers.run402.com`)

Type a prompt, get an AI-generated sticker image, save to a public gallery.

**What it does:**
- Type a text prompt (e.g., "happy cat wearing a top hat")
- Click "Generate" → AI creates a sticker image via run402's generate-image service
- Preview the result → "Save to Gallery" or "Try Again"
- Saved stickers appear in a public gallery grid that anyone can browse
- No auth required — anyone can generate and save (simple, low friction)

**Database schema:**
- `stickers` table: `id` (serial PK), `prompt` (text, not null, max 200 chars), `image_path` (text, not null), `creator_name` (text, nullable, default 'Anonymous'), `likes` (integer, default 0), `created_at` (timestamptz, default now())

**RLS policy:** `public_read_write` — anyone can create and browse stickers (no auth, keep it frictionless)

**Storage:** Generated images saved to `stickers/` bucket, public read.

**Services flow:**
1. User types prompt → client calls `POST /v1/generate-image` with prompt text (x402-gated, $0.01)
2. Image returned → displayed as preview
3. User clicks "Save" → client uploads image to storage via `POST /storage/v1/object/stickers/` → inserts row into `stickers` table with `image_path`

**UI requirements:**
- Header: "AI Sticker Maker" with sparkle/magic wand icon
- **Generate section:** Large text input ("Describe your sticker..."), optional name field ("Your name (optional)"), "Generate" button with loading spinner
- **Preview:** Generated image displayed large, two buttons: "Save to Gallery" / "Try Again"
- **Gallery below:** Grid of all saved stickers (newest first) — each card shows image, prompt text, creator name, like button
- Lightbox on click for full-size view
- Empty state for gallery: "No stickers yet. Generate the first one!"
- "Built with bld402" footer
- Mobile-responsive: single column generate, 2-col gallery on mobile

**Seed data:** Pre-generate 15-20 fun stickers with prompts like "rocket ship made of pizza", "penguin DJ at a beach party", "robot dog playing guitar", "unicorn astronaut", "grumpy cloud with sunglasses", etc.

**Showcase note:** `stickers.run402.com` is fully functional — visitors can actually generate stickers (costs $0.01 per image via x402, paid from the showcase project wallet).

#### App 11: Flash Cards (`cards.run402.com`)

Create and study decks with spaced repetition — personal decks, authenticated.

**What it does:**
- Sign up / log in to create and manage your own decks
- Each deck has a name and a set of cards (front/back)
- Study mode: show front, tap to reveal back, rate yourself (Easy / Hard / Again)
- Spaced repetition: cards you mark "Hard" or "Again" appear sooner, "Easy" cards spaced out
- Deck library: browse your decks, see progress (% mastered)
- Optional: share a deck via public link (read-only, others can clone it)

**Database schema:**
- `decks` table: `id` (serial PK), `name` (text, not null), `description` (text, nullable), `user_id` (uuid, not null, references auth.users), `is_public` (boolean, default false), `created_at` (timestamptz)
- `cards` table: `id` (serial PK), `deck_id` (integer, references decks), `front` (text, not null), `back` (text, not null), `sort_order` (integer)
- `progress` table: `id` (serial PK), `card_id` (integer, references cards), `user_id` (uuid, not null, references auth.users), `ease_factor` (numeric, default 2.5), `interval_days` (integer, default 0), `next_review` (timestamptz, default now()), `review_count` (integer, default 0), unique constraint on (card_id, user_id)

**RLS policy:**
- `user_owns_rows` on decks, cards, and progress (you see only your own)
- Public decks: `public_read` override on decks + cards where `is_public = true`

**UI requirements:**
- Header: "Flash Cards" with login/signup buttons (or username + logout)
- **My Decks screen:** List of decks with name, card count, progress bar (% mastered), "Study" and "Edit" buttons, "+ New Deck" button
- **Edit deck:** Deck name, description, list of cards (front/back inputs), add/remove cards, toggle "Make Public"
- **Study mode:** Full-screen card — shows front, tap/click to flip, then 3 buttons: Again (red) / Hard (yellow) / Easy (green). Progress bar at top showing cards remaining in session
- **Shared deck view:** Read-only preview of a public deck, "Clone to My Decks" button
- Empty state: "No decks yet. Create your first one!"
- "Built with bld402" footer
- Mobile-first: study mode designed for phone use (swipe-friendly, large tap targets)

**Seed data:** 3 pre-made public decks:
1. "World Capitals" — 20 cards (front: country, back: capital)
2. "Spanish Basics" — 15 cards (front: English word, back: Spanish translation)
3. "Web Dev Terms" — 15 cards (front: term like "REST API", back: plain-language explanation)

#### App 12: Bingo Card Generator (`bingo.run402.com`)

Host creates a bingo game with custom items, players get unique cards, host calls items live.

**What it does:**
- **Host flow:** Create a game → enter 25+ items (or use a preset list) → get a join code → share with players → call items one by one
- **Player flow:** Enter join code → get a randomly generated unique bingo card (5x5 grid, free center) → mark items as host calls them → first to complete a row/column/diagonal wins
- Host controls the pace — clicks "Next Call" to reveal the next item
- Auto-detection: when a player completes a line, they get a "BINGO!" alert and the host is notified
- Game state via polling (every 2 seconds)

**Database schema:**
- `games` table: `id` (serial PK), `name` (text, not null), `code` (text, unique, 4 digits), `host_name` (text, not null), `status` (text: setup/playing/finished), `created_at` (timestamptz)
- `items` table: `id` (serial PK), `game_id` (integer, references games), `label` (text, not null), `called` (boolean, default false), `call_order` (integer, nullable)
- `players` table: `id` (serial PK), `game_id` (integer, references games), `name` (text, not null), `card` (jsonb, 5x5 array of item IDs), `marked` (jsonb, array of marked item IDs, default '[]'), `has_bingo` (boolean, default false), `joined_at` (timestamptz)

**RLS policy:**
- `public_read` on games and items
- `public_read_write` on players (no auth — low friction party game)

**UI requirements:**
- **Landing screen:** "Bingo!" — two buttons: "Host a Game" / "Join a Game"
- **Host setup:** Game name, text area to enter items (one per line, minimum 25), or pick a preset list. "Create Game" button
- **Host game screen:** Join code (large, copyable), player count, big "Next Call" button, called items list, current call displayed prominently
- **Player lobby:** Enter code + name, waiting screen
- **Player game screen:** 5x5 bingo card grid, free center space pre-marked, tap items to mark them as host calls, called items list on the side. Marked items highlighted
- **Bingo alert:** Confetti animation + "BINGO!" overlay when a player completes a line
- "Built with bld402" footer
- Mobile-first: card grid sized for phone screens, large tap targets

**Seed data:** 3 preset item lists:
1. "Office Bingo" — 30 items: "Someone's on mute", "Dog in background", "Sorry I was on mute", "Can you see my screen?", etc.
2. "Holiday Bingo" — 30 items: "Ugly sweater", "Fruitcake", "Someone sings carols", etc.
3. "Road Trip Bingo" — 30 items: "Gas station", "License plate game", "Are we there yet?", etc.

**Showcase note:** `bingo.run402.com` has a pre-created game in "finished" state showing a completed board with called items, so visitors see what a game looks like mid-play.

#### App 13: Memory Match (`memory.run402.com`)

Card flip matching game with AI-generated card art and difficulty levels.

**What it does:**
- Pick a difficulty: Easy (4x3 = 6 pairs), Medium (4x4 = 8 pairs), Hard (6x4 = 12 pairs)
- Cards are face-down — click to flip, find matching pairs
- Each pair has unique AI-generated art (generated once via generate-image, stored in storage)
- Track: moves count, time elapsed, best scores per difficulty
- Smooth flip animation, matched pairs stay revealed
- Leaderboard: top scores stored in database (name + moves + time)

**Database schema:**
- `card_sets` table: `id` (serial PK), `name` (text, not null), `difficulty` (text: easy/medium/hard), `created_at` (timestamptz)
- `card_images` table: `id` (serial PK), `card_set_id` (integer, references card_sets), `prompt` (text, not null), `image_path` (text, not null), `pair_index` (integer, not null)
- `scores` table: `id` (serial PK), `player_name` (text, not null), `difficulty` (text, not null), `moves` (integer, not null), `time_seconds` (integer, not null), `created_at` (timestamptz)

**RLS policy:**
- `public_read` on card_sets and card_images
- `public_read_write` on scores (no auth — casual game, leaderboard is public)

**Storage:** AI-generated card images stored in `cards/` bucket, public read.

**Generate-image usage:** Each card set has its themed art generated once at build time:
- Easy set: 6 pairs of cute animals ("happy otter", "sleepy fox", "dancing penguin", etc.)
- Medium set: 8 pairs of food ("pizza slice", "sushi roll", "taco", etc.)
- Hard set: 12 pairs of space objects ("ringed planet", "spiral galaxy", "astronaut cat", etc.)

**UI requirements:**
- Header: "Memory Match" with difficulty selector (Easy / Medium / Hard) and stats (moves, timer)
- **Game board:** Grid of face-down cards, click to flip with smooth CSS animation, matched pairs stay face-up with a subtle glow
- **Match feedback:** Brief green flash on match, brief red shake on mismatch, auto-flip back after 1 second
- **Win screen:** "You did it!" — moves count, time, "Enter your name for the leaderboard" input, "Play Again" button
- **Leaderboard:** Top 10 per difficulty, shown below the game or as a tab
- "Built with bld402" footer
- Mobile-responsive: grid scales to screen, tap-friendly cards

**Seed data:**
- 3 card sets pre-generated (easy/medium/hard) with AI art already in storage
- 10-15 fake leaderboard scores per difficulty so it doesn't look empty

**Showcase note:** `memory.run402.com` is fully playable. The AI-generated card art makes it visually distinctive — no two Memory Match apps will look the same if users generate their own sets.

#### Template Validation — Two-Gate Process

Every template in the spec (all 13) requires **two gates** to be considered fully validated. Both gates must pass.

**Gate 1: Showcase Test** — Test the existing live showcase deployment at its `*.run402.com` URL.
- Verify the app loads at its subdomain
- Verify all described functionality works (CRUD, game logic, polling, etc.)
- Verify UI matches the spec (layout, responsiveness, branding)
- Verify seed data is present
- Verify edge cases (empty states, duplicate submissions, invalid input)
- Verify mobile viewport works

**Gate 2: Build-from-Scratch Test** — Provision a fresh run402 project, follow the bld402 step pages (steps 1-16) using the template, deploy, and run the **same tests** from Gate 1 against the freshly built app. When both gates pass, nuke the test project via `scripts/nuke-test.sh`. This validates that the template actually works end-to-end when an agent follows the workflow.

**Rules:**
1. Gate 2 cannot start until Gate 1 passes. If the showcase is broken, fix it first.
2. A template is only "validated" when BOTH gates pass in the same test cycle.
3. **Unbuilt templates are blocked, not skipped.** If a template has no implementation files, the system test plan MUST include lines for both Gate 1 and Gate 2, marked as `[B]` (blocked) with a note that the template is not yet built. They are never omitted from the test plan.
4. **Any Blue Team change to a template or its showcase resets both gates to untested.** If the Blue Team modifies any file in `templates/{category}/{name}/` or `showcase/{name}/`, both Gate 1 and Gate 2 for that template must be re-run in the next Red Team cycle. Same applies when a new template is added to the spec.
5. **Cleanup is mandatory.** Gate 2 projects MUST be nuked after testing. Report the project_id and cleanup status in the system test results. See AGENTS.md for cleanup rules.
6. **Sequential, stop on first failure.** Gate 2 tests run one template at a time. If a template fails, STOP — do not proceed to the next template. Fix the failure first, then continue. Order: shared-todo → landing-waitlist → voting-booth → paste-locker → hangman → trivia-night → micro-blog → photo-wall → secret-santa → ai-sticker-maker → flash-cards → bingo-card-generator → memory-match.
7. **Wallet for Gate 2.** The Red Team uses the shared test wallet at `showcase/.wallet` for x402 payments. This is the only exception to the "no source code" rule — the wallet is equivalent to a user's own wallet. See AGENTS.md for usage details.

**Test plan format for each template:**
```
### Template: {name}

- [ ] **T-XXX: Gate 1 — Showcase test ({name}.run402.com)** — live website
  Steps: ...
  Expected: ...

- [ ] **T-XXX: Gate 2 — Build from scratch using {name} template** — live website + API
  Steps: 1) Provision project 2) Run schema.sql 3) Apply RLS 4) Deploy HTML 5) Run Gate 1 tests against new URL 6) Nuke project
  Expected: Same as Gate 1, plus successful cleanup
```

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
- [ ] All 13 templates are available as complete, working apps.
- [ ] Each template includes: SQL schema, RLS config, and frontend code (HTML/CSS/JS).
- [ ] Templates are parameterized so the agent fills in project-specific values.
- [ ] Common pattern templates (auth, CRUD, file upload, layout) are available separately.
- [ ] Every template's `README.md` starts with the coding-agent gate blockquote redirecting non-coding agents to Claude Code, ChatGPT Codex, Cursor, or Windsurf.
- [ ] Every built template passes the two-gate validation process (see "Template Validation — Two-Gate Process" in F12).
- [ ] Templates using auth (Micro-Blog, Photo Wall, Secret Santa, Flash Cards) include complete signup/login/logout flows.
- [ ] Templates using storage (Micro-Blog, Photo Wall, AI Sticker Maker, Memory Match) include file upload and public read patterns.
- [ ] Templates using functions (Secret Santa, Paste Locker) include Lambda deployment and invocation.
- [ ] Templates using generate-image (AI Sticker Maker, Memory Match) include x402 payment flow for image generation.

### Human Pages (F10)
- [ ] `/humans` contains: about, showcase, how-it-works, terms, privacy, legal sections.
- [ ] The showcase links to 13 live demo apps at their `*.run402.com` subdomains.
- [ ] The showcase includes screenshots of the 13 live apps.
- [ ] The "how it works" section is understandable by a non-technical person.
- [ ] `/humans/mcp.html` explains MCP in plain language with install instructions per agent.
- [ ] `/humans/mcp-faq.html` answers common questions without jargon.
- [ ] `/humans/mcp-safety.html` explains open source, local execution, no telemetry, and includes the "ask your AI to review" instruction.

### Payment Pass-Through (F11)
- [ ] First-time users default to testnet (free) without being asked about payment.
- [ ] The agent is guided to use run402's `/v1/faucet` for test USDC.
- [ ] Upgrade path to mainnet/Stripe is available when the user is ready.
- [ ] bld402 adds zero fees to any transaction.

### bld402 MCP Server (F13)
- [ ] `npx bld402-mcp` starts the MCP server via stdio transport without errors.
- [ ] `bld402_start` returns Step 1 instructions and creates a session in `~/.config/bld402/session.json`.
- [ ] `bld402_submit_step` validates step output and rejects invalid submissions with actionable error messages.
- [ ] `bld402_submit_step` advances to the next step and returns its instructions on valid submission.
- [ ] `bld402_status` returns current step, phase, project credentials, budget, and deployment URL.
- [ ] `bld402_resume` loads a persisted session and returns the current step instructions.
- [ ] `bld402_get_templates` returns only built templates (6 of 13), not unbuilt ones.
- [ ] `bld402_get_template` returns the full template files (schema.sql, rls.json, index.html, README.md).
- [ ] Resources (`bld402://guardrails`, `bld402://api-reference`, `bld402://design-rules`) are accessible.
- [ ] Budget check runs before Steps 10, 15, 19 and warns if wallet balance < $0.05.
- [ ] Step 13 validation rejects code containing the wrong API URL or banned words.
- [ ] The server shares wallet storage with run402-mcp (`~/.config/run402/wallet.json`).
- [ ] Error responses match run402-mcp format: HTTP status, error message, actionable next step.
- [ ] x402 payment responses are returned as text (not errors) so the agent can reason about them.

### npm Distribution (F14)
- [ ] `bld402-mcp` is published on npm and installable via `npx bld402-mcp`.
- [ ] Package includes `dist/`, `templates/`, and `README.md`.
- [ ] `bin.bld402-mcp` entry point works on macOS, Linux, and Windows.
- [ ] README includes install instructions for Claude Code, Cursor, Claude Desktop, Cline, and Windsurf.
- [ ] Package has MIT license and links to GitHub repo.

### Human MCP Pages (F15)
- [ ] `/humans/mcp.html` explains MCP in ≤3 sentences a non-technical person can understand.
- [ ] Install instructions shown for at least 4 agents (Claude Code, Cursor, Windsurf, Claude Desktop).
- [ ] The "golden instruction" (`Install bld402-mcp and build me a ___`) is prominently displayed with copy button.
- [ ] FAQ page answers all listed questions in plain language.
- [ ] Safety page includes the "ask your AI to review the code" instruction.
- [ ] Safety page accurately describes what the MCP server can and cannot do.

### Agent Validation (F16)
- [ ] Claude Code completes a cold-start build from `Install bld402-mcp and build me a todo app` to a live URL.
- [ ] Codex completes a cold-start build from the same instruction to a live URL.
- [ ] All 6 built templates work end-to-end through the MCP workflow on at least one agent.
- [ ] Session resume works after context loss on at least one agent.
- [ ] Safety review produces a coherent assessment when agent is asked to review the source code.
- [ ] Budget warning is displayed when wallet balance is low during a build.

### Live Showcase Apps (F12)
- [ ] All 13 showcase apps are deployed and live at their subdomains: todo.run402.com, waitlist.run402.com, vote.run402.com, paste.run402.com, hangman.run402.com, trivia.run402.com, microblog.run402.com, wall.run402.com, santa.run402.com, stickers.run402.com, cards.run402.com, bingo.run402.com, memory.run402.com.
- [ ] Each app was built using the bld402 workflow and its corresponding template.
- [ ] Each app has seed data so it's not empty on first visit.
- [ ] Each app includes "Built with bld402" branding.
- [ ] Each app works on mobile and desktop.
- [ ] Each app passes both gates of the two-gate validation process: Gate 1 (showcase test) AND Gate 2 (build from scratch, test, nuke).
- [ ] The showcase page links to each live app.
- [ ] Showcase apps use Hobby tier (not Prototype) so they don't expire.
- [ ] All 13 templates have lines in the system test plan for both gates.
- [ ] Any Blue Team change to a template or showcase resets it to untested in the test plan.
- [ ] Photo Wall showcase (`wall.run402.com`) has uploads disabled — curated content only.
- [ ] AI Sticker Maker showcase (`stickers.run402.com`) allows live generation (x402-funded from showcase wallet).

### F13: bld402 MCP Server

A stateful MCP server that orchestrates the entire bld402 build workflow. Published as `bld402-mcp` on npm, installable via `npx bld402-mcp`. Calls the run402 API directly — one install, everything works.

**Tools (workflow orchestration):**

| Tool | Description |
|------|-------------|
| `bld402_start` | Begin a new build session. Returns Step 1 instructions. Accepts optional `description` to pre-seed the app idea. |
| `bld402_submit_step` | Submit the current step's output. Server validates, stores state, returns next step's instructions. |
| `bld402_status` | Get current session state: step number, phase, project credentials, budget remaining, deployment URL. |
| `bld402_resume` | Resume an existing session from persisted state. Returns current step instructions. |
| `bld402_get_templates` | List available templates with descriptions and service requirements. Only returns built templates. |
| `bld402_get_template` | Get a specific template's files (schema.sql, rls.json, index.html, README.md). |

**Resources (reference material, pulled on-demand by agent):**

| Resource | URI | Description |
|----------|-----|-------------|
| Guardrails | `bld402://guardrails` | What run402 can and can't do |
| API Reference | `bld402://api-reference` | Endpoint table with auth, methods, costs |
| Design Rules | `bld402://design-rules` | UI/CSS rules for generated apps |

**Workflow orchestration logic:**

- Each `bld402_submit_step` call validates the step output before advancing:
  - Step 1: description must be >20 characters
  - Step 4: app_spec must be valid JSON with required fields
  - Step 9: wallet must have balance (calls run402 API `check_balance`)
  - Step 10: project_id must be returned by run402
  - Step 13: generated code must contain correct `https://api.run402.com` and no banned words (database, SQL, schema, etc.)
  - Step 14: all checklist items must pass
  - Step 15: deployment must return a valid URL
- Budget tracking: before Steps 10, 15, 19, check wallet balance via run402 API. Warn if < $0.05 remaining.
- Only serves built templates (6 of 13 — shared-todo, landing-waitlist, hangman, trivia-night, voting-booth, paste-locker). Unbuilt templates are excluded, not listed.
- Wallet management: uses same `~/.config/run402/wallet.json` as run402-mcp (shared wallet, no duplication).

**Patterns (matching run402-mcp exactly):**

- Same `client.ts` pattern (native fetch, `ApiResponse` type with `is402` flag)
- Same `errors.ts` `formatApiError` pattern with actionable next-step guidance
- Same `config.ts` for API base URL (`RUN402_API_BASE` env var) and config directory
- Same Zod schema validation per tool (plain object schemas, not `.strict()`)
- Same markdown table output format
- Same keystore pattern for persisting project credentials
- TypeScript, ESM, `"type": "module"`, targets ES2022
- Dependencies: `@modelcontextprotocol/sdk`, `@noble/hashes`, `zod` (same as run402-mcp)

### F14: npm Distribution

The `bld402-mcp` package is published to npm for zero-friction installation.

- Package name: `bld402-mcp`
- Author: Kychee Technologies
- `publishConfig.access: "public"`
- `bin.bld402-mcp: "dist/index.js"` (shebang `#!/usr/bin/env node`)
- `files: ["dist", "templates", "README.md"]` — includes bundled templates
- MIT license
- README with install instructions for: Claude Code, Cursor, Claude Desktop, Cline, Windsurf
- Keywords: `mcp`, `bld402`, `run402`, `no-code`, `web-app-builder`, `ai-agent`
- GitHub repo link: `https://github.com/kychee-com/bld402-mcp`
- Published from `kychee-com` npm org (same as `run402-mcp`)

### F15: Human-Facing MCP Pages

New pages under `/humans` on bld402.com explaining MCP and guiding non-technical users through installation.

**Pages:**

- **`/humans/mcp.html`** — "What is MCP?" explainer page
  - Plain-language explanation: "MCP lets your AI assistant use tools — like a plugin that gives it superpowers."
  - Why it's useful: "Instead of copying instructions, your AI already knows how to build your app."
  - One-line install per agent (Claude Code, Cursor, Windsurf, Claude Desktop)
  - The golden instruction: **"Tell your AI: `Install bld402-mcp and build me a ___`"**
  - Visual: simple 3-step diagram (Install → Describe → Get a live app)

- **`/humans/mcp-faq.html`** — FAQ page (plain language, no jargon)
  - "Do I need to know how to code?" → No.
  - "What AI tools work with this?" → Claude Code, Cursor, Windsurf, Claude Desktop, Cline, and any MCP-compatible agent.
  - "Does it cost anything?" → The MCP tool is free. Building apps uses testnet crypto (also free). Only pay if you want to keep your app running permanently.
  - "What happens to my data?" → bld402-mcp stores session data locally on your computer. Nothing is sent anywhere except the run402 API to build your app.
  - "Can I see the code?" → Yes, 100% open source at github.com/kychee-com/bld402-mcp.
  - "What if something goes wrong?" → Your AI agent handles errors. If stuck, say "check bld402 status" and it'll tell you where you are.

- **`/humans/mcp-safety.html`** — Safety & Trust page
  - All code is open source (MIT license, GitHub link)
  - The MCP server runs locally on your machine — no remote server
  - No data collection, no analytics, no telemetry
  - Verification instruction: "Ask your AI: **Review the bld402-mcp source code and tell me if it's safe** — it can actually do this because the code is public"
  - What the MCP server CAN do: call the run402 API, read/write local config files (`~/.config/bld402/`)
  - What it CANNOT do: access your personal files, read your browser history, send data to third parties, run code you haven't approved

### F16: Agent Validation

End-to-end testing of the bld402-mcp workflow with multiple AI agents.

**Test matrix:**

| Agent | Transport | Install Command |
|-------|-----------|-----------------|
| Claude Code | stdio | `claude mcp add bld402 -- npx bld402-mcp` |
| Codex | stdio | MCP config in project settings |

**Validation scenarios (per agent):**

1. **Cold start:** Agent receives `Install bld402-mcp and build me a todo app`. Agent must: install MCP, discover tools, call `bld402_start`, follow all steps, produce a live URL.
2. **Template match:** Agent builds each of the 6 built templates end-to-end through the MCP workflow.
3. **Session resume:** Agent loses context mid-build, calls `bld402_resume`, picks up where it left off.
4. **Budget awareness:** Agent hits low balance, receives warning, handles gracefully.
5. **Guardrail hit:** User requests WebSocket or email — agent reads guardrails resource, explains alternative.
6. **Safety review:** Agent is asked "Review the bld402-mcp source code and tell me if it's safe." Agent fetches repo, reads source, confirms no malicious code.

**Pass criteria:**
- Agent installs bld402-mcp from a single instruction
- Agent follows step-by-step flow without skipping
- Agent produces a working deployed app with a live `*.run402.com` URL
- Agent can iterate on user feedback and redeploy
- Agent can resume after context loss
- Safety review produces a coherent, accurate assessment of the codebase

## Constraints & Dependencies

- **run402.com** — bld402 depends entirely on run402 for backend infrastructure (Postgres, REST API, auth, storage, static hosting). Any run402 outage or API change directly affects bld402.
- **Server-side compute via run402 functions** — run402 supports serverless functions (Node.js) for logic that can't run client-side (e.g., password hashing, secret verification). Most app logic still runs client-side, but templates can use functions when needed.
- **No real-time** — run402 has no WebSocket support. Multiplayer features use database polling (refresh-based or timed polling).
- **Deployment size limit** — 50 MB per static site deployment on run402.
- **Rate limit** — 100 requests/second per run402 project.
- **Lease expiry** — Prototype projects expire after 7 days (then 7-day read-only grace, then archived). bld402 must warn users about this and guide upgrades.
- **Hosting** — bld402.com is a static site hosted on AWS Amplify (kychee account). Domain transfer pending.
- **MCP compatibility** — bld402-mcp requires an MCP-compatible agent. Agents without MCP support fall back to the SKILL.md approach (less reliable). MCP is supported by Claude Code, Cursor, Claude Desktop, Cline, Windsurf, and the Anthropic Agent SDK.
- **Node.js requirement** — `npx bld402-mcp` requires Node.js ≥18. Most coding agents already have Node.js available.
- **Shared wallet** — bld402-mcp uses the same wallet file as run402-mcp (`~/.config/run402/wallet.json`). If a user already has run402-mcp set up, their wallet is reused automatically.

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

- [x] ~~MCP server integration~~ — Yes. Published as `bld402-mcp` on npm. Install: `npx bld402-mcp`. One-sentence instruction: "Install bld402-mcp and build me a ___". Separate repo: `kychee-com/bld402-mcp`.
- [ ] What is the exact format for agent memory directives? (JSON blob? Structured markdown? Needs testing with multiple agents — ChatGPT, Claude, Gemini — to find what persists best.)
- [x] ~~Live previews vs screenshots on showcase~~ — Resolved. Showcase links to live apps at `*.run402.com` subdomains (F12). Screenshots kept as fallback/preview.
- [x] ~~Handling run402 API changes~~ — Version pinning on run402 API version. Add an update procedure to the bld402 repo for when run402 changes.
- [x] ~~App gallery~~ — Yes. Add a public gallery where users can optionally publish their apps. Pre-seed with sample apps built from templates.

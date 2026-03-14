---
name: bld402
description: Build and deploy a web app on run402 using the bld402 guided workflow. Walk a non-technical user through spec, plan, build, deploy, and iterate — all from plain language.
---

# /bld402 — Build Web Apps Without Code on run402

Guide a non-technical user through building and deploying a complete web application on run402 infrastructure. The user describes what they want in plain language; you (the agent) do everything else.

**Agent-agnostic:** This skill works with Claude Code, ChatGPT Codex, Cursor, Windsurf, or any coding agent that can create files, run shell commands, and make HTTP requests.

---

## Prerequisites

Before starting, verify you have these capabilities. If ANY are missing, tell the user:

> "I need to be able to create files, run shell commands, and make HTTP requests to build your app. Please open this in a coding agent like Claude Code, ChatGPT Codex, Cursor, or Windsurf."

**Required capabilities:**
- Create and edit files on the local filesystem
- Run shell commands (Node.js must be available)
- Make HTTP requests (fetch/curl)
- Manage a crypto wallet private key (for payments — testnet, free)

**Required npm packages** (install if not present):
```
npm install viem @x402/fetch@^2 @x402/evm@^2
```

---

## Session Resume

If you have a `bld402_project` memory object from a previous session (containing `project_id`, `anon_key`, `deployment_url`, etc.), do NOT start from Step 1. Go directly to Step 17 (Gather Feedback) using the stored credentials.

---

## Capability Guardrails

Check the user's requests against these lists at EVERY step. If a feature is impossible, explain clearly in plain language and suggest the alternative. Never attempt to build something that will fail.

### What run402 CAN do

- Postgres database (tables, columns, constraints, indexes, SQL)
- REST API (full CRUD with filtering, pagination, ordering via PostgREST)
- Row-level security (user_owns_rows, public_read, public_read_write templates)
- User authentication (email/password signup, login, token refresh, logout)
- File storage (upload, download, signed URLs, S3-backed)
- Static site hosting (deploy HTML/CSS/JS, get a shareable URL, SPA support)
- Serverless functions (Node.js — for server-side logic like password hashing)
- AI image generation (via generate-image service, $0.03/image)
- Subdomains (myapp.run402.com — free)
- Bundle deploy (one API call deploys everything: DB + migrations + RLS + functions + site + subdomain)
- Multiple tiers: Prototype ($0.10, 7 days), Hobby ($5, 30 days), Team ($20, 30 days)
- Testnet (Base Sepolia) — completely free via faucet
- Publish & fork (make apps forkable by other agents)

### What run402 CANNOT do

| Not Possible | Tell the user | Alternative |
|---|---|---|
| Custom domain names (myapp.com) | "You can't use your own domain, but you can get a memorable URL like myapp.run402.com." | Claim a subdomain via `POST /subdomains/v1` |
| Server-side compute beyond run402 functions | "Most of your app runs in the browser. For things like password hashing, we use built-in serverless functions." | Use run402 functions (Node.js) |
| Real-time WebSocket connections | "Live instant updates aren't available, but the app can check for new stuff every few seconds." | Polling (fetch every 3-10 seconds) |
| Email / SMS / push notifications | "The app can't send emails, texts, or push notifications, but it can show alerts inside the app." | In-app notifications, badge counters |
| Payment processing (beyond x402) | "The app can't take credit card payments from your users." | Track balances in the database |
| OAuth / social login | "Sign-in is email and password only. No 'Sign in with Google'." | Email/password auth (built in) |
| Custom database extensions | "You can use standard database features but not special add-ons." | Standard PostgreSQL (JSON columns, etc.) |
| File sizes over 50 MB per deployment | "Your entire app needs to be under 50 MB." | Optimize images, use external hosting for large media |
| More than 100 requests/second | "The app can handle about 100 concurrent users." | Client-side caching strategies |

---

## Budget Awareness

**Pay-per-tier model:** Subscribe to a tier once, then create unlimited projects, deploy sites, and iterate — all free with wallet auth.

**Testnet (default):** Faucet gives $0.25 USDC per 24 hours.
- Tier subscription (Prototype): $0.10
- Projects, deploys, redeploys: **free** with active tier
- Only AI image generation costs per-call ($0.03/image)
- This means: **2 full tier subscriptions per faucet drip**, with unlimited deploys each

Budget is rarely a concern on testnet. The only time to warn the user is if the faucet rate-limits (1 drip per 24h per IP) or if they want AI image generation (which adds up at $0.03 each).

---

## Phase 1: Spec (Steps 1-4)

### Step 1: Describe the App

Ask the user to describe what they want to build. Use simple, friendly language. No technical terms.

**Good prompts:**
- "What kind of app do you want to make?"
- "Tell me about your idea — what should this app do?"
- "Describe what you're imagining. Who uses it and what do they do?"

Let them describe it in their own words. Check the description against the guardrails above. If something is impossible, address it now.

**Output:** `app_description` — Plain-language summary (2-4 sentences).

### Step 2: Match Templates

Compare the description against available templates:

**Utility Apps:**
| # | Template | Description |
|---|----------|-------------|
| 1 | Shared Todo List | Collaborative task list with checkboxes and assignments |
| 2 | Landing Page + Waitlist | Product launch page with email signup |
| 3 | Voting Booth | Create a poll, share link, see live results |
| 4 | Paste Locker | Secure pastebin with server-side password hashing |
| 5 | Micro-Blog | Short-form posts with image attachments — public feed, authenticated posting |
| 6 | Photo Wall | Event photo sharing with auth-gated uploads and gallery view |
| 7 | Secret Santa | Anonymous gift exchange with server-side matching |
| 8 | Flash Cards | Create and study decks with spaced repetition |

**Games:**
| # | Template | Description |
|---|----------|-------------|
| 9 | Hangman | Classic word guessing — solo play with random words |
| 10 | Trivia Night | Kahoot-style: host creates questions, players join via code, live scoring |
| 11 | AI Sticker Maker | Type a prompt, get an AI-generated sticker, save to public gallery |
| 12 | Bingo Card Generator | Host calls items, players mark unique cards, auto-detect bingo |
| 13 | Memory Match | Card flip matching game with AI-generated art and leaderboard |

If a template matches: "That sounds a lot like our [template] — it does most of what you described already. Want to start from that? We can customize it however you like."

If no match: "We'll build this from scratch — no problem!"

**Output:** `matched_template_or_null`

### Step 3: Clarify Features

Ask simple yes/no or multiple-choice questions. Rules:
- **One question at a time.** Wait for the answer.
- **Plain language only.** Never say: database, API, endpoint, schema, RLS, JWT, REST, backend, frontend, authentication, deployment, hosting, server.
- **3-6 questions max.** Focus on what matters.
- **Skip questions already answered** by the description or template.
- **After each answer,** check guardrails. Flag impossible features immediately.

**Question categories:**

Users & access:
- "Should people need to sign in, or is it open to anyone with the link?"
- "Should each person see only their own stuff, or can everyone see everything?"

Content & data:
- "What kind of things will people create or save?"
- "Do you want people to be able to search or filter?"

Interaction:
- "Should people be able to react, vote, or comment?"
- "Does anything need to update automatically, or is refreshing okay?"

Look & feel:
- "Do you have a color scheme in mind?"
- "Should it work on phones, computers, or both?"

Guardrail-targeted (ask if relevant):
- "Do you need instant live updates, or is checking every few seconds fine?" *(catches WebSocket)*
- "Should people sign in with Google/Facebook, or is email and password okay?" *(catches OAuth)*
- "Should the app send notifications, or just show updates inside the app?" *(catches notifications)*

**Output:** `feature_answers` — Structured key-value pairs.

### Step 4: Confirm Spec

Summarize what you'll build in plain, friendly language:

> "Here's what I'll build for you:
>
> **App Name** — A [brief description].
> - People [will/won't] need to sign in
> - It'll include [feature 1], [feature 2], [feature 3]
> - It'll work on [phones and computers / computers only]
>
> Sound good? Anything you want to add or change?"

**Mandatory guardrail scan:** Before confirming, verify EVERY feature is buildable on run402.

Once confirmed, build the internal `app_spec` (not shown to user):

```json
{
  "app_name": "User's app name",
  "description": "Plain-language summary",
  "template": "template_name or null",
  "features": {
    "auth": true,
    "auth_type": "email_password",
    "data_types": ["tasks", "notes"],
    "multiplayer": false,
    "polling_needed": true,
    "file_uploads": false,
    "search": true,
    "categories": false
  },
  "ui": {
    "mobile_friendly": true,
    "color_scheme": "blue and white"
  },
  "guardrail_notes": "Any limitations flagged and alternatives accepted"
}
```

**Output:** `app_spec` — The structured spec, confirmed by user.

---

## Phase 2: Plan (Steps 5-8)

### Step 5: Determine Services

Map the app_spec to run402 services. Every app uses at minimum: database + REST API + static hosting.

| Service | When needed |
|---------|-------------|
| Database | Always |
| REST API | Always (auto-generated from DB schema) |
| Authentication | When `app_spec.features.auth` is true |
| Row-Level Security | When data access varies by user |
| File Storage | When `app_spec.features.file_uploads` is true |
| Serverless Functions | When server-side logic is needed (password hashing, matching algorithms) |
| AI Image Generation | When the app generates images from prompts ($0.03/image) |
| Static Hosting | Always |

Plan database tables: what columns, foreign keys, RLS template per table, seed data needed.

**Output:** `required_services` — Services breakdown with table schemas.

### Step 6: Select Tier

**Default to Prototype on testnet (free).** Only suggest higher tiers if the user explicitly asks.

| Tier | Price | Duration | Storage | API Calls |
|------|-------|----------|---------|-----------|
| Prototype | $0.10 | 7 days | 250 MB | 500k |
| Hobby | $5.00 | 30 days | 1 GB | 5M |
| Team | $20.00 | 30 days | 10 GB | 50M |

Once subscribed, all projects and deploys are free. No per-deploy fees.

Tell the user: "I'll set this up as a free prototype first. It'll last 7 days — plenty of time to try it out. You can change and redeploy as many times as you want. If you love it, we can make it permanent later."

**Output:** `selected_tier` ("prototype"), `payment_network` ("base-sepolia").

### Step 7: Select Template

If a template was matched in Step 2, use it. Each template provides:
- `schema.sql` — Database table definitions
- `rls.json` — RLS configuration
- `index.html` — Complete frontend app
- `README.md` — Customization points

If no template matched, assemble from common patterns:
- `db-connection` — run402 API connection setup
- `auth-flow` — Signup, login, session management
- `crud` — Create, read, update, delete operations
- `file-upload` — Storage API integration
- `responsive-layout` — Mobile-first page structure
- `polling` — Timed data refresh

Templates are available at `https://bld402.com/templates/{category}/{template-name}/`.

**Output:** `selected_templates`, `selected_patterns`

### Step 8: Finalize Build Plan

Create an internal build plan and confirm with the user in plain language:

> "Here's my plan:
> 1. I'll set up a free project to power your app
> 2. I'll create the storage your app needs
> 3. I'll build the app [from our template / from scratch]
> 4. I'll put it online and give you a link you can share
>
> This should take just a few minutes. Ready to go?"

Wait for confirmation before proceeding.

**Output:** `build_plan`

---

## Phase 3: Implement (Steps 9-14)

### Step 9: Get Testnet Funds

**Skip if mainnet.** For testnet (default):

Tell the user: "I'm grabbing some free test funds to set up your project. This is completely free — just test money for trying things out."

**Step 1 — Check existing balance:**

```javascript
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

const balance = await publicClient.readContract({
  address: USDC_ADDRESS,
  abi: [{ name: 'balanceOf', type: 'function', stateMutability: 'view',
           inputs: [{ name: 'account', type: 'address' }],
           outputs: [{ name: '', type: 'uint256' }] }],
  functionName: 'balanceOf',
  args: [walletAddress],
});

const MIN_REQUIRED = 100000n; // 0.10 USDC (6 decimals) — covers tier subscription
if (balance >= MIN_REQUIRED) {
  // Skip faucet
} else {
  // Call faucet (Step 2)
}
```

**Step 2 — Call faucet (only if balance < $0.10):**

```
POST https://api.run402.com/faucet/v1
Content-Type: application/json

{ "address": "0x...wallet_address" }
```

Response: `{ "transaction_hash": "0x...", "amount_usd_micros": 250000, "token": "USDC", "network": "base-sepolia" }`

Rate limit: 1 drip per 24 hours per IP. If 429, tell user to wait.

**IMPORTANT:** Wait for the faucet transaction to confirm before proceeding (~5s on Base Sepolia):

```javascript
await publicClient.waitForTransactionReceipt({ hash: faucetTxHash });
```

Without this, the tier subscription may fail with `insufficient_funds`.

**Output:** `wallet_address`, `faucet_tx`

### Step 10: Subscribe & Create Project

This is a two-part step: subscribe to a tier (x402 payment), then create a project (wallet auth, free).

**Part 1 — Subscribe to tier (x402 payment, $0.10):**

```javascript
import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { x402Client, wrapFetchWithPayment } from '@x402/fetch';
import { ExactEvmScheme } from '@x402/evm/exact/client';
import { toClientEvmSigner } from '@x402/evm';

// 1. Set up wallet — pass account object directly (NOT walletClient)
const account = privateKeyToAccount(WALLET_PRIVATE_KEY);
const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });

// 2. Create signer — MUST use account (flat .address), not walletClient (nested .account.address)
const signer = toClientEvmSigner(account, publicClient);

// 3. Set up x402 client — both need `new`
const client = new x402Client();
client.register('eip155:84532', new ExactEvmScheme(signer));

// 4. Wrap fetch for automatic 402 handling
const fetchPaid = wrapFetchWithPayment(fetch, client);

// 5. Subscribe to prototype tier
const subRes = await fetchPaid('https://api.run402.com/tiers/v1/subscribe/prototype', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
});
const sub = await subRes.json();
// -> { wallet, tier: "prototype", lease_expires_at: "2026-03-21T..." }
```

**Common gotchas:**
- `toClientEvmSigner(account, publicClient)` — pass `account` directly, NOT `walletClient`
- `import { ExactEvmScheme } from '@x402/evm/exact/client'` — note the `/exact/client` subpath
- `new ExactEvmScheme(signer)` — MUST use `new`
- `new x402Client()` — MUST use `new`
- `client.register('eip155:84532', ...)` — use CAIP-2 Base Sepolia ID specifically, NOT `eip155:*`

**Part 2 — Create project (wallet auth, free):**

```javascript
// Sign wallet auth headers
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = await account.signMessage({ message: `run402:${timestamp}` });

const res = await fetch('https://api.run402.com/projects/v1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Run402-Wallet': account.address,
    'X-Run402-Signature': signature,
    'X-Run402-Timestamp': timestamp,
  },
  body: JSON.stringify({ name: 'app-name-slug' })
});
const project = await res.json();
```

**Response (201):**
```json
{
  "project_id": "prj_...",
  "anon_key": "eyJ...",
  "service_key": "eyJ...",
  "schema_slot": "p0042",
  "tier": "prototype",
  "lease_expires_at": "2026-03-21T..."
}
```

**CRITICAL:** Store `project_id`, `anon_key`, `service_key` in memory. `service_key` must NEVER appear in frontend code.

Tell the user: "Your project is set up! I've created a secure space for your app's data. Now I'll start building."

**Output:** `project_id`, `anon_key`, `service_key`, `api_url` (https://api.run402.com), `lease_expires_at`

### Step 11: Create Database Tables

Execute SQL via the admin endpoint:

```
POST https://api.run402.com/projects/v1/admin/{project_id}/sql
Content-Type: text/plain
Authorization: Bearer {service_key}

CREATE TABLE todos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task text NOT NULL,
  done boolean DEFAULT false,
  user_id uuid,
  created_at timestamptz DEFAULT now()
);
```

**SQL rules:**
- Allowed: CREATE TABLE, ALTER TABLE, CREATE INDEX, INSERT, UPDATE, DELETE, SELECT
- Blocked (403): CREATE EXTENSION, COPY PROGRAM, ALTER SYSTEM, SET search_path, GRANT/REVOKE
- Use `gen_random_uuid()` for UUID PKs, `timestamptz` for timestamps, `text` for strings, `jsonb` for flexible data
- Both `SERIAL` and `BIGINT GENERATED ALWAYS AS IDENTITY` work for auto-increment

**Schema reload delay:** After creating tables, wait 500ms before the next API call. The API needs time to recognize new schema.

Include seed data if needed:
```sql
INSERT INTO categories (name) VALUES ('General'), ('Urgent'), ('Personal');
```

Tell the user: "I've set up the storage for your app."

**Output:** `tables_created` — List of tables with column names.

### Step 12: Configure Row-Level Security

Apply RLS policies to control data access:

```
POST https://api.run402.com/projects/v1/admin/{project_id}/rls
Content-Type: application/json
Authorization: Bearer {service_key}

{
  "template": "public_read_write",
  "tables": [{"table": "todos"}]
}
```

**Available templates:**

| Template | Read | Write | Use when |
|----------|------|-------|----------|
| `public_read` | Everyone | Authenticated users only | Public content that signed-in users can create/edit (blogs, forums, leaderboards, shared reference data) |
| `public_read_write` | Everyone | Everyone | Open collaboration (voting, shared lists without auth) |
| `user_owns_rows` | Row owner only | Row owner only | Personal data. Requires `owner_column` parameter. |

**Decision guide:**
- App has auth + public content → `public_read` for shared posts/scores, `user_owns_rows` for private data
- App has auth + private data only → `user_owns_rows` for personal data, `public_read` for reference data
- App has no auth → `public_read_write` for everything
- Mixed → Different templates per table (separate API calls)

Tell the user: "I've set up the access rules for your app."

**Output:** `rls_configured` — Map of table to RLS template.

### Step 13: Generate Frontend Code

Generate a complete, working single-page application (HTML + CSS + JavaScript). Requirements:
- Works in any modern browser without build tools, compilation, or npm
- Uses the run402 REST API for all data operations
- Includes all necessary API configuration

**API configuration block (top of JavaScript):**

```javascript
const CONFIG = {
  API_URL: 'https://api.run402.com',
  ANON_KEY: '{anon_key}'
};

async function api(path, options = {}) {
  const res = await fetch(CONFIG.API_URL + path, {
    ...options,
    headers: {
      'apikey': CONFIG.ANON_KEY,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

**IMPORTANT:** The API URL is `https://api.run402.com` (with `api.` subdomain). `run402.com` is a static docs site — POSTing there returns 405.

**Read data:**
```javascript
const todos = await api('/rest/v1/todos?order=created_at.desc');
```

**Write data:**
```javascript
await api('/rest/v1/todos', {
  method: 'POST',
  headers: { 'Prefer': 'return=representation' },
  body: JSON.stringify({ task: 'Buy groceries' })
});
```

**Auth (if needed):**
```javascript
// Signup (creates user, does NOT return a token)
await api('/auth/v1/signup', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// Login (returns access_token + refresh_token)
const { access_token, user } = await api('/auth/v1/token', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});

// Authenticated requests — add access_token as Authorization header
headers: { 'Authorization': 'Bearer ' + access_token }

// Refresh token
const data = await api('/auth/v1/token?grant_type=refresh_token', {
  method: 'POST',
  body: JSON.stringify({ refresh_token })
});
```

**IMPORTANT:** Signup does NOT return an access token. Always call `/auth/v1/token` after signup to log the user in.

**IMPORTANT:** Always use `<script type="module">` — the code patterns above use `await` at the top level, which only works in module scripts. A plain `<script>` tag will cause a silent syntax error and a blank page.

**File structure:** Generate a single `index.html` with inline CSS and JS. If complex, split into `index.html`, `style.css`, `app.js`.

**Design rules:**
- Use `height: 100dvh` on body, flexbox layout
- Mobile breakpoint at 600px
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Primary color: #0066cc
- Include bld402 favicon as inline SVG data URI

Tell the user: "I've built your app! Let me deploy it so you can try it out."

**Output:** `app_files` — Array of `{file, data, encoding}` objects.

### Step 14: Verify Code

Review against this checklist. Fix issues before deploying.

**API configuration:**
- [ ] `API_URL` set to `https://api.run402.com`?
- [ ] `ANON_KEY` set to actual `anon_key`?
- [ ] `service_key` absent from frontend code?
- [ ] All API calls include `apikey` header?

**Data operations:**
- [ ] Table names match `tables_created`?
- [ ] Column names match actual schema?
- [ ] POST requests include `Prefer: return=representation` if needed?

**Auth (if applicable):**
- [ ] Signup calls `/auth/v1/signup`?
- [ ] Login calls `/auth/v1/token` (NOT `/auth/v1/token?grant_type=password`)?
- [ ] Login is called after signup (signup doesn't return a token)?
- [ ] `access_token` stored and used in `Authorization` header?
- [ ] Logout clears the token?

**RLS compatibility:**
- [ ] `user_owns_rows`: every INSERT includes the owner column?
- [ ] `public_read`: writes require authenticated user (access_token in header)?

**UI/UX:**
- [ ] Loading states while fetching?
- [ ] Friendly error messages (no technical jargon)?
- [ ] Mobile-friendly if requested?
- [ ] `<!DOCTYPE html>`, `charset="UTF-8"`, `viewport` meta?

**Copy & language — Banned words in user-facing text:**
- AI jargon: embedding, vector, tokenize, inference, LLM, GPT
- Dev jargon: API, endpoint, schema, payload, query, webhook, middleware
- Infra jargon: database, server, cluster, deployment, container

Rewrite any matches: "Querying the database..." becomes "Loading your data..."

Tell the user: "Everything looks good! Deploying your app now..."

---

## Phase 4: Deploy (Steps 15-16)

### Step 15: Deploy to run402

Deploy the static site (wallet auth, free with active tier):

```javascript
// Sign wallet auth headers
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = await account.signMessage({ message: `run402:${timestamp}` });

const res = await fetch('https://api.run402.com/deployments/v1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Run402-Wallet': account.address,
    'X-Run402-Signature': signature,
    'X-Run402-Timestamp': timestamp,
  },
  body: JSON.stringify({
    name: 'app-name',
    project: project_id,
    files: app_files  // [{file, data, encoding}, ...]
  })
});
const deployment = await res.json();
```

**Response:** `{ "id": "dpl_...", "url": "https://dpl-....sites.run402.com", "status": "READY" }`

**Claim a subdomain (default yes):**

Derive subdomain from app name: lowercase, replace spaces/underscores with hyphens, strip non-alphanumeric (except hyphens), truncate to 63 chars.

```
POST https://api.run402.com/subdomains/v1
Content-Type: application/json
Authorization: Bearer {service_key}

{ "name": "myapp", "deployment_id": "{deployment_id}" }
```

Subdomain rules: 3-63 chars, lowercase alphanumeric + hyphens, no leading/trailing hyphens, no consecutive hyphens, no reserved words (api, www, admin, sites, mail, ftp, cdn, static). Free, idempotent (upserts — safe to call on every deploy).

If claiming fails: fall back to the raw deployment URL. Don't retry in a loop.

**Smoke-test gate (mandatory):**
1. Fetch the live URL
2. Confirm HTTP 200 and HTML loads
3. If fail: wait 5s, retry up to 3 times total
4. Do NOT proceed until the smoke test passes

**Output:** `deployment_id`, `deployment_url`, `subdomain`, `subdomain_url`

### Step 16: Confirm Deployment

Share the good news. Be enthusiastic!

If subdomain claimed:
> "Your app is live! Here's your link:
>
> **{subdomain_url}**
>
> Share it with anyone — they can use it right away. Try it out and let me know what you think! I can make changes anytime — redeploying is free."

If no subdomain:
> "Your app is live! Here's your link:
>
> **{deployment_url}**
>
> Want a shorter URL like https://myapp.run402.com? I can set that up."

Briefly mention: 7-day prototype lease, works on phones and computers, unlimited redeploys.

---

## Phase 5: Iterate (Steps 17-21)

### Step 17: Gather Feedback

> "Try it out! What do you think? Anything you'd like to change?"

Accept feedback in any form: UI changes, new features, bug fixes, styling, "it's perfect!"

- If happy → Step 20
- If wants changes → Check guardrails first, then Step 18
- Collect ALL feedback before proceeding: "Anything else, or should I start making these changes?"

**Output:** `user_feedback`

### Step 18: Apply Changes

For each piece of feedback:

**UI/styling:** Modify CSS/HTML in app_files.

**Feature additions:** Add JS functionality. If new data storage needed:
```
POST https://api.run402.com/projects/v1/admin/{project_id}/sql
Authorization: Bearer {service_key}

ALTER TABLE todos ADD COLUMN priority text DEFAULT 'normal';
```
Update RLS if new tables added. Update frontend code.

**Bug fixes:** Debug API endpoints, auth headers, RLS access, JS errors.

**After changes:** Re-run the Step 14 verification checklist.

Tell the user: "I've made those changes! Let me put the updated version online."

**Output:** `updated_app_files`

### Step 19: Redeploy

Deploy updated app (same process as Step 15 — wallet auth, free with active tier).

If subdomain exists, reassign it to the new deployment:
```
POST https://api.run402.com/subdomains/v1
Content-Type: application/json
Authorization: Bearer {service_key}

{ "name": "{subdomain}", "deployment_id": "{new_deployment_id}" }
```

Tell the user the same link still works, then go back to Step 17 (iterate loop).

**Output:** `new_deployment_url`, `subdomain_url`

### Step 20: Done

Congratulate the user:
> "Awesome! Your app is ready.
>
> **Your app:** {subdomain_url or deployment_url}
>
> Share this link with anyone — it works on phones and computers."

**Lease reminder (prototype tier):**
> "Your app will stay live for 7 days (until {lease_expires_at}). After that, it goes into read-only mode for a week, then gets archived. If you want to keep it running longer, just let me know and I'll help you upgrade — starts at $5/month."

**Upgrade options:**

| Option | Price | How |
|--------|-------|-----|
| Renew Prototype | $0.10 | `POST /tiers/v1/renew/prototype` (x402) |
| Upgrade to Hobby | $5.00 | `POST /tiers/v1/upgrade/hobby` (x402) |
| Upgrade to Team | $20.00 | `POST /tiers/v1/upgrade/team` (x402) |
| Credit card (for humans) | Any amount | Send user to `https://run402.com/billing?wallet={wallet_address}` |

**Mandatory feedback ask:**
> "Would you like to share feedback with the bld402 team? It only takes a minute and helps improve the platform."

If yes → Step 21. If no → thank them and wrap up.

**Store final memory snapshot** for future sessions:
```json
{
  "bld402_project": {
    "app_name": "...",
    "project_id": "...",
    "anon_key": "...",
    "service_key": "...",
    "api_url": "https://api.run402.com",
    "wallet_address": "0x...",
    "deployment_url": "...",
    "subdomain_url": "...",
    "tables": ["..."],
    "rls": {"...": "..."},
    "lease_expires_at": "...",
    "tier": "prototype",
    "iteration_count": 0,
    "resume_step": 17
  }
}
```

### Step 21: Share Feedback with Devs (Optional)

If the user agrees to share feedback:

1. Write an agent summary: template used, issues hit, what went well, suggestions, iteration count
2. Ask the user for their input: "Anything you'd like to add?"
3. Combine into a message and send via the run402 message endpoint:

```javascript
// Sign wallet auth headers
const timestamp = Math.floor(Date.now() / 1000).toString();
const signature = await account.signMessage({ message: `run402:${timestamp}` });

await fetch('https://api.run402.com/message/v1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Run402-Wallet': account.address,
    'X-Run402-Signature': signature,
    'X-Run402-Timestamp': timestamp,
  },
  body: JSON.stringify({
    message: `bld402 feedback | App: ${app_name} | Template: ${template} | Iterations: ${iteration_count}\n\nAgent notes: ${agent_notes}\n\nUser notes: ${user_notes}`
  })
});
```

> "Feedback sent — thanks! The bld402 team will use it to make the platform better."

If the message endpoint is unavailable, skip gracefully — do not block the conversation.

---

## Wallet Auth Helper

Several endpoints use wallet auth (project creation, deploy, message). Reuse this pattern:

```javascript
async function walletAuthFetch(url, options = {}) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await account.signMessage({ message: `run402:${timestamp}` });

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Run402-Wallet': account.address,
      'X-Run402-Signature': signature,
      'X-Run402-Timestamp': timestamp,
      ...options.headers,
    }
  });
}
```

Timestamp must be within 30 seconds of server time (fresh signature per request).

---

## Memory Management

At each step, maintain these in your working memory:

**Always carry forward:** `project_id`, `anon_key`, `service_key`, `api_url`, `wallet_address`, `account`, `app_spec`

**Carry during build:** `tables_created`, `rls_configured`, `app_files`, `selected_templates`

**Carry during iterate:** `deployment_url`, `subdomain`, `subdomain_url`, `iteration_count`, `lease_expires_at`

If context is lost, the `bld402_project` snapshot from Step 20 contains everything needed to resume at Step 17.

---

## Quick Reference — API Endpoints

### Tier & Billing (x402 payment)

| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Subscribe to tier | POST | `/tiers/v1/subscribe/:tier` | x402 payment |
| Renew tier | POST | `/tiers/v1/renew/:tier` | x402 payment |
| Upgrade tier | POST | `/tiers/v1/upgrade/:tier` | x402 payment |
| Check tier status | GET | `/tiers/v1/status` | Wallet auth |
| Generate image | POST | `/generate-image/v1` | x402 ($0.03) |

### Project & Deploy (wallet auth — free with tier)

| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Get test funds | POST | `/faucet/v1` | None |
| Create project | POST | `/projects/v1` | Wallet auth |
| Deploy site | POST | `/deployments/v1` | Wallet auth |
| Bundle deploy | POST | `/deploy/v1` | Wallet auth |
| Check deploy | GET | `/deployments/v1/:id` | None |
| Send message | POST | `/message/v1` | Wallet auth |

### Admin (service_key)

| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| Run SQL | POST | `/projects/v1/admin/:id/sql` | service_key |
| Check schema | GET | `/projects/v1/admin/:id/schema` | service_key |
| Apply RLS | POST | `/projects/v1/admin/:id/rls` | service_key |
| Check usage | GET | `/projects/v1/admin/:id/usage` | service_key |
| Deploy function | POST | `/projects/v1/admin/:id/functions` | service_key |
| Set secret | POST | `/projects/v1/admin/:id/secrets` | service_key |
| Claim subdomain | POST | `/subdomains/v1` | service_key |

### Client API (anon_key / access_token)

| Action | Method | Endpoint | Auth |
|--------|--------|----------|------|
| CRUD data | GET/POST/PATCH/DELETE | `/rest/v1/:table` | apikey |
| Signup | POST | `/auth/v1/signup` | apikey |
| Login | POST | `/auth/v1/token` | apikey |
| Refresh token | POST | `/auth/v1/token?grant_type=refresh_token` | apikey |
| Get current user | GET | `/auth/v1/user` | Bearer token |
| Logout | POST | `/auth/v1/logout` | Bearer token |
| Upload file | POST | `/storage/v1/object/:bucket/*` | apikey |
| Download file | GET | `/storage/v1/object/:bucket/*` | apikey |
| Invoke function | POST | `/functions/v1/:name` | apikey |

### Auth Model

| Auth Method | Headers | Used for |
|-------------|---------|----------|
| **x402 payment** | `x-402-payment: <signed-payment>` | Tier subscribe/renew/upgrade, image generation |
| **Wallet auth** | `X-Run402-Wallet`, `X-Run402-Signature`, `X-Run402-Timestamp` | Project creation, deploy, bundle deploy, message, ping |
| **service_key** | `Authorization: Bearer {service_key}` | Admin SQL, RLS, schema, usage, functions, secrets, subdomains |
| **apikey** | `apikey: {anon_key}` | REST data, auth, storage, function invocation |
| **Bearer token** | `Authorization: Bearer {access_token}` | User-scoped operations (from login) |

**Base URL for all endpoints:** `https://api.run402.com`

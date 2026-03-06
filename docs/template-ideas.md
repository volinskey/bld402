# Template Ideas (2026-03-06)

> Gap analysis of run402 services vs bld402 template/pattern coverage, with concrete proposals.

## Coverage Map

| Service | Coverage | Details |
|---------|----------|---------|
| database | Strong (6 templates + 1 pattern) | shared-todo, landing-waitlist, voting-booth, hangman, trivia-night, paste-locker, db-connection.js |
| rest-api | Strong (5 templates + 1 pattern) | shared-todo, landing-waitlist, voting-booth, hangman, trivia-night, crud.js |
| deployments | Strong (6 templates) | All templates (infrastructure — excluded from gap analysis) |
| functions | **Weak** (1 template, 0 patterns) | paste-locker uses functions but no reusable pattern snippet |
| auth | **Weak** (0 templates, 1 pattern) | auth-flow.js pattern exists but no template actually demos it |
| storage | **Weak** (0 templates, 1 pattern) | file-upload.js pattern exists but no template actually demos it |
| generate-image | **GAP** | No coverage |
| message | **GAP** | No coverage |
| subdomains | **GAP** | No coverage |

### Intentionally excluded (infrastructure)

| Service | Reason |
|---------|--------|
| projects | Provisioning infrastructure |
| stripe | Billing infrastructure |
| x402 | Payment infrastructure |
| faucet | Dev tool (testnet tokens) |
| hosting | Internal marketing site |

## Proposals

### 1. AI Sticker Maker (NEW — games/)

| Field | Value |
|-------|-------|
| **Services** | generate-image, storage, database, rest-api, deployments |
| **Type** | new-template |
| **Category** | games |
| **Complexity** | simple |
| **Why** | Type a prompt, get an AI-generated sticker image. Save it to a gallery, share the link. Covers the two biggest gaps (generate-image + storage) in one fun, visual template. |

### 2. Team Bulletin Board (NEW — utility/)

| Field | Value |
|-------|-------|
| **Services** | auth, database, rest-api, storage, message, deployments |
| **Type** | new-template |
| **Category** | utility |
| **Complexity** | medium |
| **Why** | Authenticated users post announcements with optional file attachments. New posts trigger a Telegram notification to the team. Demos auth (full login/signup/logout flow), storage (file uploads), and message in one template. |

### 3. Extend: landing-waitlist + message

| Field | Value |
|-------|-------|
| **Services** | message (adds to existing database + rest-api) |
| **Type** | extend-existing |
| **Extending** | landing-waitlist |
| **Complexity** | simple (~10 lines) |
| **Why** | After a successful signup, fire a Telegram notification to the developer. Lowest-effort way to demo the message service. |

### 4. Extend: hangman + functions

| Field | Value |
|-------|-------|
| **Services** | functions (adds to existing database + rest-api) |
| **Type** | extend-existing |
| **Extending** | hangman |
| **Complexity** | medium |
| **Why** | Move word selection server-side via a `pick-word` function. Fixes the cheating vulnerability (client currently sees all words) AND demos functions. Client calls `/functions/v1/pick-word` instead of fetching the word list. |

### 5. Link Shortener (NEW — utility/)

| Field | Value |
|-------|-------|
| **Services** | subdomains, database, rest-api, functions, deployments |
| **Type** | new-template |
| **Category** | utility |
| **Complexity** | medium |
| **Why** | Create short links that redirect via a custom subdomain. A server-side function handles the redirect lookup. The most natural use case for the subdomains service. |

### 6–9. Missing Pattern Snippets

| Pattern | Service | Description |
|---------|---------|-------------|
| **functions.js** | functions | Invoke a deployed Lambda function from the client — `callFunction(name, body)` helper + error handling |
| **generate-image.js** | generate-image | Generate an image from a text prompt via `/v1/generate-image` and display it |
| **message.js** | message | Send a Telegram notification via `/v1/message` — fire-and-forget helper |
| **subdomains.js** | subdomains | Claim, list, and release custom subdomains via `/v1/subdomains` |

## Summary

| Metric | Count |
|--------|-------|
| Services covered (of 9 non-infra) | 6 |
| Full gaps | 3 (generate-image, message, subdomains) |
| Weak coverage | 3 (auth, storage, functions) |
| New template proposals | 3 |
| Extension proposals | 2 |
| New pattern proposals | 4 |

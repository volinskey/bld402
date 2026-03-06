# Template Review (2026-03-06)

> Cross-reference of all bld402 templates against the run402 service catalog.

## Full App Templates

### shared-todo
- **Uses:** database, rest-api, deployments
- **Missing opportunities:**
  - **auth** — README mentions this as optional upgrade, but no code shows how; adding a working auth variant would demo `user_owns_rows` RLS
  - **subdomains** — could claim a custom subdomain for the deployed todo app

### landing-waitlist
- **Uses:** database, rest-api, deployments
- **Missing opportunities:**
  - **message** — send a Telegram notification to the developer when a new email signs up (great demo of the message service)
  - **functions** — server-side signup validation or rate limiting, or trigger a welcome email webhook
  - **subdomains** — custom subdomain for the landing page

### voting-booth
- **Uses:** database, rest-api, deployments (+ client-side polling)
- **Missing opportunities:**
  - **auth** — replace localStorage voter_id with real auth for more reliable one-vote-per-user enforcement
  - **message** — notify poll creator via Telegram when results come in
  - **subdomains** — custom subdomain for shareable poll links

### hangman
- **Uses:** database, rest-api, deployments
- **Missing opportunities:**
  - **functions** — word selection should be server-side; currently the client fetches 50 words and picks one locally, making it trivial to cheat by inspecting the response
  - **auth** — per-user win/loss tracking and a persistent leaderboard

### trivia-night
- **Uses:** database, rest-api, deployments (+ client-side polling)
- **Missing opportunities:**
  - **functions** — `correct_index` is visible in the client-side questions payload; a server-side answer-checking function would prevent cheating
  - **auth** — player accounts with persistent scores across game sessions
  - **subdomains** — custom subdomain for game room links

### paste-locker
- **Uses:** database, functions, deployments
- **Missing opportunities:**
  - **storage** — support binary file attachments or large pastes via S3 instead of DB text columns
  - **message** — notify note creator via Telegram when their note is read
  - **auth** — user accounts to list and manage their own notes
- Existing function integration: no issues found

## Pattern Snippets

| Pattern | Status |
|---------|--------|
| db-connection.js | Up to date |
| auth-flow.js | Up to date |
| crud.js | Up to date |
| file-upload.js | Up to date |
| responsive-layout.html | Up to date |
| polling.js | Up to date |

### Missing Pattern Snippets

- **functions.js** — no pattern for calling Lambda functions (invoke, deploy); paste-locker uses functions but there's no reusable snippet
- **generate-image.js** — no pattern for the AI image generation service
- **message.js** — no pattern for sending Telegram notifications
- **subdomains.js** — no pattern for claiming/managing custom subdomains

## Summary

| Metric | Count |
|--------|-------|
| Templates reviewed | 6 |
| Patterns reviewed | 6 |
| Template improvement suggestions | 13 |
| Missing pattern snippets | 4 |
| **Total suggestions** | **17** |

# AGENTS.md — bld402

## What is bld402?

A free accessibility layer for [run402.com](https://run402.com) that lets anyone build and deploy web apps by describing what they want to an AI agent. Static site on AWS Amplify — no build tools, pure HTML/CSS/JS.

## Project Structure

| Path | Purpose |
|------|---------|
| `public/` | Static site root (deployed to Amplify) |
| `public/index.html` | Agent landing page (root URL) |
| `public/agent.json` | Machine-readable workflow catalog for agents |
| `public/build/step/` | 20 step pages guiding agents through the build workflow |
| `public/humans/` | Human-facing pages (about, how it works, showcase) |
| `public/templates/` | Template gallery (browsable by humans and agents) |
| `templates/` | Template source: utility/, games/, patterns/ |
| `docs/` | Specs, plans, and reference docs |
| `docs/products/bld402/` | Product spec |
| `docs/products/showcase/` | Showcase app specs |
| `docs/run402-services.md` | run402 backend service catalog (updated via `/update-services`) |

## Skills

### Global Skills (from kychee)

| Skill | Description |
|-------|-------------|
| `/spec` | Create or update a product specification |
| `/plan` | Create or continue an implementation plan |
| `/implement` | Execute a plan step by step |
| `/systemtest` | Run Red Team system test against a product |
| `/validate` | Orchestrate Red/Blue ping-pong validation cycle |
| `/testai` | Verify skills system is working |
| `/newskill` | Create a new AI skill |

### Project Skills

| Skill | Description |
|-------|-------------|
| `/update-services` | Sync run402 repo and update the service catalog at `docs/run402-services.md` |

## run402 Backend Services

Full catalog: [`docs/run402-services.md`](docs/run402-services.md)

| Service | Display Name | Metered |
|---------|-------------|---------|
| projects | Project Lifecycle (x402-gated) | Yes |
| database | Postgres Database (Aurora Serverless v2) | Yes |
| rest-api | Auto-generated REST API (PostgREST) | Yes |
| auth | Email/Password Auth + JWT | No |
| storage | S3 Object Storage | Yes |
| functions | Serverless Functions (Lambda) | Yes |
| deployments | Static Site Hosting (S3 + CloudFront) | Yes |
| subdomains | Custom Subdomain Mapping | No |
| generate-image | AI Image Generation (OpenRouter) | Yes |
| message | Message Notification (Telegram) | Yes |
| faucet | USDC Test Token Faucet | No |
| stripe | Subscription Billing (Stripe) | No |
| hosting | Marketing Site (S3 + CloudFront) | No |
| x402 | x402 Payment Gateway | N/A |

## Testing Cleanup — MANDATORY

**Every test that provisions a run402 project MUST clean it up before the session ends.** No orphaned projects.

### Rules

1. **Track what you create.** When you provision a project during testing, save the `project_id` and `service_key`. You will need them to clean up.
2. **Nuke when done.** Run `scripts/nuke-test.sh <project_id> <service_key>` to fully clean up: storage, subdomains, DB schema, users, tokens.
3. **NEVER delete showcase projects.** The following projects are live on the site and must never be touched:
   - `prj_1772702667600_0011` — shared-todo
   - `prj_1772707206984_0012` — landing-waitlist
   - `prj_1772707239699_0013` — hangman
   - `prj_1772707271798_0014` — trivia-night
   - `prj_1772707305070_0015` — voting-booth
   - `prj_1772728652516_0019` — paste-locker
   The nuke script has a hard blocklist and will refuse to delete these, but **do not attempt it**.
4. **Red Team (`/systemtest`, `/validate`):** Cleanup is part of the test. If you provision a project to test bld402's workflow, nuke it in your final cleanup step. Report cleanup status in the system test results.
5. **If cleanup fails:** Report the orphaned project_id so it can be manually cleaned up. Do not silently leave garbage.

### Quick reference

```bash
# Nuke a test project
./scripts/nuke-test.sh <project_id> <service_key>

# What it does:
#   1. Blocks if project is on the showcase blocklist
#   2. Deletes all storage objects
#   3. Releases claimed subdomains
#   4. Archives project (drops DB schema, users, tokens)
```

## Templates

| Category | Templates |
|----------|-----------|
| Utility | shared-todo, landing-waitlist |
| Games | hangman, trivia-night, voting-booth |
| Patterns | db-connection, auth-flow, crud, file-upload, responsive-layout, polling |

## Key References

- **bld402 spec:** `docs/products/bld402/bld402-spec.md`
- **run402 repo:** `C:/Workspace - Eleanor/run402`
- **run402 API:** `https://api.run402.com`
- **run402 spec:** `C:/Workspace - Eleanor/run402/docs/supa_spec.md`

# AGENTS.md — bld402

## What is bld402?

A free accessibility layer for [run402.com](https://run402.com) that lets anyone build and deploy web apps by describing what they want to an AI agent. Static site on AWS Amplify — no build tools, pure HTML/CSS/JS.

**MCP consolidation (2026-03-16):** bld402-mcp has been consolidated into [run402-mcp](https://github.com/kychee-com/run402-mcp). bld402.com now routes users to install run402-mcp for MCP tooling. The bld402-mcp NPM package is unpublished.

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
| `/update-services` | Sync run402 repo, update service catalog, review API for drift, and fix bld402.com |
| `/review-templates` | Review all templates against run402 services and suggest per-template improvements |
| `/idea-templates` | Find undemo'd run402 services and propose new template ideas |

## run402 Backend Services

Full catalog: [`docs/run402-services.md`](docs/run402-services.md)

| Service | Display Name | Metered |
|---------|-------------|---------|
| projects | Project Lifecycle (x402-gated) | Provision only — Prototype FREE on testnet, Hobby $5/30d, Team $20/30d |
| database | Postgres (Aurora Serverless v2) — SQL via migrations, expose manifest (dark-by-default) | Yes (storage + api_calls) |
| rest-api | Auto-generated REST API (PostgREST) | Yes (api_calls) |
| auth | Email/Password + Google OAuth + JWT + passkeys | No |
| blobs | Content-addressed CDN (S3 + CloudFront) — paste-and-go URLs with SRI | Yes (storage) |
| functions | Node 22 Fetch handlers (Lambda) — `export default async (req) => Response` | Yes |
| deploy | Unified Apply v1 — `(await r.project(id)).apply(ReleaseSpec)` (SDK 2.0+) site + DB + functions + secrets + subdomain atomically | No (free with active tier) |
| sites | Static Hosting (`*.run402.com`) — clean URLs via `site.public_paths` | No (free with tier) |
| subdomains | Custom Subdomain Mapping — claimed inline in deploy spec | No |
| routes | Same-origin Web Routes — `/admin`, `/api/*` to functions on the static-site domain | No (free with tier) |
| secrets | KMS-encrypted project secrets — values set out-of-band, asserted in deploy spec | No |
| ai | Image generation ($0.03/img), text translate, content moderation | Per-call / quota |
| email | SES transactional send, inbound parsing, custom sender domains | $5 / 10K email pack |
| contracts | KMS Contract Wallets (Ethereum signing, keys in AWS KMS) | $0.04/day rental + sign fee |
| apps | Publishable Apps / Fork | No |
| billing | Wallet allowances, Stripe credits, tier subscriptions | N/A |
| ci | GitHub Actions OIDC keyless deploy | No |
| jobs | Fixed Platform-Managed Jobs — submit known `job_type` jobs with hard cost cap (2.2+) | Per-job (`max_cost_usd_micros`) |
| faucet | Base Sepolia USDC drip (testnet) | No |
| message | Talk-to-devs — `r.message.send(...)` | No (free with tier) |
| x402 | x402 Payment Gateway (USDC on Base) | N/A |
| mpp | MPP (Tempo) Payment Gateway (pathUSD) | N/A |

## Gate 2 Testing — Build From Scratch

Red Team agents performing Gate 2 template validation (build-from-scratch tests) need to provision run402 projects. This requires x402 payment, which requires a wallet.

### Wallet for Testing

A shared test wallet exists at `showcase/.wallet` (gitignored). It contains a private key for a Base Sepolia testnet wallet with "endless" USDC from the admin faucet. **Red Team agents MAY use this wallet** — this is the only exception to the Red Team's "no source code" rule. The wallet is equivalent to a user bringing their own wallet.

**How to use it:**
```bash
# The wallet credentials are at:
showcase/.allowance.json   # SDK shape (auto-migrated from legacy showcase/.wallet)

# Use it with the existing provisioning scripts (all on @run402/sdk):
node showcase/provision.mjs <app-name>           # Provision a project (x402 — FREE on testnet)
node showcase/run-sql.mjs <app-name> <sql-file>  # Apply a SQL migration via unified deploy
node showcase/apply-rls.mjs <app-name>           # Apply the expose manifest via unified deploy
node showcase/deploy.mjs <app-name> <subdomain>  # Deploy site + claim subdomain (atomic)
```

Or use the key directly with x402 fetch for manual API calls.

### Sequential Testing — Stop on First Failure

Gate 2 tests MUST run **one template at a time, sequentially**. If a template fails Gate 2, STOP. Do not proceed to the next template. Fix the failing template first, then continue. This prevents wasting time building 5 more apps when the first one is broken.

**Order:** shared-todo → landing-waitlist → hangman → trivia-night → voting-booth → paste-locker

## Testing Cleanup

**By default, test projects are cleaned up after each run.** Use `--keep` flag to preserve projects (and their wallet funds) between test cycles. Use `--pin` with `ADMIN_KEY` to pin test projects so leases never expire.

```bash
node showcase/gate2-test/run.mjs shared-todo --keep     # Test one template, keep project
node showcase/gate2-test/run.mjs --keep --pin            # Test all, keep and pin
node scripts/fund-wallet.mjs 1.00                        # Top up test wallet via admin faucet
```

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
- **run402 repo:** `C:/Workspace-Kychee/run402`
- **run402 API:** `https://api.run402.com`
- **run402 spec:** `C:/Workspace-Kychee/run402/docs/supa_spec.md`

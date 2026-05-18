# run402 Services

> Last synced: 2026-05-18 against @run402/sdk **2.0.0**
> Canonical source: <https://run402.com/llms.txt> (wayfinder) and `llms-sdk.txt` / `llms-cli.txt` / `llms-mcp.txt` / `llms-full.txt`. This file is the in-repo cache; the run402 docs are authoritative. If they diverge, the run402 docs win.

> **SDK 2.0 breaking changes (v1.48 → 2.0):**
> - `r.deploy.apply(...)` is **removed** as a public surface. The sole hero is `(await r.project(id)).apply(spec)`. The `Deploy` class is now `@internal`.
> - `r.project(id)` is **async** — `await r.project(id)`.
> - `r.blobs.*` namespace is renamed to `r.assets.*`.
> - HTTP deploy wire renamed: `/deploy/v2/plans` → `/apply/v1/plans` (and `/commit` subpath).
> - Release observability methods live on `p.deploy.{getRelease, getActiveRelease, diff, resolve, list, events, status, upload, commit}` — the root `r.deploy.*` getters were removed.
> - New shorthand `r.useProject(id)` persists active project AND scopes in one call.

## Services

| Service | Display Name | Description |
|---------|-------------|-------------|
| projects | Project Lifecycle (x402-gated) | Provision, list, info, archive, and pin Postgres-backed projects. Tier-based pricing. |
| database | Postgres Database (Aurora Serverless v2) | SQL migrations (via deploy), schema introspection, and the expose manifest (dark-by-default RLS) |
| rest-api | Auto-generated REST API (PostgREST) | CRUD + filters + joins via PostgREST proxy with per-project schema routing |
| auth | Email/Password + Google OAuth + JWT | User signup, login, token refresh, passkeys; RLS-integrated JWT sessions |
| blobs / storage | Content-addressed CDN (S3 + CloudFront) | Upload via presigned PUT, paste-and-go URLs with SRI integrity, immutable by default |
| functions | Serverless Functions (Lambda, Node 22) | Deploy via unified deploy spec; in-handler `@run402/functions` helper; cron scheduling |
| deploy | Unified Deploy (v2) | One declarative `ReleaseSpec` → site + DB + migrations + expose + functions + secrets + subdomains + routes, atomic activation |
| sites | Static Site Hosting | Delivered via CloudFront under `<name>.run402.com`; clean URLs via `site.public_paths` |
| subdomains | Custom Subdomain Mapping | Claim / list / lookup / release. Claim happens inline in deploy specs. |
| routes | Same-origin Web Routes | Map `/admin` and `/admin/*` etc. on the static-site domain to Node 22 Fetch functions |
| secrets | Project Secrets | KMS-encrypted at rest. Set values out-of-band; declare keys in deploy spec via `secrets.require[]` |
| ai | AI Helpers | Image generation, text translation, content moderation |
| email | Email | Transactional sending, inbound parsing, custom sender domains, raw RFC-822 access |
| contracts | KMS Contract Wallets | Provision Ethereum signing wallets where private keys never leave AWS KMS |
| apps | Publishable Apps / Fork | Publish a project as a template; fork by other agents |
| billing | Billing & Allowances | Wallet allowances, Stripe credits, tier subscriptions, email packs |
| ci | GitHub Actions OIDC | Link a GitHub repo/branch to a project for keyless push-to-deploy |
| faucet | USDC Test Token Faucet | Base Sepolia drips for prototype-tier testing |
| generate-image | AI Image Generation | $0.03 / image via x402 |
| message | Talk-to-devs | `r.message.send(...)` — free with active tier |
| x402 | x402 Payment Gateway | Cryptocurrency payment middleware (Base USDC) |
| mpp | MPP (Tempo) Payment Gateway | Stripe's Machine Payments Protocol; pathUSD on Tempo |

## Service Details

### projects

- **Display:** Project Lifecycle (x402-gated)
- **Description:** Provision, list, info, archive, and pin Postgres-backed projects.
- **Endpoints:** `GET /projects/v1` · `POST /projects/v1` (provision) · `GET /projects/v1/:id` · `DELETE /projects/v1/:id` · `POST /projects/v1/admin/:id/pin` · `POST /projects/v1/admin/:id/unpin` · `GET /projects/v1/:id/usage` · `GET /projects/v1/:id/schema`
- **SDK:** `r.projects.{provision, list, info, delete, pin, getUsage, getSchema, keys, use, active, sql, rest, applyExpose, getExpose, validateExpose, promoteUser, demoteUser, quote}`
- **MCP Tools:** `provision_postgres_project`, `archive_project`, `pin_project`, `get_usage`, `get_schema`, `project_info`, `project_keys`, `list_projects`
- **Metered:** Provisioning is x402-gated. Prototype FREE on testnet; Hobby $5/30d; Team $20/30d.

### database

- **Display:** Postgres Database (Aurora Serverless v2)
- **Description:** SQL migrations (via deploy), schema introspection, expose manifest (dark-by-default).
- **Endpoints:** `POST /projects/v1/admin/:id/sql` (imperative, lifecycle-gated) · `GET /projects/v1/admin/:id/schema` · `POST /projects/v1/admin/:id/expose` (apply manifest) · `GET /projects/v1/admin/:id/expose` (read manifest)
- **SDK:** `r.projects.sql(id, sql, params?)` · `r.projects.applyExpose(id, manifest)` · `r.projects.getExpose(id)` · `r.projects.validateExpose(manifest, opts?)`
- **MCP Tools:** `run_sql`, `apply_expose` / `setup_rls` (older name), `validate_manifest`, `get_expose`
- **Metered:** Yes (DB size + api_calls via the periodic `pg_total_relation_size()`).
- **Notes:** The preferred path is to declare `database.migrations[]` and `database.expose` inside `(await r.project(id)).apply()` (SDK 2.0+) — schema, policies, and PostgREST reload land atomically with the rest of the release. The imperative SQL endpoint exists for ad-hoc one-shot DDL.

### rest-api

- **Display:** Auto-generated REST API (PostgREST)
- **Description:** Proxy all HTTP methods to PostgREST with automatic schema routing via `Accept-Profile` / `Content-Profile` headers.
- **Endpoints:** `ALL /rest/v1/*`
- **Auth:** `apikey` header — `anon_key` (RLS applies) or `service_key` (bypass).
- **SDK:** `r.projects.rest(id, table, queryOrOptions?)` · `r.projects.restResponse(...)`
- **MCP Tools:** `rest_query`
- **Metered:** Yes (counts toward per-tier api_calls).

### auth

- **Display:** Email/Password + Google OAuth + JWT
- **Description:** User signup, password login with JWT + refresh tokens, magic-link login, passkeys (WebAuthn), and Google OAuth. RLS integration via `auth.uid()` / `auth.role()`.
- **Endpoints:** `POST /auth/v1/signup` · `POST /auth/v1/token?grant_type=password` · `POST /auth/v1/token?grant_type=refresh_token` · `GET /auth/v1/user` · `POST /auth/v1/logout` · OAuth start/callback, magic-link request/exchange, passkey register/login.
- **AWS Backing:** Aurora (internal user tables) + JWT signing.
- **MCP Tools:** None directly (auth flows happen inside the deployed app).
- **Metered:** No (free with project).

### assets / storage

- **Display:** Content-addressed CDN (S3 + CloudFront)
- **Description:** Direct-to-S3 uploads with presigned PUT URLs; content-addressed `cdnUrl` with SRI integrity hash baked in. Old `POST /storage/v1/object/:bucket/*` is **gone**.
- **Endpoints:** `POST /storage/v1/uploads` (returns presigned PUT URL[s]) → client PUTs bytes → `POST /storage/v1/uploads/:id/complete` (finalize) · `GET /storage/v1/blob/:key` (reads; public blobs need no auth) · project CDN: `https://pr-<public_id>.run402.com/_blob/<key>`
- **Auth:** Project `service_key` or `project_admin` JWT in `apikey` header for write/list/admin. Anon for public reads.
- **SDK (2.0+):** `r.assets.{put, get, ls, rm, sign, diagnoseUrl, waitFresh}` (renamed from `r.blobs` in 2.0). Scoped form: `(await r.project(id)).assets.{put, get, ls, rm, sign, diagnoseUrl, waitFresh}` — drops the projectId argument.
- **MCP Tools:** `upload_file`, `download_file`, `list_files`, `delete_file`
- **Metered:** Yes (per-tier storage byte limit).

### functions

- **Display:** Serverless Functions (Lambda, Node 22)
- **Description:** Node 22 Fetch handlers (`export default async (req: Request) => Response`). Cron scheduling supported. In-handler helper library `@run402/functions` for `db(req)` / `adminDb()` / `getUser(req)` / `email` / `ai`.
- **Endpoints (admin):** `POST /projects/v1/admin/:id/functions` (deploy) · `GET /projects/v1/admin/:id/functions` (list) · `PATCH /projects/v1/admin/:id/functions/:name` (metadata) · `DELETE /projects/v1/admin/:id/functions/:name` · `GET /projects/v1/admin/:id/functions/:name/logs` (CloudWatch tail) · `POST /projects/v1/admin/:id/functions/:name/invoke` (manual trigger)
- **Endpoints (public invoke):** `ALL /functions/v1/:name[/*]` (API-key protected by `apikey` header). Same-origin web routes are the alternative entry path — see `routes`.
- **Tier caps (verified via plan-time validation):** Prototype 10s / 128 MB / 1 scheduled fn / 15 min cron. Hobby 30s / 256 MB / 3 sched / 5 min. Team 60s / 512 MB / 10 sched / 1 min.
- **SDK:** `r.functions.{deploy, list, delete, update, invoke, logs}(projectId, ...)` (root) or scoped `(await r.project(id)).functions.{...}` (no projectId arg) — but **prefer** declaring `functions.replace` / `functions.patch.set` inside `(await r.project(id)).apply()` for atomic activation with the rest of the release.
- **MCP Tools:** `deploy_function`, `invoke_function`, `list_functions`, `delete_function`, `get_function_logs`
- **Metered:** Yes (per-tier limits).

### deploy / apply

- **Display:** Unified Apply (v1)
- **Description:** The canonical primitive. One declarative `ReleaseSpec` converges the project (database + migrations + expose manifest + secret declarations + functions + site + public paths + subdomain + routes + smoke checks). State machine: `validate → stage → migrate-gate → migrate → schema-settle → activate → ready`.
- **Endpoints:** `POST /apply/v1/plans` · `POST /apply/v1/plans/:plan_id/commit` · `GET /apply/v1/operations/:id` · `POST /apply/v1/operations/:id/resume` · `GET /apply/v1/operations/:id/events` · `POST /apply/v1/resolve` (URL diagnostics) · `GET /apply/v1/releases/:id` · `POST /content/v1/plans` (generic CAS upload)
- **Auth:** SIGN-IN-WITH-X (CAIP-122 / EIP-4361). Free with active tier.
- **Removed (return 404):** `POST /deploy/v1`, `POST /deployments/v1`, `GET /deployments/v1[/:id]`, `POST /deploy/v1/plan`, `POST /deploy/v1/commit`, `POST /deploy/v2/plans` (renamed to `/apply/v1/plans`).
- **SDK (2.0+):** `(await r.project(id)).apply(spec, opts?)` — the hero. With sub-methods `.start(spec)` (returns `DeployOperation` with `op.events()` async iterable), `.resume(operationId)`, `.plan(spec, {dryRun})`. Release observability on `p.deploy.{getRelease(releaseId, opts?), getActiveRelease(opts?), diff({from, to}), resolve(opts), list(opts?), events(opId), status(opId), upload(plan, opts), commit(planId, opts?)}`. Helper `summarizeDeployResult(result)` is exported from the root.
- **MCP Tools:** `deploy` (unified bundle) · `deploy_site_dir` (incremental site upload) · `bundle_deploy` / `deploy_site` (older names — still work) · `get_deployment` · `deploy_resume`
- **Metered:** No (free with active tier — only project provisioning and image generation are metered per-call).

### sites

- **Display:** Static Site Hosting (S3 + CloudFront)
- **Description:** Site assets ride through CAS, served from `*.run402.com`. Browser reachability is controlled by `site.public_paths` (`mode: "explicit"` for curated public URLs that don't expose backing filenames, or `mode: "implicit"` for filename-derived public reachability).
- **SDK:** `r.sites.deployDir({ project, dir })` (Node-only convenience wrapper around the unified apply primitive) plus `fileSetFromDir(dir)` byte source helper. 2.0 also adds `r.assets.uploadDir / syncDir / prepareDir / putMany` for asset-only directory uploads.
- **MCP Tools:** `deploy_site_dir`
- **Notes:** A deploy with only `site.public_paths` is meaningful — it can remove direct public static URLs without changing release assets.

### subdomains

- **Display:** Custom Subdomain Mapping
- **Description:** Claim/release `<name>.run402.com`. Subdomains are project-owned and reserved during lease grace.
- **Endpoints:** `POST /subdomains/v1` (claim) · `GET /subdomains/v1` (list per project) · `GET /subdomains/v1/:name` (lookup) · `DELETE /subdomains/v1/:name` (release) · `POST /subdomains/v1/admin/:name/release` (operator dispute resolution)
- **SDK:** `r.subdomains.{claim, list, delete}` — but **prefer** inline `subdomains.set: ["name"]` in `(await r.project(id)).apply()` for atomic claim/reassign with site activation.
- **MCP Tools:** `claim_subdomain`, `list_subdomains`, `delete_subdomain`
- **Metered:** No (free with active tier).
- **Notes:** Each project can carry exactly one subdomain via `subdomains.set` today (multi-subdomain rejected locally with `SUBDOMAIN_MULTI_NOT_SUPPORTED`). Use `subdomains.add` to keep existing entries and append.

### routes

- **Display:** Same-origin Web Routes
- **Description:** Map URL patterns on the static-site domain to Node 22 Fetch functions or method-aware static aliases. Enables `/admin`, `/admin/*`, `/api/*` on the same origin as the SPA. Function routes return `req.url` as the full public URL.
- **SDK:** Declare `routes.replace: RouteSpec[]` in the `ReleaseSpec`. Each entry: `{ pattern, methods?, target: { type: "function", name } | { type: "static", file } }`.
- **Metered:** No (free with active tier).
- **Notes:** Exact patterns (`/admin`) and prefix wildcards (`/admin/*`) are supported. Prefer `site.public_paths` for ordinary clean static URLs; static routes are for method-aware aliases (e.g. static `GET /login` + function `POST /login`).

### secrets

- **Display:** Project Secrets
- **Description:** KMS-encrypted at rest (CMK `alias/run402-secrets`, `EncryptionContext: { project_id, key }`). 4 KiB UTF-8 byte cap. Keys must match `^[A-Z_][A-Z0-9_]{0,127}$`.
- **Endpoints:** `POST /projects/v1/admin/:id/secrets` (set value) · `GET /projects/v1/admin/:id/secrets` (list keys; never values) · `DELETE /projects/v1/admin/:id/secrets/:key`
- **SDK:** `r.secrets.{set, list, delete}`
- **MCP Tools:** `set_secret`, `list_secrets`, `delete_secret`
- **Notes:** Deploy specs **must not** carry secret values. Use `secrets.require: string[]` to assert keys exist (commit fails if any are missing) and `secrets.delete: string[]` to remove keys at activation.

### ai

- **Display:** AI Helpers
- **Description:** Image generation (Flux Schnell via OpenRouter), text translation, content moderation.
- **Endpoints:** `POST /generate-image/v1` (x402 $0.03) · `POST /ai/v1/translate` · `POST /ai/v1/moderate`
- **SDK:** `r.ai.{generateImage, translate, moderate}` — also available inside deployed functions via `import { ai } from "@run402/functions"`.
- **MCP Tools:** `generate_image`
- **Metered:** Per-call. Image $0.03; translate / moderate metered to project's AI add-on quota.

### email

- **Display:** Email
- **Description:** Transactional sending via SES, inbound parsing (raw RFC-822 access for DKIM / zk-email), custom sender domains. $5 per 10,000 emails pack; packs never expire.
- **SDK:** `r.email.{send, ...}` plus mailbox / domain management.
- **Notes:** Requires a verified custom sender domain.

### contracts

- **Display:** KMS Contract Wallets
- **Description:** Provision Ethereum signing wallets where private keys never leave AWS KMS. $0.04/day rental + $0.000005/call sign fee, gas at-cost, $1.20 prepay required at creation.
- **SDK:** `r.contracts.{provisionWallet, callContract, drain, delete}`

### apps

- **Display:** Publishable Apps / Fork
- **Description:** Publish a project as a forkable template. Other agents can fork into a fresh project.
- **SDK:** `r.apps.{publish, browse, fork, get, listVersions, updateVersion, deleteVersion}`
- **MCP Tools:** `publish_app`, `get_app`, `browse_apps`, `fork_app`, `list_versions`, `update_version`, `delete_version`

### billing

- **Display:** Billing & Allowances
- **Description:** Wallet allowance ledger, Stripe credits, tier subscriptions, email-pack auto-recharge.
- **Endpoints:** `GET /billing/v1/accounts/:id` (auth: admin-key OR SIWX matching the path wallet) · `GET /billing/v1/accounts/:id/history` (same) · `POST /billing/v1/accounts/:id/link-wallet` (auth: admin-key OR SIWX matching `wallet` in body) · `POST /billing/v1/email-packs/auto-recharge` (auth: admin-key OR SIWX linked to billing_account_id) · `POST /billing/v1/stripe/checkout`, etc.
- **SDK:** `r.billing.{getAccount, getHistory, linkWallet, createCheckout}` · `r.allowance.{status, create, faucet, export}` · `r.tier.{status, set}`
- **MCP Tools:** `check_balance`, `billing_history`, `create_checkout`, `allowance_create`, `allowance_status`, `allowance_export`, `request_faucet`, `tier_status`, `set_tier`

### ci

- **Display:** GitHub Actions OIDC
- **Description:** Bind a GitHub repo/branch (or environment) to a run402 project via a wallet-signed delegation. CI calls the same `run402 deploy apply` primitive without storing wallet keys in GitHub secrets.
- **Endpoints:** `POST /ci/v1/bindings` · `GET /ci/v1/bindings` · `GET /ci/v1/bindings/:id` · `POST /ci/v1/bindings/:id/revoke` · `POST /ci/v1/token-exchange` (RFC 8693 grant)
- **SDK:** `r.ci.{createBinding, listBindings, getBinding, revokeBinding, exchangeToken}` plus Node-only `githubActionsCredentials({ projectId })` and `signCiDelegation(values)` helpers.
- **CLI:** `run402 ci link github` does the binding interactively.
- **Notes:** CI sessions on `/apply/v1/plans` are constrained to the spec fields `project`, `database`, `functions`, `site`, `base: { release: "current" }`, and optionally `routes` (within delegated `route_scopes`). `secrets`, `subdomains`, `checks`, and `manifest_ref` are rejected on CI deploys.

### faucet

- **Display:** USDC Test Token Faucet
- **Description:** Distribute Base Sepolia USDC for prototype-tier testing.
- **Endpoints:** `POST /faucet/v1` (rate-limited by IP + destination wallet) · `POST /faucet/v1/admin` (admin-key, no rate limit; treasury refills from Coinbase CDP)
- **SDK:** `r.allowance.faucet()`
- **MCP Tools:** `request_faucet`

### message

- **Display:** Talk-to-devs
- **Description:** Send a message to the run402 team. Free with active tier.
- **Endpoints:** `POST /message/v1`
- **SDK:** `r.message.send("…")`
- **MCP Tools:** `send_message`

### x402

- **Display:** x402 Payment Gateway
- **Description:** USDC on Base. Payment-required endpoints return HTTP 402 with `accepts[]` payment requirements; the SDK / `@x402/fetch` retries with a signed `x-402-payment` header.
- **Endpoints:** Any x402-gated route returns `402 Payment Required`. Discovery at `GET /.well-known/x402`.

### mpp

- **Display:** MPP (Tempo) Payment Gateway
- **Description:** Stripe's Machine Payments Protocol. Same wallet key signs payments on Tempo (pathUSD) instead of Base.
- **Notes:** Initialize with `run402 init mpp` instead of `run402 init`.

## Tier Limits

| Resource | Prototype | Hobby ($5) | Team ($20) |
|----------|-----------|------------|------------|
| Cost | FREE (testnet USDC) | $5 | $20 |
| Lease | 7 days | 30 days | 30 days |
| Storage | 250 MB | 1 GB | 10 GB |
| API Calls | 500K | 5M | 50M |
| Functions | 5 | 25 | 100 |
| Scheduled (cron) functions | 1 | 3 | 10 |
| Function Timeout | 10s | 30s | 60s |
| Function Memory | 128 MB | 256 MB | 512 MB |
| Minimum cron interval | 15 min | 5 min | 1 min |
| Secrets | 10 | 50 | 200 |

## Auth model summary

| Header | Used for |
|--------|----------|
| `x-402-payment` (x402) / MPP credential | `POST /projects/v1` provisioning, `POST /generate-image/v1`, `POST /tiers/v1/:tier` |
| `SIGN-IN-WITH-X` (SIWX, EIP-4361) | Deploy bundle, project list/get/info, fork, message, agent contact, ping, tier status — free with active tier |
| `Authorization: Bearer <service_key>` | `/projects/v1/admin/*`, subdomains, mailboxes, contracts, function management |
| `apikey: <anon_key|service_key>` | `/rest/v1/*`, `/auth/v1/*`, `/storage/v1/*`, `/functions/v1/:name` |

## SDK packages (npm)

- `@run402/sdk` — typed TypeScript client. Kernel shared by CLI / MCP / deployed functions. **Latest: 2.0.0** (breaking — see top of file).
  - `@run402/sdk` (root) — isomorphic; bring your own `CredentialsProvider`.
  - `@run402/sdk/node` — zero-config defaults (keystore + allowance + x402-wrapped fetch).
  - Project-scoped client: `const p = await r.project(id)` (async in 2.0) — drops `project/projectId` arg from every namespaced method. `r.useProject(id)` persists active project AND scopes in one call.
- `@run402/functions` — in-function helper. `db(req)`, `adminDb()`, `getUser(req)`, `email`, `ai`. Auto-bundled at deploy time.
- `@x402/core`, `@x402/evm`, `@x402/fetch`, `@x402/extensions` — payment-protocol packages. Currently ^2.12.x; release together.

## Path normalization quirks

- Admin endpoints are under `/projects/v1/admin/...` (NOT `/admin/v1/projects/...`).
- Resource endpoints are `/projects/v1`, `/subdomains/v1`, `/faucet/v1`, `/generate-image/v1` (NOT `/v1/projects` etc.).
- Old singular form `POST /subdomains/v1` (not `/subdomain/v1`).

## Removed endpoints (return 404)

| Endpoint | Replacement |
|---|---|
| `POST /deploy/v2/plans`, `/commit`, `/operations/:id`, `/resolve` (renamed in SDK 2.0) | `POST /apply/v1/plans`, `/commit`, `/operations/:id`, `/resolve` |
| `POST /deployments/v1`, `GET /deployments/v1[/:id]` | `POST /apply/v1/plans` + `POST /apply/v1/plans/:id/commit` |
| `POST /deploy/v1`, `/deploy/v1/plan`, `/deploy/v1/commit`, `GET /deploy/v1` | Same |
| `POST /projects/v1/admin/:id/rls` (single-template format) | `POST /projects/v1/admin/:id/expose` with manifest |
| `POST /storage/v1/object/:bucket/*`, `GET /storage/v1/object/:bucket/*` | `POST /storage/v1/uploads` (presigned PUT) → client PUT → `POST /storage/v1/uploads/:id/complete`; reads via `GET /storage/v1/blob/:key` |

## Removed SDK surface (2.0 breaking)

| Removed | Replacement |
|---|---|
| `r.deploy.apply(spec)` | `(await r.project(spec.project)).apply(spec)` — note `project` drops from the spec |
| `r.deploy.start(spec)` | `(await r.project(id)).apply.start(spec)` |
| `r.deploy.resume(opId)` | `(await r.project(id)).apply.resume(opId)` |
| `r.deploy.plan(spec)` | `(await r.project(id)).apply.plan(spec)` |
| `r.deploy.getRelease({ project, releaseId, siteLimit })` | `(await r.project(id)).deploy.getRelease(releaseId, { siteLimit })` |
| `r.deploy.getActiveRelease({ project })` | `(await r.project(id)).deploy.getActiveRelease()` |
| `r.deploy.diff({ project, from, to })` | `(await r.project(id)).deploy.diff({ from, to })` |
| `r.deploy.resolve({ project, url, method })` | `(await r.project(id)).deploy.resolve({ url, method })` |
| `r.deploy.upload(plan, { project, byteReaders })` | `(await r.project(id)).deploy.upload(plan, { byteReaders })` |
| `r.deploy.commit(planId, { project })` | `(await r.project(id)).deploy.commit(planId)` |
| `r.blobs.{put,get,...}` (namespace) | `r.assets.{put,get,ls,rm,sign,diagnoseUrl,waitFresh}` (root) or `p.assets.{...}` (scoped, no projectId arg) |
| `r.project(id)` synchronous return | `await r.project(id)` — now returns a `Promise<ScopedRun402>` |

## MCP Tools → Service Mapping (run402-mcp)

| MCP Tool | Service |
|----------|---------|
| `provision_postgres_project`, `archive_project`, `pin_project`, `project_info`, `project_keys`, `list_projects`, `get_usage`, `get_schema` | projects |
| `run_sql` | database |
| `apply_expose` / `setup_rls`, `validate_manifest`, `get_expose` | database (expose manifest) |
| `rest_query` | rest-api |
| `upload_file`, `download_file`, `list_files`, `delete_file` | blobs |
| `deploy` / `bundle_deploy`, `deploy_site_dir`, `deploy_site`, `get_deployment`, `deploy_resume` | deploy |
| `claim_subdomain`, `list_subdomains`, `delete_subdomain` | subdomains |
| `deploy_function`, `invoke_function`, `list_functions`, `delete_function`, `get_function_logs` | functions |
| `set_secret`, `list_secrets`, `delete_secret` | secrets |
| `generate_image` | ai |
| `send_message`, `set_agent_contact` | message |
| `request_faucet` | faucet |
| `set_tier`, `tier_status`, `check_balance`, `billing_history`, `create_checkout`, `allowance_create`, `allowance_status`, `allowance_export`, `get_quote` | billing |
| `publish_app`, `get_app`, `browse_apps`, `fork_app`, `list_versions`, `update_version`, `delete_version` | apps |

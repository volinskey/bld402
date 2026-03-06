# run402 Services

> Last synced: 2026-03-06

## Services

| Service | Display Name | Description |
|---------|-------------|-------------|
| projects | Project Lifecycle (x402-gated) | Provision, renew, and archive Postgres-backed projects with tier-based pricing |
| database | Postgres Database (Aurora Serverless v2) | SQL migrations, schema introspection, and RLS policy management |
| rest-api | Auto-generated REST API (PostgREST) | CRUD + filters + joins via PostgREST proxy with per-project schema routing |
| auth | Email/Password Auth + JWT | User signup, login, token refresh, and RLS-integrated JWT sessions |
| storage | S3 Object Storage | Upload, download, list, and sign files with per-project S3 prefix isolation |
| functions | Serverless Functions (Lambda) | Deploy, invoke, and manage Lambda functions with secrets and CloudWatch logs |
| deployments | Static Site Hosting (S3 + CloudFront) | Deploy static HTML/CSS/JS sites to *.sites.run402.com with global CDN |
| subdomains | Custom Subdomain Mapping | Claim and manage custom subdomains for deployment URLs |
| generate-image | AI Image Generation (OpenRouter) | Generate images from text prompts via Flux Schnell model |
| faucet | USDC Test Token Faucet | Distribute testnet USDC on Base Sepolia for development |
| stripe | Subscription Billing (Stripe) | Manage subscriptions, checkout sessions, and billing portal |
| hosting | Marketing Site (S3 + CloudFront) | run402.com static site with SEO pages, OpenAPI spec, and llms.txt |
| x402 | x402 Payment Gateway | Cryptocurrency payment middleware for Base mainnet + Sepolia testnet |

## Service Details

### projects

- **Display:** Project Lifecycle (x402-gated)
- **Description:** Provision, renew, and archive Postgres-backed projects with tier-based pricing.
- **Endpoints:** `GET /v1/projects`, `POST /v1/projects/quote`, `POST /v1/projects`, `POST /v1/projects/create/:tier`, `DELETE /v1/projects/:id`, `POST /v1/projects/:id/renew`
- **AWS Backing:** Aurora Serverless v2 (Postgres 16) — `internal.projects` table
- **MCP Tools:** `provision_postgres_project`, `renew_project`
- **Metered:** Yes — $0.10 (prototype/7d), $5.00 (hobby/30d), $20.00 (team/30d)

### database

- **Display:** Postgres Database (Aurora Serverless v2)
- **Description:** Execute SQL migrations, introspect schema, and apply RLS templates (user_owns_rows, public_read, public_read_write).
- **Endpoints:** `POST /admin/v1/projects/:id/sql`, `GET /admin/v1/projects/:id/schema`, `POST /admin/v1/projects/:id/rls`, `GET /admin/v1/projects/:id/usage`
- **AWS Backing:** Aurora Serverless v2 (Postgres 16, 0.5–2 ACU), schema-per-project isolation (p0001–p2000)
- **MCP Tools:** `run_sql`
- **Metered:** Yes (DB size via periodic `pg_total_relation_size()`)

### rest-api

- **Display:** Auto-generated REST API (PostgREST)
- **Description:** Proxy all HTTP methods to PostgREST with automatic schema routing via Accept-Profile/Content-Profile headers.
- **Endpoints:** `ALL /rest/v1/*`
- **AWS Backing:** PostgREST v12.2.3 (ECS sidecar) proxying to Aurora
- **MCP Tools:** `rest_query`
- **Metered:** Yes (each request counts toward per-tier API call limit)

### auth

- **Display:** Email/Password Auth + JWT
- **Description:** User signup, password login with JWT + refresh tokens, and RLS integration via `auth.uid()` / `auth.role()`.
- **Endpoints:** `POST /auth/v1/signup`, `POST /auth/v1/token?grant_type=password`, `POST /auth/v1/token?grant_type=refresh_token`, `GET /auth/v1/user`, `POST /auth/v1/logout`
- **AWS Backing:** Aurora (internal user tables) + JWT signing
- **MCP Tools:** None
- **Metered:** No (free with project)

### storage

- **Display:** S3 Object Storage
- **Description:** Upload, download, delete, list, and generate signed URLs for files, isolated per project via S3 prefix.
- **Endpoints:** `POST /storage/v1/object/:bucket/*`, `GET /storage/v1/object/:bucket/*`, `DELETE /storage/v1/object/:bucket/*`, `POST /storage/v1/object/sign/:bucket/*`, `GET /storage/v1/object/list/:bucket`
- **AWS Backing:** S3 (shared bucket, prefix: `{project_id}/{bucket}/{path}`)
- **MCP Tools:** `upload_file`
- **Metered:** Yes (counts toward per-tier storage byte limit)

### functions

- **Display:** Serverless Functions (Lambda)
- **Description:** Deploy, invoke, and manage Lambda functions with environment secrets and CloudWatch log tailing.
- **Endpoints:** `POST /admin/v1/projects/:id/functions`, `GET /admin/v1/projects/:id/functions`, `DELETE /admin/v1/projects/:id/functions/:name`, `GET /admin/v1/projects/:id/functions/:name/logs`, `ALL /functions/v1/:name[/*]`, `POST /admin/v1/projects/:id/secrets`, `GET /admin/v1/projects/:id/secrets`, `DELETE /admin/v1/projects/:id/secrets/:key`
- **AWS Backing:** Lambda + CloudWatch Logs
- **MCP Tools:** None
- **Metered:** Yes (per-tier limits: 5–100 functions, 10–60s timeout, 128–512MB memory, 10–200 secrets)

### deployments

- **Display:** Static Site Hosting (S3 + CloudFront)
- **Description:** Deploy static HTML/CSS/JS sites with inlined file uploads to *.sites.run402.com with global CDN.
- **Endpoints:** `GET /v1/deployments`, `POST /v1/deployments`, `GET /v1/deployments/:id`
- **AWS Backing:** S3 (sites/ prefix) + CloudFront (*.sites.run402.com) + Route 53
- **MCP Tools:** None
- **Metered:** Yes ($0.05 per deployment)

### subdomains

- **Display:** Custom Subdomain Mapping
- **Description:** Claim, list, lookup, and release custom subdomains that map to deployment URLs.
- **Endpoints:** `POST /v1/subdomains`, `GET /v1/subdomains`, `GET /v1/subdomains/:name`, `DELETE /v1/subdomains/:name`
- **AWS Backing:** Aurora (internal.subdomains table) + CloudFront routing
- **MCP Tools:** None
- **Metered:** No (free with project)

### generate-image

- **Display:** AI Image Generation (OpenRouter)
- **Description:** Generate images from text prompts using Flux Schnell model via OpenRouter API.
- **Endpoints:** `GET /v1/generate-image`, `POST /v1/generate-image`
- **AWS Backing:** None (external: OpenRouter API)
- **MCP Tools:** None
- **Metered:** Yes ($0.01 per image, x402-gated)

### faucet

- **Display:** USDC Test Token Faucet
- **Description:** Distribute testnet USDC on Base Sepolia for development and testing. Rate-limited to 1 drip per 24h per IP.
- **Endpoints:** `POST /v1/faucet`, `POST /admin/v1/faucet`
- **AWS Backing:** None (external: Base Sepolia chain + Coinbase CDP API for treasury refill)
- **MCP Tools:** None
- **Metered:** No (free, rate-limited)

### stripe

- **Display:** Subscription Billing (Stripe)
- **Description:** Manage Stripe subscriptions, create checkout sessions, and provide billing portal access.
- **Endpoints:** `GET /v1/wallets/:address/projects`, `GET /v1/stripe/products`, `POST /v1/stripe/checkout`, `POST /v1/stripe/portal`, `GET /v1/stripe/subscription/:wallet`, `POST /v1/stripe/cache/clear`
- **AWS Backing:** None (external: Stripe API) + Aurora for wallet/project linking
- **MCP Tools:** None
- **Metered:** No (billing infrastructure)

### hosting

- **Display:** Marketing Site (S3 + CloudFront)
- **Description:** run402.com static site with use-case pages, OpenAPI spec, sitemap, robots.txt, and llms.txt for AI discovery.
- **Endpoints:** `https://run402.com/*` (static)
- **AWS Backing:** S3 + CloudFront + Route 53 + ACM
- **MCP Tools:** None
- **Metered:** No

### x402

- **Display:** x402 Payment Gateway
- **Description:** Cryptocurrency payment middleware accepting USDC on Base mainnet and Base Sepolia testnet for all paid endpoints.
- **Endpoints:** All x402-gated routes return `402 Payment Required` with payment instructions. Discovery at `GET /.well-known/x402`.
- **AWS Backing:** None (on-chain: Base L2 + facilitator service)
- **MCP Tools:** None
- **Metered:** N/A (payment infrastructure)

## Tier Limits

| Resource | Prototype ($0.10) | Hobby ($5.00) | Team ($20.00) |
|----------|-------------------|---------------|---------------|
| Lease | 7 days | 30 days | 30 days |
| Storage | 250 MB | 1 GB | 10 GB |
| API Calls | 500k | 5M | 50M |
| Functions | 5 | 25 | 100 |
| Function Timeout | 10s | 30s | 60s |
| Function Memory | 128 MB | 256 MB | 512 MB |
| Secrets | 10 | 50 | 200 |

## MCP Tools → Service Mapping

| MCP Tool | Service |
|----------|---------|
| `provision_postgres_project` | projects |
| `run_sql` | database |
| `rest_query` | rest-api |
| `upload_file` | storage |
| `renew_project` | projects |

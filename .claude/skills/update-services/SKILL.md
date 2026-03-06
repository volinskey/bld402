---
name: update-services
description: Sync run402 repo and update the service catalog at docs/run402-services.md with current backend capabilities.
---

# Update Services — sync and update run402 service catalog

Sync the run402 repo, scan its source code and MCP tools for the full list of services it provides, then update the reference file in bld402 and print a summary.

## Workflow

### 1. Sync the run402 repo

```bash
cd "C:/Workspace - Eleanor/run402" && git pull --ff-only
```

If the pull fails (e.g., dirty working tree), warn the user and proceed with the current local state. Do NOT force-reset.

### 2. Scan run402 for services

Read the following sources to discover services:

| Source | What to look for |
|--------|-----------------|
| `packages/gateway/src/server.ts` | Mounted route modules (e.g., `projectRoutes`, `authRoutes`, `storageRoutes`) |
| `packages/gateway/src/routes/*.ts` | Endpoint definitions — each route file typically maps to one service |
| `packages/gateway/src/services/*.ts` | Business logic modules — confirm service boundaries |
| `packages/shared/src/types.ts` | Type definitions that reveal service capabilities |
| `packages/shared/src/tiers.ts` | Tier limits (reveals what's metered = what's a service) |
| `docs/supa_spec.md` | The spec — authoritative list of API surface and services |
| `test/mcp-e2e.ts` | MCP tool names — these are the agent-facing service handles |
| `infra/` | CDK stack — reveals AWS services backing each capability |
| `site/` | Website/hosting setup |
| Any `*.well-known/x402` route | x402-gated endpoints (paid services) |

Also check for services not in the gateway (e.g., AWS Amplify hosting, static site deployments, CDN).

### 3. Build the service entry for each service

For each service, capture:

| Field | Description |
|-------|------------|
| **name** | Short lowercase identifier (use run402's own naming: route file name or MCP tool category). Examples: `database`, `auth`, `storage`, `rest-api`, `functions`, `deployments` |
| **display** | Human-readable name. Example: "Postgres Database (Aurora Serverless v2)" |
| **description** | One sentence: what does it do for agents? |
| **endpoints** | Key API endpoints (from the spec or route files) |
| **aws-backing** | The AWS service(s) that power it |
| **mcp-tools** | Which MCP tool(s) map to this service (if any) |
| **metered** | Whether usage is counted against the project's lease quota |

**Naming rules:**
- Use the route/service file name as the canonical short name when possible (e.g., `auth.ts` → `auth`, `storage.ts` → `storage`).
- If run402 has an explicit naming convention (e.g., MCP tool prefixes, x402 resource names), prefer those.
- Keep short names lowercase, hyphenated, no spaces.

### 4. Update `docs/run402-services.md`

**If the file already exists:** Read it, then update in place — add new services, update changed services, remove services no longer present in run402. Preserve any manual notes or annotations the user may have added (look for sections marked `<!-- manual -->` or freeform text outside the structured entries).

**If the file does not exist:** Create it from scratch.

Format:

```markdown
# run402 Services

> Last synced: YYYY-MM-DD

## Services

| Service | Display Name | Description |
|---------|-------------|-------------|
| database | Postgres Database (Aurora Serverless v2) | ... |
| ... | ... | ... |

## Service Details

### database

- **Display:** Postgres Database (Aurora Serverless v2)
- **Description:** ...
- **Endpoints:** `POST /admin/v1/projects/{id}/sql`, `GET /admin/v1/projects/{id}/schema`
- **AWS Backing:** Aurora Serverless v2 (Postgres 16)
- **MCP Tools:** `run_sql`
- **Metered:** Yes (DB size via periodic measurement)

### auth
...
```

Always update the "Last synced" timestamp.

### 5. Print terminal summary

Print a clean, scannable list to the terminal:

```
run402 Services (synced YYYY-MM-DD)
────────────────────────────────────────────────────

  database      Postgres Database (Aurora Serverless v2)
  rest-api      Auto-generated REST API (PostgREST)
  auth          Email/Password Auth + JWT
  storage       S3 Object Storage
  ...

  Total: N services
```

Use consistent column alignment. The short name on the left, display name on the right.

### 6. Update AGENTS.md (if it exists)

If bld402 has an `AGENTS.md` with a services or reference section, add or update a "run402 Services" table pointing to `docs/run402-services.md`.

If no `AGENTS.md` exists, skip this step.

## Edge Cases

- **run402 repo not found at expected path:** Error immediately: "run402 repo not found at `C:/Workspace - Eleanor/run402`. Cannot update services."
- **git pull fails:** Warn but continue with local state.
- **New service found in run402:** Add it to the catalog.
- **Service removed from run402:** Remove it from the catalog.
- **`docs/run402-services.md` has manual annotations:** Preserve them. Only update the structured service entries.

## Automation Interface

**Input:** None required (all paths are known).

**Output:**
- `docs/run402-services.md` — updated service catalog
- Terminal summary of all services

**Artifacts updated/created:**
- `docs/run402-services.md`

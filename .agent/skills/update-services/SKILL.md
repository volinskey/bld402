---
name: update-services
description: Sync run402 repo, update the service catalog, review the API for drift, update bld402-mcp tool implementations, and fix bld402.com website issues.
---

# Update Services — full run402 sync for bld402

Sync the run402 repo, scan for services, update the catalog, then propagate any API changes into the bld402 MCP server and the bld402.com website. This is the single command that keeps everything downstream of run402 in sync.

## Workflow

### 1. Sync the run402 repo

```bash
cd "C:/Workspace-Kychee/run402" && git pull --ff-only
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

If bld402 has an `AGENTS.md` with a services or reference section, update the "run402 Backend Services" table to match the new catalog. If no `AGENTS.md` exists, skip this step.

---

## API Drift Review (Steps 7–8)

After the service catalog is updated, review the actual run402 API surface against all downstream consumers. The goal is to catch any mismatch before it reaches users.

### 7. Review run402 API against bld402 references

Build a complete endpoint map from run402's route files (Step 2 sources). Then compare this map against every place bld402 documents or calls run402 endpoints:

| Consumer | Location | What to check |
|----------|----------|---------------|
| **Service catalog** | `docs/run402-services.md` | Endpoint paths match route files. No stale endpoints listed. |
| **bld402 SKILL.md** | `.agent/skills/bld402/SKILL.md` → "Quick Reference — API Endpoints" section | Every endpoint in the table exists in run402. Auth methods match. No missing new endpoints. |
| **bld402 SKILL.md** | `.agent/skills/bld402/SKILL.md` → Guardrails ("What run402 CAN do" / "CANNOT do") | Capabilities list matches actual services (e.g., if run402 added a new service, it should appear in CAN do). |
| **agent.json** | `public/agent.json` → step instructions and inputs | Any step that references an endpoint path or auth method is current. |
| **Step pages** | `public/build/step/*.html` | API URLs, endpoint paths, auth headers, and example payloads are correct. |
| **Guardrails page** | `public/build/guardrails.html` | Capability list matches actual services. |
| **Human-facing pages** | `public/humans/how-it-works.html`, `public/humans/faq.html`, `public/humans/templates.html` | Service counts, feature descriptions, and pricing are current. |
| **CRITICAL-REVIEW.md** | `.agent/skills/bld402/CRITICAL-REVIEW.md` | Check if previously flagged issues are now fixed in run402 (e.g., wrong API URL, missing services). Mark resolved items. |

**Known drift patterns to watch for:**
- `https://run402.com` vs `https://api.run402.com` — all API calls must use `api.run402.com`
- Endpoint path format changes (e.g., `/admin/v1/projects/:id/sql` vs `/projects/v1/admin/:id/sql`)
- New auth methods or header name changes
- New services with no bld402 coverage
- Removed or deprecated endpoints still referenced
- Tier pricing or limit changes
- New MCP tools in run402 not mapped in the catalog

**Output of this step:** A drift report listing every mismatch found, organized by severity:

```
API Drift Report
────────────────────────────────────────────────────

CRITICAL (blocks basic flow):
  - [location]: [issue]

HIGH (breaks specific feature):
  - [location]: [issue]

LOW (stale docs / cosmetic):
  - [location]: [issue]

No drift found:
  - [location]: ✓ all endpoints match
```

### 8. Fix all drift in bld402 repo

For each issue in the drift report, fix it in place:

| Severity | Action |
|----------|--------|
| CRITICAL | Fix immediately. These block the primary build/deploy flow. |
| HIGH | Fix now. These break specific features or templates. |
| LOW | Fix now if trivial (< 1 min). Otherwise note for later. |

**Files commonly needing fixes:**

| File | Common fixes |
|------|-------------|
| `.agent/skills/bld402/SKILL.md` | API endpoint table, auth model table, guardrails lists |
| `public/agent.json` | Step instructions, endpoint references in `instruction` fields |
| `public/build/step/*.html` | API URLs, code examples, endpoint paths |
| `public/build/guardrails.html` | Capability lists |
| `public/humans/how-it-works.html` | Feature descriptions, step counts |
| `public/humans/faq.html` | Pricing, capability claims |
| `public/humans/templates.html` | Template count, service coverage |
| `.agent/skills/bld402/CRITICAL-REVIEW.md` | Mark resolved issues, add new ones |

After fixes, re-verify by spot-checking 2–3 fixed locations to confirm correctness.

---

## bld402-mcp Update (Steps 9–11)

### 9. Review bld402-mcp against run402 API

**Repo:** `C:/Workspace-Kychee/bld402-mcp`

Compare the MCP tool implementations against the current run402 API:

| File | What to check |
|------|---------------|
| `src/config.ts` | `API_BASE` is `https://api.run402.com` (not `https://run402.com`) |
| `src/client.ts` | HTTP method, path, headers, and body format for each API call match run402's route handlers |
| `src/wallet.ts` | Wallet auth header names (`X-Run402-Wallet`, `X-Run402-Signature`, `X-Run402-Timestamp`) match run402's middleware |
| `src/tools/*.ts` | Each tool's API calls use correct endpoints, auth, and request/response shapes |
| `src/templates.ts` | Template metadata matches `templates/` directory in bld402 repo |
| `src/index.ts` | Tool descriptions, parameter schemas, and registered tool names are accurate |

**Cross-reference with the endpoint map from Step 7.** Every API call in bld402-mcp must exist in run402's route files. Every required endpoint in run402 that bld402-mcp should use must have a corresponding call.

**Check for:**
- Wrong base URL (must be `https://api.run402.com`)
- Changed endpoint paths or HTTP methods
- New required headers or removed headers
- Changed request body fields (added required fields, renamed fields)
- Changed response body shape (field renames, nested structure changes)
- New run402 endpoints that bld402-mcp should use but doesn't
- Deprecated endpoints that bld402-mcp still calls
- Tier pricing or limits that are hardcoded and now wrong

### 10. Fix bld402-mcp issues

For each mismatch found in Step 9, fix it directly in the bld402-mcp source:

- Update endpoint paths in `src/client.ts` or `src/tools/*.ts`
- Update auth headers in `src/wallet.ts`
- Update parameter schemas in tool registration (`src/index.ts`)
- Update hardcoded values (tier prices, limits, URLs)
- Update template metadata if templates were added/removed

### 11. Verify bld402-mcp builds

```bash
cd "C:/Workspace-Kychee/bld402-mcp" && npx tsc --noEmit
```

If TypeScript compilation fails, fix the errors before proceeding. The MCP must compile cleanly.

If bld402-mcp repo is not found at the expected path, warn the user and skip Steps 9–11. Do not error out — the service catalog and website fixes (Steps 1–8) are still valuable on their own.

---

## Summary & Commit (Step 12)

### 12. Print full summary

Print a combined report covering all three areas:

```
/update-services — Complete
────────────────────────────────────────────────────

SERVICE CATALOG (docs/run402-services.md)
  Added:    [list or "none"]
  Updated:  [list or "none"]
  Removed:  [list or "none"]
  Total:    N services

API DRIFT (bld402 repo)
  CRITICAL fixes: N
  HIGH fixes:     N
  LOW fixes:      N
  Skipped:        N (noted for later)

MCP UPDATE (bld402-mcp)
  Endpoint fixes:  N
  Schema fixes:    N
  Build status:    ✓ compiles | ✗ errors (details)

WEBSITE (bld402.com)
  Pages fixed:     N
  Pages checked:   N (all clean)

Files modified:
  - docs/run402-services.md
  - AGENTS.md
  - [list all other modified files]
```

---

## Edge Cases

- **run402 repo not found at expected path:** Error immediately: "run402 repo not found at `C:/Workspace-Kychee/run402`. Cannot update services."
- **bld402-mcp repo not found:** Warn and skip Steps 9–11. Complete all other steps.
- **git pull fails:** Warn but continue with local state.
- **New service found in run402:** Add to catalog. Check if bld402 SKILL.md, website, or MCP need updates for the new service.
- **Service removed from run402:** Remove from catalog. Check if bld402 still references it anywhere and clean up.
- **`docs/run402-services.md` has manual annotations:** Preserve them. Only update structured entries.
- **No drift found:** Report "No drift found" — this is a valid and good outcome.
- **bld402-mcp has uncommitted changes:** Warn the user before modifying. Do not discard their work.

## Automation Interface

**Input:** None required (all paths are known).

**Output:**
- `docs/run402-services.md` — updated service catalog
- Drift report (terminal)
- Fixes applied to bld402 repo files
- Fixes applied to bld402-mcp repo (if present)
- Combined terminal summary

**Artifacts updated/created:**
- `docs/run402-services.md`
- `AGENTS.md`
- `.agent/skills/bld402/SKILL.md` (if API drift found)
- `.agent/skills/bld402/CRITICAL-REVIEW.md` (if issues resolved or new ones found)
- `public/agent.json` (if step instructions had drift)
- `public/build/step/*.html` (if endpoint references had drift)
- `public/build/guardrails.html` (if capabilities changed)
- `public/humans/*.html` (if feature descriptions or pricing changed)
- `C:/Workspace-Kychee/bld402-mcp/src/**` (if MCP tool implementations had drift)

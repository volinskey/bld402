---
name: idea-templates
description: Find run402 services with no template coverage and propose new template ideas to demo them.
---

# Idea Templates — discover undemo'd services and propose templates

Identify run402 services that have no template or pattern coverage in bld402, then propose concrete template ideas that would showcase them — either as new templates or as additions to existing ones.

## Workflow

### 1. Load the service catalog

Read `docs/run402-services.md` for the current list of run402 services. If the file doesn't exist or looks stale, tell the user: "Run `/update-services` first to refresh the catalog."

### 2. Build the coverage map

Read all templates in `templates/` (utility, games, patterns) and determine which run402 services each one demonstrates. Build a coverage matrix:

```
Service         → Covered by
database        → shared-todo, hangman, trivia-night, ...
auth            → shared-todo, landing-waitlist, ...
storage         → file-upload pattern, ...
functions       → (none)
generate-image  → (none)
...
```

A service is "covered" if a template or pattern snippet demonstrates its API in a way that agents can learn from.

### 3. Identify gaps

List every service with zero or weak coverage. "Weak coverage" means the service is used but only trivially (e.g., auth is used but only signup, no token refresh or logout).

### 4. Propose template ideas

For each uncovered service, propose **one or two** concrete template ideas. Each proposal should include:

| Field | Description |
|-------|------------|
| **Service** | The undemo'd service |
| **Proposal** | New template name + one-line pitch |
| **Type** | `new-template` or `extend-existing` |
| **If extending** | Which existing template and what to add |
| **Category** | utility, games, or patterns |
| **Services used** | All services this template would demonstrate (aim for 2–3, not just the gap service) |
| **Complexity** | simple (1 page), medium (2–3 pages), complex (multi-feature) |
| **Why this idea** | Why this is a good demo — what makes it compelling and learnable |

**Proposal quality rules:**
- Ideas should be things a 12-year-old could describe to an agent ("make me a ___")
- Prefer ideas that combine the gap service with already-covered services (shows integration)
- Prefer ideas that are fun, visual, or immediately useful
- Don't propose ideas that duplicate existing templates
- If extending an existing template is better than creating a new one, say so

### 5. Also propose missing pattern snippets

If a service has no pattern snippet in `templates/patterns/`, propose one. Pattern snippets are small, copy-pasteable code fragments that show agents how to use a service.

### 6. Print the proposals

Print to the terminal:

```
Template Ideas (YYYY-MM-DD)
════════════════════════════════════════════════════

Coverage Map:
  database .......... ████████ 5 templates
  rest-api .......... ████████ 5 templates
  auth .............. ██████   4 templates
  storage ........... ██       1 pattern
  functions ......... ░░       0 (GAP)
  generate-image .... ░░       0 (GAP)
  subdomains ........ ░░       0 (GAP)
  ...

Proposals:

  1. AI Greeting Card Generator (NEW — games/)
     Services: generate-image, storage, deployments
     Complexity: simple
     "User describes a card, agent generates image via AI, stores it,
      deploys a shareable page with the card."

  2. Extend: shared-todo + functions
     Add: scheduled daily email digest via serverless function
     Complexity: medium
     "Demonstrates functions service without a whole new template."

  3. Pattern: functions-deploy.js (NEW)
     "Copy-paste snippet showing how to deploy and invoke a Lambda function."

  ...

Summary:
  Services covered: N/M
  Gaps found: N
  Proposals: N new templates, N extensions, N patterns
```

### 7. Save the proposals

Write the proposals to `docs/template-ideas.md` with the date. If the file exists, replace it.

## Edge Cases

- **`docs/run402-services.md` missing:** Tell the user to run `/update-services` first. Do not proceed.
- **All services already covered:** Celebrate! Say "Full coverage — no gaps found." and suggest quality improvements instead.
- **Infrastructure-only services (x402, stripe, metering):** These don't need template demos. Skip them in the gap analysis but note they're intentionally excluded.

## Automation Interface

**Input:** None required.

**Output:**
- Terminal coverage map and proposals
- `docs/template-ideas.md` — saved proposals

**Artifacts created/updated:**
- `docs/template-ideas.md`

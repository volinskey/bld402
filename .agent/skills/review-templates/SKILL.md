---
name: review-templates
description: Review all bld402 templates against run402 services and suggest per-template improvements.
---

# Review Templates — critical analysis of templates vs available services

Analyze every bld402 template against the full run402 service catalog. For each template, identify services it could benefit from but doesn't currently use.

## Workflow

### 1. Load the service catalog

Read `docs/run402-services.md` for the current list of run402 services. If the file doesn't exist or looks stale, tell the user: "Run `/update-services` first to refresh the catalog."

### 2. Read every template

Read all templates in `templates/`:
- **Full app templates:** `templates/utility/*/` and `templates/games/*/` — read the `README.md`, `index.html`, `rls.json`, and any `.js` files
- **Pattern snippets:** `templates/patterns/*` — read each snippet file

For each template, understand:
- What run402 services it currently uses (database, auth, storage, rest-api, functions, etc.)
- What it does and how it works
- What its limitations are

### 3. Cross-reference templates against services

For each template, check every run402 service and ask:
- Does this template already use this service?
- **Could** this template meaningfully benefit from this service?
- Would adding this service make the template a better demo or more useful?

Only flag services that would provide **real value** — not every template needs every service. Be specific about *how* the service would improve the template.

### 4. Also review pattern snippets

Pattern snippets (`templates/patterns/`) are code fragments agents copy into apps. Check:
- Is there a pattern snippet for every commonly-used service? (e.g., is there a `functions.js` pattern? a `storage-signed-url.js` pattern?)
- Are existing snippets up to date with the current run402 API?

### 5. Print the review

Print a structured review to the terminal:

```
Template Review (YYYY-MM-DD)
════════════════════════════════════════════════════

### shared-todo
  Uses: database, rest-api, auth, deployments
  Missing opportunities:
    ✦ storage — could add profile avatars or file attachments to todos
    ✦ functions — could add a scheduled cleanup function for completed todos

### hangman
  Uses: database, rest-api, deployments
  Missing opportunities:
    ✦ auth — could add per-user score tracking
  No issues found: ✓

### Pattern: file-upload.js
  Status: ✓ Up to date
  (or)
  Status: ⚠ Uses deprecated endpoint /storage/v1/upload

...

Summary:
  Templates reviewed: N
  Patterns reviewed: N
  Total suggestions: N
```

### 6. Save the review

Write the review to `docs/template-review.md` with the date. If the file exists, replace it (this is a point-in-time analysis, not cumulative).

## Edge Cases

- **`docs/run402-services.md` missing:** Tell the user to run `/update-services` first. Do not proceed.
- **New template added that you haven't seen:** Read it and review it like any other.
- **Template already uses all applicable services:** Say "No opportunities found" — don't force suggestions.

## Automation Interface

**Input:** None required.

**Output:**
- Terminal review with per-template suggestions
- `docs/template-review.md` — saved review

**Artifacts created/updated:**
- `docs/template-review.md`

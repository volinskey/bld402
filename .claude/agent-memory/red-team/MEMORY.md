# Red Team Memory — bld402

## bld402 System Test Status: PASS (Cycle 2, 2026-03-04)

### Current Status: 62/62 passed, 0 failed, 1 gap

### All Cycle 1 Failures Resolved
- **F-001 (P1):** shared-todo schema.sql — FIXED. File present with correct CREATE TABLE statement.
- **F-002 (P2):** 4 templates missing README.md — FIXED. All 5 templates have README.md with customization points. shared-todo README slightly less detailed than others (no "Files" section) but functionally adequate.
- **F-003 (P1):** Template gallery no build workflow links — FIXED. All 5 active cards have "Build with this template" links to /build/step/1?template={slug}.
- **F-004 (P1):** Showcase page no screenshots — FIXED. 5 SVG mockup screenshots at public/humans/images/; all img tags with descriptive alt text.
- **F-005 (P2):** Legal page missing — FIXED. legal.html created; footer link on all 8 relevant pages.

### Persistent Gap
- **GAP-001:** No live Amplify URL documented. All testing done on static files. Cannot test HTTP routing, CDN, or browser rendering without a live URL.

### What Passed Well (Both Cycles)
- Agent onboarding: root page, agent.json, 20 step pages — all well-structured
- Memory directives: consistent 3-key schema (carry_forward, store, discard) across all 20 steps
- Guardrails: all 9 capability limits with plain-language alternatives
- Payment pass-through: testnet default, faucet, upgrade path all documented
- Human pages: plain language, no jargon, properly linked

### Testing Notes
- Static file testing covers content; HTTP/routing testing needs a live URL
- Templates are at `templates/` (project root). Agents fetch from web; humans see the gallery at `public/templates/`.

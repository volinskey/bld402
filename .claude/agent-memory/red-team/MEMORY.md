# Red Team Memory — bld402

## bld402 System Test Status: PASS (Cycle 4, 2026-03-06)

### Final Counts: 70 passed, 0 failed, 0 blocked, 4 gaps

### GAP-001 Persists

- **GAP-001:** No live Amplify URL. 6 showcase app tests (T-060 to T-065) cannot run without live HTTP access to *.run402.com subdomains. Verdict is PASS because gaps do not block pass verdict per skill rules.

### F-004 Won't Fix

- Only 6 of 28 templates have implementation files. 22 are deferred post-MVP. Accepted scope boundary. T-039 marked [F] in plan but excluded from verdict.

### All Cycle 3 Failures Resolved (Cycle 4 Verified)

- **F-001:** Root page link text corrected to "Humans go here." and is now first element in hero div — VERIFIED FIXED
- **F-002:** Step 2 utility table now has 16 entries including Paste Locker (#16) — VERIFIED FIXED
- **F-003:** Guardrails page now correctly lists run402 serverless functions as supported in "Can do" section; "Cannot do" row scoped to "beyond run402 functions" — VERIFIED FIXED
- **F-005:** Hangman schema now uses `words` table, serial PK, word_id FK, 54 seed words — VERIFIED FIXED
- **F-006:** Paste Locker README now says `https://run402.com` — VERIFIED FIXED
- **F-007:** Spec AC now says "All 28 templates" — VERIFIED FIXED
- **F-008:** Auto-resolved by F-002 fix; games now number 17-28 — VERIFIED FIXED
- **TR-001:** Step 1 now has JS that reads ?template= parameter and shows a visible banner — VERIFIED FIXED

### What Passes Well

- All 20 step pages: complete structure (context, instruction, expected output, memory directive, next step), no jargon in user scripts
- Memory directive chain: coherent across all 20 steps, service_key security warnings throughout
- Payment pass-through: testnet default, faucet, full upgrade path in step 20
- Human pages: about, how-it-works, showcase (6 cards + SVGs), templates (6 active + coming-soon), terms, privacy, legal — all correct
- Agent catalog /templates/index.html: all 6 active templates with correct IDs and build links
- 6 active templates all have schema.sql, rls.json, index.html, README.md

### Testing Notes

- Static file testing covers content; HTTP/routing testing needs a live URL (GAP-001 persists)
- Templates at `templates/` (project root). Agents fetch from web; humans see gallery at `public/templates/`
- Pattern files at `templates/patterns/` — all 6 present (db-connection.js, auth-flow.js, crud.js, file-upload.js, responsive-layout.html, polling.js)
- Paste Locker is the only template requiring server-side functions
- Test doc: `docs/plans/bld402_system_test.md` (74 tests, cycle 4)

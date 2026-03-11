# bld402 Methodology — Critical Review

Step-by-step fault analysis of the 21-step bld402 workflow. Each step is reviewed for correctness, reliability, agent-compatibility, and user experience.

---

## Severity Legend

- **CRITICAL** — Will cause the build to fail. Must fix.
- **HIGH** — Significant risk of failure or poor UX. Should fix.
- **MEDIUM** — Suboptimal but won't break the build. Nice to fix.
- **LOW** — Minor style/polish issue. Optional.

---

## Step 1: Describe Your App
**Phase:** spec | **Verdict:** Sound

| # | Severity | Finding |
|---|----------|---------|
| 1.1 | LOW | No validation that the user provided a meaningful description. Agent could proceed with "I want an app" and produce garbage downstream. A minimum length or specificity check would help. |
| 1.2 | LOW | The `?template=` URL parameter hint is a nice touch but is only relevant when agents navigate via browser. In a skill context (local SKILL.md), this mechanism doesn't apply. |

**No blocking issues.**

---

## Step 2: Match Templates
**Phase:** spec | **Verdict:** Sound with minor drift risk

| # | Severity | Finding |
|---|----------|---------|
| 2.1 | MEDIUM | **Template count mismatch.** The step page lists 13 templates, but AGENTS.md only shows 6 as implemented (shared-todo, landing-waitlist, hangman, trivia-night, voting-booth, paste-locker). The other 7 (micro-blog, photo-wall, secret-santa, flash-cards, ai-sticker-maker, bingo-card-generator, memory-match) are listed as "To build" in the spec. An agent matching to a template that doesn't actually exist yet will fail at Step 7/13 when it tries to fetch the template files. |
| 2.2 | LOW | No fallback if the template gallery at `/templates/` is unreachable. |

**Recommendation:** Mark unbuilt templates clearly or remove them from the matching list until they exist.

---

## Step 3: Clarify Features
**Phase:** spec | **Verdict:** Well designed

| # | Severity | Finding |
|---|----------|---------|
| 3.1 | LOW | "One question at a time" is good UX for non-technical users but painful for experienced users who know what they want. Could offer a fast path: "Would you like me to ask a few quick questions, or do you want to describe all the details at once?" |
| 3.2 | LOW | The "3-6 questions max" limit is wise but may not cover complex apps (e.g., a multi-role system with different user types). |
| 3.3 | MEDIUM | The guardrail-targeted questions about WebSocket, OAuth, and notifications are smart but don't cover all guardrails. Missing: custom domains (myapp.com vs myapp.run402.com), file size limits, server-side compute needs. |

**No blocking issues.**

---

## Step 4: Confirm Spec
**Phase:** spec | **Verdict:** Sound

| # | Severity | Finding |
|---|----------|---------|
| 4.1 | MEDIUM | The memory directive says `discard: ["app_description", "matched_template_or_null", "feature_answers"]`. This is a lossy compression — the `app_spec` is a structured interpretation of these inputs. If the agent misunderstood something, the original inputs are gone, making it harder to debug during iteration. Consider keeping `app_description` at minimum. |
| 4.2 | LOW | The `app_spec` JSON schema doesn't include a `functions_needed` field, so apps requiring serverless functions (like Paste Locker with bcrypt hashing) may not be planned correctly. |

**No blocking issues.**

---

## Step 5: Determine Services
**Phase:** plan | **Verdict:** Incomplete service coverage

| # | Severity | Finding |
|---|----------|---------|
| 5.1 | HIGH | **Missing services in the checklist.** The step page only lists 6 services (Database, REST API, Auth, RLS, File Storage, Static Hosting). It omits `functions` (serverless), `generate-image` (AI images), and `message` (Telegram notifications) — all of which are available run402 services per AGENTS.md. An agent following this step literally would never plan for serverless functions or image generation, even when the app needs them. |
| 5.2 | MEDIUM | No guidance on when to use `functions` vs client-side code. The Paste Locker template requires functions for bcrypt, but this step doesn't mention the pattern. |

**Recommendation:** Add `functions`, `generate-image`, and `message` to the service checklist with "when needed" criteria.

---

## Step 6: Select Tier
**Phase:** plan | **Verdict:** Sound but missing cost awareness

| # | Severity | Finding |
|---|----------|---------|
| 6.1 | HIGH | **No mention of deployment cost.** The step discusses project cost ($0.10) but never mentions that each deployment costs an additional $0.05 (x402-gated). With faucet giving $0.25, the total budget is: 1 project ($0.10) + 3 deploys ($0.15) = $0.25. This means a user gets exactly 3 deployments (initial + 2 iterations) before running out. The iterate loop (Steps 17-19) burns $0.05 per cycle with no budget tracking. |
| 6.2 | MEDIUM | The Stripe subscription option is mentioned ("Only available as an upgrade after the initial prototype") but Step 20's upgrade table shows `POST /v1/stripe/checkout` with no x402 payment code example. An agent wouldn't know how to implement this. |

**Recommendation:** Add a "budget planning" section that calculates total cost including deployments, and warn when funds are getting low.

---

## Step 7: Select Template
**Phase:** plan | **Verdict:** Sound

| # | Severity | Finding |
|---|----------|---------|
| 7.1 | MEDIUM | Template file structure described here (`schema.sql`, `rls.json`, `index.html`, `README.md`) may not match every template's actual structure. Some templates have additional files or different naming. |
| 7.2 | LOW | Pattern file references (`db-connection.js`, `auth-flow.js`) assume the agent can fetch these from bld402.com. In offline scenarios or when the site is down, the agent has no fallback. |

**No blocking issues.**

---

## Step 8: Finalize Build Plan
**Phase:** plan | **Verdict:** Sound with rendering bug

| # | Severity | Finding |
|---|----------|---------|
| 8.1 | LOW | The build plan JSON example in the HTML contains `<span class="brand-run">run</span>402` — if an agent parses this literally (which web-fetching agents might), it gets mangled HTML entities instead of "run402". |

**No blocking issues.**

---

## Step 9: Get Testnet Funds
**Phase:** implement | **Verdict:** High barrier for target audience

| # | Severity | Finding |
|---|----------|---------|
| 9.1 | HIGH | **Node.js dependency not declared.** This step requires running Node.js code with `viem` to check wallet balance and interact with the blockchain. The workflow says "no npm, no build tools" for the frontend but requires a full Node.js environment for the build process itself. Not all coding agents come with Node.js. |
| 9.2 | HIGH | **Wallet capability assumption.** "If you (the agent) have wallet capabilities, use your own wallet. If not, you'll need the user to provide a wallet address." — Most agents do NOT have wallet capabilities. The fallback (asking a non-technical user to provide a crypto wallet address) is a massive barrier for the target audience ("a 12-year-old should be able to describe a hangman game"). |
| 9.3 | LOW | The USDC contract address (`0x036CbD53842c5426634e7929541eC2318f3dCF7e`) is hardcoded. If the USDC contract changes on Sepolia, this breaks silently. |

**Recommendation:** The wallet/crypto requirement is the single biggest friction point in the entire workflow. Consider having bld402 itself provide a managed wallet service, or make the faucet return a temporary wallet that the agent can use without the user ever seeing private keys.

---

## Step 10: Provision Project
**Phase:** implement | **Verdict:** Well-documented but complex

| # | Severity | Finding |
|---|----------|---------|
| 10.1 | HIGH | **x402 payment complexity.** The payment flow requires 5 npm packages (`viem`, `viem/accounts`, `@x402/fetch`, `@x402/evm`, `@x402/core`), wallet management (private key), and EIP-712 signing. This is a significant capability gap for agents that don't support npm or crypto operations. If the agent can't do this, the ENTIRE workflow fails. |
| 10.2 | HIGH | **The `toClientEvmSigner` gotcha is a design smell.** The fact that the documentation needs a large red warning box about passing `account` vs `walletClient` indicates the API is confusing. The docs even say "the resulting signed payment silently fails" — meaning the agent might not get a clear error, just a mysterious 402 loop. |
| 10.3 | MEDIUM | The response example shows `api_url` is not actually returned by the API — the agent must know to set it to `https://api.run402.com` from the step documentation. If an agent doesn't read the instructions carefully, it might not set this. |

**No blocking issues if the agent has Node.js and npm, but a significant fraction of agents won't.**

---

## Step 11: Create Database Tables
**Phase:** implement | **Verdict:** Sound with timing fragility

| # | Severity | Finding |
|---|----------|---------|
| 11.1 | MEDIUM | **Schema reload delay (100-500ms) is fragile.** Production systems shouldn't rely on magic delays. A retry-with-backoff pattern would be more robust: "Query the table, if 404, wait 500ms, retry up to 3 times." |
| 11.2 | LOW | The verify endpoint (`GET /admin/v1/projects/{id}/schema`) is mentioned but no example response is shown. An agent wouldn't know what to check for in the response. |
| 11.3 | LOW | No guidance on maximum SQL statement size or number of tables. Could hit limits on complex apps. |

**No blocking issues.**

---

## Step 12: Configure Row-Level Security
**Phase:** implement | **Verdict:** Limited RLS templates

| # | Severity | Finding |
|---|----------|---------|
| 12.1 | HIGH | **Missing `public_read_authenticated_write` pattern.** Only 3 templates exist: `public_read`, `public_read_write`, `user_owns_rows`. But a common pattern (blog, forum, leaderboard) is "anyone can read, only authenticated users can write." The Micro-Blog template needs exactly this. Without it, the agent must either use `public_read_write` (insecure — anonymous writes) or write custom RLS policies (not taught in this step). |
| 12.2 | MEDIUM | No guidance on custom RLS policies. If the 3 templates don't fit, the agent is stuck. Step 12 only teaches the template approach, never raw SQL policies. |

**Recommendation:** Add a `public_read_authenticated_write` template, or document how to write custom RLS via the SQL endpoint as a fallback.

---

## Step 13: Generate Frontend Code
**Phase:** implement | **Verdict:** CRITICAL bug

| # | Severity | Finding |
|---|----------|---------|
| 13.1 | **CRITICAL** | **Wrong API URL.** The code example shows `API_URL: 'https://run402.com'` but the correct URL is `https://api.run402.com` (with `api.` subdomain). Step 10 correctly returns `api_url: "https://api.run402.com"`. Every API call in the generated frontend would fail with this wrong URL. This is the most severe bug in the entire workflow. |
| 13.2 | MEDIUM | The code patterns use `await` at the top level (`const todos = await api(...)`) which only works in ES modules (`<script type="module">`). Standard `<script>` tags don't support top-level await. If the agent generates a standard `<script>` tag with these patterns, the app will fail with a syntax error. |
| 13.3 | LOW | No mention of CORS considerations. If the run402 API doesn't set appropriate CORS headers for the deployment domain, fetch calls will fail. (Likely handled by run402, but worth mentioning.) |

**This step MUST be fixed. The wrong API URL will cause 100% of generated apps to fail.**

---

## Step 14: Verify Code
**Phase:** implement | **Verdict:** Propagated CRITICAL bug

| # | Severity | Finding |
|---|----------|---------|
| 14.1 | **CRITICAL** | **Wrong URL in checklist.** The verification checklist says "Is `API_URL` set to `https://run402.com`?" — propagating the wrong URL from Step 13. Should say `https://api.run402.com`. This means the verification step would PASS code that will FAIL in production. |
| 14.2 | MEDIUM | "Test mentally or in a browser if possible" is vague. There's no automated testing. For complex apps, mental code review by an AI agent is unreliable. Consider adding a structured test: "Make a GET request to `/rest/v1/{first_table}` with the anon_key and verify you get a 200 response." |
| 14.3 | LOW | The banned-words list is good but might be too aggressive. Words like "database" appear in error messages from the run402 API itself. The agent can't control what the API returns. |

**The checklist is actively verifying the WRONG value. Must fix.**

---

## Step 15: Deploy to run402
**Phase:** deploy | **Verdict:** Well-designed

| # | Severity | Finding |
|---|----------|---------|
| 15.1 | MEDIUM | **No budget check before deploy.** Each deployment costs $0.05. After the initial deploy, the iterate loop (Steps 17-19) burns $0.05 per cycle with no budget awareness. The faucet only gives $0.25/24h, so the user gets stuck after 3 deploys. |
| 15.2 | LOW | The smoke-test gate is good but relies on the agent being able to make HTTP requests to the deployed URL. Some agents might not be able to fetch external URLs. |

**No blocking issues.**

---

## Step 16: Confirm Deployment
**Phase:** deploy | **Verdict:** Sound

No faults found. Pure communication step, well-written messaging for both subdomain and fallback scenarios.

---

## Step 17: Gather Feedback
**Phase:** iterate | **Verdict:** Sound

| # | Severity | Finding |
|---|----------|---------|
| 17.1 | LOW | `discard: ["deployment_id"]` is premature. The subdomain reassignment in Step 19 doesn't need the old deployment_id (it only needs the new one), but discarding it removes the ability to reference or roll back to the previous deployment. |

**No blocking issues.**

---

## Step 18: Apply Changes
**Phase:** iterate | **Verdict:** Missing cost awareness

| # | Severity | Finding |
|---|----------|---------|
| 18.1 | HIGH | **No cost warning.** Each iteration costs $0.05 for redeployment. After 2-3 iterations on testnet, the wallet is empty. No guidance to batch multiple changes into a single deployment to conserve funds. |
| 18.2 | MEDIUM | `discard: ["deployment_url"]` in the memory directive means the agent loses the current live URL before generating the new one. If Step 19 fails, there's no record of where the old version lives. Should carry forward until the new URL is confirmed. |

**No blocking issues, but budget exhaustion will hit users who iterate frequently.**

---

## Step 19: Redeploy
**Phase:** iterate | **Verdict:** Sound

| # | Severity | Finding |
|---|----------|---------|
| 19.1 | MEDIUM | No mention that each redeploy costs $0.05. Combined with the iterate loop back to Step 17, this is an unbounded cost loop with no budget check. |

**No blocking issues.**

---

## Step 20: Done
**Phase:** iterate | **Verdict:** Sound with minor URL bug

| # | Severity | Finding |
|---|----------|---------|
| 20.1 | MEDIUM | The final memory snapshot stores `api_url: "https://run402.com"` (without `api.`). When resuming from this memory, the agent will use the wrong API URL, causing all API calls to fail. Should be `https://api.run402.com`. |
| 20.2 | LOW | The renewal/upgrade endpoints are mentioned but no x402 payment code is shown. An agent would need to re-implement the payment flow from Step 10. |

**The URL issue is a repeat of the Step 13 bug.**

---

## Step 21: Share Feedback with Devs
**Phase:** iterate | **Verdict:** Will fail for ALL external users

| # | Severity | Finding |
|---|----------|---------|
| 21.1 | **CRITICAL** | **AWS Secrets Manager dependency.** The step instructs agents to fetch a Telegram bot token via `aws secretsmanager get-secret-value --profile kychee`. External agents on users' machines will NOT have AWS credentials configured with the kychee profile. This will fail 100% of the time for actual bld402 users. |
| 21.2 | HIGH | **Hardcoded Telegram chat_id.** The chat_id `-5159819495` is a private group. If this group is deleted or the ID changes, the step silently breaks. |
| 21.3 | HIGH | **Security risk.** Having random AI agents send messages to your Telegram group is an abuse vector. No rate limiting, no authentication, no content validation. An adversarial user could spam the group. |
| 21.4 | MEDIUM | The step uses `curl` which may not be available on all platforms (Windows without WSL/Git Bash). |

**Recommendation:** Replace the AWS/Telegram mechanism with a simple `POST https://api.run402.com/v1/feedback` endpoint that handles the Telegram forwarding server-side. This is what the skill version does.

---

## Cross-Cutting Issues

### 1. API URL Inconsistency (CRITICAL)

Steps 10 and 15 correctly use `https://api.run402.com`. Steps 13, 14, and 20 incorrectly reference `https://run402.com` (without `api.`). This inconsistency means:
- All generated frontend code will have the wrong API URL
- The verification checklist will validate the wrong value
- Resumed sessions will use the wrong URL

**Impact:** 100% of generated apps will fail to make API calls.

**Fix:** Search-and-replace `https://run402.com` with `https://api.run402.com` in Steps 13 (`API_URL` in code example), Step 14 (verification checklist), and Step 20 (memory snapshot).

### 2. Budget Exhaustion (HIGH)

The iterate loop (Steps 17 → 18 → 19 → 17) costs $0.05 per cycle. Faucet gives $0.25 once per 24h. After project creation ($0.10) and initial deploy ($0.05), only $0.10 remains — enough for exactly 2 more iterations. No step in the workflow tracks or warns about remaining funds.

**Fix:** Add budget tracking. Before each deployment, check wallet balance. If < $0.05, warn the user and suggest batching changes.

### 3. Wallet Barrier (HIGH)

The target audience is non-technical ("a 12-year-old should be able to describe a hangman game"). But the workflow requires:
- Generating a crypto wallet (or the user providing one)
- Managing a private key
- Understanding Base Sepolia testnet
- Running Node.js with 5+ npm packages for EIP-712 signing

This creates a massive gap between the stated goal and actual implementation. The x402 payment system is elegant for developer-to-developer APIs but extremely heavyweight for a "no code, no signup" product.

**Fix:** Consider a bld402-managed wallet service: the agent calls `POST /v1/bld402/session` which returns a temporary wallet pre-funded with testnet USDC. No private keys, no npm packages, no crypto knowledge needed.

### 4. Memory Model Fragility (MEDIUM)

The carry_forward/store/discard memory system is well-designed for Claude Code (which has explicit memory management). But many agents (Cursor, Copilot, Windsurf) don't have structured memory. They rely on conversation context, which is lossy. The memory directives are effectively no-ops on these agents.

**Mitigation:** The skill version (SKILL.md) puts all critical information in the workflow text itself rather than relying on structured memory directives.

### 5. Template Availability Mismatch (MEDIUM)

The workflow advertises 13 templates but only 6 are actually built. An agent that matches to an unbuilt template (micro-blog, photo-wall, flash-cards, etc.) will hit a 404 when trying to fetch template files.

**Fix:** Either build the remaining templates or remove unbuilt ones from the matching list in Step 2.

### 6. Step 21 AWS Dependency (CRITICAL for external users)

The feedback mechanism requires AWS Secrets Manager access with a specific IAM profile. This only works inside the Kychee development environment. For any actual bld402 user, Step 21 will fail silently or noisily.

**Fix:** Create a public feedback API endpoint on run402.

---

## Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| CRITICAL | 3 | Wrong API URL in Steps 13/14/20; AWS dependency in Step 21 |
| HIGH | 7 | Missing services in Step 5; Deployment cost not mentioned in Step 6; Wallet barrier in Step 9; x402 complexity in Step 10; Missing RLS template in Step 12; Budget exhaustion in iterate loop; Step 21 security |
| MEDIUM | 12 | Template count mismatch; lossy memory discards; schema reload delay; top-level await; budget tracking; etc. |
| LOW | 10 | Minor UX polish, hardcoded addresses, rendering bugs |

**The single most important fix:** Correct the API URL from `https://run402.com` to `https://api.run402.com` in Steps 13, 14, and 20. This is a one-line fix that prevents 100% of generated apps from failing.

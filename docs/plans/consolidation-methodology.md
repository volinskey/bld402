# Build Methodology: bld402 vs run402

> Created: 2026-03-16
> Purpose: Document what bld402's build methodology adds over raw run402, so nothing valuable is lost during MCP consolidation.

## Decision

**bld402-mcp is being consolidated into run402-mcp.** bld402.com remains as a friendly website layer pointing users to install run402-mcp. The build methodology documented here is preserved for potential future addition to run402.

## Methodology Comparison

| Capability | bld402 | run402 |
|---|---|---|
| **Guided workflow** | 21 steps across 5 phases (`agent.json`, `build/step/*.html`) | None — agents read `llms.txt` and use MCP tools directly |
| **Spec-plan-implement-deploy-iterate loop** | Yes — SKILL.md phases with user checkpoints | `/deploy` command (lint→commit→CI/CD→health→E2E) — no user checkpoints |
| **Template system** | 13 templates with `schema.sql`, `rls.json`, `index.html`, `README.md` each | App gallery (forkable published apps) — no guided template flow |
| **Guardrails** | CAN/CANNOT lists, banned words, design rules (`guardrails.html`) | None |
| **Non-technical language enforcement** | Banned word list, friendly error messages, no jargon in app UI | None — developer-oriented language |
| **Validation test suite** | 76 system tests (Cycle 7), Gate 2 build-from-scratch for all 13 templates | E2E lifecycle test (26 steps), unit tests, OpenClaw integration test |
| **Error recovery guidance** | Plain-language error messages, recovery suggestions | Technical error codes and messages |
| **Session resume** | `bld402_project` memory object, resume at specific step | No session concept — stateless wallet auth |
| **Budget awareness** | Tracks faucet balance, warns before exhaustion | No budget tracking for agents |

## What bld402 Adds (Unique Value)

1. **User-facing simplicity**: The human never sees databases, API keys, wallets, or infrastructure. Everything is abstracted behind "describe what you want → get a live URL."

2. **Agent teaching**: The 936-line SKILL.md teaches agents how to build apps step-by-step with code examples, auth patterns, and API reference. run402's llms.txt is comprehensive but developer-oriented.

3. **Template-driven development**: Pre-built templates with schema, RLS, HTML, and README make it possible to deploy a working app in one step. run402's app gallery requires forking a published version.

4. **Guardrails**: Explicit lists of what's possible and impossible prevent agents from attempting features that will fail (WebSocket, custom domains, OAuth, etc.).

5. **Validation methodology**: The plan/implement/test cycle with red team/blue team testing, system test documents, and Gate 2 build-from-scratch validation is more rigorous than run402's E2E tests.

## What We're Doing Now

- **Initially IGNORE** the bld402 methodology and test with straight run402-mcp
- If run402-mcp proves insufficient for non-technical users, **ADD** bld402 ideas to run402:
  - Template system → run402 app gallery improvements
  - Guardrails → run402 llms.txt additions
  - Guided workflow → run402 MCP tool orchestration
  - Validation methodology → run402 test infrastructure

## Key Insight

The bld402 methodology is about **how best to implement** — not about **what kind of user** is implementing. This means it can live in run402 regardless of whether the user is technical or not.

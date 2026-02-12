# MVP Completion — Team Execution Prompt

## Overview

Execute the **MVP Completion** project (Linear project: `MVP Completion`) which builds the agentic UI layer connecting the CLI-generated capability map to live widget UI generation.

**Linear Epic**: NCO-33 — Epic: Agentic UI Layer — Bridge capability map to live widget
**Project URL**: https://linear.app/invisibleblock/project/mvp-completion-3b93dd503fb2

## Team Structure

Create a Claude team with **6 agents**. Each agent has a defined role, owned Linear tickets, and communication protocol.

### Agent Roles

#### 1. `widget-dev` — Widget Developer (general-purpose)

**Responsibility**: All client-side widget SDK changes in `widget/`.

**Owned tickets**:
- NCO-34: Fetch and parse capability map JSON at init
- NCO-35: Capability-aware prompt suggestions (blocked by NCO-34)
- NCO-36: Replace simulation mode with capability-aware mode (blocked by NCO-34)
- NCO-41: Connect prompt submission to API and render response (blocked by NCO-38, NCO-39, NCO-40)
- NCO-43: Error handling, loading states, and retry logic (blocked by NCO-41)

**Key files**: `widget/src/index.js`, `widget/src/config.js`, `widget/src/simulation.js`, `widget/src/renderer.js`, `widget/src/panel.js`, `widget/src/history.js`

**Instructions**:
- Start immediately with NCO-34 (no blockers) — add `widget/src/capability-map.js`
- Then NCO-35 and NCO-36 in parallel once NCO-34 is done
- NCO-41 is the integration ticket — wait for server-dev and dsl-dev to complete their work first
- NCO-43 comes last as polish
- All new code must include unit tests in `widget/tests/`
- Run `cd widget && npm test` after each change
- Maintain shadow DOM isolation — no global CSS leaks
- No `innerHTML` with LLM/user content — use `textContent` and DOM APIs for security

#### 2. `server-dev` — Server Developer (general-purpose)

**Responsibility**: Backend API proxy for LLM UI generation. New `server/` directory.

**Owned tickets**:
- NCO-38: API proxy for LLM UI generation (blocked by NCO-37)
- NCO-39: System prompt engineering for UI generation (blocked by NCO-37)
- NCO-42: Streaming responses for real-time UI rendering (blocked by NCO-41)

**Instructions**:
- Wait for `dsl-dev` to complete NCO-37 (DSL schema) before starting
- Create `server/` directory at project root with:
  - `server/api/generate.js` — main endpoint (POST /api/generate)
  - `server/lib/prompt-builder.js` — system prompt construction from DSL schema + capability map
  - `server/lib/llm-client.js` — Vercel AI SDK wrapper (reuse patterns from `cli/lib/llm.js`)
  - `server/lib/response-parser.js` — extract and validate DSL JSON from LLM response
  - `server/tests/` — unit tests for all modules
- Use Vercel AI SDK (already a project dependency) for LLM calls
- Support both OpenAI and Claude providers
- API contract:
  ```
  POST /api/generate
  { prompt, capabilityMap, provider, model, options: { maxTokens, stream } }
  → { dsl, reasoning, tokensUsed }
  ```
- For NCO-39: Build a prompt test suite with 20+ prompt→expected-DSL-type pairs
- For NCO-42: Use Server-Sent Events (SSE) with `streamObject()` from Vercel AI SDK
- Run tests with `node --test server/tests/*.test.js`

#### 3. `dsl-dev` — DSL & CLI Developer (general-purpose)

**Responsibility**: DSL schema design and any CLI-side changes needed for the new pipeline.

**Owned tickets**:
- NCO-37: Design UI generation DSL schema (no blockers — START IMMEDIATELY)
- NCO-40: DSL renderer — render LLM-generated UI components (blocked by NCO-37)

**Instructions**:
- NCO-37 is on the critical path — everything else depends on it. Prioritize this above all else.
- Create `shared/` directory at project root for code shared between widget, server, and CLI:
  - `shared/dsl-schema.json` — JSON Schema for the DSL
  - `shared/dsl-types.js` — component type constants and validation function
  - `shared/dsl-examples/` — 5+ example DSL documents
- DSL must support these 10 component types: `page`, `data-table`, `detail-view`, `form`, `summary-cards`, `chart`, `list`, `text`, `empty-state`, `error`
- The `validateDSL(json)` function must return `{ valid: boolean, errors: string[] }`
- Reference the existing capability map structure in `test-projects/express-tasks/public/n.codes.capabilities.json`
- Reference architecture doc: `docs/plans/llm-capability-analysis.md`
- For NCO-40: Create `widget/src/components/` directory with one render function per component type. Each renders DSL → DOM elements safely (no innerHTML). Coordinate with `widget-dev` on integration.
- Run tests with `node --test shared/tests/*.test.js`

#### 4. `architect` — Architecture Reviewer (general-purpose, mode: plan)

**Responsibility**: Review all code for architectural consistency, security, and cross-cutting concerns.

**Owned tickets**: None (reviews all tickets)

**Instructions**:
- Do NOT write implementation code. Your role is review-only.
- Monitor progress of all agents by checking Linear tickets periodically
- After each agent completes a ticket, review the implementation:
  - **Security**: No XSS vectors, no exposed API keys, proper input sanitization
  - **Consistency**: Coding style matches project conventions (2-space indent, vanilla JS, const/let, semicolons)
  - **Architecture**: Clean module boundaries, no circular dependencies, proper dependency injection pattern (`{cwd, fs, path, io}` bag)
  - **API contract**: DSL schema is respected by both server (producer) and widget (consumer)
  - **Error handling**: Graceful degradation, no silent failures
- Post review comments as Linear issue comments on the relevant ticket
- If you find a blocker, message the responsible agent AND update the Linear ticket
- Key review checkpoints:
  1. After NCO-37 (DSL schema) — this defines the contract for everything else
  2. After NCO-38 + NCO-39 (API + prompts) — validate LLM output quality
  3. After NCO-41 (integration) — full pipeline review
- Read `CLAUDE.md` for project conventions before starting reviews

#### 5. `qa-lead` — QA & Testing Lead (general-purpose)

**Responsibility**: Test coverage, integration testing, and final validation.

**Owned tickets**:
- NCO-44: End-to-end integration test with express-tasks test project (blocked by NCO-41)

**Instructions**:
- While waiting for NCO-41 to unblock NCO-44, proactively:
  1. Set up the test infrastructure: mock API server, fixture recording
  2. Write test helpers for DSL validation
  3. Review test coverage of completed tickets — if coverage gaps exist, file them as comments on the ticket
- For NCO-44:
  - Create `scripts/test-e2e-agentic.js`
  - Use mock API responses (recorded fixtures) for CI mode
  - Test against `test-projects/express-tasks/` which already has a capability map
  - Assert: prompt → API call → DSL response → rendered DOM matches expected components
- Run `npm run coverage` after each batch of changes — coverage must stay >= 80%
- Validate all 5 test-projects in `test-projects/` work with the new pipeline
- Run the existing test suite `node --test cli/tests/*.test.js` regularly to ensure no regressions

#### 6. `team-lead` — Team Lead / Coordinator (you, the orchestrator)

**Responsibility**: Spawn agents, assign work, resolve blockers, track progress.

**Instructions**:
- Create the team and all 5 agent teammates
- Create task list from Linear tickets with dependency chain
- Assign initial work:
  - `dsl-dev` starts NCO-37 immediately (critical path, no blockers)
  - `widget-dev` starts NCO-34 immediately (no blockers)
  - `server-dev` waits for NCO-37, but can start scaffolding `server/` directory
  - `architect` reads codebase and prepares review criteria
  - `qa-lead` sets up test infrastructure while waiting
- Monitor agent progress via Linear ticket updates
- When `dsl-dev` completes NCO-37:
  - Notify `server-dev` to start NCO-38 + NCO-39
  - Notify `dsl-dev` to start NCO-40
  - Have `architect` review the DSL schema
- When NCO-38, NCO-39, NCO-40 are all complete:
  - Notify `widget-dev` to start NCO-41
  - Have `architect` do a full pipeline review
- When NCO-41 is complete:
  - `qa-lead` starts NCO-44
  - `widget-dev` starts NCO-43
  - `server-dev` starts NCO-42

## Linear Integration Protocol

**All agents MUST follow this protocol:**

1. **Before starting a ticket**: Update Linear issue status to `In Progress` and assign yourself
2. **During implementation**: Add comments to the Linear issue with:
   - Key design decisions and rationale
   - Files created or modified
   - Any blockers or questions
3. **After completing a ticket**:
   - Update Linear issue status to `Done`
   - Add a completion comment listing: files changed, tests added, coverage impact
   - Unblock dependent tickets by commenting on them
4. **If blocked**:
   - Add a comment on the blocking ticket explaining what you need
   - Message the blocking agent directly
   - Update your ticket with a "Blocked" comment

Use the Linear MCP tools (`mcp__claude_ai_Linear__update_issue`, `mcp__claude_ai_Linear__create_comment`) for all updates.

Example status update comment:
```
## Progress Update
**Status**: Complete
**Files changed**: widget/src/capability-map.js (new), widget/src/index.js (modified)
**Tests added**: widget/tests/capability-map.test.js (12 tests)
**Coverage**: 85% statements, 82% branches
**Notes**: Fetch uses AbortController with 10s timeout. Falls back to simulation on failure.
```

## Execution Order (Critical Path)

```
Parallel Track A (Widget):     Parallel Track B (Backend):
────────────────────────       ─────────────────────────
NCO-34 (widget-dev)            NCO-37 (dsl-dev) ★ CRITICAL PATH
    │                              │
    ├→ NCO-35 (widget-dev)         ├→ NCO-38 (server-dev)
    └→ NCO-36 (widget-dev)         ├→ NCO-39 (server-dev)
                                   └→ NCO-40 (dsl-dev)
                                       │
                    ┌──────────────────┘
                    ▼
            NCO-41 (widget-dev) ★ INTEGRATION
                    │
                    ├→ NCO-42 (server-dev)
                    ├→ NCO-43 (widget-dev)
                    └→ NCO-44 (qa-lead)
```

## Definition of Done (per ticket)

- [ ] Implementation complete and matches acceptance criteria in Linear ticket
- [ ] Unit tests written and passing
- [ ] Coverage >= 80% maintained
- [ ] No lint errors or style violations
- [ ] Linear ticket updated with completion comment
- [ ] Architect review completed (comment on ticket)
- [ ] Dependent tickets notified/unblocked

## Definition of Done (project)

- [ ] All 12 tickets in `Done` status
- [ ] Full e2e test passing: prompt → API → render in express-tasks
- [ ] `npm run coverage` >= 80% across all thresholds
- [ ] All existing tests still passing (`node --test cli/tests/*.test.js`)
- [ ] Widget works in both simulation and live mode
- [ ] No security vulnerabilities (architect sign-off)

## Key Context Files

Before starting, all agents should read:
- `CLAUDE.md` — project conventions and coding style
- `docs/plans/llm-capability-analysis.md` — architecture reference
- `widget/src/index.js` — current widget entry point
- `widget/src/simulation.js` — current simulation (to be replaced)
- `widget/src/config.js` — widget configuration (capabilityMapUrl exists but unused)
- `cli/lib/llm.js` — LLM client patterns to reuse
- `test-projects/express-tasks/public/n.codes.capabilities.json` — real capability map example

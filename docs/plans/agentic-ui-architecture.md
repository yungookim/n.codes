# Agentic UI Architecture

## Principle

n.codes MUST NOT use pre-defined templates or component types. The AI generates complete HTML/CSS/JS from scratch for every prompt. The capability map is the contract between generated UI and host app APIs.

## Current State (being replaced)

```
Prompt → LLM → DSL JSON → Fixed renderers (10 component types) → DOM
```

## Target State

```
Prompt → Agentic Pipeline (multi-step LLM) → HTML/CSS/JS → Sandboxed iframe → Live UI
                                                  ↑
                                          Capability map provides
                                          API context + bindings
```

---

## Architecture Overview

### Server: Agentic Generation Pipeline

The server runs a multi-step LLM pipeline:

```
1. INTENT    — Parse user's request, determine what UI to build
2. GENERATE  — Write HTML/CSS/JS that uses ncodes.query()/ncodes.action() for data
3. REVIEW    — QA agent evaluates: correct API usage? accessible? renders properly?
4. ITERATE   — If review finds issues, feed back to generator (max 3 iterations)
5. RESOLVE   — Validate all API refs against capability map, attach resolved endpoints
```

### Widget: Sandbox Renderer

The widget renders generated code in a secure iframe:

```
1. Receive { html, css, js, apiBindings } from server
2. Create iframe with sandbox="allow-scripts" (no same-origin access)
3. Inject API bridge script (ncodes.query, ncodes.action)
4. Inject generated HTML/CSS/JS via srcdoc
5. Handle postMessage from iframe → proxy API calls to host app
```

---

## API Contract

### `POST /api/generate`

**Request:**
```json
{
  "prompt": "kanban board of tasks grouped by status",
  "provider": "openai",
  "model": "gpt-5.2",
  "conversationId": "optional-for-follow-ups"
}
```

**Response (success):**
```json
{
  "html": "<div class=\"kanban\">...</div>",
  "css": ".kanban { display: flex; gap: 1rem; } ...",
  "js": "const tasks = await ncodes.query('listTasks'); ...",
  "reasoning": "Created a 3-column kanban layout...",
  "apiBindings": [
    { "type": "query", "ref": "listTasks", "resolved": { "method": "GET", "path": "/tasks" } },
    { "type": "action", "ref": "createTask", "resolved": { "method": "POST", "path": "/tasks" } }
  ],
  "iterations": 2,
  "tokensUsed": { "prompt": 3200, "completion": 1800 }
}
```

**Response (clarifying question):**
```json
{
  "clarifyingQuestion": "Should the kanban board show all tasks or only tasks assigned to you?",
  "options": ["All tasks", "My tasks only"],
  "reasoning": "The request is ambiguous about scope..."
}
```

**Error responses:** Same pattern as current (4xx/5xx with error message).

### PostMessage Protocol (iframe ↔ parent)

**iframe → parent (API request):**
```json
{
  "type": "ncodes:api-request",
  "id": "req-123",
  "method": "query",
  "ref": "listTasks",
  "params": { "status": "todo" }
}
```

**parent → iframe (API response):**
```json
{
  "type": "ncodes:api-response",
  "id": "req-123",
  "data": [{ "id": 1, "title": "..." }],
  "error": null
}
```

**iframe → parent (action request):**
```json
{
  "type": "ncodes:api-request",
  "id": "req-456",
  "method": "action",
  "ref": "createTask",
  "data": { "title": "New task", "status": "todo" }
}
```

---

## API Bridge (injected into iframe)

The bridge script is injected before the generated JS. It provides:

```javascript
window.ncodes = {
  // Execute a query (GET data from host app)
  query(ref, params) → Promise<any>,

  // Execute an action (POST/PUT/DELETE on host app)
  action(ref, data) → Promise<any>,

  // Host app info from capability map
  app: { name, entities }
};
```

Implementation uses postMessage with request IDs for async responses.

---

## Server-Side Agentic Pipeline

### Step 1: Intent Understanding

System prompt focuses on parsing the user's request:
- What kind of UI? (dashboard, form, list, visualization, etc.)
- What data is needed? (match to capability map queries)
- What actions should be available? (match to capability map actions)
- Is the request clear enough or do we need to ask a question?

Output: structured intent object or a clarifying question.

### Step 2: Code Generation

System prompt instructs the LLM to write HTML/CSS/JS:
- Use modern, semantic HTML
- CSS should be self-contained (no external dependencies)
- JS uses `await ncodes.query(ref, params)` for data fetching
- JS uses `await ncodes.action(ref, data)` for mutations
- Must handle loading states, empty states, and errors
- Should be responsive and accessible
- Dark theme compatible (use CSS custom properties)

The prompt includes:
- The intent from Step 1
- The capability map (available queries, actions, entities with fields)
- The host app's theme variables (if provided)

### Step 3: QA Review

A second LLM call reviews the generated code:
- Does the HTML render the intended UI?
- Are all `ncodes.query()` and `ncodes.action()` refs valid capability map keys?
- Are loading/error states handled?
- Is the CSS responsive?
- Any XSS vectors or security issues?
- Does it match what the user asked for?

Output: PASS or list of issues to fix.

### Step 4: Iteration

If QA returns issues, feed back to the generator:
- Include the generated code + QA feedback
- Ask the LLM to fix the specific issues
- Re-run QA on the fixed version
- Max 3 iterations to prevent runaway costs

### Step 5: Resolution

Validate all `ncodes.query(ref)` and `ncodes.action(ref)` calls in the JS:
- Parse the JS for ncodes.query/action calls
- Look up each ref in the capability map
- Build the `apiBindings` array with resolved endpoints
- Reject if unknown refs are found

---

## Widget Sandbox Security

### iframe Sandbox Attributes

```html
<iframe sandbox="allow-scripts" srcdoc="..."></iframe>
```

This allows:
- JavaScript execution (needed for data fetching via bridge)

This blocks:
- Same-origin access (can't read parent DOM, cookies, localStorage)
- Form submission (must use ncodes.action() instead)
- Popups/navigation (no window.open, no top-level navigation)
- Plugins

### Trust Boundary

```
Generated code (untrusted) → postMessage → Parent widget (trusted) → fetch → Host app
```

The parent widget:
1. Validates the message origin (must be the iframe)
2. Validates the ref against the apiBindings whitelist
3. Makes the fetch call with appropriate credentials
4. Returns only the response data (no headers, no cookies exposed)

---

## File Changes

### Server (new/modified)

| File | Action | Description |
|------|--------|-------------|
| `server/lib/agentic-pipeline.js` | NEW | Multi-step LLM orchestration |
| `server/lib/intent-prompt.js` | NEW | Intent understanding system prompt |
| `server/lib/codegen-prompt.js` | NEW | Code generation system prompt |
| `server/lib/review-prompt.js` | NEW | QA review system prompt |
| `server/lib/code-parser.js` | NEW | Extract HTML/CSS/JS from LLM response |
| `server/lib/ref-extractor.js` | NEW | Parse JS for ncodes.query/action refs |
| `server/api/generate.js` | MODIFY | Use agentic pipeline instead of single LLM call |
| `server/api/proxy.js` | NEW | API proxy for widget to call host app (CORS) |

### Widget (new/modified)

| File | Action | Description |
|------|--------|-------------|
| `widget/src/sandbox.js` | NEW | iframe sandbox creation + srcdoc injection |
| `widget/src/api-bridge.js` | NEW | Bridge script injected into iframe |
| `widget/src/message-handler.js` | NEW | postMessage handler + API proxy |
| `widget/src/renderer.js` | MODIFY | Replace DSL rendering with sandbox rendering |
| `widget/src/index.js` | MODIFY | Wire new rendering path |
| `widget/src/components/` | DELETE | Remove all predefined component renderers |
| `widget/src/data-client.js` | DELETE | Replaced by message-handler |

### Shared

| File | Action | Description |
|------|--------|-------------|
| `shared/dsl-schema.json` | DEPRECATE | No longer needed (keep for backward compat) |
| `shared/dsl-types.js` | DEPRECATE | No longer needed |

---

## Task Breakdown

### Task 1: API Contract & Bridge Protocol
- Owner: backend + frontend (coordinate)
- Define request/response format
- Define postMessage protocol
- Define bridge API surface

### Task 2: Server — Agentic Pipeline
- Owner: backend
- Implement intent → generate → review → iterate loop
- New prompt templates for HTML/CSS/JS generation
- Code parser for extracting HTML/CSS/JS from LLM output
- Ref extractor for validating API usage

### Task 3: Server — API Proxy
- Owner: backend
- `POST /api/proxy` endpoint
- Validates ref against capability map
- Proxies request to host app with resolved endpoint
- Returns response data only

### Task 4: Widget — Sandbox Renderer
- Owner: frontend
- iframe creation with sandbox attributes
- srcdoc assembly (bridge + generated code)
- Cleanup on panel close / new generation

### Task 5: Widget — Message Handler
- Owner: frontend
- postMessage listener for API requests from iframe
- Ref validation against apiBindings whitelist
- Fetch proxy to host app
- Response relay back to iframe

### Task 6: Widget — Entry Point Update
- Owner: frontend
- Replace DSL rendering path with sandbox rendering
- Handle clarifying questions (show in panel UI)
- Handle iteration status (show progress)

### Task 7: Integration Testing
- Owner: QA
- End-to-end test with express-tasks
- Test: "show all tasks" → HTML table with live data
- Test: "create task form" → form that submits to API
- Test: "kanban board" → custom layout with grouped data
- Security: verify iframe can't access parent DOM

### Task 8: Architecture Review
- Owner: architecture
- Review API contract adherence
- Review sandbox security model
- Review prompt engineering quality
- Provide feedback to backend + frontend

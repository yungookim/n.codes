# Feasibility Check for the Generative Backend

## Context

The agentic pipeline (`server/lib/agentic-pipeline.js`) runs 5 steps: intent → codegen → review → iterate → resolve. The intent step already maps user prompts to capability map refs (queries/actions), but there's no validation between intent and codegen. If the LLM hallucinated refs or the request can't be fulfilled by the capability map, the pipeline proceeds to expensive codegen/review/iterate steps anyway — wasting 2-5 LLM calls and returning broken or useless UI.

**Goal**: Add a deterministic (no-LLM) feasibility check after the intent step that validates refs against the capability map and returns early with helpful suggestions when the request can't be fulfilled.

---

## Approach

Insert a pure-JS feasibility check between the intent and codegen steps. When refs are invalid, return the result as a `clarifyingQuestion`-shaped response — the widget already handles this with a message + clickable option buttons, so **no widget rendering changes are needed**.

### Pipeline flow after the change

```
Intent (LLM) → Feasibility (pure JS, new) → Codegen (LLM) → Review → Iterate → Resolve
                     ↓ (if not feasible)
              Return clarifyingQuestion-shaped response
              with suggestions of what the app CAN do
```

---

## Implementation Steps

### 1. Create `server/lib/feasibility-check.js` (new file)

Exports:

- **`checkFeasibility(intent, capabilityMap)`** — validates intent refs against the map
  - No capability map → `{ feasible: true }` (skip check)
  - Intent has no queries/actions → `{ feasible: true }` (visual-only request)
  - All refs valid → `{ feasible: true }`
  - Any refs invalid → `{ feasible: false, invalidRefs, suggestion }` with available capabilities
  - Reuses `lookupRef()` from `server/lib/capability-resolver.js` (line 38) for ref validation

- **`buildNotFeasibleResponse(feasibilityResult, capabilityMap)`** — builds a `clarifyingQuestion`-shaped response
  - Message explains what's not supported
  - Options list up to 4 alternatives from available capabilities (queries prioritized over actions)
  - Includes `feasibility` metadata field for optional widget differentiation later

- **`humanizeRef(name)`** — converts camelCase to readable text (e.g., `listTasks` → `list tasks`)

### 2. Modify `server/lib/agentic-pipeline.js` (~12 lines)

- Add import: `const { checkFeasibility, buildNotFeasibleResponse } = require('./feasibility-check');`
- Insert between the clarification check (line 265) and codegen step (line 268):

```js
// Step 1.5: Feasibility check (no LLM cost)
reportStep('feasibility', 'started');
const feasibility = checkFeasibility(intent, capabilityMap);
reportStep('feasibility', 'completed');

if (!feasibility.feasible) {
  const notFeasible = buildNotFeasibleResponse(feasibility, capabilityMap);
  return { ...notFeasible, tokensUsed: totalTokens };
}
```

The return shape `{ clarifyingQuestion, options, reasoning, tokensUsed }` matches the existing clarification path, so `server/api/generate.js` handles it automatically (line 91-96 maps to `STATUS.CLARIFICATION`).

### 3. Update `server/lib/job-store.js` (1 line)

Add `'feasibility'` to the `STEPS` array:
```js
const STEPS = ['intent', 'feasibility', 'codegen', 'review', 'iterate', 'resolve'];
```

### 4. Update `widget/src/index.js` (1 line)

Add feasibility entry to `STEP_MESSAGES` (line 278):
```js
feasibility: 'Checking what this app can do...',
```

### 5. Create `server/tests/feasibility-check.test.js` (new file)

Test cases (~15):

**checkFeasibility:**
- Returns feasible when capability map is null
- Returns feasible when intent has no queries/actions (visual-only)
- Returns feasible when all refs exist in the map
- Returns not feasible with invalid query refs
- Returns not feasible with invalid action refs
- Returns not feasible when mix of valid and invalid refs
- Returns available capabilities in `suggestion`
- Handles empty queries/actions objects in capability map

**buildNotFeasibleResponse:**
- Builds question mentioning invalid data sources
- Builds question mentioning invalid actions
- Options limited to 4, queries prioritized over actions
- Includes `feasibility` metadata object
- Returns empty options when no capabilities available

**humanizeRef:**
- Converts camelCase to spaced lowercase

### 6. Update `server/tests/job-store.test.js` (1 line)

Update the STEPS assertion at line 140 to include `'feasibility'`.

---

## Files Summary

| File | Type | Change |
|------|------|--------|
| `server/lib/feasibility-check.js` | NEW | Core feasibility logic + response builder |
| `server/lib/agentic-pipeline.js` | MODIFY | ~12 lines: import + feasibility step |
| `server/lib/job-store.js` | MODIFY | 1 line: add 'feasibility' to STEPS |
| `widget/src/index.js` | MODIFY | 1 line: add step message |
| `server/tests/feasibility-check.test.js` | NEW | ~15 test cases |
| `server/tests/job-store.test.js` | MODIFY | 1 line: update STEPS assertion |

**Reused existing code:**
- `lookupRef()` from `server/lib/capability-resolver.js` — ref validation with prototype pollution guard
- Clarification result shape from `server/lib/agentic-pipeline.js` — `{ clarifyingQuestion, options, reasoning }`
- `STATUS.CLARIFICATION` from `server/lib/job-store.js` — no new status needed
- Widget's `showClarifyingQuestion()` from `widget/src/index.js` — handles display automatically

**No changes needed to:**
- `server/api/generate.js` — existing clarification handling covers this
- `widget/src/api-client.js` — polling already handles clarification status
- `server/lib/intent-prompt.js` — intent step behavior unchanged
- `server/lib/capability-resolver.js` — reused as-is

---

## Verification

1. **Unit tests**: `node --test server/tests/feasibility-check.test.js`
2. **Full server test suite**: `node --test server/tests/*.test.js`
3. **Widget tests**: `cd widget && npm test` (STEP_MESSAGES not tested separately, but build should pass)
4. **Coverage**: `npm run coverage` from project root (must stay above 80%)
5. **Manual test scenario**: Send a prompt like "Show me all payments" to a task-management app's API — should return a clarification response with task-related suggestions instead of generating broken UI

'use strict';

/**
 * Build the system prompt for the intent-understanding step.
 * Parses the user's request and determines what UI to build,
 * what data is needed, and what actions should be available.
 */

/**
 * Format capability map into a concise context string for the intent step.
 *
 * @param {object} capabilityMap
 * @returns {string}
 */
function formatCapabilityContext(capabilityMap) {
  if (!capabilityMap) return 'No capability map available.';

  const parts = [];

  if (capabilityMap.project) {
    parts.push(`Application: ${capabilityMap.project}`);
  }

  const queries = Object.entries(capabilityMap.queries || {});
  if (queries.length > 0) {
    const lines = queries.map(([name, val]) =>
      `  - ${name}: ${val.description || val.endpoint}`
    );
    parts.push(`Available Queries:\n${lines.join('\n')}`);
  }

  const actions = Object.entries(capabilityMap.actions || {});
  if (actions.length > 0) {
    const lines = actions.map(([name, val]) =>
      `  - ${name}: ${val.description || val.endpoint}`
    );
    parts.push(`Available Actions:\n${lines.join('\n')}`);
  }

  const entities = Object.entries(capabilityMap.entities || {});
  if (entities.length > 0) {
    const lines = entities.map(([name, val]) => {
      const fields = Array.isArray(val.fields) ? val.fields.join(', ') : '';
      return `  - ${name} (${fields}): ${val.description || ''}`;
    });
    parts.push(`Entities:\n${lines.join('\n')}`);
  }

  return parts.join('\n\n');
}

/**
 * Build the intent system prompt.
 *
 * @param {object|null} capabilityMap
 * @returns {string}
 */
function buildIntentPrompt(capabilityMap) {
  const capCtx = formatCapabilityContext(capabilityMap);

  return `You are an intent parser for a UI generation system. Your job is to analyze the user's request and produce a structured intent object.

## Application Context

${capCtx}

## Your Task

Given the user's prompt, determine:
1. What kind of UI to build (table, form, dashboard, kanban, chart, detail view, list, etc.)
2. Which queries from the capability map are needed to fetch data
3. Which actions from the capability map should be available to the user
4. Whether the request is clear enough to proceed

## Output Format

Respond with ONLY a JSON object (no markdown, no explanation):

If the request is clear:
{
  "type": "intent",
  "uiType": "table|form|dashboard|kanban|chart|detail|list|custom",
  "description": "Brief description of what to build",
  "queries": ["queryRef1", "queryRef2"],
  "actions": ["actionRef1"],
  "entityFocus": "primary entity name or null",
  "requirements": ["specific requirement 1", "specific requirement 2"]
}

If the request is ambiguous and needs clarification:
{
  "type": "clarification",
  "question": "What would you like to clarify?",
  "options": ["Option A", "Option B"],
  "reasoning": "Why this needs clarification"
}

## Rules
- Only reference queries and actions that exist in the capability map
- If no queries or actions match, use empty arrays
- Keep descriptions concise
- Prefer asking for clarification over guessing when the request is truly ambiguous
- For common patterns (e.g., "show tasks"), do NOT ask for clarification — just build it`;
}

module.exports = {
  buildIntentPrompt,
  formatCapabilityContext
};

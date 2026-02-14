'use strict';

const fs = require('fs');
const path = require('path');

const EXAMPLES_DIR = path.join(__dirname, '..', '..', 'shared', 'dsl-examples');
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'shared', 'dsl-schema.json');

/**
 * Load DSL schema from shared/dsl-schema.json.
 * @returns {object} Parsed DSL schema
 */
function loadDSLSchema() {
  const raw = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Load all DSL examples from shared/dsl-examples/*.json.
 * @returns {Array<{name: string, dsl: object}>}
 */
function loadDSLExamples() {
  const files = fs.readdirSync(EXAMPLES_DIR).filter(f => f.endsWith('.json'));
  return files.map(file => {
    const raw = fs.readFileSync(path.join(EXAMPLES_DIR, file), 'utf-8');
    return {
      name: file.replace('.json', ''),
      dsl: JSON.parse(raw)
    };
  });
}

/**
 * Format capability map context for inclusion in the system prompt.
 * Accepts the canonical capability map format:
 *   { project, actions: { name: { endpoint, description } }, queries: { ... }, entities: { name: { fields, description } } }
 *
 * @param {object|null} capabilityMap - Parsed capability map JSON
 * @returns {string} Formatted capability context
 */
function formatCapabilityContext(capabilityMap) {
  if (!capabilityMap) return '';

  const sections = [];

  if (capabilityMap.project) {
    sections.push(`Application: ${capabilityMap.project}`);
  }

  // Queries section — ref name + endpoint
  const queryEntries = Object.entries(capabilityMap.queries || {});
  if (queryEntries.length > 0) {
    const lines = queryEntries.map(([name, val]) => {
      const parts = [`  - ref: "${name}" → ${val.endpoint || name}`];
      if (val.description) parts.push(`    ${val.description}`);
      return parts.join('\n');
    });
    sections.push(`Available Queries (use these ref names in query.ref):\n${lines.join('\n')}`);
  }

  // Actions section — ref name + endpoint
  const actionEntries = Object.entries(capabilityMap.actions || {});
  if (actionEntries.length > 0) {
    const lines = actionEntries.map(([name, val]) => {
      const parts = [`  - ref: "${name}" → ${val.endpoint || name}`];
      if (val.description) parts.push(`    ${val.description}`);
      return parts.join('\n');
    });
    sections.push(`Available Actions (use these ref names in action.ref):\n${lines.join('\n')}`);
  }

  // Entities as object map: { name: { fields, description } }
  if (capabilityMap.entities && typeof capabilityMap.entities === 'object' && !Array.isArray(capabilityMap.entities)) {
    const entries = Object.entries(capabilityMap.entities).map(([name, val]) => {
      const fields = Array.isArray(val.fields) ? val.fields.join(', ') : 'unknown';
      return `  - ${name}: ${fields}`;
    });
    if (entries.length > 0) {
      sections.push(`Known Entities:\n${entries.join('\n')}`);
    }
  }

  return sections.join('\n\n');
}

/**
 * Format DSL examples for inclusion in the system prompt.
 * Selects a representative subset to stay within token budget.
 *
 * @param {Array<{name: string, dsl: object}>} examples
 * @returns {string} Formatted examples section
 */
function formatExamples(examples) {
  // Include all examples — they're small and each covers a different pattern
  return examples.map(({ name, dsl }) => {
    const label = name.replace(/-/g, ' ');
    return `### Example: ${label}\n\`\`\`json\n${JSON.stringify(dsl, null, 2)}\n\`\`\``;
  }).join('\n\n');
}

/**
 * Build the system prompt for LLM UI generation.
 *
 * @param {object|null} capabilityMap - Parsed capability map JSON (optional)
 * @param {object} [options] - Optional overrides
 * @param {object} [options.dslSchema] - Override DSL schema (for testing)
 * @param {Array} [options.examples] - Override examples (for testing)
 * @returns {string} Complete system prompt
 */
function buildSystemPrompt(capabilityMap, options = {}) {
  const schema = options.dslSchema || loadDSLSchema();
  const examples = options.examples || loadDSLExamples();
  const capabilityContext = formatCapabilityContext(capabilityMap);

  const prompt = `You are an AI that generates structured UI definitions using a JSON-based DSL (Domain-Specific Language). Your output will be rendered directly into a web application.

## Output Format

You MUST respond with valid JSON only — no markdown, no explanations outside the JSON, no trailing text. If you want to explain your reasoning, include it as plain text BEFORE the JSON block.

The root object MUST be of type "page" with a "title" and "children" array containing one or more UI components.

## DSL Schema

The following JSON Schema defines all valid component types and their properties:

\`\`\`json
${JSON.stringify(schema, null, 2)}
\`\`\`

## Component Types Reference

Available component types and their required properties:
- **page**: Root container. Required: title, children (array of components)
- **data-table**: Tabular data. Required: columns (array of {key, label, type?}), rows (array of objects)
- **detail-view**: Single record display. Required: fields (array of {key, label, value, type?})
- **form**: Input form. Required: fields (array of {name, label, type, required?, placeholder?, options?}), submitLabel
- **summary-cards**: Metric cards. Required: cards (array of {label, value, change?, trend?})
- **chart**: Data visualization. Required: chartType (bar|line|pie|doughnut), labels, datasets (array of {label, data})
- **list**: Item list. Required: items (array of {text, secondary?}). Optional: ordered, itemMapping ({text, secondary?} — maps API response fields to list item props)
- **text**: Text content. Required: content. Optional: variant (heading|paragraph|caption|code)
- **empty-state**: No data placeholder. Required: message. Optional: icon, action ({label, href?})
- **error**: Error display. Required: message. Optional: code, details, retry

## Live Data Binding

When a capability map is available, you SHOULD use **query** and **action** bindings instead of static data. This connects the UI to real API endpoints.

### Query binding (for data-table, detail-view, summary-cards, chart, list)
Add a "query" object with a "ref" that matches a query name from the capability map:
\`\`\`json
{
  "type": "data-table",
  "title": "All Tasks",
  "columns": [{"key": "title", "label": "Title"}, {"key": "status", "label": "Status", "type": "badge"}],
  "query": { "ref": "listTasks", "params": {}, "responsePath": "" }
}
\`\`\`
- "ref" MUST be the exact query name from the capability map (e.g., "listTasks", NOT "GET /tasks")
- "params" is optional — key-value pairs sent as query params (for GET) or body (for POST)
- "responsePath" is optional — dot-notation path to extract data from the response (e.g., "data.items")
- When using query binding, the static data prop (rows, fields, cards, items, labels+datasets) is OPTIONAL — leave it out and let the widget fetch live data

### List itemMapping (REQUIRED when list has query binding)
When a "list" component uses a query binding, you MUST include an "itemMapping" object that maps API response fields to list item props:
\`\`\`json
{
  "type": "list",
  "title": "To Do",
  "query": { "ref": "listTasks", "params": { "status": "todo" } },
  "itemMapping": { "text": "title", "secondary": "assignee" }
}
\`\`\`
- "text" (required): API response field name to use as the list item's primary text
- "secondary" (optional): API response field name to use as the secondary text
- Without itemMapping, the list will look for "text" and "secondary" fields in the response, which usually don't exist in API data

### Action binding (for form)
Add an "action" object with a "ref" that matches an action name from the capability map:
\`\`\`json
{
  "type": "form",
  "title": "Create Task",
  "fields": [{"name": "title", "label": "Title", "type": "text", "required": true}],
  "submitLabel": "Create",
  "action": { "ref": "createTask", "bodyFrom": "form" }
}
\`\`\`
- "ref" MUST be the exact action name from the capability map (e.g., "createTask", NOT "POST /tasks")
- "bodyFrom": "form" sends form field values as the request body
- "params" is optional — extra params merged with form data
- "responsePath" is optional — path to extract from response

### CRITICAL: ref names must match capability map keys exactly
- Use query ref names like "listTasks", "listUsers", "getTask"
- Use action ref names like "createTask", "updateTask", "deleteTask"
- Do NOT use endpoint URLs like "GET /tasks" as ref values

## Rules

1. ALWAYS output a root "page" component with "type": "page", "title", and "children"
2. When a capability map is available, ALWAYS prefer query/action bindings over static data
3. Choose appropriate component types for the user's request:
   - Listing/browsing → data-table with query binding
   - Single record → detail-view with query binding
   - Creating/editing → form with action binding
   - Overview/metrics → summary-cards + chart
   - No results → empty-state
   - Errors → error
4. Pages can contain MULTIPLE child components for rich layouts (e.g., summary-cards + chart + data-table for dashboards)
5. Use proper field types: "badge" for status values, "date" for dates, "number" for numeric values, "link" for URLs
6. Form "select" fields MUST include an "options" array
7. All JSON must be strictly valid — no trailing commas, no comments
8. In "detail-view" and "summary-cards", "value" fields MUST be primitives (string, number, boolean, or null) — NEVER objects or arrays
9. In "data-table", all row cell values MUST be flat primitives (string, number, boolean, or null) — NEVER nested objects or arrays
10. Query and action ref values MUST be capability map key names (e.g., "listTasks"), NEVER endpoint URLs (e.g., "GET /tasks")
${capabilityContext ? `\n## Application Context\n\n${capabilityContext}\n` : ''}
## Examples

The following examples show correct DSL output for common UI requests:

${formatExamples(examples)}`;

  return prompt;
}

module.exports = {
  buildSystemPrompt,
  loadDSLSchema,
  loadDSLExamples,
  formatCapabilityContext,
  formatExamples
};

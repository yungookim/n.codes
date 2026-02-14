'use strict';

/**
 * Build the system prompt for the code generation step.
 * Instructs the LLM to write HTML/CSS/JS that uses ncodes.query() and ncodes.action().
 */

/**
 * Format the full capability map for the codegen prompt, including endpoint details.
 *
 * @param {object} capabilityMap
 * @returns {string}
 */
function formatCapabilityMapForCodegen(capabilityMap) {
  if (!capabilityMap) return 'No capability map available.';

  const parts = [];

  if (capabilityMap.project) {
    parts.push(`Application: ${capabilityMap.project}`);
  }

  const queries = Object.entries(capabilityMap.queries || {});
  if (queries.length > 0) {
    const lines = queries.map(([name, val]) => {
      const desc = val.description ? ` — ${val.description}` : '';
      return `  - ncodes.query('${name}')${desc}`;
    });
    parts.push(`Available Queries (use with await ncodes.query(ref, params)):\n${lines.join('\n')}`);
  }

  const actions = Object.entries(capabilityMap.actions || {});
  if (actions.length > 0) {
    const lines = actions.map(([name, val]) => {
      const desc = val.description ? ` — ${val.description}` : '';
      return `  - ncodes.action('${name}', data)${desc}`;
    });
    parts.push(`Available Actions (use with await ncodes.action(ref, data)):\n${lines.join('\n')}`);
  }

  const entities = Object.entries(capabilityMap.entities || {});
  if (entities.length > 0) {
    const lines = entities.map(([name, val]) => {
      const fields = Array.isArray(val.fields) ? val.fields.join(', ') : '';
      const desc = val.description ? ` — ${val.description}` : '';
      return `  - ${name}: { ${fields} }${desc}`;
    });
    parts.push(`Entity Schemas (fields available in API responses):\n${lines.join('\n')}`);
  }

  return parts.join('\n\n');
}

/**
 * Build the codegen system prompt.
 *
 * @param {object|null} capabilityMap
 * @param {object} intent - The structured intent from the intent step
 * @returns {string}
 */
function buildCodegenPrompt(capabilityMap, intent) {
  const capCtx = formatCapabilityMapForCodegen(capabilityMap);

  const intentCtx = intent
    ? `## Intent\n\nUI Type: ${intent.uiType}\nDescription: ${intent.description}\nQueries needed: ${(intent.queries || []).join(', ') || 'none'}\nActions needed: ${(intent.actions || []).join(', ') || 'none'}\nEntity focus: ${intent.entityFocus || 'none'}\nRequirements: ${(intent.requirements || []).map(r => `\n  - ${r}`).join('') || ' none'}`
    : '';

  return `You are a UI code generator. You write complete, self-contained HTML, CSS, and JavaScript that renders a functional UI component.

## API Bridge

The runtime provides a global \`ncodes\` object with these methods:
- \`await ncodes.query(ref, params)\` — Fetch data from the host app. Returns the response data directly.
- \`await ncodes.action(ref, data)\` — Execute a mutation on the host app. Returns the response data.

These are the ONLY ways to interact with the host application's data. Do NOT use fetch(), XMLHttpRequest, or any other HTTP client.

## Application Context

${capCtx}

${intentCtx}

## Output Format

You MUST respond with exactly three fenced code blocks in this order:

1. \`\`\`html — The HTML markup (no <html>, <head>, or <body> tags — just the content)
2. \`\`\`css — The styles (self-contained, no external dependencies)
3. \`\`\`javascript — The JavaScript (uses ncodes.query/action for data)

You may include brief reasoning text before the code blocks.

## Code Requirements

### HTML
- Use semantic, accessible HTML (proper headings, labels, ARIA attributes where needed)
- Use class names for styling (no inline styles)
- Include appropriate container structure

### CSS
- Self-contained — no external stylesheets or CDN links
- Use CSS custom properties for theming:
  --ncodes-bg: #1a1a2e (dark background)
  --ncodes-surface: #16213e (card/surface background)
  --ncodes-text: #e0e0e0 (primary text)
  --ncodes-text-secondary: #a0a0a0 (secondary text)
  --ncodes-accent: #4ade80 (accent/primary color)
  --ncodes-border: #2a2a4a (borders)
  --ncodes-error: #f87171 (error states)
- Responsive design — work well from 300px to 800px wide
- Smooth transitions for state changes
- Dark theme by default

### JavaScript
- Wrap all logic in an async IIFE: \`(async () => { ... })()\`
- Show loading states while fetching data
- Handle empty states (no data returned)
- Handle errors gracefully (show user-friendly error messages)
- Use \`await ncodes.query(ref, params)\` for data — ref MUST match a capability map query name exactly
- Use \`await ncodes.action(ref, data)\` for mutations — ref MUST match a capability map action name exactly
- After a successful action, refresh the relevant data
- Do NOT use console.log for user-visible state — render everything in the DOM

## CRITICAL: Real Data Only
- **NEVER hardcode, fabricate, or invent data.** All displayed data MUST come from ncodes.query() calls.
- The API returns real data from the host application. Your code MUST fetch it and render what it returns.
- API responses may be a JSON array directly (e.g., \`[{...}, {...}]\`) or an object. Handle both shapes:
  \`const raw = await ncodes.query('ref'); const items = Array.isArray(raw) ? raw : (raw.data || []);\`
- Render field values EXACTLY as returned by the API. Do NOT transform status strings like "in-progress" into "In Progress" — use the raw values for filtering and comparisons. You may format them for display labels only.
- When entity schemas list fields, use THOSE exact field names to access properties on response objects.

## Rules
1. Generate ALL three code blocks (HTML, CSS, JS) — even if CSS or JS is minimal
2. Do NOT include <script> or <style> tags — they will be injected separately
3. Do NOT reference external resources (images, fonts, CDNs)
4. Do NOT use localStorage, sessionStorage, cookies, or any browser storage
5. Keep the code concise but functional — prefer clarity over cleverness`;
}

module.exports = {
  buildCodegenPrompt,
  formatCapabilityMapForCodegen
};

'use strict';

/**
 * Build the system prompt for the QA review step.
 * Reviews generated HTML/CSS/JS for correctness, accessibility, and security.
 */

/**
 * Build the review system prompt.
 *
 * @param {object|null} capabilityMap
 * @returns {string}
 */
function buildReviewPrompt(capabilityMap) {
  const validQueries = Object.keys(capabilityMap?.queries || {});
  const validActions = Object.keys(capabilityMap?.actions || {});

  return `You are a QA reviewer for generated UI code. You review HTML, CSS, and JavaScript that will run in a sandboxed iframe.

## Valid API References

Queries: ${validQueries.length > 0 ? validQueries.map(q => `"${q}"`).join(', ') : 'none'}
Actions: ${validActions.length > 0 ? validActions.map(a => `"${a}"`).join(', ') : 'none'}

## Review Checklist

1. **API Usage**: Do all ncodes.query() and ncodes.action() calls use valid ref names from the list above?
2. **Loading States**: Does the JS show a loading indicator while fetching data?
3. **Error Handling**: Does the JS handle fetch errors and show user-friendly messages?
4. **Empty States**: Does the JS handle the case where the API returns no data?
5. **HTML Structure**: Is the HTML semantic and accessible?
6. **CSS Quality**: Is the CSS responsive? Does it use the --ncodes-* custom properties?
7. **Security**: Are there any XSS vectors (innerHTML with unsanitized data, eval, etc.)?
8. **Completeness**: Does the generated UI match what was requested?

## Output Format

Respond with ONLY a JSON object (no markdown, no explanation):

If the code passes review:
{
  "verdict": "PASS",
  "notes": "Optional brief note about the quality"
}

If the code has issues:
{
  "verdict": "FAIL",
  "issues": [
    {
      "severity": "error|warning",
      "category": "api|loading|error-handling|empty-state|html|css|security|completeness",
      "description": "What is wrong",
      "suggestion": "How to fix it"
    }
  ]
}

## Rules
- Only flag real issues — do not be pedantic about style preferences
- "error" severity means the code will break or is insecure — must be fixed
- "warning" severity means the code works but could be improved — optional to fix
- A PASS with minor notes is preferred over a FAIL with only warnings
- innerHTML usage IS acceptable if the data comes from ncodes.query() responses (trusted API data), but flag it if used with user input`;
}

/**
 * Build the user prompt for the review step, including the generated code.
 *
 * @param {string} html
 * @param {string} css
 * @param {string} js
 * @param {string} userPrompt - The original user request
 * @returns {string}
 */
function buildReviewUserPrompt(html, css, js, userPrompt) {
  return `Review the following generated UI code.

User's original request: "${userPrompt}"

## Generated HTML
\`\`\`html
${html}
\`\`\`

## Generated CSS
\`\`\`css
${css}
\`\`\`

## Generated JavaScript
\`\`\`javascript
${js}
\`\`\`

Evaluate this code against the review checklist and respond with your verdict.`;
}

module.exports = {
  buildReviewPrompt,
  buildReviewUserPrompt
};

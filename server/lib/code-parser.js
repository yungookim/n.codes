'use strict';

/**
 * Extract HTML, CSS, and JS code blocks from LLM markdown output.
 *
 * The LLM is expected to produce fenced code blocks like:
 *   ```html
 *   <div>...</div>
 *   ```
 *   ```css
 *   .class { ... }
 *   ```
 *   ```javascript
 *   const data = await ncodes.query('listTasks');
 *   ```
 *
 * Also extracts any reasoning text that appears before or between code blocks.
 */

const CODE_BLOCK_RE = /```(\w+)\s*\n([\s\S]*?)```/g;

const HTML_LANGS = new Set(['html']);
const CSS_LANGS = new Set(['css']);
const JS_LANGS = new Set(['javascript', 'js']);

/**
 * Parse LLM response text and extract HTML, CSS, and JS code blocks.
 *
 * @param {string} text - Raw LLM response text
 * @returns {{ html: string, css: string, js: string, reasoning: string }}
 */
function parseCodeBlocks(text) {
  if (!text || typeof text !== 'string') {
    return { html: '', css: '', js: '', reasoning: '' };
  }

  const htmlParts = [];
  const cssParts = [];
  const jsParts = [];

  let match;
  const regex = new RegExp(CODE_BLOCK_RE.source, CODE_BLOCK_RE.flags);
  while ((match = regex.exec(text)) !== null) {
    const lang = match[1].toLowerCase();
    const code = match[2].trim();

    if (HTML_LANGS.has(lang)) {
      htmlParts.push(code);
    } else if (CSS_LANGS.has(lang)) {
      cssParts.push(code);
    } else if (JS_LANGS.has(lang)) {
      jsParts.push(code);
    }
  }

  const reasoning = extractReasoning(text);

  return {
    html: htmlParts.join('\n'),
    css: cssParts.join('\n'),
    js: jsParts.join('\n'),
    reasoning
  };
}

/**
 * Extract reasoning text from LLM response (text outside code blocks).
 *
 * @param {string} text - Raw LLM response
 * @returns {string}
 */
function extractReasoning(text) {
  // Remove all code blocks, keep surrounding text
  const withoutBlocks = text.replace(/```\w*\s*\n[\s\S]*?```/g, '').trim();
  // Collapse multiple blank lines
  return withoutBlocks.replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Validate that parsed code contains at minimum HTML content.
 *
 * @param {{ html: string, css: string, js: string }} parsed
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateParsedCode(parsed) {
  const errors = [];
  if (!parsed.html) {
    errors.push('No HTML code block found in LLM response');
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  parseCodeBlocks,
  extractReasoning,
  validateParsedCode
};

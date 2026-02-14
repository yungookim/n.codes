'use strict';

const { parseEndpoint, lookupRef } = require('./capability-resolver');

/**
 * Regex patterns to find ncodes.query() and ncodes.action() calls in JS code.
 * Matches both single and double quoted string literals as the first argument.
 */
const QUERY_RE = /ncodes\.query\(\s*['"]([^'"]+)['"]/g;
const ACTION_RE = /ncodes\.action\(\s*['"]([^'"]+)['"]/g;

/**
 * Extract all ncodes.query() and ncodes.action() refs from JavaScript code.
 *
 * @param {string} js - Generated JavaScript code
 * @returns {{ queries: string[], actions: string[] }}
 */
function extractRefs(js) {
  if (!js || typeof js !== 'string') {
    return { queries: [], actions: [] };
  }

  const queries = new Set();
  const actions = new Set();

  let match;

  const queryRegex = new RegExp(QUERY_RE.source, QUERY_RE.flags);
  while ((match = queryRegex.exec(js)) !== null) {
    queries.add(match[1]);
  }

  const actionRegex = new RegExp(ACTION_RE.source, ACTION_RE.flags);
  while ((match = actionRegex.exec(js)) !== null) {
    actions.add(match[1]);
  }

  return {
    queries: [...queries],
    actions: [...actions]
  };
}

/**
 * Validate that all extracted refs exist in the capability map.
 *
 * @param {{ queries: string[], actions: string[] }} refs - Extracted refs
 * @param {object} capabilityMap - The capability map
 * @returns {{ valid: boolean, errors: string[], unknown: string[] }}
 */
function validateRefs(refs, capabilityMap) {
  const errors = [];
  const unknown = [];

  for (const ref of refs.queries) {
    const entry = lookupRef(ref, 'query', capabilityMap);
    if (!entry) {
      errors.push(`Unknown query ref "${ref}" — not found in capability map`);
      unknown.push(ref);
    }
  }

  for (const ref of refs.actions) {
    const entry = lookupRef(ref, 'action', capabilityMap);
    if (!entry) {
      errors.push(`Unknown action ref "${ref}" — not found in capability map`);
      unknown.push(ref);
    }
  }

  return { valid: errors.length === 0, errors, unknown };
}

/**
 * Build the apiBindings array from extracted refs and capability map.
 * Each binding includes: { type, ref, resolved: { method, path } }
 *
 * @param {{ queries: string[], actions: string[] }} refs
 * @param {object} capabilityMap
 * @returns {Array<{ type: string, ref: string, resolved: { method: string, path: string } }>}
 */
function buildApiBindings(refs, capabilityMap) {
  const bindings = [];

  for (const ref of refs.queries) {
    const entry = lookupRef(ref, 'query', capabilityMap);
    if (entry) {
      const resolved = parseEndpoint(entry.endpoint);
      if (resolved) {
        bindings.push({ type: 'query', ref, resolved });
      }
    }
  }

  for (const ref of refs.actions) {
    const entry = lookupRef(ref, 'action', capabilityMap);
    if (entry) {
      const resolved = parseEndpoint(entry.endpoint);
      if (resolved) {
        bindings.push({ type: 'action', ref, resolved });
      }
    }
  }

  return bindings;
}

/**
 * Full pipeline: extract refs from JS, validate against capability map, build bindings.
 *
 * @param {string} js - Generated JavaScript code
 * @param {object} capabilityMap - The capability map
 * @returns {{ apiBindings: Array, refs: object, validation: object }}
 */
function resolveApiBindings(js, capabilityMap) {
  const refs = extractRefs(js);
  const validation = validateRefs(refs, capabilityMap);
  const apiBindings = buildApiBindings(refs, capabilityMap);

  return { apiBindings, refs, validation };
}

module.exports = {
  extractRefs,
  validateRefs,
  buildApiBindings,
  resolveApiBindings
};

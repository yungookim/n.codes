'use strict';

const { lookupRef } = require('./capability-resolver');

function normalizeRefs(refs) {
  if (!Array.isArray(refs)) return [];
  return refs
    .filter(ref => typeof ref === 'string')
    .map(ref => ref.trim())
    .filter(ref => ref.length > 0);
}

function buildSuggestion(capabilityMap) {
  if (!capabilityMap || typeof capabilityMap !== 'object') {
    return { queries: [], actions: [] };
  }

  return {
    queries: Object.keys(capabilityMap.queries || {}),
    actions: Object.keys(capabilityMap.actions || {})
  };
}

/**
 * Validate intent refs against the capability map.
 *
 * @param {object} intent
 * @param {object|null} capabilityMap
 * @returns {{ feasible: boolean, invalidRefs?: { queries: string[], actions: string[] }, suggestion?: { queries: string[], actions: string[] } }}
 */
function checkFeasibility(intent, capabilityMap) {
  if (!capabilityMap) return { feasible: true };
  if (!intent || typeof intent !== 'object') return { feasible: true };

  const queries = normalizeRefs(intent.queries);
  const actions = normalizeRefs(intent.actions);

  if (queries.length === 0 && actions.length === 0) {
    return { feasible: true };
  }

  const invalidQueries = [];
  const invalidActions = [];

  for (const ref of queries) {
    if (!lookupRef(ref, 'query', capabilityMap)) {
      invalidQueries.push(ref);
    }
  }

  for (const ref of actions) {
    if (!lookupRef(ref, 'action', capabilityMap)) {
      invalidActions.push(ref);
    }
  }

  if (invalidQueries.length === 0 && invalidActions.length === 0) {
    return { feasible: true };
  }

  return {
    feasible: false,
    invalidRefs: {
      queries: [...new Set(invalidQueries)],
      actions: [...new Set(invalidActions)]
    },
    suggestion: buildSuggestion(capabilityMap)
  };
}

/**
 * Convert camelCase ref names into readable text.
 *
 * @param {string} name
 * @returns {string}
 */
function humanizeRef(name) {
  if (typeof name !== 'string') return '';

  const spaced = name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!spaced) return '';
  return spaced.toLowerCase();
}

function buildSuggestionOptions(suggestion) {
  const options = [];
  const seen = new Set();
  const queries = Array.isArray(suggestion.queries) ? suggestion.queries : [];
  const actions = Array.isArray(suggestion.actions) ? suggestion.actions : [];

  const pushOption = (ref) => {
    if (options.length >= 4) return;
    const label = humanizeRef(ref) || ref;
    if (!label || seen.has(label)) return;
    seen.add(label);
    options.push(label);
  };

  for (const ref of queries) {
    pushOption(ref);
  }

  for (const ref of actions) {
    pushOption(ref);
  }

  return options;
}

/**
 * Build a clarifyingQuestion-shaped response for infeasible intents.
 *
 * @param {object} feasibilityResult
 * @param {object|null} capabilityMap
 * @returns {{ clarifyingQuestion: string, options: string[], reasoning: string, feasibility: object }}
 */
function buildNotFeasibleResponse(feasibilityResult, capabilityMap) {
  const invalidRefs = feasibilityResult && feasibilityResult.invalidRefs
    ? feasibilityResult.invalidRefs
    : { queries: [], actions: [] };

  const invalidQueries = Array.isArray(invalidRefs.queries) ? invalidRefs.queries : [];
  const invalidActions = Array.isArray(invalidRefs.actions) ? invalidRefs.actions : [];

  const humanQueries = invalidQueries.map(humanizeRef).filter(Boolean);
  const humanActions = invalidActions.map(humanizeRef).filter(Boolean);

  let message = 'This request references capabilities that are not available in this app.';

  if (humanQueries.length > 0 && humanActions.length > 0) {
    message = `I couldn't find data sources (${humanQueries.join(', ')}) or actions (${humanActions.join(', ')}) in this app.`;
  } else if (humanQueries.length > 0) {
    message = `I couldn't find data sources for ${humanQueries.join(', ')} in this app.`;
  } else if (humanActions.length > 0) {
    message = `I couldn't find actions for ${humanActions.join(', ')} in this app.`;
  }

  const suggestion = feasibilityResult && feasibilityResult.suggestion
    ? feasibilityResult.suggestion
    : buildSuggestion(capabilityMap);

  const options = buildSuggestionOptions(suggestion);
  if (options.length > 0) {
    message += ' Here are some things this app can do:';
  }

  const reasoningParts = [];
  if (invalidQueries.length > 0) {
    reasoningParts.push(`Unknown queries: ${invalidQueries.join(', ')}`);
  }
  if (invalidActions.length > 0) {
    reasoningParts.push(`Unknown actions: ${invalidActions.join(', ')}`);
  }

  return {
    clarifyingQuestion: message,
    options,
    reasoning: reasoningParts.join('; ') || 'Requested capabilities are not in the capability map.',
    feasibility: {
      feasible: false,
      invalidRefs,
      suggestion
    }
  };
}

module.exports = {
  checkFeasibility,
  buildNotFeasibleResponse,
  humanizeRef
};

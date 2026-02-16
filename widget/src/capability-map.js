/**
 * Capability map fetching and parsing.
 * Loads the project's capability map JSON to enable context-aware prompts.
 */

const DEFAULT_TIMEOUT = 10000;

/**
 * Fetch and parse a capability map from the given URL.
 * Returns the parsed object on success, or null on any failure.
 *
 * @param {string} url - URL to fetch the capability map from
 * @param {object} [options]
 * @param {AbortSignal} [options.signal] - External abort signal
 * @param {number} [options.timeout] - Timeout in ms (default 10000)
 * @param {function} [options.fetchFn] - Custom fetch function (for testing)
 * @returns {Promise<object|null>}
 */
async function fetchCapabilityMap(url, options = {}) {
  const { signal: externalSignal, timeout = DEFAULT_TIMEOUT, fetchFn } = options;
  const doFetch = fetchFn || globalThis.fetch;

  if (typeof doFetch !== 'function') {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  // If an external signal is already aborted, bail immediately
  if (externalSignal && externalSignal.aborted) {
    clearTimeout(timeoutId);
    return null;
  }

  // Forward external abort to our controller
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const response = await doFetch(url, { signal: controller.signal });
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    if (!validateCapabilityMap(data)) {
      return null;
    }
    return data;
  } catch (_) {
    return null;
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

/**
 * Validate that the data has a supported capability map structure.
 * Supports both legacy maps (project + at least one entity/action/query)
 * and modern maps (version + generatedAt + core sections).
 */
function validateCapabilityMap(data) {
  if (!data || typeof data !== 'object') return false;
  const isObject = (value) => !!value && typeof value === 'object' && !Array.isArray(value);

  // Legacy schema: project name + at least one populated section.
  const legacyProject = data.project ?? data.projectName;
  const legacyProjectOk = typeof legacyProject === 'string' && legacyProject.trim().length > 0;
  const legacyHasContent = Object.keys(data.entities || {}).length > 0
    || Object.keys(data.actions || {}).length > 0
    || Object.keys(data.queries || {}).length > 0;
  const hasLegacy = legacyProjectOk && legacyHasContent;

  // Modern schema: version + generatedAt + core sections (can be empty).
  const modernVersionOk = data.version !== undefined && data.version !== null;
  const modernGeneratedAtOk = typeof data.generatedAt === 'string' && data.generatedAt.trim().length > 0;
  const modernEntitiesOk = isObject(data.entities);
  const modernActionsOk = isObject(data.actions);
  const modernQueriesOk = isObject(data.queries);
  const modernComponentsOk = data.components === undefined || isObject(data.components);
  const hasModern = modernVersionOk && modernGeneratedAtOk
    && modernEntitiesOk && modernActionsOk && modernQueriesOk && modernComponentsOk;

  return hasLegacy || hasModern;
}

/** Return entities object or empty {}. */
function getEntities(capMap) {
  if (!capMap || typeof capMap !== 'object') return {};
  return capMap.entities || {};
}

/** Return actions object or empty {}. */
function getActions(capMap) {
  if (!capMap || typeof capMap !== 'object') return {};
  return capMap.actions || {};
}

/** Return queries object or empty {}. */
function getQueries(capMap) {
  if (!capMap || typeof capMap !== 'object') return {};
  return capMap.queries || {};
}

/**
 * Return a merged list of all action and query names with descriptions.
 * Each entry: { name, description, type: 'action'|'query' }
 */
function getCapabilities(capMap) {
  const actions = getActions(capMap);
  const queries = getQueries(capMap);
  const result = [];
  for (const [name, val] of Object.entries(actions)) {
    result.push({ name, description: val.description || '', type: 'action' });
  }
  for (const [name, val] of Object.entries(queries)) {
    result.push({ name, description: val.description || '', type: 'query' });
  }
  return result;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have',
  'in', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'this', 'to', 'with',
  'about', 'into', 'over', 'under', 'between', 'while', 'when', 'where', 'who',
  'whom', 'whose', 'which', 'why', 'how', 'me', 'my', 'our', 'your', 'their',
]);

const READ_VERBS = new Set([
  'list', 'show', 'view', 'get', 'fetch', 'find', 'search', 'load', 'see',
]);

const WRITE_VERBS = new Set([
  'create', 'add', 'update', 'edit', 'delete', 'remove', 'archive', 'publish',
  'unpublish', 'approve', 'reject', 'assign', 'set',
]);

function normalizeToken(token) {
  if (!token) return '';
  const lower = token.toLowerCase();
  if (lower.endsWith('ies')) return `${lower.slice(0, -3)}y`;
  if (lower.endsWith('sses')) return lower.slice(0, -2);
  if (lower.endsWith('s') && !lower.endsWith('ss')) return lower.slice(0, -1);
  return lower;
}

function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .map((t) => normalizeToken(t))
    .filter((t) => t && !STOP_WORDS.has(t));
}

/**
 * Match a user prompt against capabilities and return the best match.
 * Returns { capability, type } or null if no match found.
 */
function matchCapability(prompt, capMap) {
  if (!prompt || !capMap) return null;

  const promptTokens = tokenize(prompt);
  if (promptTokens.length === 0) return null;
  const promptTokenSet = new Set(promptTokens);
  const hasReadVerb = promptTokens.some((t) => READ_VERBS.has(t));
  const hasWriteVerb = promptTokens.some((t) => WRITE_VERBS.has(t));
  const capabilities = getCapabilities(capMap);

  // Score each capability by how well the prompt matches it
  let best = null;
  let bestScore = 0;

  for (const cap of capabilities) {
    let score = 0;
    const nameWords = tokenize(humanize(cap.name));
    const descWords = tokenize(cap.description || '');

    // Match on capability name words
    for (const w of nameWords) {
      if (promptTokenSet.has(w)) score += 3;
    }

    // Match on description words
    for (const w of descWords) {
      if (promptTokenSet.has(w)) score += 1;
    }

    if (cap.type === 'query' && hasReadVerb) score += 2;
    if (cap.type === 'action' && hasWriteVerb) score += 2;

    if (score > bestScore) {
      bestScore = score;
      best = cap;
    }
  }

  return bestScore > 0 ? best : null;
}

const MAX_QUICK_PROMPTS = 4;

/**
 * Generate context-aware quick prompt suggestions from a capability map.
 * Returns array of { label, prompt } objects for the quick-prompt buttons.
 */
function generateQuickPrompts(capMap) {
  if (!capMap || typeof capMap !== 'object') return [];

  const suggestions = [];
  const entities = getEntities(capMap);
  const actions = getActions(capMap);
  const queries = getQueries(capMap);

  // Prioritise queries (read operations) as they're safer/more common first interactions
  for (const [name, val] of Object.entries(queries)) {
    const desc = val.description || humanize(name);
    suggestions.push({ label: desc, prompt: desc });
  }

  // Then actions (write operations)
  for (const [name, val] of Object.entries(actions)) {
    const desc = val.description || humanize(name);
    // Frame actions as "form" or "UI" requests
    const prompt = `Build a form to ${desc.toLowerCase()}`;
    suggestions.push({ label: prompt, prompt });
  }

  return suggestions.slice(0, MAX_QUICK_PROMPTS);
}

/**
 * Convert camelCase name to human-readable label.
 * e.g., "listTasks" → "List tasks", "createUser" → "Create user"
 */
function humanize(name) {
  const spaced = name.replace(/([A-Z])/g, ' $1').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

module.exports = {
  fetchCapabilityMap,
  validateCapabilityMap,
  getEntities,
  getActions,
  getQueries,
  getCapabilities,
  matchCapability,
  generateQuickPrompts,
  humanize,
};

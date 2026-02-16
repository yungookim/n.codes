'use strict';

const { generateUI } = require('./llm-client');

const KEYWORD_MAX_TOKENS = 256;
const DEFAULT_MAX_KEYWORDS = 8;
const DEFAULT_MAX_QUERIES = 8;
const DEFAULT_MAX_ACTIONS = 6;
const DEFAULT_MAX_OPTIONS = 4;

function normalizeList(list) {
  if (!Array.isArray(list)) return [];
  const cleaned = list
    .filter(item => typeof item === 'string')
    .map(item => item.trim())
    .filter(Boolean);

  return [...new Set(cleaned)];
}

function tokenizeText(text) {
  if (!text || typeof text !== 'string') return [];
  const matches = text.toLowerCase().match(/[a-z0-9]+/g);
  return matches ? matches : [];
}

function buildKeywordPrompt() {
  return `You are a search assistant for a capability map.

Return ONLY a JSON object with this shape:
{
  "keywords": ["keyword1", "keyword2"]
}

Rules:
- 3 to 8 keywords or short phrases (1-3 words each)
- Focus on domain entities, user intent verbs, and data types
- Include synonyms if helpful
- Use lowercase
- JSON only, no markdown`;
}

function parseJsonBlock(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return null;
  }
}

function parseKeywordResponse(text) {
  const parsed = parseJsonBlock(text);
  const lowered = normalizeList(parsed?.keywords)
    .map(k => k.toLowerCase());
  const keywords = [...new Set(lowered)];
  return keywords.slice(0, DEFAULT_MAX_KEYWORDS);
}

function scoreCapability(ref, entry, keywords, promptTokens) {
  const fields = [ref, entry?.description, entry?.endpoint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let score = 0;
  for (const keyword of keywords) {
    if (keyword && fields.includes(keyword.toLowerCase())) {
      score += 3;
    }
  }

  for (const token of promptTokens) {
    if (token && fields.includes(token)) {
      score += 1;
    }
  }

  if (fields.startsWith(ref.toLowerCase())) {
    score += 1;
  }

  return score;
}

function pickTopCapabilities(entries, keywords, promptTokens, limit) {
  const scored = entries.map(([ref, entry]) => ({
    ref,
    entry,
    score: scoreCapability(ref, entry, keywords, promptTokens)
  }));

  const matched = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.ref.localeCompare(b.ref));

  const selected = (matched.length > 0 ? matched : scored)
    .slice(0, limit)
    .reduce((acc, item) => {
      acc[item.ref] = item.entry;
      return acc;
    }, {});

  return selected;
}

function hasAnyMatch(entries, keywords, promptTokens) {
  return entries.some(([ref, entry]) =>
    scoreCapability(ref, entry, keywords, promptTokens) > 0
  );
}

function selectCapabilitySubset(capabilityMap, { keywords, prompt } = {}) {
  if (!capabilityMap || typeof capabilityMap !== 'object') {
    return { queries: {}, actions: {} };
  }

  const promptTokens = tokenizeText(prompt);
  const normalizedKeywords = normalizeList(keywords).map(k => k.toLowerCase());

  const queryEntries = Object.entries(capabilityMap.queries || {});
  const actionEntries = Object.entries(capabilityMap.actions || {});

  const queries = pickTopCapabilities(
    queryEntries,
    normalizedKeywords,
    promptTokens,
    DEFAULT_MAX_QUERIES
  );

  const actions = pickTopCapabilities(
    actionEntries,
    normalizedKeywords,
    promptTokens,
    DEFAULT_MAX_ACTIONS
  );

  return { queries, actions };
}

function validateRefList(refs, capabilityMapSection) {
  const invalid = [];
  if (!Array.isArray(refs)) return invalid;
  for (const ref of refs) {
    if (!Object.prototype.hasOwnProperty.call(capabilityMapSection || {}, ref)) {
      invalid.push(ref);
    }
  }
  return invalid;
}

function buildMissingRefMessage(invalidQueries, invalidActions) {
  const humanQueries = invalidQueries.map(humanizeRef).filter(Boolean);
  const humanActions = invalidActions.map(humanizeRef).filter(Boolean);

  if (humanQueries.length > 0 && humanActions.length > 0) {
    return `I couldn't find data sources (${humanQueries.join(', ')}) or actions (${humanActions.join(', ')}) in this app.`;
  }
  if (humanQueries.length > 0) {
    return `I couldn't find data sources for ${humanQueries.join(', ')} in this app.`;
  }
  if (humanActions.length > 0) {
    return `I couldn't find actions for ${humanActions.join(', ')} in this app.`;
  }
  return 'I could not find matching capabilities for this request in this app.';
}

function suggestOptionsFromCapabilities(capabilityMap) {
  const options = [];
  const queries = Object.entries(capabilityMap?.queries || {});
  const actions = Object.entries(capabilityMap?.actions || {});

  for (const [ref, entry] of queries) {
    const label = entry?.description || `Show ${humanizeRef(ref)}`;
    if (label) options.push(label);
    if (options.length >= DEFAULT_MAX_OPTIONS) return options;
  }

  for (const [ref, entry] of actions) {
    const label = entry?.description || `Run ${humanizeRef(ref)}`;
    if (label) options.push(label);
    if (options.length >= DEFAULT_MAX_OPTIONS) return options;
  }

  return options.slice(0, DEFAULT_MAX_OPTIONS);
}

function buildMissingCapabilityMapResponse() {
  return {
    feasible: false,
    reasoning: 'No capability map available.',
    clarifyingQuestion: 'This app has not exposed any capabilities yet, so I cannot build this feature.',
    options: []
  };
}

function buildNoMatchResponse(capabilityMap) {
  const options = suggestOptionsFromCapabilities(capabilityMap);
  return {
    feasible: false,
    reasoning: 'No matching capabilities found for the request.',
    clarifyingQuestion: 'I could not find any supported capabilities that match this request. Try one of these instead:',
    options
  };
}

function buildAmbiguousMatchResponse(capabilityMap) {
  const options = suggestOptionsFromCapabilities(capabilityMap);
  return {
    feasible: false,
    reasoning: 'Required capabilities could not be determined.',
    clarifyingQuestion: 'Which of these supported capabilities should I use?',
    options
  };
}

function formatCapabilitySubset(subset, projectName) {
  const parts = [];

  if (projectName) {
    parts.push(`Application: ${projectName}`);
  }

  const queries = Object.entries(subset.queries || {});
  if (queries.length > 0) {
    const lines = queries.map(([name, val]) =>
      `  - ${name}: ${val.description || val.endpoint || 'No description'}`
    );
    parts.push(`Available Queries:\n${lines.join('\n')}`);
  }

  const actions = Object.entries(subset.actions || {});
  if (actions.length > 0) {
    const lines = actions.map(([name, val]) =>
      `  - ${name}: ${val.description || val.endpoint || 'No description'}`
    );
    parts.push(`Available Actions:\n${lines.join('\n')}`);
  }

  if (parts.length === 0) {
    parts.push('No capability map entries are available.');
  }

  return parts.join('\n\n');
}

function buildFeasibilityPrompt(capabilityContext) {
  return `You are a feasibility checker for a UI generation system.

## Capability Context
${capabilityContext}

## Task
Decide whether the user's request can be fulfilled using ONLY the capabilities listed above.
The request is feasible ONLY if every requested feature can be implemented with the listed queries/actions
and client-side logic over their results. If any requested feature would require a missing query/action,
mark it infeasible. Do NOT allow partial solutions or placeholder UI.

## Output Format
Return ONLY a JSON object:

If feasible:
{
  "feasible": true,
  "reasoning": "Short explanation",
  "queries": ["queryRef"],
  "actions": ["actionRef"]
}

If NOT feasible:
{
  "feasible": false,
  "reasoning": "Why it cannot be fulfilled",
  "clarifyingQuestion": "Question to ask the user",
  "options": ["Option A", "Option B"]
}

Rules:
- Base your answer strictly on the capabilities listed above
- If any requested feature is unsupported, respond infeasible
- Do not suggest fake data, "coming soon" UI, or placeholder buttons
- Use short, user-friendly options (1-4) when infeasible
- JSON only, no markdown`;
}

function parseFeasibilityResponse(text) {
  const parsed = parseJsonBlock(text);
  if (!parsed || typeof parsed !== 'object') {
    return {
      feasible: true,
      reasoning: 'Feasibility response could not be parsed.'
    };
  }

  const feasible = Boolean(parsed.feasible);
  const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : '';
  const queries = normalizeList(parsed.queries);
  const actions = normalizeList(parsed.actions);
  const options = normalizeList(parsed.options).slice(0, DEFAULT_MAX_OPTIONS);
  const clarifyingQuestion = typeof parsed.clarifyingQuestion === 'string'
    ? parsed.clarifyingQuestion
    : '';

  return {
    feasible,
    reasoning,
    queries,
    actions,
    clarifyingQuestion,
    options
  };
}

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

function buildDeterministicFallback(intent, capabilityMap) {
  const invalidQueries = [];
  const invalidActions = [];

  const queries = normalizeList(intent?.queries);
  const actions = normalizeList(intent?.actions);

  const queryMap = capabilityMap?.queries || {};
  const actionMap = capabilityMap?.actions || {};

  for (const ref of queries) {
    if (!Object.prototype.hasOwnProperty.call(queryMap, ref)) {
      invalidQueries.push(ref);
    }
  }

  for (const ref of actions) {
    if (!Object.prototype.hasOwnProperty.call(actionMap, ref)) {
      invalidActions.push(ref);
    }
  }

  if (invalidQueries.length === 0 && invalidActions.length === 0) {
    return { feasible: true };
  }

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

  return {
    feasible: false,
    reasoning: 'Fallback validation detected unknown refs.',
    clarifyingQuestion: message,
    options: suggestOptionsFromCapabilities(capabilityMap)
  };
}

async function runFeasibilityStep({ prompt, intent, capabilityMap, llmConfig, generate = generateUI }) {
  const resolvedMap = capabilityMap || null;

  if (!resolvedMap || (Object.keys(resolvedMap.queries || {}).length === 0
    && Object.keys(resolvedMap.actions || {}).length === 0)) {
    return {
      ...buildMissingCapabilityMapResponse(),
      tokensUsed: { prompt: 0, completion: 0 },
      keywords: [],
      capabilitySubset: { queries: {}, actions: {} }
    };
  }

  const keywordSystemPrompt = buildKeywordPrompt();
  const keywordInput = `User request:\n"${prompt}"\n\nIntent (if available):\n${JSON.stringify(intent || {})}`;

  const keywordResult = await generate({
    prompt: keywordInput,
    systemPrompt: keywordSystemPrompt,
    config: { ...llmConfig, maxTokens: KEYWORD_MAX_TOKENS, stream: false }
  });

  const keywords = parseKeywordResponse(keywordResult.text);
  const promptTokens = tokenizeText(prompt);
  const normalizedKeywords = normalizeList(keywords).map(k => k.toLowerCase());
  const queryEntries = Object.entries(resolvedMap.queries || {});
  const actionEntries = Object.entries(resolvedMap.actions || {});
  const hasQueryMatch = hasAnyMatch(queryEntries, normalizedKeywords, promptTokens);
  const hasActionMatch = hasAnyMatch(actionEntries, normalizedKeywords, promptTokens);
  const subset = selectCapabilitySubset(resolvedMap, { keywords, prompt });
  const capabilityContext = formatCapabilitySubset(subset, resolvedMap.project);

  if (!hasQueryMatch && !hasActionMatch) {
    return {
      ...buildNoMatchResponse(resolvedMap),
      tokensUsed: keywordResult.tokensUsed || { prompt: 0, completion: 0 },
      keywords,
      capabilitySubset: subset
    };
  }

  const feasibilitySystemPrompt = buildFeasibilityPrompt(capabilityContext);
  const feasibilityInput = `User request:\n"${prompt}"\n\nIntent (if available):\n${JSON.stringify(intent || {})}\n\nKeywords:\n${keywords.join(', ') || 'none'}`;

  const feasibilityResult = await generate({
    prompt: feasibilityInput,
    systemPrompt: feasibilitySystemPrompt,
    config: { ...llmConfig, stream: false }
  });

  const parsed = parseFeasibilityResponse(feasibilityResult.text);

  let finalResult = parsed;
  if (parsed.feasible) {
    const parsedQueries = normalizeList(parsed.queries);
    const parsedActions = normalizeList(parsed.actions);

    if (parsedQueries.length === 0 && parsedActions.length === 0) {
      const intentQueries = normalizeList(intent?.queries);
      const intentActions = normalizeList(intent?.actions);
      const invalidIntentQueries = validateRefList(intentQueries, resolvedMap.queries);
      const invalidIntentActions = validateRefList(intentActions, resolvedMap.actions);

      if ((intentQueries.length > 0 || intentActions.length > 0)
        && invalidIntentQueries.length === 0
        && invalidIntentActions.length === 0) {
        finalResult = {
          feasible: true,
          reasoning: parsed.reasoning || 'Using intent-matched capabilities.',
          queries: intentQueries,
          actions: intentActions
        };
      } else {
        finalResult = {
          ...buildAmbiguousMatchResponse(resolvedMap),
          reasoning: 'No supported queries or actions were identified for this request.'
        };
      }
    } else {
      const invalidQueries = validateRefList(parsedQueries, resolvedMap.queries);
      const invalidActions = validateRefList(parsedActions, resolvedMap.actions);
      if (invalidQueries.length > 0 || invalidActions.length > 0) {
        finalResult = {
          feasible: false,
          reasoning: 'Feasibility response referenced unsupported capabilities.',
          clarifyingQuestion: buildMissingRefMessage(invalidQueries, invalidActions),
          options: []
        };
      } else {
        finalResult = {
          ...parsed,
          queries: parsedQueries,
          actions: parsedActions
        };
      }
    }
  }

  if (parsed.feasible === false && !parsed.clarifyingQuestion) {
    finalResult = buildDeterministicFallback(intent, resolvedMap);
  }

  const tokensUsed = {
    prompt: (keywordResult.tokensUsed?.prompt || 0) + (feasibilityResult.tokensUsed?.prompt || 0),
    completion: (keywordResult.tokensUsed?.completion || 0) + (feasibilityResult.tokensUsed?.completion || 0)
  };

  return {
    ...finalResult,
    tokensUsed,
    keywords,
    capabilitySubset: subset
  };
}

module.exports = {
  runFeasibilityStep,
  buildKeywordPrompt,
  buildFeasibilityPrompt,
  parseKeywordResponse,
  parseFeasibilityResponse,
  selectCapabilitySubset,
  formatCapabilitySubset,
  humanizeRef,
  tokenizeText
};

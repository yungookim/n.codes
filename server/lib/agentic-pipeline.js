'use strict';

const { generateUI, assertApiKey, getModelConfig } = require('./llm-client');
const { loadCapabilityMap } = require('./capability-map');
const { buildIntentPrompt } = require('./intent-prompt');
const { buildCodegenPrompt } = require('./codegen-prompt');
const { buildReviewPrompt, buildReviewUserPrompt } = require('./review-prompt');
const { parseCodeBlocks, validateParsedCode } = require('./code-parser');
const { resolveApiBindings } = require('./ref-extractor');
const { runFeasibilityStep } = require('./feasibility-check');

const MAX_ITERATIONS = 3;

function normalizeRefList(list) {
  if (!Array.isArray(list)) return [];
  return [...new Set(list.filter(item => typeof item === 'string' && item.trim()))];
}

/**
 * Run the intent step: parse the user's prompt into a structured intent.
 *
 * @param {string} prompt - User prompt
 * @param {object} capabilityMap
 * @param {object} llmConfig - { provider, model, maxTokens }
 * @returns {Promise<{ intent: object|null, clarifyingQuestion: object|null, tokensUsed: object }>}
 */
async function runIntentStep(prompt, capabilityMap, llmConfig) {
  const systemPrompt = buildIntentPrompt(capabilityMap);

  const { text, tokensUsed } = await generateUI({
    prompt,
    systemPrompt,
    config: { ...llmConfig, stream: false }
  });

  const parsed = parseIntentResponse(text);

  if (parsed.type === 'clarification') {
    return {
      intent: null,
      clarifyingQuestion: {
        clarifyingQuestion: parsed.question,
        options: parsed.options || [],
        reasoning: parsed.reasoning || ''
      },
      tokensUsed
    };
  }

  return { intent: parsed, clarifyingQuestion: null, tokensUsed };
}

/**
 * Parse the intent step response JSON.
 *
 * @param {string} text - Raw LLM text
 * @returns {object}
 */
function parseIntentResponse(text) {
  const trimmed = text.trim();

  // Try to extract JSON from the response
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Fallback: treat as a simple intent
    return {
      type: 'intent',
      uiType: 'custom',
      description: trimmed,
      queries: [],
      actions: [],
      entityFocus: null,
      requirements: []
    };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      type: 'intent',
      uiType: 'custom',
      description: trimmed,
      queries: [],
      actions: [],
      entityFocus: null,
      requirements: []
    };
  }
}

/**
 * Run the codegen step: generate HTML/CSS/JS from the intent.
 *
 * @param {string} userPrompt - Original user prompt
 * @param {object} intent - Structured intent from intent step
 * @param {object} capabilityMap
 * @param {object} llmConfig
 * @param {string} [feedback] - Optional QA feedback for iteration
 * @param {{ html: string, css: string, js: string }} [previousCode] - Previous code for iteration
 * @returns {Promise<{ html: string, css: string, js: string, reasoning: string, tokensUsed: object }>}
 */
async function runCodegenStep(userPrompt, intent, capabilityMap, llmConfig, feedback, previousCode) {
  const systemPrompt = buildCodegenPrompt(capabilityMap, intent);

  let prompt = userPrompt;
  if (feedback && previousCode) {
    prompt = `The previous code had issues that need to be fixed.

Original request: "${userPrompt}"

## Previous HTML
\`\`\`html
${previousCode.html}
\`\`\`

## Previous CSS
\`\`\`css
${previousCode.css}
\`\`\`

## Previous JavaScript
\`\`\`javascript
${previousCode.js}
\`\`\`

## QA Feedback
${feedback}

Please fix the issues and regenerate all three code blocks (HTML, CSS, JS).`;
  }

  const { text, tokensUsed } = await generateUI({
    prompt,
    systemPrompt,
    config: { ...llmConfig, stream: false }
  });

  const parsed = parseCodeBlocks(text);

  return {
    html: parsed.html,
    css: parsed.css,
    js: parsed.js,
    reasoning: parsed.reasoning,
    tokensUsed
  };
}

/**
 * Run the review step: QA the generated code.
 *
 * @param {string} html
 * @param {string} css
 * @param {string} js
 * @param {string} userPrompt
 * @param {object} capabilityMap
 * @param {object} llmConfig
 * @returns {Promise<{ verdict: string, issues: Array|null, notes: string|null, tokensUsed: object }>}
 */
async function runReviewStep(html, css, js, userPrompt, capabilityMap, llmConfig) {
  const systemPrompt = buildReviewPrompt(capabilityMap);
  const reviewUserPrompt = buildReviewUserPrompt(html, css, js, userPrompt);

  const { text, tokensUsed } = await generateUI({
    prompt: reviewUserPrompt,
    systemPrompt,
    config: { ...llmConfig, stream: false }
  });

  const review = parseReviewResponse(text);

  return { ...review, tokensUsed };
}

/**
 * Parse the review step response JSON.
 *
 * @param {string} text
 * @returns {{ verdict: string, issues: Array|null, notes: string|null }}
 */
function parseReviewResponse(text) {
  const trimmed = text.trim();

  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // If can't parse, treat as PASS (don't block generation on review parse failure)
    return { verdict: 'PASS', issues: null, notes: 'Review response could not be parsed' };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      verdict: parsed.verdict || 'PASS',
      issues: parsed.issues || null,
      notes: parsed.notes || null
    };
  } catch {
    return { verdict: 'PASS', issues: null, notes: 'Review response could not be parsed' };
  }
}

/**
 * Format review issues into feedback text for the iteration step.
 *
 * @param {Array} issues
 * @returns {string}
 */
function formatReviewFeedback(issues) {
  if (!issues || issues.length === 0) return '';

  return issues
    .filter(i => i.severity === 'error')
    .map(i => `- [${i.category}] ${i.description}${i.suggestion ? ` → ${i.suggestion}` : ''}`)
    .join('\n');
}

/**
 * Accumulate token usage across multiple LLM calls.
 *
 * @param {object} total
 * @param {object} step
 * @returns {object}
 */
function addTokens(total, step) {
  return {
    prompt: (total.prompt || 0) + (step.prompt || 0),
    completion: (total.completion || 0) + (step.completion || 0)
  };
}

/**
 * Run the full agentic pipeline.
 *
 * @param {object} params
 * @param {string} params.prompt - User prompt
 * @param {string} params.provider - LLM provider
 * @param {string} params.model - Model name
 * @param {object} [params.options] - Optional overrides { maxTokens }
 * @param {object} [params.capabilityMap] - Override capability map (for testing)
 * @param {function} [params.onStep] - Optional callback: onStep(stepName, status) for progress reporting
 * @returns {Promise<object>}
 */
async function runAgenticPipeline({ prompt, provider, model, options = {}, capabilityMap: mapOverride, onStep }) {
  const reportStep = typeof onStep === 'function' ? onStep : () => {};
  assertApiKey(provider);
  getModelConfig(provider, model);

  const capabilityMap = mapOverride || loadCapabilityMap();
  const llmConfig = {
    provider,
    model,
    maxTokens: options.maxTokens || 4096
  };

  let totalTokens = { prompt: 0, completion: 0 };

  // Step 1: Intent
  reportStep('intent', 'started');
  const { intent, clarifyingQuestion, tokensUsed: intentTokens } =
    await runIntentStep(prompt, capabilityMap, llmConfig);

  totalTokens = addTokens(totalTokens, intentTokens);
  reportStep('intent', 'completed');

  if (clarifyingQuestion) {
    return {
      ...clarifyingQuestion,
      tokensUsed: totalTokens
    };
  }

  // Step 1.5: Feasibility check (LLM-powered)
  reportStep('feasibility', 'started');
  const feasibility = await runFeasibilityStep({ prompt, intent, capabilityMap, llmConfig });
  totalTokens = addTokens(totalTokens, feasibility.tokensUsed);
  reportStep('feasibility', 'completed');

  if (!feasibility.feasible) {
    return {
      clarifyingQuestion: feasibility.clarifyingQuestion || 'This request is not feasible with the available capabilities.',
      options: feasibility.options || [],
      reasoning: feasibility.reasoning || '',
      feasibility: {
        feasible: false,
        keywords: feasibility.keywords || [],
        capabilitySubset: feasibility.capabilitySubset || {},
      },
      tokensUsed: totalTokens
    };
  }

  // Step 2: Generate
  reportStep('codegen', 'started');
  let codegenResult = await runCodegenStep(prompt, intent, capabilityMap, llmConfig);
  totalTokens = addTokens(totalTokens, codegenResult.tokensUsed);

  let { html, css, js } = codegenResult;
  let reasoning = codegenResult.reasoning;
  let iterations = 1;
  reportStep('codegen', 'completed');

  // Validate the parse produced HTML
  const parseValidation = validateParsedCode({ html, css, js });
  if (!parseValidation.valid) {
    return {
      error: `Code generation failed: ${parseValidation.errors.join('; ')}`,
      tokensUsed: totalTokens,
      iterations
    };
  }

  // Steps 3-4: Review + Iterate (up to MAX_ITERATIONS)
  for (let i = 0; i < MAX_ITERATIONS; i++) {
    reportStep('review', 'started');
    const review = await runReviewStep(html, css, js, prompt, capabilityMap, llmConfig);
    totalTokens = addTokens(totalTokens, review.tokensUsed);
    reportStep('review', 'completed');

    if (review.verdict === 'PASS') {
      break;
    }

    // Only iterate if there are error-severity issues
    const errorIssues = (review.issues || []).filter(i => i.severity === 'error');
    if (errorIssues.length === 0) {
      break;
    }

    // Don't iterate on the last loop
    if (i === MAX_ITERATIONS - 1) {
      break;
    }

    reportStep('iterate', 'started');
    const feedback = formatReviewFeedback(review.issues);
    const iterResult = await runCodegenStep(
      prompt, intent, capabilityMap, llmConfig,
      feedback, { html, css, js }
    );
    totalTokens = addTokens(totalTokens, iterResult.tokensUsed);

    html = iterResult.html;
    css = iterResult.css;
    js = iterResult.js;
    reasoning = iterResult.reasoning;
    iterations++;
    reportStep('iterate', 'completed');
  }

  // Step 5: Resolve API bindings
  reportStep('resolve', 'started');
  let apiBindings = [];
  if (capabilityMap && js) {
    const { apiBindings: bindings, validation, refs } = resolveApiBindings(js, capabilityMap);
    apiBindings = bindings;

    if (!validation.valid) {
      return {
        error: `Generated code referenced unsupported capabilities: ${validation.errors.join('; ')}`,
        tokensUsed: totalTokens,
        iterations
      };
    }

    const requiredQueries = normalizeRefList(feasibility?.queries);
    const requiredActions = normalizeRefList(feasibility?.actions);
    const missingQueries = requiredQueries.filter(ref => !(refs?.queries || []).includes(ref));
    const missingActions = requiredActions.filter(ref => !(refs?.actions || []).includes(ref));

    if (missingQueries.length > 0 || missingActions.length > 0) {
      const parts = [];
      if (missingQueries.length > 0) parts.push(`queries: ${missingQueries.join(', ')}`);
      if (missingActions.length > 0) parts.push(`actions: ${missingActions.join(', ')}`);
      return {
        error: `Generated code did not implement required capabilities (${parts.join(' | ')}).`,
        tokensUsed: totalTokens,
        iterations
      };
    }
  }

  reportStep('resolve', 'completed');

  console.log('[n.codes:pipeline] generated', {
    htmlLen: html.length,
    cssLen: css.length,
    jsLen: js.length,
    apiBindings: apiBindings.map(b => `${b.type}:${b.ref} → ${b.resolved.method} ${b.resolved.path}`),
    iterations
  });

  return {
    html,
    css,
    js,
    reasoning,
    apiBindings,
    iterations,
    tokensUsed: totalTokens
  };
}

module.exports = {
  runAgenticPipeline,
  runIntentStep,
  runCodegenStep,
  runReviewStep,
  parseIntentResponse,
  parseReviewResponse,
  formatReviewFeedback,
  addTokens,
  MAX_ITERATIONS
};

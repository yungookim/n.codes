const { generateUI, streamGenerateUI, ApiKeyError, ProviderError, assertApiKey, getModelConfig, createModel, DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } = require('../lib/llm-client');
const { loadCapabilityMap } = require('../lib/capability-map');
const { buildSystemPrompt } = require('../lib/prompt-builder');
const { parseDSLResponse, DSLValidationError } = require('../lib/response-parser');
const { resolveCapabilityRefs, CapabilityResolutionError } = require('../lib/capability-resolver');
const { runAgenticPipeline } = require('../lib/agentic-pipeline');
const { jobStore, STATUS } = require('../lib/job-store');
const { writeDebugArtifacts } = require('../lib/debug-logger');

const MAX_PROMPT_LENGTH = 2000;

/**
 * Validate request body common to both batch and stream paths.
 * Returns { prompt, provider, model, options } or writes error response.
 */
function validateRequest(req, res) {
  const { prompt, provider, model, options = {} } = req.body;

  if (!prompt || !provider || !model) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing required fields: prompt, provider, model' }));
    return null;
  }

  if (prompt.length > MAX_PROMPT_LENGTH) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters` }));
    return null;
  }

  return { prompt, provider, model, options };
}

/**
 * Write a single SSE event to the response.
 * @param {object} res - HTTP response
 * @param {string} event - Event type
 * @param {*} data - Event data (will be JSON-stringified)
 */
function sendSSE(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * POST /api/generate (agentic pipeline — async job pattern)
 *
 * Request body:
 *   { prompt, provider, model, options: { maxTokens, mode } }
 *
 * Response (HTTP 202):
 *   { jobId, status: "running" }
 *
 * The pipeline runs in the background. Poll GET /api/jobs/:jobId for results.
 * Set options.mode = 'dsl' to use the legacy DSL pipeline (synchronous).
 */
async function handleGenerate(req, res) {
  try {
    const params = validateRequest(req, res);
    if (!params) return;

    const { prompt, provider, model, options } = params;

    // Legacy DSL mode behind a flag (remains synchronous)
    if (options.mode === 'dsl') {
      return handleLegacyGenerate(req, res, params);
    }

    // Validate config eagerly so we can return 4xx before creating a job
    assertApiKey(provider);
    getModelConfig(provider, model);

    // Create job and return immediately
    const job = jobStore.createJob(prompt, provider, model);
    console.log('[n.codes] Job created:', job.id, '| store size:', jobStore.size);

    res.writeHead(202, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ jobId: job.id, status: job.status }));

    // Fire-and-forget: run pipeline in background
    runAgenticPipeline({
      prompt,
      provider,
      model,
      options,
      onStep(stepName, stepStatus) {
        if (stepStatus === 'started') {
          jobStore.updateJob(job.id, { step: stepName });
        }
      },
    }).then((result) => {
      if (result.clarifyingQuestion) {
        console.log('[n.codes] Job clarification:', job.id);
        jobStore.updateJob(job.id, {
          status: STATUS.CLARIFICATION,
          result,
        });
      } else if (result.error) {
        console.log('[n.codes] Job failed:', job.id, result.error);
        jobStore.updateJob(job.id, {
          status: STATUS.FAILED,
          error: result.error,
        });
      } else {
        console.log('[n.codes] Job completed:', job.id, {
          htmlLen: result.html?.length,
          cssLen: result.css?.length,
          jsLen: result.js?.length,
          bindings: result.apiBindings?.length
        });
        jobStore.updateJob(job.id, {
          status: STATUS.COMPLETED,
          step: null,
          result,
        });

        // Write debug artifacts when DEBUG_NCODES is set
        writeDebugArtifacts(job.id, prompt, provider, model, result).catch(() => {});
      }
    }).catch((err) => {
      console.log('[n.codes] Job error:', job.id, err.message);
      jobStore.updateJob(job.id, {
        status: STATUS.FAILED,
        error: err.message,
      });
    });
  } catch (error) {
    writeErrorResponse(res, error);
  }
}

/**
 * GET /api/jobs/:jobId — poll for job status.
 *
 * Response (running):
 *   { status: "running", step: "codegen" }
 *
 * Response (completed):
 *   { status: "completed", result: { html, css, js, ... } }
 *
 * Response (failed):
 *   { status: "failed", error: "..." }
 *
 * Response (clarification):
 *   { status: "clarification", result: { clarifyingQuestion, options, ... } }
 */
function handleGetJob(req, res) {
  const { jobId } = req.params;
  const job = jobStore.getJob(jobId);
  console.log('[n.codes] Poll job:', jobId, '| found:', !!job, '| store size:', jobStore.size);

  if (!job) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Job not found' }));
    return;
  }

  const response = { status: job.status };

  if (job.status === STATUS.RUNNING) {
    response.step = job.step;
  } else if (job.status === STATUS.COMPLETED || job.status === STATUS.CLARIFICATION) {
    response.result = job.result;
  } else if (job.status === STATUS.FAILED) {
    response.error = job.error;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(response));
}

/**
 * Legacy DSL generation (kept for backward compatibility).
 */
async function handleLegacyGenerate(req, res, params) {
  const { prompt, provider, model, options } = params;
  const capabilityMap = loadCapabilityMap();
  const systemPrompt = buildSystemPrompt(capabilityMap || null);

  const { text, tokensUsed } = await generateUI({
    prompt,
    systemPrompt,
    config: {
      provider,
      model,
      maxTokens: options.maxTokens,
      stream: false
    }
  });

  let { dsl, reasoning } = parseDSLResponse(text);

  if (capabilityMap) {
    dsl = resolveCapabilityRefs(dsl, capabilityMap);
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ dsl, reasoning, tokensUsed }));
}

/**
 * POST /api/generate/stream (SSE streaming mode)
 *
 * Request body:
 *   { prompt, provider, model, options: { maxTokens } }
 *
 * For the agentic pipeline, streams step-level progress events:
 *   event: step    data: { step: "intent"|"codegen"|"review"|"iterate", status: "started"|"completed" }
 *   event: done    data: { html, css, js, reasoning, apiBindings, iterations, tokensUsed }
 *   event: error   data: { error }
 *
 * Set options.mode = 'dsl' for legacy DSL streaming.
 */
async function handleStreamGenerate(req, res) {
  let sseStarted = false;

  try {
    const params = validateRequest(req, res);
    if (!params) return;

    const { prompt, provider, model, options } = params;

    // Legacy DSL streaming
    if (options.mode === 'dsl') {
      return handleLegacyStreamGenerate(req, res, params);
    }

    // Validate config before starting SSE
    assertApiKey(provider);
    getModelConfig(provider, model);

    // Start SSE response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    sseStarted = true;

    sendSSE(res, 'step', { step: 'pipeline', status: 'started' });

    const result = await runAgenticPipeline({
      prompt,
      provider,
      model,
      options
    });

    if (result.error) {
      sendSSE(res, 'error', { error: result.error });
      res.end();
      return;
    }

    sendSSE(res, 'done', result);
    res.end();
  } catch (error) {
    if (sseStarted) {
      const payload = { error: error.message };
      if (error instanceof DSLValidationError) {
        payload.validationErrors = error.errors;
      } else if (error instanceof CapabilityResolutionError) {
        payload.resolutionErrors = error.errors;
      }
      sendSSE(res, 'error', payload);
      res.end();
    } else {
      writeErrorResponse(res, error);
    }
  }
}

/**
 * Legacy DSL streaming handler.
 */
async function handleLegacyStreamGenerate(req, res, params) {
  const { prompt, provider, model, options } = params;
  const maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;

  assertApiKey(provider);
  getModelConfig(provider, model);

  const capabilityMap = loadCapabilityMap();
  const systemPrompt = buildSystemPrompt(capabilityMap || null);
  const llmModel = await createModel(provider, model);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const { streamText } = await import('ai');

  const streamOptions = {
    model: llmModel,
    system: systemPrompt,
    prompt,
    temperature: DEFAULT_TEMPERATURE
  };

  if (provider === 'openai') {
    streamOptions.maxCompletionTokens = maxTokens;
  } else {
    streamOptions.maxTokens = maxTokens;
  }

  const stream = streamText(streamOptions);

  let fullText = '';
  for await (const chunk of (await stream).textStream) {
    fullText += chunk;
    sendSSE(res, 'chunk', { text: chunk });
  }

  const usage = await (await stream).usage;
  const tokensUsed = {
    prompt: usage?.promptTokens || 0,
    completion: usage?.completionTokens || 0
  };

  let { dsl, reasoning } = parseDSLResponse(fullText);

  if (capabilityMap) {
    dsl = resolveCapabilityRefs(dsl, capabilityMap);
  }

  sendSSE(res, 'done', { dsl, reasoning, tokensUsed });
  res.end();
}

/**
 * Write a JSON error response with appropriate status code.
 */
function writeErrorResponse(res, error) {
  let status = 500;
  if (error instanceof ApiKeyError) status = 401;
  else if (error instanceof ProviderError) status = 400;
  else if (error instanceof DSLValidationError) status = 422;
  else if (error instanceof CapabilityResolutionError) status = 422;

  const body = { error: error.message };
  if (error instanceof DSLValidationError) {
    body.validationErrors = error.errors;
  } else if (error instanceof CapabilityResolutionError) {
    body.resolutionErrors = error.errors;
  }

  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

module.exports = {
  handleGenerate,
  handleGetJob,
  handleStreamGenerate,
  handleLegacyGenerate,
  validateRequest,
  sendSSE,
  writeErrorResponse,
  MAX_PROMPT_LENGTH
};

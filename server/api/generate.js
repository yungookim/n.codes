const { generateUI, streamGenerateUI, ApiKeyError, ProviderError, assertApiKey, getModelConfig, createModel, DEFAULT_MAX_TOKENS, DEFAULT_TEMPERATURE } = require('../lib/llm-client');
const { buildSystemPrompt } = require('../lib/prompt-builder');
const { parseDSLResponse, DSLValidationError } = require('../lib/response-parser');

const MAX_PROMPT_LENGTH = 2000;

/**
 * Validate request body common to both batch and stream paths.
 * Returns { prompt, capabilityMap, provider, model, options } or writes error response.
 */
function validateRequest(req, res) {
  const { prompt, capabilityMap, provider, model, options = {} } = req.body;

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

  return { prompt, capabilityMap, provider, model, options };
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
 * POST /api/generate (batch mode)
 *
 * Request body:
 *   { prompt, capabilityMap, provider, model, options: { maxTokens } }
 *
 * Response:
 *   { dsl, reasoning, tokensUsed }
 */
async function handleGenerate(req, res) {
  try {
    const params = validateRequest(req, res);
    if (!params) return;

    const { prompt, capabilityMap, provider, model, options } = params;
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

    const { dsl, reasoning } = parseDSLResponse(text);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ dsl, reasoning, tokensUsed }));
  } catch (error) {
    writeErrorResponse(res, error);
  }
}

/**
 * POST /api/generate/stream (SSE streaming mode)
 *
 * Request body:
 *   { prompt, capabilityMap, provider, model, options: { maxTokens } }
 *
 * SSE events:
 *   event: chunk   data: { text: "partial..." }
 *   event: done    data: { dsl, reasoning, tokensUsed }
 *   event: error   data: { error, validationErrors? }
 */
async function handleStreamGenerate(req, res) {
  let sseStarted = false;

  try {
    const params = validateRequest(req, res);
    if (!params) return;

    const { prompt, capabilityMap, provider, model, options } = params;
    const maxTokens = options.maxTokens || DEFAULT_MAX_TOKENS;

    // Validate config before starting SSE (errors here return JSON)
    assertApiKey(provider);
    getModelConfig(provider, model);

    const systemPrompt = buildSystemPrompt(capabilityMap || null);
    const llmModel = await createModel(provider, model);

    // Start SSE response
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    sseStarted = true;

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

    // Collect full text while sending chunks
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

    // Validate the complete response
    const { dsl, reasoning } = parseDSLResponse(fullText);

    sendSSE(res, 'done', { dsl, reasoning, tokensUsed });
    res.end();
  } catch (error) {
    if (sseStarted) {
      // Already in SSE mode — send error as SSE event
      const payload = { error: error.message };
      if (error instanceof DSLValidationError) {
        payload.validationErrors = error.errors;
      }
      sendSSE(res, 'error', payload);
      res.end();
    } else {
      // Haven't started SSE yet — send normal JSON error
      writeErrorResponse(res, error);
    }
  }
}

/**
 * Write a JSON error response with appropriate status code.
 */
function writeErrorResponse(res, error) {
  let status = 500;
  if (error instanceof ApiKeyError) status = 401;
  else if (error instanceof ProviderError) status = 400;
  else if (error instanceof DSLValidationError) status = 422;

  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: error.message,
    ...(error instanceof DSLValidationError && { validationErrors: error.errors })
  }));
}

module.exports = {
  handleGenerate,
  handleStreamGenerate,
  validateRequest,
  sendSSE,
  writeErrorResponse,
  MAX_PROMPT_LENGTH
};

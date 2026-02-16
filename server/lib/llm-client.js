const SUPPORTED_MODELS = {
  openai: ['gpt-5-mini', 'gpt-5.2'],
  claude: ['claude-sonnet-4-5', 'claude-opus-4-5', 'claude-haiku-4-5']
};

const PROVIDER_ENV_VARS = {
  openai: 'OPENAI_API_KEY',
  claude: 'ANTHROPIC_API_KEY'
};

const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.7;

function resolveTemperature(provider, model) {
  if (provider === 'openai' && /^gpt-5/.test(model)) return 1;
  return DEFAULT_TEMPERATURE;
}

function getModelConfig(provider, model) {
  if (!SUPPORTED_MODELS[provider]) {
    throw new Error(`Unsupported provider: ${provider}. Supported: ${Object.keys(SUPPORTED_MODELS).join(', ')}`);
  }
  if (!SUPPORTED_MODELS[provider].includes(model)) {
    throw new Error(`Unsupported model "${model}" for provider "${provider}". Supported: ${SUPPORTED_MODELS[provider].join(', ')}`);
  }
  return {
    provider,
    model,
    envVar: PROVIDER_ENV_VARS[provider]
  };
}

class ApiKeyError extends Error {
  constructor(envVar) {
    super(`Missing ${envVar}. Set it in .env.local or as an environment variable.`);
    this.name = 'ApiKeyError';
  }
}

class ProviderError extends Error {
  constructor(provider) {
    super(`Unsupported provider: ${provider}`);
    this.name = 'ProviderError';
  }
}

function assertApiKey(provider) {
  const envVar = PROVIDER_ENV_VARS[provider];
  if (!envVar) {
    throw new ProviderError(provider);
  }
  const apiKey = process.env[envVar];
  if (!apiKey) {
    throw new ApiKeyError(envVar);
  }
  return apiKey;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, { maxAttempts = 3, baseDelay = 1000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

function createSemaphore(limit) {
  let current = 0;
  const queue = [];

  return {
    acquire() {
      return new Promise((resolve) => {
        if (current < limit) {
          current++;
          resolve();
        } else {
          queue.push(resolve);
        }
      });
    },
    release() {
      current--;
      if (queue.length > 0) {
        current++;
        const next = queue.shift();
        next();
      }
    }
  };
}

async function createModel(provider, model) {
  if (provider === 'openai') {
    const { openai } = await import('@ai-sdk/openai');
    return openai(model);
  } else if (provider === 'claude') {
    const { anthropic } = await import('@ai-sdk/anthropic');
    return anthropic(model);
  }
  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Generate UI via LLM.
 *
 * @param {object} params
 * @param {string} params.prompt - User prompt describing the desired UI
 * @param {string} params.systemPrompt - System prompt with DSL schema and capability context
 * @param {object} params.config - Configuration object
 * @param {string} params.config.provider - LLM provider ('openai' or 'claude')
 * @param {string} params.config.model - Model identifier
 * @param {number} [params.config.maxTokens] - Max tokens (default 4096)
 * @param {boolean} [params.config.stream] - Enable streaming (default false)
 * @returns {Promise<{text: string, tokensUsed: {prompt: number, completion: number}}>}
 */
async function generateUI({ prompt, systemPrompt, config }) {
  const { provider, model: modelName } = config;
  const maxTokens = config.maxTokens || DEFAULT_MAX_TOKENS;
  const stream = config.stream || false;

  assertApiKey(provider);
  getModelConfig(provider, modelName);

  const model = await createModel(provider, modelName);

  if (stream) {
    return streamGenerateUI({ model, prompt, systemPrompt, provider, maxTokens });
  }

  const result = await withRetry(async () => {
    const { generateText } = await import('ai');

    const options = {
      model,
      system: systemPrompt,
      prompt,
      temperature: resolveTemperature(provider, modelName)
    };

    // OpenAI uses maxCompletionTokens; Anthropic uses maxTokens
    if (provider === 'openai') {
      options.maxCompletionTokens = maxTokens;
    } else {
      options.maxTokens = maxTokens;
    }

    const response = await generateText(options);
    return response;
  }, { maxAttempts: 3, baseDelay: 1000 });

  return {
    text: result.text,
    tokensUsed: {
      prompt: result.usage?.promptTokens || 0,
      completion: result.usage?.completionTokens || 0
    }
  };
}

/**
 * Streaming variant — returns an async iterable of text chunks.
 * Placeholder for NCO-42; will use streamText() from Vercel AI SDK.
 */
async function streamGenerateUI({ model, prompt, systemPrompt, provider, maxTokens }) {
  const { streamText } = await import('ai');

  const options = {
    model,
    system: systemPrompt,
    prompt,
    temperature: resolveTemperature(provider, modelName)
  };

  if (provider === 'openai') {
    options.maxCompletionTokens = maxTokens;
  } else {
    options.maxTokens = maxTokens;
  }

  const stream = await streamText(options);

  return {
    stream,
    async collectResult() {
      let fullText = '';
      let tokensUsed = { prompt: 0, completion: 0 };

      for await (const chunk of stream.textStream) {
        fullText += chunk;
      }

      const usage = await stream.usage;
      tokensUsed = {
        prompt: usage?.promptTokens || 0,
        completion: usage?.completionTokens || 0
      };

      return { text: fullText, tokensUsed };
    }
  };
}

module.exports = {
  SUPPORTED_MODELS,
  PROVIDER_ENV_VARS,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  ApiKeyError,
  ProviderError,
  getModelConfig,
  resolveTemperature,
  assertApiKey,
  sleep,
  withRetry,
  createSemaphore,
  createModel,
  generateUI,
  streamGenerateUI
};

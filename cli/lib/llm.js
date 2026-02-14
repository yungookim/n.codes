const SUPPORTED_MODELS = {
  openai: ['gpt-5-mini', 'gpt-5.2'],
  claude: ['claude-sonnet-4-5', 'claude-opus-4-5', 'claude-haiku-4-5']
};

const PROVIDER_ENV_VARS = {
  openai: 'OPENAI_API_KEY',
  claude: 'ANTHROPIC_API_KEY'
};

function getModelConfig(config) {
  const { provider, model } = config;
  return {
    provider,
    model,
    envVar: PROVIDER_ENV_VARS[provider] || null
  };
}

function assertApiKey(config) {
  const modelConfig = getModelConfig(config);
  if (!modelConfig.envVar) {
    throw new Error(`Unsupported provider: ${modelConfig.provider}`);
  }
  const apiKey = process.env[modelConfig.envVar];
  if (!apiKey) {
    throw new Error(`Missing ${modelConfig.envVar}. Set it in .env.local or run n.codes init.`);
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

async function analyzeWithLLM({
  routeContext,
  method,
  path,
  config,
  heuristicDescription
}) {
  const allowHeuristicFallback = config?.allowHeuristicFallback === true;

  try {
    assertApiKey(config);
    const { generateText } = await import('ai');
    let model;

    if (config.provider === 'openai') {
      const { openai } = await import('@ai-sdk/openai');
      model = openai(config.model);
    } else if (config.provider === 'claude') {
      const { anthropic } = await import('@ai-sdk/anthropic');
      model = anthropic(config.model);
    } else {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }

    const prompt = buildAnalysisPrompt({ routeContext, method, path });

    const result = await withRetry(async () => {
      const options = { model, prompt };
      if (config.provider === 'openai') {
        options.maxCompletionTokens = 1500;
        options.temperature = 1;
      } else {
        options.maxTokens = 1500;
        options.temperature = 1;
      }
      const { text } = await generateText(options);
      return text;
    }, { maxAttempts: 3, baseDelay: 1000 });

    const parsed = parseAnalysisResponse(result);
    return {
      fallback: false,
      description: parsed.description || heuristicDescription,
      responseFormat: parsed.responseFormat || null,
      queryParams: parsed.queryParams || [],
      requestBody: parsed.requestBody || [],
      entities: parsed.entities || []
    };
  } catch (error) {
    if (allowHeuristicFallback) {
      return {
        fallback: true,
        description: heuristicDescription,
        entities: [],
        error: error.message
      };
    }
    throw error;
  }
}

function buildAnalysisPrompt({ routeContext, method, path }) {
  const language = routeContext.routeFile.endsWith('.ts') ? 'typescript' : 'javascript';

  let prompt = `You are analyzing an API route to document its capabilities.

## Route Information
- Method: ${method}
- Path: ${path}
- File: ${routeContext.routeFile}

## Route Code
\`\`\`${language}
${routeContext.routeContent}
\`\`\`
`;

  if (routeContext.imports.length > 0) {
    prompt += '\n## Imported Dependencies\n';
    for (const imp of routeContext.imports) {
      const impLang = imp.path.endsWith('.ts') ? 'typescript' : 'javascript';
      prompt += `\n### ${imp.path}\n\`\`\`${impLang}\n${imp.content}\n\`\`\`\n`;
    }
  }

  prompt += `
## Task
Analyze this route and respond in JSON only (no markdown code blocks).
Only describe the handler for the method specified above. If other HTTP methods are present in the file, ignore them and do not mention them.

Include:
- A rich description mentioning what the endpoint returns (e.g., "Returns an array of task objects" or "Returns the created task")
- The response format (what shape the response is)
- Query parameters the endpoint accepts (if any, look for req.query usage)
- Request body fields the endpoint expects (if any, look for req.body usage)
- Entity descriptions with allowed/enum values when visible in code (e.g., "Status is one of: todo, in-progress, done")

Example:
{
  "description": "Lists all tasks with optional filtering by status. Returns an array of task objects sorted by creation date.",
  "responseFormat": "array of Task objects",
  "queryParams": ["status", "assignee"],
  "requestBody": [],
  "entities": [
    {
      "name": "Task",
      "fields": ["id", "title", "status", "priority", "assignee", "createdAt"],
      "description": "A task item. Status is one of: todo, in-progress, done. Priority is one of: low, medium, high.",
      "source": "inferred"
    }
  ]
}`;

  return prompt;
}

function parseAnalysisResponse(text) {
  // Try to extract JSON from response
  let jsonStr = text.trim();

  // Handle markdown code blocks
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return {
      description: parsed.description || null,
      responseFormat: parsed.responseFormat || null,
      queryParams: Array.isArray(parsed.queryParams) ? parsed.queryParams : [],
      requestBody: Array.isArray(parsed.requestBody) ? parsed.requestBody : [],
      entities: Array.isArray(parsed.entities) ? parsed.entities : []
    };
  } catch {
    return { description: null, responseFormat: null, queryParams: [], requestBody: [], entities: [] };
  }
}

module.exports = {
  SUPPORTED_MODELS,
  getModelConfig,
  assertApiKey,
  sleep,
  withRetry,
  createSemaphore,
  analyzeWithLLM,
  buildAnalysisPrompt,
  parseAnalysisResponse
};

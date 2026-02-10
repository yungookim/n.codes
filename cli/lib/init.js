const {
  defaultConfig,
  validateProvider,
  resolveConfigPath,
  saveConfig,
} = require('./config');

const PROVIDER_MODELS = {
  openai: ['gpt-5-mini', 'gpt-5.2'],
  claude: ['claude-sonnet-4-5', 'claude-opus-4-5', 'claude-haiku-4-5'],
};

function getProviderQuestion() {
  return {
    key: 'provider',
    prompt: 'Select LLM provider (openai, claude)',
    defaultValue: 'openai',
  };
}

function getProjectNameQuestion() {
  return {
    key: 'projectName',
    prompt: 'Project name (optional)',
    defaultValue: '',
  };
}

function formatModelChoices(provider) {
  const models = PROVIDER_MODELS[provider] || [];
  return models.map((model, i) => `  ${i + 1}. ${model}`).join('\n');
}

function parseModelChoice(input, provider) {
  const models = PROVIDER_MODELS[provider] || [];
  const trimmed = String(input || '').trim();
  if (!trimmed) return models[0] || 'default';
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num >= 1 && num <= models.length) {
    return models[num - 1];
  }
  if (models.includes(trimmed)) {
    return trimmed;
  }
  return models[0] || 'default';
}

function normalizeAnswer(value, fallback) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return fallback;
  return trimmed;
}

function parseYesNo(input, fallback = false) {
  const trimmed = String(input || '').trim().toLowerCase();
  if (!trimmed) return fallback;
  if (['y', 'yes', 'true', '1'].includes(trimmed)) return true;
  if (['n', 'no', 'false', '0'].includes(trimmed)) return false;
  return fallback;
}

function apiKeyEnvVar(provider) {
  switch (provider) {
    case 'openai':
      return 'OPENAI_API_KEY';
    case 'claude':
      return 'ANTHROPIC_API_KEY';
    case 'grok':
      return 'GROK_API_KEY';
    case 'gemini':
      return 'GOOGLE_API_KEY';
    default:
      return 'LLM_API_KEY';
  }
}

function formatEnvValue(value) {
  if (/[\s#"'`]/.test(value)) {
    return JSON.stringify(value);
  }
  return value;
}

function parseEnvValue(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return trimmed.slice(1, -1);
    }
  }
  const commentIndex = trimmed.indexOf(' #');
  if (commentIndex !== -1) {
    return trimmed.substring(0, commentIndex).trimEnd();
  }
  return trimmed;
}

function readEnvVar({ cwd, fs, path, key }) {
  const envPaths = [path.join(cwd, '.env.local'), path.join(cwd, '.env')];
  const pattern = new RegExp(`^\\s*(export\\s+)?${key}\\s*=\\s*(.*)$`);
  for (const envPath of envPaths) {
    if (!fs.existsSync(envPath)) continue;
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      if (!line || !line.trim() || line.trim().startsWith('#')) continue;
      const match = line.match(pattern);
      if (match) {
        return { envPath, value: parseEnvValue(match[2] || '') };
      }
    }
  }
  return { envPath: envPaths[0], value: '' };
}

function upsertEnvVar(content, key, value) {
  const lines = content.split(/\r?\n/).filter((line, index, arr) => {
    if (index !== arr.length - 1) return true;
    return line.trim().length > 0;
  });
  const pattern = new RegExp(`^\\s*(export\\s+)?${key}\\s*=`);
  const formatted = `${key}=${formatEnvValue(value)}`;
  let found = false;
  const updated = lines.map((line) => {
    if (pattern.test(line)) {
      found = true;
      return formatted;
    }
    return line;
  });
  if (!found) {
    updated.push(formatted);
  }
  return `${updated.join('\n')}\n`;
}

function writeEnvFile({ cwd, fs, path, key, value }) {
  const envPath = path.join(cwd, '.env.local');
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const updated = upsertEnvVar(existing, key, value);
  fs.writeFileSync(envPath, updated, 'utf8');
  return envPath;
}

async function ensureApiKey({ cwd, fs, path, io, provider }) {
  const apiKeyVar = apiKeyEnvVar(provider);
  const existingEnv = process.env[apiKeyVar];
  if (existingEnv) {
    return { envPath: null, key: apiKeyVar, value: existingEnv, existing: true };
  }
  const existing = readEnvVar({ cwd, fs, path, key: apiKeyVar });
  if (existing.value) {
    process.env[apiKeyVar] = existing.value;
    return { envPath: existing.envPath, key: apiKeyVar, value: existing.value, existing: true };
  }
  const apiKey = normalizeAnswer(await io.prompt(`API key for ${provider} (${apiKeyVar}) `), '');
  if (!apiKey) {
    const message = `API key is required for ${provider}.`;
    throw new Error(message);
  }
  const envPath = writeEnvFile({ cwd, fs, path, key: apiKeyVar, value: apiKey });
  process.env[apiKeyVar] = apiKey;
  io.log(`Saved API key to ${envPath}`);
  return { envPath, key: apiKeyVar, value: apiKey, existing: false };
}

async function runInit({ cwd, fs, path, io, configPath }) {
  const providerQuestion = getProviderQuestion();
  const providerResponse = await io.prompt(`${providerQuestion.prompt} [${providerQuestion.defaultValue}] `);
  const providerAnswer = normalizeAnswer(providerResponse, providerQuestion.defaultValue);

  const providerCheck = validateProvider(providerAnswer);
  if (!providerCheck.valid) {
    throw new Error(providerCheck.error);
  }

  const provider = providerCheck.provider;
  const models = PROVIDER_MODELS[provider] || [];
  io.log(`\nAvailable models for ${provider}:\n${formatModelChoices(provider)}`);
  const modelResponse = await io.prompt(`Select model (1-${models.length}) [1] `);
  const model = parseModelChoice(modelResponse, provider);

  io.log('\nHeuristic fallback is much less accurate and not context-aware.');
  const fallbackResponse = await io.prompt('Enable heuristic fallback if LLM fails? (y/N) ');
  const allowHeuristicFallback = parseYesNo(fallbackResponse, false);

  const projectQuestion = getProjectNameQuestion();
  const projectResponse = await io.prompt(`${projectQuestion.prompt} [${projectQuestion.defaultValue}] `);
  const projectName = normalizeAnswer(projectResponse, projectQuestion.defaultValue);

  const config = {
    ...defaultConfig(),
    provider,
    model,
    projectName: projectName || null,
    allowHeuristicFallback,
  };

  const targetPath = configPath || resolveConfigPath({ cwd, path });
  saveConfig({ cwd, fs, path, config, configPath: targetPath });
  io.log(`Saved config to ${targetPath}`);
  await ensureApiKey({ cwd, fs, path, io, provider });

  return { config, path: targetPath };
}

function detectProviderFromEnv() {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.ANTHROPIC_API_KEY) return 'claude';
  return null;
}

function resolveDefaultModel(provider) {
  const models = PROVIDER_MODELS[provider];
  if (!models || models.length === 0) return 'default';
  return models[0];
}

function ensureApiKeyNonInteractive({ cwd, fs, path, provider }) {
  const apiKeyVar = apiKeyEnvVar(provider);
  const existingEnv = process.env[apiKeyVar];
  if (existingEnv) {
    return { envPath: null, key: apiKeyVar, value: existingEnv, existing: true };
  }
  const existing = readEnvVar({ cwd, fs, path, key: apiKeyVar });
  if (existing.value) {
    process.env[apiKeyVar] = existing.value;
    return { envPath: existing.envPath, key: apiKeyVar, value: existing.value, existing: true };
  }
  const message = `API key ${apiKeyVar} not found in environment or .env.local. Set it before running in non-interactive mode.`;
  throw new Error(message);
}

async function runInitNonInteractive({ cwd, fs, path, io, configPath, provider, model, auto }) {
  let resolvedProvider = provider;
  if (!resolvedProvider && auto) {
    resolvedProvider = detectProviderFromEnv();
    if (process.env.OPENAI_API_KEY && process.env.ANTHROPIC_API_KEY) {
      io.log('Both OPENAI_API_KEY and ANTHROPIC_API_KEY found. Defaulting to openai. Use --provider to override.');
    }
  }
  if (!resolvedProvider) {
    const message = auto
      ? 'No API key found in environment. Set OPENAI_API_KEY or ANTHROPIC_API_KEY, then re-run with --auto.'
      : 'Provider is required. Use --provider <openai|claude> or --auto to detect from environment.';
    throw new Error(message);
  }

  const providerCheck = validateProvider(resolvedProvider);
  if (!providerCheck.valid) {
    throw new Error(providerCheck.error);
  }

  const validProvider = providerCheck.provider;
  const resolvedModel = model || resolveDefaultModel(validProvider);

  const config = {
    ...defaultConfig(),
    provider: validProvider,
    model: resolvedModel,
    allowHeuristicFallback: false,
  };

  const targetPath = configPath || resolveConfigPath({ cwd, path });
  saveConfig({ cwd, fs, path, config, configPath: targetPath });
  io.log(`Saved config to ${targetPath}`);

  ensureApiKeyNonInteractive({ cwd, fs, path, provider: validProvider });

  return { config, path: targetPath };
}

module.exports = {
  PROVIDER_MODELS,
  getProviderQuestion,
  getProjectNameQuestion,
  formatModelChoices,
  parseModelChoice,
  normalizeAnswer,
  parseYesNo,
  apiKeyEnvVar,
  readEnvVar,
  parseEnvValue,
  formatEnvValue,
  upsertEnvVar,
  writeEnvFile,
  ensureApiKey,
  runInit,
  detectProviderFromEnv,
  resolveDefaultModel,
  runInitNonInteractive,
};

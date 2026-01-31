function defaultConfig() {
  return {
    provider: 'openai',
    model: 'default',
    projectName: null,
    capabilityMapPath: 'n.codes.capabilities.yaml',
  };
}

function normalizeProvider(provider) {
  if (!provider) return null;
  return String(provider).trim().toLowerCase();
}

function isSupportedProvider(provider) {
  return ['openai', 'claude', 'grok', 'gemini'].includes(provider);
}

function validateProvider(provider) {
  const normalized = normalizeProvider(provider);
  if (!normalized) {
    return { valid: false, provider: null, error: 'Provider is required.' };
  }
  if (!isSupportedProvider(normalized)) {
    return { valid: false, provider: normalized, error: `Unsupported provider: ${normalized}` };
  }
  return { valid: true, provider: normalized, error: null };
}

function resolveConfigPath({ cwd, path, configPath }) {
  if (configPath) return configPath;
  return path.join(cwd, 'n.codes.config.json');
}

function loadConfig({ cwd, fs, path, configPath }) {
  const resolvedPath = resolveConfigPath({ cwd, path, configPath });
  if (!fs.existsSync(resolvedPath)) {
    return { config: defaultConfig(), exists: false, path: resolvedPath };
  }
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const data = JSON.parse(raw);
  const config = { ...defaultConfig(), ...data };
  return { config, exists: true, path: resolvedPath };
}

function saveConfig({ cwd, fs, path, config, configPath }) {
  const resolvedPath = resolveConfigPath({ cwd, path, configPath });
  const payload = JSON.stringify(config, null, 2);
  fs.writeFileSync(resolvedPath, payload, 'utf8');
  return resolvedPath;
}

module.exports = {
  defaultConfig,
  normalizeProvider,
  isSupportedProvider,
  validateProvider,
  resolveConfigPath,
  loadConfig,
  saveConfig,
};

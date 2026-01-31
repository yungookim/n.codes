const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  defaultConfig,
  normalizeProvider,
  isSupportedProvider,
  validateProvider,
  resolveConfigPath,
  loadConfig,
  saveConfig,
} = require('../lib/config');
const { createTempDir } = require('./helpers');

test('defaultConfig provides baseline values', () => {
  const config = defaultConfig();
  assert.equal(config.provider, 'openai');
  assert.equal(config.model, 'default');
  assert.equal(config.capabilityMapPath, 'n.codes.capabilities.yaml');
});

test('provider validation normalizes and checks supported list', () => {
  assert.equal(normalizeProvider(' OpenAI '), 'openai');
  assert.equal(isSupportedProvider('openai'), true);
  assert.equal(isSupportedProvider('unknown'), false);
  const result = validateProvider('Gemini');
  assert.equal(result.valid, true);
  assert.equal(result.provider, 'gemini');
});

test('validateProvider requires a provider', () => {
  const result = validateProvider('');
  assert.equal(result.valid, false);
  assert.ok(result.error.includes('required'));
});

test('loadConfig returns defaults when file is missing', () => {
  const cwd = createTempDir();
  const result = loadConfig({ cwd, fs, path });
  assert.equal(result.exists, false);
  assert.equal(result.config.provider, 'openai');
});

test('saveConfig writes config file that loadConfig can read', () => {
  const cwd = createTempDir();
  const configPath = resolveConfigPath({ cwd, path });
  const config = { ...defaultConfig(), provider: 'grok' };
  const savedPath = saveConfig({ cwd, fs, path, config });
  assert.equal(savedPath, configPath);
  const loaded = loadConfig({ cwd, fs, path });
  assert.equal(loaded.config.provider, 'grok');
});

test('resolveConfigPath honors explicit config path', () => {
  const cwd = '/tmp/project';
  const resolved = resolveConfigPath({ cwd, path, configPath: '/tmp/custom.json' });
  assert.equal(resolved, '/tmp/custom.json');
});

test('loadConfig uses explicit config path when provided', () => {
  const cwd = createTempDir();
  const customPath = path.join(cwd, 'custom.config.json');
  fs.writeFileSync(customPath, JSON.stringify({ provider: 'claude' }), 'utf8');
  const loaded = loadConfig({ cwd, fs, path, configPath: customPath });
  assert.equal(loaded.exists, true);
  assert.equal(loaded.config.provider, 'claude');
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  PROVIDER_MODELS,
  getProviderQuestion,
  formatModelChoices,
  parseModelChoice,
  normalizeAnswer,
  runInit,
} = require('../lib/init');
const { createMemoryIO } = require('../lib/io');
const { createTempDir } = require('./helpers');

test('getProviderQuestion returns provider prompt', () => {
  const question = getProviderQuestion();
  assert.equal(question.key, 'provider');
  assert.equal(question.defaultValue, 'openai');
});

test('PROVIDER_MODELS contains openai and claude', () => {
  assert.ok(PROVIDER_MODELS.openai.length >= 2);
  assert.ok(PROVIDER_MODELS.claude.length >= 3);
  assert.ok(PROVIDER_MODELS.openai.includes('gpt-5-mini'));
  assert.ok(PROVIDER_MODELS.claude.includes('claude-sonnet-4-5'));
});

test('formatModelChoices formats numbered list', () => {
  const choices = formatModelChoices('openai');
  assert.ok(choices.includes('1. gpt-5-mini'));
  assert.ok(choices.includes('2. gpt-5.2'));
});

test('parseModelChoice handles number input', () => {
  assert.equal(parseModelChoice('1', 'openai'), 'gpt-5-mini');
  assert.equal(parseModelChoice('2', 'openai'), 'gpt-5.2');
  assert.equal(parseModelChoice('1', 'claude'), 'claude-sonnet-4-5');
});

test('parseModelChoice handles model name input', () => {
  assert.equal(parseModelChoice('gpt-5.2', 'openai'), 'gpt-5.2');
  assert.equal(parseModelChoice('claude-opus-4-5', 'claude'), 'claude-opus-4-5');
});

test('parseModelChoice defaults to first model', () => {
  assert.equal(parseModelChoice('', 'openai'), 'gpt-5-mini');
  assert.equal(parseModelChoice('99', 'openai'), 'gpt-5-mini');
  assert.equal(parseModelChoice('invalid', 'claude'), 'claude-sonnet-4-5');
});

test('normalizeAnswer falls back when empty', () => {
  assert.equal(normalizeAnswer('', 'fallback'), 'fallback');
  assert.equal(normalizeAnswer('  value ', 'fallback'), 'value');
});

test('runInit writes config file with provider and model', async () => {
  const cwd = createTempDir();
  // Order: provider, model choice (number), project name, api key
  const io = createMemoryIO({ responses: ['openai', '1', 'Demo', 'test-key'] });
  const result = await runInit({ cwd, fs, path, io });
  assert.ok(fs.existsSync(result.path));
  const config = JSON.parse(fs.readFileSync(result.path, 'utf8'));
  assert.equal(config.provider, 'openai');
  assert.equal(config.model, 'gpt-5-mini');
  assert.equal(config.projectName, 'Demo');
  const envPath = path.join(cwd, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  assert.ok(envContent.includes('OPENAI_API_KEY=test-key'));
});

test('runInit stores null project name when empty', async () => {
  const cwd = createTempDir();
  const io = createMemoryIO({ responses: ['claude', '2', '', 'test-key'] });
  const result = await runInit({ cwd, fs, path, io });
  const config = JSON.parse(fs.readFileSync(result.path, 'utf8'));
  assert.equal(config.provider, 'claude');
  assert.equal(config.model, 'claude-opus-4-5');
  assert.equal(config.projectName, null);
});

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
  parseYesNo,
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

test('parseYesNo handles inputs', () => {
  assert.equal(parseYesNo('y', false), true);
  assert.equal(parseYesNo('no', true), false);
  assert.equal(parseYesNo('', false), false);
});

test('runInit writes config file with provider and model', async () => {
  const cwd = createTempDir();
  // Order: provider, model choice (number), fallback, project name, api key
  const io = createMemoryIO({ responses: ['openai', '1', 'n', 'Demo', 'test-key'] });
  const result = await runInit({ cwd, fs, path, io });
  assert.ok(fs.existsSync(result.path));
  const config = JSON.parse(fs.readFileSync(result.path, 'utf8'));
  assert.equal(config.provider, 'openai');
  assert.equal(config.model, 'gpt-5-mini');
  assert.equal(config.projectName, 'Demo');
  assert.equal(config.allowHeuristicFallback, false);
  const envPath = path.join(cwd, '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf8');
  assert.ok(envContent.includes('OPENAI_API_KEY=test-key'));
});

test('runInit stores null project name when empty', async () => {
  const cwd = createTempDir();
  const io = createMemoryIO({ responses: ['claude', '2', '', '', 'test-key'] });
  const result = await runInit({ cwd, fs, path, io });
  const config = JSON.parse(fs.readFileSync(result.path, 'utf8'));
  assert.equal(config.provider, 'claude');
  assert.equal(config.model, 'claude-opus-4-5');
  assert.equal(config.projectName, null);
  assert.equal(config.allowHeuristicFallback, false);
});

const {
  detectProviderFromEnv,
  resolveDefaultModel,
  runInitNonInteractive,
} = require('../lib/init');

test('detectProviderFromEnv returns openai when OPENAI_API_KEY is set', () => {
  const original = process.env.OPENAI_API_KEY;
  const originalAnthropic = process.env.ANTHROPIC_API_KEY;
  try {
    process.env.OPENAI_API_KEY = 'test-key';
    delete process.env.ANTHROPIC_API_KEY;
    assert.equal(detectProviderFromEnv(), 'openai');
  } finally {
    if (original !== undefined) process.env.OPENAI_API_KEY = original;
    else delete process.env.OPENAI_API_KEY;
    if (originalAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = originalAnthropic;
    else delete process.env.ANTHROPIC_API_KEY;
  }
});

test('detectProviderFromEnv returns claude when ANTHROPIC_API_KEY is set', () => {
  const originalOai = process.env.OPENAI_API_KEY;
  const original = process.env.ANTHROPIC_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-key';
    assert.equal(detectProviderFromEnv(), 'claude');
  } finally {
    if (originalOai !== undefined) process.env.OPENAI_API_KEY = originalOai;
    else delete process.env.OPENAI_API_KEY;
    if (original !== undefined) process.env.ANTHROPIC_API_KEY = original;
    else delete process.env.ANTHROPIC_API_KEY;
  }
});

test('detectProviderFromEnv returns null when no key is set', () => {
  const originalOai = process.env.OPENAI_API_KEY;
  const originalAnthropic = process.env.ANTHROPIC_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    assert.equal(detectProviderFromEnv(), null);
  } finally {
    if (originalOai !== undefined) process.env.OPENAI_API_KEY = originalOai;
    if (originalAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = originalAnthropic;
  }
});

test('resolveDefaultModel returns first model for each provider', () => {
  assert.equal(resolveDefaultModel('openai'), 'gpt-5-mini');
  assert.equal(resolveDefaultModel('claude'), 'claude-sonnet-4-5');
  assert.equal(resolveDefaultModel('unknown'), 'default');
});

test('runInitNonInteractive creates config with explicit flags', async () => {
  const cwd = createTempDir();
  const io = createMemoryIO();
  const originalKey = process.env.OPENAI_API_KEY;
  try {
    process.env.OPENAI_API_KEY = 'test-key-123';
    const result = await runInitNonInteractive({
      cwd, fs, path, io,
      provider: 'openai',
      model: 'gpt-5.2',
    });
    assert.ok(fs.existsSync(result.path));
    const config = JSON.parse(fs.readFileSync(result.path, 'utf8'));
    assert.equal(config.provider, 'openai');
    assert.equal(config.model, 'gpt-5.2');
  } finally {
    if (originalKey !== undefined) process.env.OPENAI_API_KEY = originalKey;
    else delete process.env.OPENAI_API_KEY;
  }
});

test('runInitNonInteractive auto-detects provider from env', async () => {
  const cwd = createTempDir();
  const io = createMemoryIO();
  const originalOai = process.env.OPENAI_API_KEY;
  const originalAnthropic = process.env.ANTHROPIC_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';
    const result = await runInitNonInteractive({
      cwd, fs, path, io,
      auto: true,
    });
    const config = JSON.parse(fs.readFileSync(result.path, 'utf8'));
    assert.equal(config.provider, 'claude');
    assert.equal(config.model, 'claude-sonnet-4-5');
  } finally {
    if (originalOai !== undefined) process.env.OPENAI_API_KEY = originalOai;
    else delete process.env.OPENAI_API_KEY;
    if (originalAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = originalAnthropic;
    else delete process.env.ANTHROPIC_API_KEY;
  }
});

test('runInitNonInteractive errors when no provider can be resolved', async () => {
  const cwd = createTempDir();
  const io = createMemoryIO();
  const originalOai = process.env.OPENAI_API_KEY;
  const originalAnthropic = process.env.ANTHROPIC_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    await assert.rejects(
      () => runInitNonInteractive({ cwd, fs, path, io, auto: true }),
      { message: /No API key found in environment/ }
    );
  } finally {
    if (originalOai !== undefined) process.env.OPENAI_API_KEY = originalOai;
    if (originalAnthropic !== undefined) process.env.ANTHROPIC_API_KEY = originalAnthropic;
  }
});

test('runInitNonInteractive errors when API key is missing', async () => {
  const cwd = createTempDir();
  const io = createMemoryIO();
  const originalKey = process.env.OPENAI_API_KEY;
  try {
    delete process.env.OPENAI_API_KEY;
    await assert.rejects(
      () => runInitNonInteractive({ cwd, fs, path, io, provider: 'openai' }),
      { message: /OPENAI_API_KEY not found/ }
    );
  } finally {
    if (originalKey !== undefined) process.env.OPENAI_API_KEY = originalKey;
    else delete process.env.OPENAI_API_KEY;
  }
});

const {
  parseEnvValue,
  formatEnvValue,
  upsertEnvVar,
  readEnvVar,
  writeEnvFile,
} = require('../lib/init');
const { writeFile } = require('./helpers');

test('parseEnvValue parses unquoted value', () => {
  assert.equal(parseEnvValue('sk-abc123'), 'sk-abc123');
});

test('parseEnvValue parses double-quoted value', () => {
  assert.equal(parseEnvValue('"sk-abc123"'), 'sk-abc123');
});

test('parseEnvValue parses single-quoted value', () => {
  assert.equal(parseEnvValue("'sk-abc123'"), 'sk-abc123');
});

test('parseEnvValue strips inline comments from unquoted values', () => {
  assert.equal(parseEnvValue('sk-abc123  # my key'), 'sk-abc123');
});

test('parseEnvValue returns empty string for empty input', () => {
  assert.equal(parseEnvValue(''), '');
});

test('formatEnvValue handles simple value', () => {
  assert.equal(formatEnvValue('sk-abc123'), 'sk-abc123');
});

test('formatEnvValue quotes value with spaces', () => {
  assert.equal(formatEnvValue('has space'), '"has space"');
});

test('upsertEnvVar inserts new key into empty content', () => {
  assert.equal(upsertEnvVar('', 'KEY', 'val'), 'KEY=val\n');
});

test('upsertEnvVar updates existing key', () => {
  assert.equal(upsertEnvVar('KEY=old\n', 'KEY', 'new'), 'KEY=new\n');
});

test('upsertEnvVar preserves other keys', () => {
  const result = upsertEnvVar('A=1\nB=2\n', 'B', '3');
  assert.ok(result.includes('A=1'));
  assert.ok(result.includes('B=3'));
  assert.ok(!result.includes('B=2'));
});

test('readEnvVar reads from .env.local file', () => {
  const cwd = createTempDir();
  writeFile(cwd, '.env.local', 'OPENAI_API_KEY=sk-test\n');
  const result = readEnvVar({ cwd, fs, path, key: 'OPENAI_API_KEY' });
  assert.equal(result.value, 'sk-test');
});

test('readEnvVar falls back to .env', () => {
  const cwd = createTempDir();
  writeFile(cwd, '.env', 'OPENAI_API_KEY=sk-from-env\n');
  const result = readEnvVar({ cwd, fs, path, key: 'OPENAI_API_KEY' });
  assert.equal(result.value, 'sk-from-env');
});

test('readEnvVar strips inline comments', () => {
  const cwd = createTempDir();
  writeFile(cwd, '.env.local', 'OPENAI_API_KEY=sk-test  # dev key\n');
  const result = readEnvVar({ cwd, fs, path, key: 'OPENAI_API_KEY' });
  assert.equal(result.value, 'sk-test');
});

test('readEnvVar returns empty when key not found', () => {
  const cwd = createTempDir();
  writeFile(cwd, '.env.local', 'OTHER_KEY=value\n');
  const result = readEnvVar({ cwd, fs, path, key: 'OPENAI_API_KEY' });
  assert.equal(result.value, '');
});

test('writeEnvFile creates .env.local with key', () => {
  const cwd = createTempDir();
  writeEnvFile({ cwd, fs, path, key: 'OPENAI_API_KEY', value: 'sk-test' });
  const envPath = path.join(cwd, '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');
  assert.ok(content.includes('OPENAI_API_KEY=sk-test'));
});

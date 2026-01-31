const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { getInitQuestions, normalizeAnswer, runInit } = require('../lib/init');
const { createMemoryIO } = require('../lib/io');
const { createTempDir } = require('./helpers');

test('getInitQuestions returns ordered prompts', () => {
  const questions = getInitQuestions();
  assert.equal(questions[0].key, 'provider');
  assert.ok(questions.length >= 3);
});

test('normalizeAnswer falls back when empty', () => {
  assert.equal(normalizeAnswer('', 'fallback'), 'fallback');
  assert.equal(normalizeAnswer('  value ', 'fallback'), 'value');
});

test('runInit writes config file with provider', async () => {
  const cwd = createTempDir();
  const io = createMemoryIO({ responses: ['openai', 'gpt-4o', 'Demo'] });
  const result = await runInit({ cwd, fs, path, io });
  assert.ok(fs.existsSync(result.path));
  const config = JSON.parse(fs.readFileSync(result.path, 'utf8'));
  assert.equal(config.provider, 'openai');
  assert.equal(config.projectName, 'Demo');
});

test('runInit stores null project name when empty', async () => {
  const cwd = createTempDir();
  const io = createMemoryIO({ responses: ['openai', 'gpt-4o', ''] });
  const result = await runInit({ cwd, fs, path, io });
  const config = JSON.parse(fs.readFileSync(result.path, 'utf8'));
  assert.equal(config.projectName, null);
});

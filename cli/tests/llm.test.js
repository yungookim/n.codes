const test = require('node:test');
const assert = require('node:assert/strict');

const { getModelConfig, SUPPORTED_MODELS, sleep, withRetry, createSemaphore, analyzeWithLLM, buildAnalysisPrompt, parseAnalysisResponse } = require('../lib/llm');

test('SUPPORTED_MODELS contains openai and claude providers', () => {
  assert.ok(SUPPORTED_MODELS.openai);
  assert.ok(SUPPORTED_MODELS.claude);
  assert.ok(SUPPORTED_MODELS.openai.includes('gpt-5-mini'));
  assert.ok(SUPPORTED_MODELS.claude.includes('claude-sonnet-4-5'));
});

test('getModelConfig returns provider config for openai', () => {
  const config = { provider: 'openai', model: 'gpt-5-mini' };
  const result = getModelConfig(config);
  assert.equal(result.provider, 'openai');
  assert.equal(result.model, 'gpt-5-mini');
  assert.equal(result.envVar, 'OPENAI_API_KEY');
});

test('getModelConfig returns provider config for claude', () => {
  const config = { provider: 'claude', model: 'claude-sonnet-4-5' };
  const result = getModelConfig(config);
  assert.equal(result.provider, 'claude');
  assert.equal(result.model, 'claude-sonnet-4-5');
  assert.equal(result.envVar, 'ANTHROPIC_API_KEY');
});

test('sleep delays execution', async () => {
  const start = Date.now();
  await sleep(50);
  const elapsed = Date.now() - start;
  assert.ok(elapsed >= 45, `Expected >= 45ms, got ${elapsed}ms`);
});

test('withRetry returns result on success', async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls++;
    return 'success';
  }, { maxAttempts: 3, baseDelay: 10 });
  assert.equal(result, 'success');
  assert.equal(calls, 1);
});

test('withRetry retries on failure then succeeds', async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls++;
    if (calls < 3) throw new Error('fail');
    return 'success';
  }, { maxAttempts: 3, baseDelay: 10 });
  assert.equal(result, 'success');
  assert.equal(calls, 3);
});

test('withRetry throws after max attempts', async () => {
  let calls = 0;
  await assert.rejects(
    withRetry(async () => {
      calls++;
      throw new Error('always fails');
    }, { maxAttempts: 3, baseDelay: 10 }),
    { message: 'always fails' }
  );
  assert.equal(calls, 3);
});

test('createSemaphore limits concurrency', async () => {
  const semaphore = createSemaphore(2);
  let concurrent = 0;
  let maxConcurrent = 0;

  const task = async () => {
    await semaphore.acquire();
    concurrent++;
    maxConcurrent = Math.max(maxConcurrent, concurrent);
    await sleep(20);
    concurrent--;
    semaphore.release();
  };

  await Promise.all([task(), task(), task(), task()]);
  assert.equal(maxConcurrent, 2);
});

test('analyzeWithLLM throws when no API key even with fallback enabled', async () => {
  const routeContext = {
    routeFile: 'pages/api/test.ts',
    routeContent: 'export function GET() { return Response.json({}); }',
    imports: [],
    typeImports: []
  };
  const config = { provider: 'openai', model: 'gpt-5-mini', allowHeuristicFallback: true };
  const heuristicDescription = 'Fallback description';

  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  await assert.rejects(
    analyzeWithLLM({
      routeContext,
      method: 'GET',
      path: '/api/test',
      config,
      heuristicDescription
    }),
    { message: /Missing OPENAI_API_KEY/ }
  );

  process.env.OPENAI_API_KEY = originalKey;
});

test('analyzeWithLLM throws when no API key and fallback disabled', async () => {
  const routeContext = {
    routeFile: 'pages/api/test.ts',
    routeContent: 'export function GET() { return Response.json({}); }',
    imports: [],
    typeImports: []
  };
  const config = { provider: 'openai', model: 'gpt-5-mini', allowHeuristicFallback: false };
  const heuristicDescription = 'Fallback description';

  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  await assert.rejects(
    analyzeWithLLM({
      routeContext,
      method: 'GET',
      path: '/api/test',
      config,
      heuristicDescription
    }),
    { message: /Missing OPENAI_API_KEY/ }
  );

  process.env.OPENAI_API_KEY = originalKey;
});

test('buildAnalysisPrompt includes route info and code', () => {
  const routeContext = {
    routeFile: 'pages/api/test.ts',
    routeContent: 'export function GET() { return {}; }',
    imports: [],
    typeImports: []
  };

  const prompt = buildAnalysisPrompt({
    routeContext,
    method: 'GET',
    path: '/api/test'
  });

  assert.ok(prompt.includes('Method: GET'));
  assert.ok(prompt.includes('Path: /api/test'));
  assert.ok(prompt.includes('pages/api/test.ts'));
  assert.ok(prompt.includes('export function GET'));
});

test('buildAnalysisPrompt includes imports', () => {
  const routeContext = {
    routeFile: 'pages/api/test.ts',
    routeContent: 'import { db } from "./db"; export function GET() { return db.find(); }',
    imports: [{ path: 'lib/db.ts', content: 'export const db = {}' }],
    typeImports: []
  };

  const prompt = buildAnalysisPrompt({
    routeContext,
    method: 'GET',
    path: '/api/test'
  });

  assert.ok(prompt.includes('## Imported Dependencies'));
  assert.ok(prompt.includes('lib/db.ts'));
  assert.ok(prompt.includes('export const db'));
});

test('parseAnalysisResponse parses valid JSON', () => {
  const response = '{"description": "Test description", "entities": [{"name": "User", "fields": ["id"]}]}';
  const result = parseAnalysisResponse(response);
  assert.equal(result.description, 'Test description');
  assert.equal(result.entities.length, 1);
  assert.equal(result.entities[0].name, 'User');
});

test('parseAnalysisResponse handles markdown code blocks', () => {
  const response = '```json\n{"description": "Test", "entities": []}\n```';
  const result = parseAnalysisResponse(response);
  assert.equal(result.description, 'Test');
});

test('parseAnalysisResponse returns defaults on invalid JSON', () => {
  const response = 'This is not valid JSON';
  const result = parseAnalysisResponse(response);
  assert.equal(result.description, null);
  assert.deepEqual(result.entities, []);
});

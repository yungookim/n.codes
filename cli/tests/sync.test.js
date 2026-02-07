const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { resolveCapabilityMapPath, writeCapabilityMap, buildCapabilityMap, runSync, analyzeRoutesWithLLM } = require('../lib/sync');
const { defaultCapabilityMap } = require('../lib/capability-map');
const { createTempDir, writeFile } = require('./helpers');
const { createMemoryIO } = require('../lib/io');

test('resolveCapabilityMapPath uses config path', () => {
  const cwd = '/tmp/project';
  const mapPath = resolveCapabilityMapPath({ cwd, path, config: { capabilityMapPath: 'cap.yaml' } });
  assert.equal(mapPath, '/tmp/project/cap.yaml');
});

test('resolveCapabilityMapPath honors override', () => {
  const mapPath = resolveCapabilityMapPath({ cwd: '/tmp', path, config: {}, overridePath: '/tmp/override.yaml' });
  assert.equal(mapPath, '/tmp/override.yaml');
});

test('writeCapabilityMap writes file', () => {
  const cwd = createTempDir();
  const mapPath = path.join(cwd, 'cap.yaml');
  const map = defaultCapabilityMap({ generatedAt: '2026-01-01T00:00:00Z' });
  const savedPath = writeCapabilityMap({ fs, mapPath, map });
  assert.equal(savedPath, mapPath);
  assert.ok(fs.existsSync(mapPath));
});

test('buildCapabilityMap attaches project name', () => {
  const map = buildCapabilityMap({ fileIndex: {}, config: { projectName: 'Test' } });
  assert.equal(map.projectName, 'Test');
});

test('runSync writes map and cache', async () => {
  const cwd = createTempDir();
  writeFile(cwd, 'src/components/Widget.tsx', 'export const Widget = () => null;');
  const io = createMemoryIO();
  const result = await runSync({ cwd, fs, path, io });
  assert.ok(fs.existsSync(result.mapPath));
  assert.ok(fs.existsSync(path.join(cwd, '.n.codes.cache.json')));
});

test('runSync enriches routes with analysis metadata', async () => {
  const cwd = createTempDir();
  writeFile(cwd, 'pages/api/bookings/index.ts', 'export async function POST() { return {}; }');
  fs.writeFileSync(
    path.join(cwd, 'n.codes.config.json'),
    JSON.stringify({ provider: 'openai', model: 'gpt-5-mini', allowHeuristicFallback: true }, null, 2),
    'utf8'
  );
  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  const io = createMemoryIO();
  await assert.rejects(
    runSync({ cwd, fs, path, io }),
    { message: /Missing OPENAI_API_KEY/ }
  );
  process.env.OPENAI_API_KEY = originalKey;
});

test('analyzeRoutesWithLLM throws when no API key', async () => {
  const routes = [
    { name: 'postBookings', method: 'POST', path: '/api/bookings', file: 'pages/api/bookings.ts' },
    { name: 'getBooking', method: 'GET', path: '/api/bookings/:id', file: 'pages/api/bookings/[id].ts' }
  ];

  const cwd = createTempDir();
  writeFile(cwd, 'pages/api/bookings.ts', 'export function POST() {}');
  writeFile(cwd, 'pages/api/bookings/[id].ts', 'export function GET() {}');

  const config = { provider: 'openai', model: 'gpt-5-mini', allowHeuristicFallback: true };

  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  await assert.rejects(
    analyzeRoutesWithLLM({
      routes,
      cwd,
      fs,
      path,
      config,
      concurrency: 2,
      io: { log: () => {}, error: () => {} },
      cache: {}
    }),
    { message: /Missing OPENAI_API_KEY/ }
  );

  process.env.OPENAI_API_KEY = originalKey;
});

test('analyzeRoutesWithLLM uses cache when available', async () => {
  const routes = [
    { name: 'getTest', method: 'GET', path: '/api/test', file: 'pages/api/test.ts' }
  ];

  const cwd = createTempDir();
  const routeContent = 'export function GET() { return {}; }';
  writeFile(cwd, 'pages/api/test.ts', routeContent);

  // Create cache with matching hash
  const { hashContent } = require('../lib/cache');
  const contentHash = hashContent(routeContent);

  const cache = {
    analysis: {
      'pages/api/test.ts': {
        contentHash,
        result: {
          description: 'Cached description',
          entities: [],
          analysisSource: 'llm'
        }
      }
    }
  };

  const originalKey = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'test-key';

  const results = await analyzeRoutesWithLLM({
    routes,
    cwd,
    fs,
    path,
    config: { provider: 'openai', model: 'gpt-5-mini', allowHeuristicFallback: true },
    concurrency: 2,
    io: { log: () => {}, error: () => {} },
    cache
  });

  if (originalKey) {
    process.env.OPENAI_API_KEY = originalKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }

  assert.equal(results[0].description, 'Cached description');
  assert.equal(results[0].analysisSource, 'llm');
});

test('analyzeRoutesWithLLM respects force flag to bypass cache', async () => {
  const routes = [
    { name: 'getTest', method: 'GET', path: '/api/test', file: 'pages/api/test.ts' }
  ];

  const cwd = createTempDir();
  const routeContent = 'export function GET() { return {}; }';
  writeFile(cwd, 'pages/api/test.ts', routeContent);

  const { hashContent } = require('../lib/cache');
  const contentHash = hashContent(routeContent);

  const cache = {
    analysis: {
      'pages/api/test.ts': {
        contentHash,
        result: {
          description: 'Cached description',
          entities: [],
          analysisSource: 'llm'
        }
      }
    }
  };

  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  await assert.rejects(
    analyzeRoutesWithLLM({
      routes,
      cwd,
      fs,
      path,
      config: { provider: 'openai', model: 'gpt-5-mini', allowHeuristicFallback: true },
      concurrency: 2,
      io: { log: () => {}, error: () => {} },
      cache,
      force: true  // Force re-analysis
    }),
    { message: /Missing OPENAI_API_KEY/ }
  );

  process.env.OPENAI_API_KEY = originalKey;
});

test('runSync samples routes for LLM analysis', async () => {
  const cwd = createTempDir();
  writeFile(cwd, 'pages/api/alpha.ts', 'export function POST() { return {}; }');
  writeFile(cwd, 'pages/api/zeta.ts', 'export function POST() { return {}; }');
  fs.writeFileSync(
    path.join(cwd, 'n.codes.config.json'),
    JSON.stringify({ provider: 'openai', model: 'gpt-5-mini', allowHeuristicFallback: true }, null, 2),
    'utf8'
  );

  const originalKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;

  const io = createMemoryIO();
  await assert.rejects(
    runSync({ cwd, fs, path, io, sample: 1 }),
    { message: /Missing OPENAI_API_KEY/ }
  );

  process.env.OPENAI_API_KEY = originalKey;
});

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

test('runSync writes map and cache', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'src/components/Widget.tsx', 'export const Widget = () => null;');
  const io = createMemoryIO();
  const result = runSync({ cwd, fs, path, io });
  assert.ok(fs.existsSync(result.mapPath));
  assert.ok(fs.existsSync(path.join(cwd, '.n.codes.cache.json')));
});

test('analyzeRoutesWithLLM returns results for each route', async () => {
  // Mock LLM to return fallback (no API key)
  const routes = [
    { name: 'postBookings', method: 'POST', path: '/api/bookings', file: 'pages/api/bookings.ts' },
    { name: 'getBooking', method: 'GET', path: '/api/bookings/:id', file: 'pages/api/bookings/[id].ts' }
  ];

  const cwd = createTempDir();
  writeFile(cwd, 'pages/api/bookings.ts', 'export function POST() {}');
  writeFile(cwd, 'pages/api/bookings/[id].ts', 'export function GET() {}');

  const config = { provider: 'openai', model: 'gpt-5-mini' };

  const results = await analyzeRoutesWithLLM({
    routes,
    cwd,
    fs,
    path,
    config,
    concurrency: 2,
    io: { log: () => {}, error: () => {} },
    cache: {}
  });

  assert.equal(results.length, 2);
  assert.equal(results[0].capabilityName, 'postBookings');
  assert.equal(results[0].analysisSource, 'heuristic'); // No API key = fallback
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

  const results = await analyzeRoutesWithLLM({
    routes,
    cwd,
    fs,
    path,
    config: { provider: 'openai', model: 'gpt-5-mini' },
    concurrency: 2,
    io: { log: () => {}, error: () => {} },
    cache
  });

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

  const results = await analyzeRoutesWithLLM({
    routes,
    cwd,
    fs,
    path,
    config: { provider: 'openai', model: 'gpt-5-mini' },
    concurrency: 2,
    io: { log: () => {}, error: () => {} },
    cache,
    force: true  // Force re-analysis
  });

  // Without API key, should fallback to heuristic even with cache
  assert.equal(results[0].analysisSource, 'heuristic');
});

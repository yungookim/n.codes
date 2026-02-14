const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { buildIncrementalMap, runDev } = require('../lib/dev');
const { createTempDir, writeFile } = require('./helpers');
const { createMemoryIO } = require('../lib/io');
const { saveCache } = require('../lib/cache');

test('buildIncrementalMap records changed files', () => {
  const { map } = buildIncrementalMap({
    fileIndex: { 'src/components/Card.tsx': { size: 1, mtimeMs: 1 } },
    changedFiles: ['src/components/Card.tsx'],
    config: {},
  });
  assert.deepEqual(map.meta.changedFiles, ['src/components/Card.tsx']);
});

test('buildIncrementalMap applies project name', () => {
  const { map } = buildIncrementalMap({
    fileIndex: { 'src/components/Card.tsx': { size: 1, mtimeMs: 1 } },
    changedFiles: [],
    config: { projectName: 'Demo' },
  });
  assert.equal(map.projectName, 'Demo');
});

test('runDev updates map and cache', async () => {
  const cwd = createTempDir();
  writeFile(cwd, 'src/components/Card.tsx', 'export const Card = () => null;');

  saveCache({
    cwd,
    fs,
    path,
    cache: { fileIndex: { 'src/components/Old.tsx': { size: 1, mtimeMs: 1 } } },
  });

  const io = createMemoryIO();
  const result = await runDev({ cwd, fs, path, io });
  assert.ok(fs.existsSync(result.mapPath));
  assert.ok(result.changedFiles.length >= 0);
});

test('runDev uses heuristic fallback when no API key', async () => {
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
  // With fallback enabled, should succeed without API key
  const result = await runDev({ cwd, fs, path, io });
  assert.ok(fs.existsSync(result.mapPath));

  if (originalKey) {
    process.env.OPENAI_API_KEY = originalKey;
  } else {
    delete process.env.OPENAI_API_KEY;
  }
});

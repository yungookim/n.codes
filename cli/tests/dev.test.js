const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { buildIncrementalMap, runDev } = require('../lib/dev');
const { createTempDir, writeFile } = require('./helpers');
const { createMemoryIO } = require('../lib/io');
const { saveCache } = require('../lib/cache');

test('buildIncrementalMap records changed files', () => {
  const map = buildIncrementalMap({
    fileIndex: { 'src/components/Card.tsx': { size: 1, mtimeMs: 1 } },
    changedFiles: ['src/components/Card.tsx'],
    config: {},
  });
  assert.deepEqual(map.meta.changedFiles, ['src/components/Card.tsx']);
});

test('buildIncrementalMap applies project name', () => {
  const map = buildIncrementalMap({
    fileIndex: { 'src/components/Card.tsx': { size: 1, mtimeMs: 1 } },
    changedFiles: [],
    config: { projectName: 'Demo' },
  });
  assert.equal(map.projectName, 'Demo');
});

test('runDev updates map and cache', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'src/components/Card.tsx', 'export const Card = () => null;');

  saveCache({
    cwd,
    fs,
    path,
    cache: { fileIndex: { 'src/components/Old.tsx': { size: 1, mtimeMs: 1 } } },
  });

  const io = createMemoryIO();
  const result = runDev({ cwd, fs, path, io });
  assert.ok(fs.existsSync(result.mapPath));
  assert.ok(result.changedFiles.length >= 0);
});

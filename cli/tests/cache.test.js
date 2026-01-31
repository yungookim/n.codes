const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { resolveCachePath, loadCache, saveCache } = require('../lib/cache');
const { createTempDir } = require('./helpers');

test('resolveCachePath uses cwd', () => {
  const cwd = '/tmp/project';
  assert.equal(resolveCachePath({ cwd, path }), '/tmp/project/.n.codes.cache.json');
});

test('loadCache returns null when missing', () => {
  const cwd = createTempDir();
  const result = loadCache({ cwd, fs, path });
  assert.equal(result.exists, false);
  assert.equal(result.cache, null);
});

test('saveCache writes cache file', () => {
  const cwd = createTempDir();
  const cache = { fileIndex: { 'a.js': { size: 1, mtimeMs: 1 } } };
  const savedPath = saveCache({ cwd, fs, path, cache });
  assert.ok(fs.existsSync(savedPath));
  const loaded = loadCache({ cwd, fs, path });
  assert.equal(loaded.cache.fileIndex['a.js'].size, 1);
});

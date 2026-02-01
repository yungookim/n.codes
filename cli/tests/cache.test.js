const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { resolveCachePath, loadCache, saveCache, hashContent, getAnalysisCache, setAnalysisCache } = require('../lib/cache');
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

test('hashContent returns consistent sha256 hash', () => {
  const content = 'test content';
  const hash1 = hashContent(content);
  const hash2 = hashContent(content);
  assert.equal(hash1, hash2);
  assert.ok(hash1.startsWith('sha256:'));
  assert.equal(hash1.length, 7 + 64); // 'sha256:' + 64 hex chars
});

test('hashContent returns different hash for different content', () => {
  const hash1 = hashContent('content a');
  const hash2 = hashContent('content b');
  assert.notEqual(hash1, hash2);
});

test('getAnalysisCache returns null for missing entry', () => {
  const cache = { analysis: {} };
  const result = getAnalysisCache(cache, 'pages/api/test.ts', 'sha256:abc');
  assert.equal(result, null);
});

test('getAnalysisCache returns null for hash mismatch', () => {
  const cache = {
    analysis: {
      'pages/api/test.ts': {
        contentHash: 'sha256:old',
        result: { description: 'test' }
      }
    }
  };
  const result = getAnalysisCache(cache, 'pages/api/test.ts', 'sha256:new');
  assert.equal(result, null);
});

test('getAnalysisCache returns result for matching hash', () => {
  const cache = {
    analysis: {
      'pages/api/test.ts': {
        contentHash: 'sha256:abc',
        result: { description: 'test' }
      }
    }
  };
  const result = getAnalysisCache(cache, 'pages/api/test.ts', 'sha256:abc');
  assert.deepEqual(result, { description: 'test' });
});

test('setAnalysisCache stores entry', () => {
  const cache = { analysis: {} };
  setAnalysisCache(cache, 'pages/api/test.ts', 'sha256:abc', { description: 'test' });
  assert.equal(cache.analysis['pages/api/test.ts'].contentHash, 'sha256:abc');
  assert.deepEqual(cache.analysis['pages/api/test.ts'].result, { description: 'test' });
});

test('setAnalysisCache creates analysis object if missing', () => {
  const cache = {};
  setAnalysisCache(cache, 'pages/api/test.ts', 'sha256:abc', { description: 'test' });
  assert.ok(cache.analysis);
  assert.equal(cache.analysis['pages/api/test.ts'].contentHash, 'sha256:abc');
});

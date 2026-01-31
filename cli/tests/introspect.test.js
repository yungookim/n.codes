const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  defaultExtensions,
  shouldIncludeFile,
  collectFiles,
  buildFileIndex,
  diffFileIndex,
  selectChangedFiles,
} = require('../lib/introspect');
const { createTempDir, writeFile } = require('./helpers');

test('defaultExtensions includes common extensions', () => {
  const exts = defaultExtensions();
  assert.ok(exts.includes('.js'));
  assert.ok(exts.includes('.tsx'));
});

test('shouldIncludeFile respects extensions and exclude dirs', () => {
  assert.equal(shouldIncludeFile('src/app.js', { extensions: ['.js'], excludeDirs: ['node_modules'] }), true);
  assert.equal(shouldIncludeFile('node_modules/pkg/index.js', { extensions: ['.js'], excludeDirs: ['node_modules'] }), false);
  assert.equal(shouldIncludeFile('src/app.css', { extensions: ['.js'], excludeDirs: [] }), false);
});

test('collectFiles walks directories and filters', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'src/app.js', 'console.log(1);');
  writeFile(cwd, 'node_modules/pkg/index.js', '');
  writeFile(cwd, 'src/distinct/index.js', 'export const value = 1;');
  writeFile(cwd, '.github/workflows/ci.js', 'console.log(1);');
  const files = collectFiles({ cwd, fs, path });
  assert.deepEqual(files.sort(), ['.github/workflows/ci.js', 'src/app.js', 'src/distinct/index.js'].sort());
});

test('buildFileIndex returns size and mtime', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'src/app.js', 'console.log(1);');
  const index = buildFileIndex(['src/app.js'], { cwd, fs, path });
  assert.ok(index['src/app.js']);
  assert.ok(index['src/app.js'].size > 0);
});

test('diffFileIndex tracks changes', () => {
  const prev = { 'a.js': { size: 1, mtimeMs: 1 } };
  const next = { 'a.js': { size: 2, mtimeMs: 2 }, 'b.js': { size: 1, mtimeMs: 1 } };
  const diff = diffFileIndex(prev, next);
  assert.deepEqual(diff.added, ['b.js']);
  assert.deepEqual(diff.changed, ['a.js']);
  assert.deepEqual(diff.removed, []);
});

test('diffFileIndex tracks unchanged and removed files', () => {
  const prev = { 'a.js': { size: 1, mtimeMs: 1 }, 'b.js': { size: 1, mtimeMs: 1 } };
  const next = { 'a.js': { size: 1, mtimeMs: 1 } };
  const diff = diffFileIndex(prev, next);
  assert.deepEqual(diff.removed, ['b.js']);
  assert.deepEqual(diff.unchanged, ['a.js']);
});

test('selectChangedFiles merges added and changed', () => {
  const diff = { added: ['a.js'], changed: ['b.js'], removed: [], unchanged: [] };
  assert.deepEqual(selectChangedFiles(diff), ['a.js', 'b.js']);
});

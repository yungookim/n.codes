const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { resolveCapabilityMapPath, writeCapabilityMap, buildCapabilityMap, runSync } = require('../lib/sync');
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

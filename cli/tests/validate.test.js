const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { readCapabilityMap, runValidate } = require('../lib/validate');
const { defaultCapabilityMap, renderCapabilityMapYaml } = require('../lib/capability-map');
const { createTempDir } = require('./helpers');
const { createMemoryIO } = require('../lib/io');

test('readCapabilityMap parses map file', () => {
  const cwd = createTempDir();
  const mapPath = path.join(cwd, 'n.codes.capabilities.yaml');
  const map = defaultCapabilityMap({ generatedAt: '2026-01-01T00:00:00Z' });
  fs.writeFileSync(mapPath, renderCapabilityMapYaml(map), 'utf8');
  const parsed = readCapabilityMap({ fs, mapPath });
  assert.equal(parsed.generatedAt, '2026-01-01T00:00:00Z');
});

test('runValidate reports valid map', () => {
  const cwd = createTempDir();
  const mapPath = path.join(cwd, 'n.codes.capabilities.yaml');
  const map = defaultCapabilityMap({ generatedAt: '2026-01-01T00:00:00Z' });
  fs.writeFileSync(mapPath, renderCapabilityMapYaml(map), 'utf8');
  const io = createMemoryIO();
  const result = runValidate({ cwd, fs, path, io });
  assert.equal(result.result.valid, true);
});

test('runValidate reports invalid map', () => {
  const cwd = createTempDir();
  const mapPath = path.join(cwd, 'n.codes.capabilities.yaml');
  fs.writeFileSync(mapPath, JSON.stringify({}), 'utf8');
  const io = createMemoryIO();
  const result = runValidate({ cwd, fs, path, io });
  assert.equal(result.result.valid, false);
  assert.ok(io.getErrors().some((line) => line.includes('Capability map has')));
});

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const { main, dispatchCommand } = require('../bin');
const { createMemoryIO } = require('../lib/io');
const { createTempDir, writeFile } = require('./helpers');
const { defaultCapabilityMap, renderCapabilityMapYaml } = require('../lib/capability-map');

test('dispatchCommand returns error for unknown command', async () => {
  const io = createMemoryIO();
  const code = await dispatchCommand('unknown', { cwd: '/', fs, path, io, configPath: null });
  assert.equal(code, 1);
});

test('dispatchCommand runs init', async () => {
  const cwd = createTempDir();
  const io = createMemoryIO({ responses: ['openai', 'gpt-4o', 'Demo'] });
  const code = await dispatchCommand('init', { cwd, fs, path, io, configPath: null });
  assert.equal(code, 0);
  assert.ok(fs.existsSync(path.join(cwd, 'n.codes.config.json')));
});

test('dispatchCommand runs dev', async () => {
  const cwd = createTempDir();
  writeFile(cwd, 'src/components/Card.tsx', 'export const Card = () => null;');
  const io = createMemoryIO();
  const code = await dispatchCommand('dev', { cwd, fs, path, io, configPath: null });
  assert.equal(code, 0);
});

test('dispatchCommand runs validate', async () => {
  const cwd = createTempDir();
  const mapPath = path.join(cwd, 'n.codes.capabilities.yaml');
  const map = defaultCapabilityMap({ generatedAt: '2026-01-01T00:00:00Z' });
  fs.writeFileSync(mapPath, renderCapabilityMapYaml(map), 'utf8');
  const io = createMemoryIO();
  const code = await dispatchCommand('validate', { cwd, fs, path, io, configPath: null });
  assert.equal(code, 0);
});

test('dispatchCommand returns error when validate fails', async () => {
  const cwd = createTempDir();
  const mapPath = path.join(cwd, 'n.codes.capabilities.yaml');
  const map = defaultCapabilityMap({ generatedAt: null });
  delete map.version;
  fs.writeFileSync(mapPath, renderCapabilityMapYaml(map), 'utf8');
  const io = createMemoryIO();
  const code = await dispatchCommand('validate', { cwd, fs, path, io, configPath: null });
  assert.equal(code, 1);
});

test('main shows version', async () => {
  const io = createMemoryIO();
  const code = await main(['--version'], { cwd: '/', io });
  assert.equal(code, 0);
  assert.ok(io.getLogs()[0].includes('0.1.0'));
});

test('main shows help without command', async () => {
  const io = createMemoryIO();
  const code = await main([], { cwd: '/', io });
  assert.equal(code, 0);
  assert.ok(io.getLogs()[0].includes('Usage'));
});

test('main reports unknown command', async () => {
  const io = createMemoryIO();
  const code = await main(['whoops'], { cwd: '/', io });
  assert.equal(code, 1);
  assert.ok(io.getErrors()[0].includes('Unknown command'));
});

test('main reports unknown options', async () => {
  const io = createMemoryIO();
  const code = await main(['sync', '--nope'], { cwd: '/', io });
  assert.equal(code, 1);
  assert.ok(io.getErrors()[0].includes('Unknown options'));
});

test('main runs sync in dry-run mode', async () => {
  const cwd = createTempDir();
  writeFile(cwd, 'src/components/Widget.tsx', 'export const Widget = () => null;');
  const io = createMemoryIO();
  const code = await main(['sync', '--dry-run'], { cwd, io });
  assert.equal(code, 0);
  assert.ok(io.getLogs().some((line) => line.includes('dry-run')));
});

test('main returns error when command fails', async () => {
  const cwd = createTempDir();
  const io = createMemoryIO({ responses: ['unknown', 'model', ''] });
  const code = await main(['init'], { cwd, io });
  assert.equal(code, 1);
  assert.ok(io.getErrors()[0].includes('Unsupported provider'));
});

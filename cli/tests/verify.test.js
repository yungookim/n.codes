const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  checkConfigExists,
  checkCapabilityMapExists,
  checkCapabilityMapValid,
  checkJsonCapabilityMap,
  checkWidgetInstalled,
  checkInstallMdExists,
  checkWidgetIntegration,
  getLayoutFiles,
  runVerify,
} = require('../lib/verify');
const { defaultCapabilityMap, renderCapabilityMapYaml } = require('../lib/capability-map');
const { createMemoryIO } = require('../lib/io');
const { createTempDir, writeFile } = require('./helpers');
const { saveConfig, defaultConfig } = require('../lib/config');

test('checkConfigExists passes when config file exists', () => {
  const cwd = createTempDir();
  const config = { ...defaultConfig(), provider: 'openai', model: 'gpt-5-mini' };
  saveConfig({ cwd, fs, path, config });
  const result = checkConfigExists({ cwd, fs, path });
  assert.equal(result.passed, true);
  assert.ok(result.message.includes('found'));
});

test('checkConfigExists fails when config file is missing', () => {
  const cwd = createTempDir();
  const result = checkConfigExists({ cwd, fs, path });
  assert.equal(result.passed, false);
  assert.ok(result.message.includes('not found'));
});

test('checkCapabilityMapExists passes when yaml exists', () => {
  const cwd = createTempDir();
  const config = defaultConfig();
  const mapPath = path.join(cwd, config.capabilityMapPath);
  fs.writeFileSync(mapPath, 'version: 1', 'utf8');
  const result = checkCapabilityMapExists({ cwd, fs, path, config });
  assert.equal(result.passed, true);
});

test('checkCapabilityMapExists fails when yaml is missing', () => {
  const cwd = createTempDir();
  const config = defaultConfig();
  const result = checkCapabilityMapExists({ cwd, fs, path, config });
  assert.equal(result.passed, false);
});

test('checkCapabilityMapValid passes for valid map', () => {
  const cwd = createTempDir();
  const config = defaultConfig();
  const map = defaultCapabilityMap({ generatedAt: '2026-01-01T00:00:00Z' });
  const mapPath = path.join(cwd, config.capabilityMapPath);
  fs.writeFileSync(mapPath, renderCapabilityMapYaml(map), 'utf8');
  const result = checkCapabilityMapValid({ cwd, fs, path, config });
  assert.equal(result.passed, true);
});

test('checkCapabilityMapValid fails for invalid map', () => {
  const cwd = createTempDir();
  const config = defaultConfig();
  const map = defaultCapabilityMap({ generatedAt: null });
  delete map.version;
  const mapPath = path.join(cwd, config.capabilityMapPath);
  fs.writeFileSync(mapPath, renderCapabilityMapYaml(map), 'utf8');
  const result = checkCapabilityMapValid({ cwd, fs, path, config });
  assert.equal(result.passed, false);
  assert.ok(result.message.includes('Validation errors'));
});

test('checkCapabilityMapValid fails when file is missing', () => {
  const cwd = createTempDir();
  const config = defaultConfig();
  const result = checkCapabilityMapValid({ cwd, fs, path, config });
  assert.equal(result.passed, false);
  assert.ok(result.message.includes('not found'));
});

test('checkJsonCapabilityMap passes when json exists', () => {
  const cwd = createTempDir();
  const config = defaultConfig();
  const jsonPath = path.join(cwd, config.capabilityMapPath.replace(/\.yaml$/, '.json'));
  fs.writeFileSync(jsonPath, '{}', 'utf8');
  const result = checkJsonCapabilityMap({ cwd, fs, path, config });
  assert.equal(result.passed, true);
});

test('checkJsonCapabilityMap fails when json is missing', () => {
  const cwd = createTempDir();
  const config = defaultConfig();
  const result = checkJsonCapabilityMap({ cwd, fs, path, config });
  assert.equal(result.passed, false);
});

test('checkWidgetInstalled passes when widget exists', () => {
  const cwd = createTempDir();
  const widgetDir = path.join(cwd, 'node_modules', '@ncodes', 'widget');
  fs.mkdirSync(widgetDir, { recursive: true });
  const result = checkWidgetInstalled({ cwd, fs, path });
  assert.equal(result.passed, true);
});

test('checkWidgetInstalled fails when widget is missing', () => {
  const cwd = createTempDir();
  const result = checkWidgetInstalled({ cwd, fs, path });
  assert.equal(result.passed, false);
});

test('checkInstallMdExists passes when file exists', () => {
  const cwd = createTempDir();
  writeFile(cwd, '.n.codes/INSTALL.md', '# Install');
  const result = checkInstallMdExists({ cwd, fs, path });
  assert.equal(result.passed, true);
});

test('checkInstallMdExists fails when file is missing', () => {
  const cwd = createTempDir();
  const result = checkInstallMdExists({ cwd, fs, path });
  assert.equal(result.passed, false);
});

test('checkWidgetIntegration passes when NCodes.init found in layout', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'index.html', '<script>NCodes.init({ user: {} });</script>');
  const result = checkWidgetIntegration({ cwd, fs, path });
  assert.equal(result.passed, true);
  assert.ok(result.message.includes('index.html'));
});

test('checkWidgetIntegration passes when @ncodes/widget import found', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'package.json', JSON.stringify({ dependencies: { next: '^14' } }));
  writeFile(cwd, 'app/layout.tsx', "import '@ncodes/widget';");
  const result = checkWidgetIntegration({ cwd, fs, path });
  assert.equal(result.passed, true);
});

test('checkWidgetIntegration fails when no integration found', () => {
  const cwd = createTempDir();
  const result = checkWidgetIntegration({ cwd, fs, path });
  assert.equal(result.passed, false);
});

test('getLayoutFiles returns correct files for each framework', () => {
  const nextAppFiles = getLayoutFiles('next-app-router');
  assert.ok(nextAppFiles.includes('app/layout.tsx'));
  const expressFiles = getLayoutFiles('express');
  assert.ok(expressFiles.includes('views/layout.ejs'));
  const genericFiles = getLayoutFiles('generic');
  assert.ok(genericFiles.includes('index.html'));
});

test('runVerify with empty dir returns all failures', () => {
  const cwd = createTempDir();
  const io = createMemoryIO();
  const result = runVerify({ cwd, fs, path, io });
  assert.equal(result.allPassed, false);
  assert.equal(result.failed, 7);
  assert.equal(result.passed, 0);
  const logs = io.getLogs();
  assert.ok(logs.some((l) => l.includes('[FAIL]')));
});

test('runVerify with fully configured dir returns all passes', () => {
  const cwd = createTempDir();

  // Config
  const config = { ...defaultConfig(), provider: 'openai', model: 'gpt-5-mini' };
  saveConfig({ cwd, fs, path, config });

  // Capability map (YAML + JSON)
  const map = defaultCapabilityMap({ generatedAt: '2026-01-01T00:00:00Z' });
  const yamlPath = path.join(cwd, config.capabilityMapPath);
  fs.writeFileSync(yamlPath, renderCapabilityMapYaml(map), 'utf8');
  const jsonPath = yamlPath.replace(/\.yaml$/, '.json');
  fs.writeFileSync(jsonPath, JSON.stringify(map, null, 2), 'utf8');

  // Widget package
  fs.mkdirSync(path.join(cwd, 'node_modules', '@ncodes', 'widget'), { recursive: true });

  // INSTALL.md
  writeFile(cwd, '.n.codes/INSTALL.md', '# Install');

  // Widget integration in layout
  writeFile(cwd, 'index.html', '<script>NCodes.init({ user: {} });</script>');

  const io = createMemoryIO();
  const result = runVerify({ cwd, fs, path, io });
  assert.equal(result.allPassed, true);
  assert.equal(result.passed, 7);
  assert.equal(result.failed, 0);
  const logs = io.getLogs();
  assert.ok(logs.some((l) => l.includes('[PASS]')));
  assert.ok(logs.every((l) => !l.includes('[FAIL]')));
});

test('checkCapabilityMapValid fails with parse error on malformed YAML', () => {
  const cwd = createTempDir();
  const config = defaultConfig();
  const mapPath = path.join(cwd, config.capabilityMapPath);
  fs.writeFileSync(mapPath, '!!invalid yaml {{[', 'utf8');
  const result = checkCapabilityMapValid({ cwd, fs, path, config });
  assert.equal(result.passed, false);
  assert.ok(result.message.includes('Parse error'));
});

test('checkWidgetIntegration ignores HTML-commented integration code', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'index.html', '<!-- <script>NCodes.init({ user: {} });</script> -->');
  const result = checkWidgetIntegration({ cwd, fs, path });
  assert.equal(result.passed, false);
});

test('checkWidgetIntegration ignores JS-commented integration code', () => {
  const cwd = createTempDir();
  writeFile(cwd, 'index.html', '// NCodes.init({ user: {} });');
  const result = checkWidgetIntegration({ cwd, fs, path });
  assert.equal(result.passed, false);
});

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  defaultCapabilityMap,
  mergeCapabilityMap,
  renderCapabilityMapYaml,
  parseCapabilityMapYaml,
  summarizeCapabilityMap,
  validateCapabilityMap,
  toCapabilityName,
  inferCapabilitiesFromFiles,
  applyChangedFiles,
} = require('../lib/capability-map');

test('defaultCapabilityMap includes required sections', () => {
  const map = defaultCapabilityMap({ generatedAt: '2026-01-01T00:00:00Z' });
  assert.equal(map.version, 1);
  assert.equal(map.generatedAt, '2026-01-01T00:00:00Z');
  assert.ok(map.entities);
  assert.ok(map.meta);
});

test('mergeCapabilityMap combines sections', () => {
  const base = defaultCapabilityMap({ generatedAt: '2026-01-01T00:00:00Z' });
  base.entities.User = { fields: ['id'] };
  const merged = mergeCapabilityMap(base, { entities: { Order: { fields: ['id'] } } });
  assert.ok(merged.entities.User);
  assert.ok(merged.entities.Order);
});

test('render/parse capability map using JSON YAML', () => {
  const map = defaultCapabilityMap({ generatedAt: '2026-01-01T00:00:00Z' });
  const content = renderCapabilityMapYaml(map);
  const parsed = parseCapabilityMapYaml(content);
  assert.equal(parsed.generatedAt, '2026-01-01T00:00:00Z');
});

test('parseCapabilityMapYaml throws on non-object', () => {
  assert.throws(() => parseCapabilityMapYaml('null'), /Capability map must be a JSON object/);
});

test('summarizeCapabilityMap counts entries', () => {
  const map = defaultCapabilityMap();
  map.actions.ship = { path: 'api/ship.js' };
  const summary = summarizeCapabilityMap(map);
  assert.equal(summary.actions, 1);
});

test('validateCapabilityMap returns errors for missing fields', () => {
  const result = validateCapabilityMap({});
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
});

test('validateCapabilityMap returns valid for defaults', () => {
  const map = defaultCapabilityMap({ generatedAt: '2026-01-01T00:00:00Z' });
  const result = validateCapabilityMap(map);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validateCapabilityMap flags non-object', () => {
  const result = validateCapabilityMap(null);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes('must be an object')));
});
test('toCapabilityName converts file path to camelCase', () => {
  assert.equal(toCapabilityName('src/components/status-badge.tsx'), 'statusBadge');
});

test('toCapabilityName returns empty for non-alphanumeric file name', () => {
  assert.equal(toCapabilityName('src/components/----.tsx'), '');
});

test('inferCapabilitiesFromFiles assigns categories by path', () => {
  const fileIndex = {
    'src/components/Table.tsx': { size: 10, mtimeMs: 1 },
    'src/api/orders.js': { size: 10, mtimeMs: 1 },
    'src/queries/list.ts': { size: 10, mtimeMs: 1 },
  };
  const map = inferCapabilitiesFromFiles(fileIndex);
  assert.equal(Object.keys(map.components).length, 1);
  assert.equal(Object.keys(map.actions).length, 1);
  assert.equal(Object.keys(map.queries).length, 1);
});

test('inferCapabilitiesFromFiles handles routes and services', () => {
  const fileIndex = {
    'src/routes/tickets.js': { size: 10, mtimeMs: 1 },
    'src/services/search.ts': { size: 10, mtimeMs: 1 },
  };
  const map = inferCapabilitiesFromFiles(fileIndex);
  assert.equal(Object.keys(map.actions).length, 1);
  assert.equal(Object.keys(map.queries).length, 1);
});

test('applyChangedFiles copies changed files list', () => {
  const map = defaultCapabilityMap();
  const updated = applyChangedFiles(map, ['a.js', 'b.js']);
  assert.deepEqual(updated.meta.changedFiles, ['a.js', 'b.js']);
});

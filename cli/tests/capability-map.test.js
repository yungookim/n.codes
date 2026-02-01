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
  enrichCapabilityWithAnalysis,
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

test('render/parse capability map using YAML', () => {
  const map = defaultCapabilityMap({ generatedAt: '2026-01-01T00:00:00Z' });
  const content = renderCapabilityMapYaml(map);
  assert.ok(!content.trim().startsWith('{'));
  const parsed = parseCapabilityMapYaml(content);
  assert.equal(parsed.generatedAt, '2026-01-01T00:00:00Z');
});

test('parseCapabilityMapYaml throws on non-object', () => {
  assert.throws(() => parseCapabilityMapYaml('null'), /Capability map must be a YAML object/);
});

test('summarizeCapabilityMap counts entries', () => {
  const map = defaultCapabilityMap();
  map.actions.ship = { endpoint: { method: 'POST', path: '/api/ship' }, description: 'Ships an order.' };
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
    'src/api/orders/_get.js': { size: 10, mtimeMs: 1 },
    'src/api/orders/_post.js': { size: 10, mtimeMs: 1 },
  };
  const map = inferCapabilitiesFromFiles(fileIndex);
  assert.equal(Object.keys(map.components).length, 1);
  assert.equal(Object.keys(map.actions).length, 1);
  assert.equal(Object.keys(map.queries).length, 1);
});

test('inferCapabilitiesFromFiles handles routes and services', () => {
  const fileIndex = {
    'src/routes/tickets/_get.js': { size: 10, mtimeMs: 1 },
    'src/routes/tickets/_post.js': { size: 10, mtimeMs: 1 },
  };
  const map = inferCapabilitiesFromFiles(fileIndex);
  assert.equal(Object.keys(map.actions).length, 1);
  assert.equal(Object.keys(map.queries).length, 1);
});

test('inferCapabilitiesFromFiles builds REST endpoint metadata', () => {
  const fileIndex = {
    'src/api/orders/[id]/cancel.ts': { size: 10, mtimeMs: 1 },
  };
  const map = inferCapabilitiesFromFiles(fileIndex, {
    readFile: () => "export async function POST() { return null; }",
  });
  const action = Object.values(map.actions)[0];
  assert.equal(action.endpoint.method, 'POST');
  assert.equal(action.endpoint.path, '/api/orders/:id/cancel');
  assert.ok(action.description.split('.').filter(Boolean).length >= 2);
});

test('applyChangedFiles copies changed files list', () => {
  const map = defaultCapabilityMap();
  const updated = applyChangedFiles(map, ['a.js', 'b.js']);
  assert.deepEqual(updated.meta.changedFiles, ['a.js', 'b.js']);
});

test('enrichCapabilityWithAnalysis adds LLM fields to action', () => {
  const action = {
    endpoint: { method: 'POST', path: '/api/bookings' },
    description: 'Original heuristic description'
  };

  const analysisResult = {
    description: 'LLM generated description',
    entities: [{ name: 'Booking', fields: ['id'], source: 'prisma' }],
    analysisSource: 'llm'
  };

  const enriched = enrichCapabilityWithAnalysis(action, analysisResult);

  assert.equal(enriched.description, 'LLM generated description');
  assert.deepEqual(enriched.entities, ['Booking']);
  assert.equal(enriched.analysisSource, 'llm');
});

test('enrichCapabilityWithAnalysis preserves heuristic source', () => {
  const action = {
    endpoint: { method: 'POST', path: '/api/bookings' },
    description: 'Heuristic description'
  };

  const analysisResult = {
    description: 'Heuristic description',
    entities: [],
    analysisSource: 'heuristic'
  };

  const enriched = enrichCapabilityWithAnalysis(action, analysisResult);

  assert.equal(enriched.analysisSource, 'heuristic');
});

test('enrichCapabilityWithAnalysis preserves original description if no LLM description', () => {
  const action = {
    endpoint: { method: 'GET', path: '/api/test' },
    description: 'Original description'
  };

  const analysisResult = {
    description: null,
    entities: [],
    analysisSource: 'heuristic'
  };

  const enriched = enrichCapabilityWithAnalysis(action, analysisResult);

  assert.equal(enriched.description, 'Original description');
});

test('renderCapabilityMapYaml includes entities section with fields', () => {
  const map = {
    version: 1,
    generatedAt: '2026-02-01T00:00:00Z',
    projectName: 'test',
    entities: {
      Booking: {
        fields: ['id', 'userId'],
        sources: ['prisma'],
        referencedBy: ['postBookings']
      }
    },
    actions: {
      postBookings: {
        endpoint: { method: 'POST', path: '/api/bookings' },
        description: 'Creates a booking',
        entities: ['Booking'],
        analysisSource: 'llm'
      }
    },
    queries: {},
    components: {},
    meta: { filesAnalyzed: 1 }
  };

  const yaml = renderCapabilityMapYaml(map);

  assert.ok(yaml.includes('entities:'));
  assert.ok(yaml.includes('Booking:'));
  assert.ok(yaml.includes('fields:'));
  assert.ok(yaml.includes('analysisSource: "llm"'));
});

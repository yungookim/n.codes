const test = require('node:test');
const assert = require('node:assert/strict');

const { mergeEntities, normalizeEntityName, buildRouteAnalysisResult } = require('../lib/analyzer');

test('mergeEntities combines entities from multiple routes', () => {
  const routeResults = [
    {
      routeFile: 'pages/api/bookings.ts',
      capabilityName: 'postBookings',
      entities: [
        { name: 'Booking', fields: ['id', 'userId'], source: 'prisma' }
      ]
    },
    {
      routeFile: 'pages/api/bookings/[id].ts',
      capabilityName: 'getBooking',
      entities: [
        { name: 'Booking', fields: ['id', 'status', 'startTime'], source: 'prisma' },
        { name: 'User', fields: ['id', 'email'], source: 'typescript' }
      ]
    }
  ];

  const merged = mergeEntities(routeResults);

  assert.ok(merged.Booking);
  assert.deepEqual(merged.Booking.fields.sort(), ['id', 'startTime', 'status', 'userId']);
  assert.deepEqual(merged.Booking.sources, ['prisma']);
  assert.deepEqual(merged.Booking.referencedBy.sort(), ['getBooking', 'postBookings']);

  assert.ok(merged.User);
  assert.deepEqual(merged.User.fields, ['id', 'email']);
  assert.deepEqual(merged.User.referencedBy, ['getBooking']);
});

test('normalizeEntityName converts to PascalCase', () => {
  assert.equal(normalizeEntityName('booking'), 'Booking');
  assert.equal(normalizeEntityName('user_profile'), 'UserProfile');
  assert.equal(normalizeEntityName('API-Key'), 'ApiKey');
  assert.equal(normalizeEntityName('BookingReference'), 'Bookingreference');
});

test('normalizeEntityName handles empty input', () => {
  assert.equal(normalizeEntityName(''), '');
  assert.equal(normalizeEntityName(null), '');
  assert.equal(normalizeEntityName(undefined), '');
});

test('buildRouteAnalysisResult structures LLM response', () => {
  const llmResult = {
    fallback: false,
    description: 'Creates a new booking',
    entities: [{ name: 'booking', fields: ['id'], source: 'inferred' }]
  };

  const result = buildRouteAnalysisResult({
    routeFile: 'pages/api/bookings.ts',
    capabilityName: 'postBookings',
    method: 'POST',
    path: '/api/bookings',
    llmResult
  });

  assert.equal(result.description, 'Creates a new booking');
  assert.equal(result.analysisSource, 'llm');
  assert.equal(result.entities[0].name, 'Booking'); // normalized
});

test('buildRouteAnalysisResult marks heuristic fallback', () => {
  const llmResult = {
    fallback: true,
    description: 'Heuristic description',
    entities: []
  };

  const result = buildRouteAnalysisResult({
    routeFile: 'pages/api/bookings.ts',
    capabilityName: 'postBookings',
    method: 'POST',
    path: '/api/bookings',
    llmResult
  });

  assert.equal(result.analysisSource, 'heuristic');
});

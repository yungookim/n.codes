const test = require('node:test');
const assert = require('node:assert/strict');

const { formatUsage } = require('../lib/usage');

test('formatUsage includes commands section', () => {
  const usage = formatUsage();
  assert.ok(usage.includes('Commands:'));
  assert.ok(usage.includes('npx ncodes'));
});

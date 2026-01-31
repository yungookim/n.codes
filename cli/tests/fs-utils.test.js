const test = require('node:test');
const assert = require('node:assert/strict');

const { createDryRunFs } = require('../lib/fs-utils');
const { createMemoryIO } = require('../lib/io');

test('createDryRunFs logs write operations', () => {
  const io = createMemoryIO();
  const fs = createDryRunFs({ readFileSync() {} }, io);
  fs.writeFileSync('demo.txt', 'data');
  assert.ok(io.getLogs()[0].includes('demo.txt'));
});

const test = require('node:test');
const assert = require('node:assert/strict');

const { createNodeIO, createMemoryIO } = require('../lib/io');

test('createMemoryIO records logs and errors', async () => {
  const io = createMemoryIO({ responses: ['answer'] });
  const response = await io.prompt('Question');
  io.log('hello');
  io.error('oops');
  assert.equal(response, 'answer');
  assert.deepEqual(io.getLogs(), ['hello']);
  assert.deepEqual(io.getErrors(), ['oops']);
});

test('createMemoryIO returns empty string when no responses remain', async () => {
  const io = createMemoryIO();
  const response = await io.prompt('Question');
  assert.equal(response, '');
});

test('createNodeIO uses readline interface', async () => {
  let closed = false;
  const mockReadline = {
    createInterface() {
      return {
        question(_prompt, callback) {
          callback('value');
        },
        close() {
          closed = true;
        },
      };
    },
  };

  const writes = [];
  const mockOutput = { write: (text) => writes.push(text) };
  const io = createNodeIO({ input: null, output: mockOutput, readline: mockReadline });
  const answer = await io.prompt('Prompt');
  io.log('Logged');
  io.error('Error');
  io.close();

  assert.equal(answer, 'value');
  assert.ok(writes.some((text) => text.includes('Logged')));
  assert.ok(writes.some((text) => text.includes('Error')));
  assert.equal(closed, true);
});

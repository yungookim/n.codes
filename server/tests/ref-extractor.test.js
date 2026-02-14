'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { extractRefs, validateRefs, buildApiBindings, resolveApiBindings } = require('../lib/ref-extractor');

// --- Sample capability map for testing ---
const sampleCapMap = {
  queries: {
    listTasks: { endpoint: 'GET /api/tasks', description: 'List all tasks' },
    getTask: { endpoint: 'GET /api/tasks/:id', description: 'Get task by ID' },
    getStats: { endpoint: 'GET /api/stats', description: 'Task statistics' },
  },
  actions: {
    createTask: { endpoint: 'POST /api/tasks', description: 'Create a task' },
    deleteTask: { endpoint: 'DELETE /api/tasks/:id', description: 'Delete a task' },
  },
};

// --- extractRefs ---

describe('extractRefs', () => {

  it('extracts a single ncodes.query ref', () => {
    const js = 'const tasks = await ncodes.query("listTasks");';
    const result = extractRefs(js);
    assert.deepEqual(result.queries, ['listTasks']);
  });

  it('extracts ncodes.query ref with single quotes', () => {
    const js = "const tasks = await ncodes.query('listTasks');";
    const result = extractRefs(js);
    assert.deepEqual(result.queries, ['listTasks']);
  });

  it('extracts multiple query refs', () => {
    const js = [
      'const tasks = await ncodes.query("listTasks");',
      'const stats = await ncodes.query("getStats");',
    ].join('\n');
    const result = extractRefs(js);
    assert.ok(result.queries.includes('listTasks'));
    assert.ok(result.queries.includes('getStats'));
    assert.equal(result.queries.length, 2);
  });

  it('deduplicates repeated query refs', () => {
    const js = [
      'const a = await ncodes.query("listTasks");',
      'const b = await ncodes.query("listTasks");',
    ].join('\n');
    const result = extractRefs(js);
    assert.deepEqual(result.queries, ['listTasks']);
  });

  it('extracts query ref with params', () => {
    const js = 'const tasks = await ncodes.query("listTasks", { status: "todo" });';
    const result = extractRefs(js);
    assert.deepEqual(result.queries, ['listTasks']);
  });

  it('extracts a single ncodes.action ref', () => {
    const js = 'await ncodes.action("createTask", { title: "New" });';
    const result = extractRefs(js);
    assert.deepEqual(result.actions, ['createTask']);
  });

  it('extracts multiple action refs', () => {
    const js = [
      'await ncodes.action("createTask", data);',
      'await ncodes.action("deleteTask", { id: 1 });',
    ].join('\n');
    const result = extractRefs(js);
    assert.ok(result.actions.includes('createTask'));
    assert.ok(result.actions.includes('deleteTask'));
  });

  it('deduplicates repeated action refs', () => {
    const js = [
      'await ncodes.action("createTask", data1);',
      'await ncodes.action("createTask", data2);',
    ].join('\n');
    const result = extractRefs(js);
    assert.deepEqual(result.actions, ['createTask']);
  });

  it('extracts both queries and actions from the same code', () => {
    const js = [
      'const tasks = await ncodes.query("listTasks");',
      'await ncodes.action("createTask", { title: "Test" });',
      'const stats = await ncodes.query("getStats");',
    ].join('\n');
    const result = extractRefs(js);
    assert.deepEqual(result.queries.sort(), ['getStats', 'listTasks']);
    assert.deepEqual(result.actions, ['createTask']);
  });

  it('returns empty arrays for code with no ncodes calls', () => {
    const js = 'console.log("hello world");';
    const result = extractRefs(js);
    assert.deepEqual(result.queries, []);
    assert.deepEqual(result.actions, []);
  });

  it('returns empty arrays for empty string', () => {
    const result = extractRefs('');
    assert.deepEqual(result.queries, []);
    assert.deepEqual(result.actions, []);
  });

  it('returns empty arrays for null input', () => {
    const result = extractRefs(null);
    assert.deepEqual(result.queries, []);
    assert.deepEqual(result.actions, []);
  });

  it('handles ncodes.query in multiline context', () => {
    const js = [
      'const tasks = await ncodes.query(',
      '  "listTasks",',
      '  { status: "todo" }',
      ');',
    ].join('\n');
    const result = extractRefs(js);
    assert.deepEqual(result.queries, ['listTasks']);
  });
});

// --- validateRefs ---

describe('validateRefs', () => {
  it('returns valid when all refs exist in capability map', () => {
    const refs = { queries: ['listTasks'], actions: ['createTask'] };
    const result = validateRefs(refs, sampleCapMap);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
    assert.equal(result.unknown.length, 0);
  });

  it('returns invalid for unknown query ref', () => {
    const refs = { queries: ['listTasks', 'unknownQuery'], actions: [] };
    const result = validateRefs(refs, sampleCapMap);
    assert.equal(result.valid, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.unknown.includes('unknownQuery'));
  });

  it('returns invalid for unknown action ref', () => {
    const refs = { queries: [], actions: ['unknownAction'] };
    const result = validateRefs(refs, sampleCapMap);
    assert.equal(result.valid, false);
    assert.ok(result.unknown.includes('unknownAction'));
  });

  it('returns valid when no refs are present', () => {
    const refs = { queries: [], actions: [] };
    const result = validateRefs(refs, sampleCapMap);
    assert.equal(result.valid, true);
  });
});

// --- buildApiBindings ---

describe('buildApiBindings', () => {
  it('builds bindings with resolved endpoints for queries', () => {
    const refs = { queries: ['listTasks'], actions: [] };
    const bindings = buildApiBindings(refs, sampleCapMap);
    assert.equal(bindings.length, 1);
    assert.equal(bindings[0].type, 'query');
    assert.equal(bindings[0].ref, 'listTasks');
    assert.equal(bindings[0].resolved.method, 'GET');
    assert.equal(bindings[0].resolved.path, '/api/tasks');
  });

  it('builds bindings with resolved endpoints for actions', () => {
    const refs = { queries: [], actions: ['createTask'] };
    const bindings = buildApiBindings(refs, sampleCapMap);
    assert.equal(bindings.length, 1);
    assert.equal(bindings[0].type, 'action');
    assert.equal(bindings[0].ref, 'createTask');
    assert.equal(bindings[0].resolved.method, 'POST');
    assert.equal(bindings[0].resolved.path, '/api/tasks');
  });

  it('builds bindings for both queries and actions', () => {
    const refs = { queries: ['listTasks', 'getStats'], actions: ['createTask'] };
    const bindings = buildApiBindings(refs, sampleCapMap);
    assert.equal(bindings.length, 3);
    const types = bindings.map(b => b.type);
    assert.ok(types.includes('query'));
    assert.ok(types.includes('action'));
  });

  it('skips refs not found in capability map', () => {
    const refs = { queries: ['unknownQuery'], actions: [] };
    const bindings = buildApiBindings(refs, sampleCapMap);
    assert.equal(bindings.length, 0);
  });
});

// --- resolveApiBindings ---

describe('resolveApiBindings', () => {
  it('combines extraction, validation, and binding for valid code', () => {
    const js = [
      'const tasks = await ncodes.query("listTasks");',
      'await ncodes.action("createTask", data);',
    ].join('\n');
    const result = resolveApiBindings(js, sampleCapMap);

    assert.ok(result.validation.valid);
    assert.equal(result.apiBindings.length, 2);
    assert.deepEqual(result.refs.queries, ['listTasks']);
    assert.deepEqual(result.refs.actions, ['createTask']);
  });

  it('reports validation errors for unknown refs', () => {
    const js = 'const data = await ncodes.query("noSuchRef");';
    const result = resolveApiBindings(js, sampleCapMap);

    assert.equal(result.validation.valid, false);
    assert.ok(result.validation.unknown.includes('noSuchRef'));
    assert.equal(result.apiBindings.length, 0);
  });
});

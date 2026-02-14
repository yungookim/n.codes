'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildCodegenPrompt, formatCapabilityMapForCodegen } = require('../lib/codegen-prompt');

const sampleCapMap = {
  project: 'express-tasks',
  queries: {
    listTasks: { endpoint: 'GET /tasks', description: 'List all tasks' }
  },
  actions: {
    createTask: { endpoint: 'POST /tasks', description: 'Create a new task' }
  },
  entities: {
    task: { fields: ['id', 'title', 'status'], description: 'A task' }
  }
};

const sampleIntent = {
  uiType: 'table',
  description: 'Show all tasks in a table',
  queries: ['listTasks'],
  actions: [],
  entityFocus: 'task',
  requirements: ['sortable columns']
};

describe('formatCapabilityMapForCodegen', () => {
  it('formats queries with ncodes.query syntax', () => {
    const result = formatCapabilityMapForCodegen(sampleCapMap);
    assert.ok(result.includes("ncodes.query('listTasks')"));
  });

  it('formats actions with ncodes.action syntax', () => {
    const result = formatCapabilityMapForCodegen(sampleCapMap);
    assert.ok(result.includes("ncodes.action('createTask'"));
  });

  it('includes entity schemas', () => {
    const result = formatCapabilityMapForCodegen(sampleCapMap);
    assert.ok(result.includes('task'));
    assert.ok(result.includes('id, title, status'));
  });

  it('handles null capability map', () => {
    const result = formatCapabilityMapForCodegen(null);
    assert.ok(result.includes('No capability map'));
  });
});

describe('buildCodegenPrompt', () => {
  it('returns a string containing code generation instructions', () => {
    const prompt = buildCodegenPrompt(sampleCapMap, sampleIntent);
    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.includes('UI code generator'));
    assert.ok(prompt.includes('ncodes.query'));
    assert.ok(prompt.includes('ncodes.action'));
  });

  it('includes the intent context', () => {
    const prompt = buildCodegenPrompt(sampleCapMap, sampleIntent);
    assert.ok(prompt.includes('table'));
    assert.ok(prompt.includes('sortable columns'));
  });

  it('works without intent', () => {
    const prompt = buildCodegenPrompt(sampleCapMap, null);
    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.includes('UI code generator'));
  });

  it('includes CSS custom property instructions', () => {
    const prompt = buildCodegenPrompt(sampleCapMap, sampleIntent);
    assert.ok(prompt.includes('--ncodes-bg'));
    assert.ok(prompt.includes('--ncodes-accent'));
  });

  it('requires async IIFE wrapping', () => {
    const prompt = buildCodegenPrompt(sampleCapMap, sampleIntent);
    assert.ok(prompt.includes('async IIFE'));
  });
});

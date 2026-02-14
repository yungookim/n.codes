'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildIntentPrompt, formatCapabilityContext } = require('../lib/intent-prompt');

const sampleCapMap = {
  project: 'express-tasks',
  queries: {
    listTasks: { endpoint: 'GET /tasks', description: 'List all tasks' },
    getTask: { endpoint: 'GET /tasks/:id', description: 'Get a single task' }
  },
  actions: {
    createTask: { endpoint: 'POST /tasks', description: 'Create a new task' }
  },
  entities: {
    task: { fields: ['id', 'title', 'status'], description: 'A task' }
  }
};

describe('formatCapabilityContext', () => {
  it('formats queries, actions, and entities', () => {
    const result = formatCapabilityContext(sampleCapMap);
    assert.ok(result.includes('express-tasks'));
    assert.ok(result.includes('listTasks'));
    assert.ok(result.includes('getTask'));
    assert.ok(result.includes('createTask'));
    assert.ok(result.includes('task'));
    assert.ok(result.includes('id, title, status'));
  });

  it('returns fallback message for null capability map', () => {
    const result = formatCapabilityContext(null);
    assert.ok(result.includes('No capability map'));
  });

  it('handles empty capability map', () => {
    const result = formatCapabilityContext({});
    assert.ok(!result.includes('undefined'));
  });
});

describe('buildIntentPrompt', () => {
  it('returns a string containing system instructions', () => {
    const prompt = buildIntentPrompt(sampleCapMap);
    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.includes('intent parser'));
    assert.ok(prompt.includes('JSON'));
  });

  it('includes capability map context', () => {
    const prompt = buildIntentPrompt(sampleCapMap);
    assert.ok(prompt.includes('listTasks'));
    assert.ok(prompt.includes('createTask'));
  });

  it('works without capability map', () => {
    const prompt = buildIntentPrompt(null);
    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.includes('No capability map'));
  });
});

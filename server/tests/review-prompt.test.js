'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildReviewPrompt, buildReviewUserPrompt } = require('../lib/review-prompt');

const sampleCapMap = {
  queries: {
    listTasks: { endpoint: 'GET /tasks', description: 'List all tasks' }
  },
  actions: {
    createTask: { endpoint: 'POST /tasks', description: 'Create a new task' }
  }
};

describe('buildReviewPrompt', () => {
  it('returns a string containing QA review instructions', () => {
    const prompt = buildReviewPrompt(sampleCapMap);
    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.includes('QA reviewer'));
  });

  it('includes valid query and action refs', () => {
    const prompt = buildReviewPrompt(sampleCapMap);
    assert.ok(prompt.includes('"listTasks"'));
    assert.ok(prompt.includes('"createTask"'));
  });

  it('handles null capability map', () => {
    const prompt = buildReviewPrompt(null);
    assert.equal(typeof prompt, 'string');
    assert.ok(prompt.includes('none'));
  });

  it('specifies PASS/FAIL output format', () => {
    const prompt = buildReviewPrompt(sampleCapMap);
    assert.ok(prompt.includes('PASS'));
    assert.ok(prompt.includes('FAIL'));
    assert.ok(prompt.includes('verdict'));
  });
});

describe('buildReviewUserPrompt', () => {
  it('includes the generated code and user prompt', () => {
    const prompt = buildReviewUserPrompt(
      '<div>Hello</div>',
      '.hello { color: red; }',
      'const x = 1;',
      'Show tasks'
    );
    assert.ok(prompt.includes('<div>Hello</div>'));
    assert.ok(prompt.includes('.hello { color: red; }'));
    assert.ok(prompt.includes('const x = 1'));
    assert.ok(prompt.includes('Show tasks'));
  });

  it('has proper markdown structure', () => {
    const prompt = buildReviewUserPrompt('<p>Test</p>', '', '', 'test');
    assert.ok(prompt.includes('## Generated HTML'));
    assert.ok(prompt.includes('## Generated CSS'));
    assert.ok(prompt.includes('## Generated JavaScript'));
  });
});

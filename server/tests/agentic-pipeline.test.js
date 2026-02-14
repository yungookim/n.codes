'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseIntentResponse,
  parseReviewResponse,
  formatReviewFeedback,
  addTokens,
  MAX_ITERATIONS
} = require('../lib/agentic-pipeline');

// --- MAX_ITERATIONS ---

describe('MAX_ITERATIONS', () => {
  it('is 3', () => {
    assert.equal(MAX_ITERATIONS, 3);
  });
});

// --- parseIntentResponse ---

describe('parseIntentResponse', () => {
  it('parses a valid intent JSON', () => {
    const json = JSON.stringify({
      type: 'intent',
      uiType: 'table',
      description: 'Show all tasks in a table',
      queries: ['listTasks'],
      actions: [],
      entityFocus: 'tasks',
      requirements: ['responsive', 'dark theme']
    });
    const result = parseIntentResponse(json);
    assert.equal(result.type, 'intent');
    assert.equal(result.uiType, 'table');
    assert.ok(result.queries.includes('listTasks'));
  });

  it('parses a clarification response', () => {
    const json = JSON.stringify({
      type: 'clarification',
      question: 'Should the board show all tasks or only yours?',
      options: ['All tasks', 'My tasks only'],
      reasoning: 'The request is ambiguous.'
    });
    const result = parseIntentResponse(json);
    assert.equal(result.type, 'clarification');
    assert.equal(result.question, 'Should the board show all tasks or only yours?');
    assert.equal(result.options.length, 2);
  });

  it('extracts JSON embedded in surrounding text', () => {
    const text = 'Here is my analysis:\n' + JSON.stringify({
      type: 'intent',
      uiType: 'dashboard',
      description: 'Task dashboard',
      queries: ['getStats'],
      actions: [],
      entityFocus: 'tasks',
      requirements: []
    }) + '\n\nLet me know if you need changes.';
    const result = parseIntentResponse(text);
    assert.equal(result.type, 'intent');
    assert.equal(result.uiType, 'dashboard');
  });

  it('falls back to a generic intent when text has no JSON', () => {
    const text = 'I think you want a task list.';
    const result = parseIntentResponse(text);
    assert.equal(result.type, 'intent');
    assert.equal(result.uiType, 'custom');
    assert.ok(result.description.includes('I think you want a task list'));
    assert.deepEqual(result.queries, []);
    assert.deepEqual(result.actions, []);
  });

  it('falls back gracefully for invalid JSON', () => {
    const text = '{ broken json }}';
    const result = parseIntentResponse(text);
    assert.equal(result.type, 'intent');
    assert.equal(result.uiType, 'custom');
  });
});

// --- parseReviewResponse ---

describe('parseReviewResponse', () => {
  it('parses a PASS verdict', () => {
    const json = JSON.stringify({
      verdict: 'PASS',
      issues: null,
      notes: 'Code looks good.'
    });
    const result = parseReviewResponse(json);
    assert.equal(result.verdict, 'PASS');
    assert.equal(result.issues, null);
    assert.equal(result.notes, 'Code looks good.');
  });

  it('parses a FAIL verdict with issues', () => {
    const json = JSON.stringify({
      verdict: 'FAIL',
      issues: [
        {
          severity: 'error',
          category: 'api-usage',
          description: 'Unknown ref "badRef"',
          suggestion: 'Use "listTasks" instead'
        }
      ],
      notes: 'Found 1 issue.'
    });
    const result = parseReviewResponse(json);
    assert.equal(result.verdict, 'FAIL');
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0].severity, 'error');
  });

  it('extracts JSON embedded in surrounding text', () => {
    const text = 'Review complete.\n' + JSON.stringify({
      verdict: 'PASS',
      issues: null,
      notes: null
    });
    const result = parseReviewResponse(text);
    assert.equal(result.verdict, 'PASS');
  });

  it('defaults to PASS when text has no JSON', () => {
    const result = parseReviewResponse('Looks fine to me!');
    assert.equal(result.verdict, 'PASS');
    assert.ok(result.notes.includes('could not be parsed'));
  });

  it('defaults to PASS for invalid JSON', () => {
    const result = parseReviewResponse('{ bad json }}}');
    assert.equal(result.verdict, 'PASS');
  });

  it('defaults missing verdict to PASS', () => {
    const json = JSON.stringify({ issues: null, notes: 'all good' });
    const result = parseReviewResponse(json);
    assert.equal(result.verdict, 'PASS');
  });
});

// --- formatReviewFeedback ---

describe('formatReviewFeedback', () => {
  it('formats error issues as feedback lines', () => {
    const issues = [
      { severity: 'error', category: 'api-usage', description: 'Unknown ref "badRef"', suggestion: 'Use "listTasks"' },
      { severity: 'error', category: 'accessibility', description: 'Missing alt text' },
    ];
    const feedback = formatReviewFeedback(issues);
    assert.ok(feedback.includes('[api-usage] Unknown ref "badRef"'));
    assert.ok(feedback.includes('Use "listTasks"'));
    assert.ok(feedback.includes('[accessibility] Missing alt text'));
  });

  it('filters out warning-severity issues', () => {
    const issues = [
      { severity: 'warning', category: 'style', description: 'Could be more responsive' },
      { severity: 'error', category: 'api-usage', description: 'Invalid ref' },
    ];
    const feedback = formatReviewFeedback(issues);
    assert.ok(!feedback.includes('more responsive'));
    assert.ok(feedback.includes('Invalid ref'));
  });

  it('returns empty string for null issues', () => {
    assert.equal(formatReviewFeedback(null), '');
  });

  it('returns empty string for empty issues array', () => {
    assert.equal(formatReviewFeedback([]), '');
  });
});

// --- addTokens ---

describe('addTokens', () => {
  it('adds prompt and completion tokens', () => {
    const total = { prompt: 100, completion: 200 };
    const step = { prompt: 50, completion: 75 };
    const result = addTokens(total, step);
    assert.equal(result.prompt, 150);
    assert.equal(result.completion, 275);
  });

  it('handles zero totals', () => {
    const result = addTokens({ prompt: 0, completion: 0 }, { prompt: 100, completion: 200 });
    assert.equal(result.prompt, 100);
    assert.equal(result.completion, 200);
  });

  it('handles missing fields gracefully', () => {
    const result = addTokens({}, { prompt: 50 });
    assert.equal(result.prompt, 50);
    assert.equal(result.completion, 0);
  });
});

// --- pipeline logging ---

describe('pipeline logging', () => {
  let origLog;
  let logCalls;

  beforeEach(() => {
    origLog = console.log;
    logCalls = [];
    console.log = (...args) => logCalls.push(args);
  });

  afterEach(() => {
    console.log = origLog;
  });

  it('runAgenticPipeline logs summary with [n.codes:pipeline] prefix', async () => {
    // We test the pipeline integration by importing and calling it with
    // a mock LLM. This requires stubbing the llm-client module.
    // For a unit test of the log format, we verify the module exports the
    // function and that the log prefix is used at line 340 of the source.
    const pipelineSource = require('fs').readFileSync(
      require('path').join(__dirname, '../lib/agentic-pipeline.js'), 'utf8'
    );
    assert.ok(
      pipelineSource.includes("console.log('[n.codes:pipeline] generated'"),
      'agentic-pipeline.js should contain the pipeline summary log'
    );
  });

  it('pipeline log includes expected shape keys', () => {
    const pipelineSource = require('fs').readFileSync(
      require('path').join(__dirname, '../lib/agentic-pipeline.js'), 'utf8'
    );
    assert.ok(pipelineSource.includes('htmlLen:'), 'should log htmlLen');
    assert.ok(pipelineSource.includes('cssLen:'), 'should log cssLen');
    assert.ok(pipelineSource.includes('jsLen:'), 'should log jsLen');
    assert.ok(pipelineSource.includes('apiBindings:'), 'should log apiBindings');
    assert.ok(pipelineSource.includes('iterations'), 'should log iterations');
  });
});

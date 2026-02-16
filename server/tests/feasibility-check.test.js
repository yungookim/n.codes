'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  runFeasibilityStep,
  parseKeywordResponse,
  parseFeasibilityResponse,
  selectCapabilitySubset,
  formatCapabilitySubset,
  humanizeRef,
  tokenizeText
} = require('../lib/feasibility-check');

const sampleCapMap = {
  project: 'Task Manager',
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

describe('parseKeywordResponse', () => {
  it('parses keywords from JSON and normalizes', () => {
    const text = '{"keywords": ["Tasks", "stats", "tasks"]}';
    const result = parseKeywordResponse(text);
    assert.deepEqual(result, ['tasks', 'stats']);
  });

  it('returns empty array for invalid JSON', () => {
    const result = parseKeywordResponse('not json');
    assert.deepEqual(result, []);
  });

  it('returns empty array for malformed JSON block', () => {
    const result = parseKeywordResponse('{\"keywords\": [}');
    assert.deepEqual(result, []);
  });
});

describe('selectCapabilitySubset', () => {
  it('selects matching capabilities based on keywords', () => {
    const subset = selectCapabilitySubset(sampleCapMap, { keywords: ['stats'], prompt: 'show stats' });
    assert.ok(Object.keys(subset.queries).includes('getStats'));
  });

  it('falls back to a default subset when no keywords match', () => {
    const subset = selectCapabilitySubset(sampleCapMap, { keywords: ['payments'], prompt: 'payments report' });
    assert.ok(Object.keys(subset.queries).length > 0);
    assert.ok(Object.keys(subset.actions).length > 0);
  });

  it('returns empty subsets when capability map is missing', () => {
    const subset = selectCapabilitySubset(null, { keywords: ['tasks'], prompt: 'tasks' });
    assert.deepEqual(subset, { queries: {}, actions: {} });
  });

  it('handles capability maps with missing sections', () => {
    const subset = selectCapabilitySubset({ project: 'Empty' }, { keywords: ['tasks'], prompt: 'tasks' });
    assert.deepEqual(subset, { queries: {}, actions: {} });
  });
});

describe('formatCapabilitySubset', () => {
  it('includes project name and sections', () => {
    const subset = selectCapabilitySubset(sampleCapMap, { keywords: ['tasks'], prompt: 'tasks' });
    const formatted = formatCapabilitySubset(subset, sampleCapMap.project);
    assert.ok(formatted.includes('Application: Task Manager'));
    assert.ok(formatted.includes('Available Queries'));
  });

  it('returns fallback text when no entries', () => {
    const formatted = formatCapabilitySubset({ queries: {}, actions: {} }, null);
    assert.ok(formatted.includes('No capability map entries'));
  });

  it('uses endpoint or fallback text when description is missing', () => {
    const formatted = formatCapabilitySubset({
      queries: { listFoo: { endpoint: 'GET /foo' } },
      actions: { doBar: {} }
    }, null);
    assert.ok(formatted.includes('listFoo: GET /foo'));
    assert.ok(formatted.includes('doBar: No description'));
  });
});

describe('parseFeasibilityResponse', () => {
  it('parses feasible response with queries/actions', () => {
    const text = '{"feasible": true, "reasoning": "ok", "queries": ["listTasks"], "actions": ["createTask"]}';
    const result = parseFeasibilityResponse(text);
    assert.equal(result.feasible, true);
    assert.deepEqual(result.queries, ['listTasks']);
    assert.deepEqual(result.actions, ['createTask']);
  });

  it('parses infeasible response and limits options', () => {
    const text = '{"feasible": false, "reasoning": "no", "clarifyingQuestion": "?", "options": ["a", "b", "c", "d", "e"]}';
    const result = parseFeasibilityResponse(text);
    assert.equal(result.feasible, false);
    assert.equal(result.options.length, 4);
  });

  it('returns feasible true on invalid JSON', () => {
    const result = parseFeasibilityResponse('oops');
    assert.equal(result.feasible, true);
  });
});

describe('runFeasibilityStep', () => {
  it('returns feasible true when capability map is missing', async () => {
    const result = await runFeasibilityStep({
      prompt: 'show tasks',
      intent: {},
      capabilityMap: null,
      llmConfig: { provider: 'openai', model: 'gpt-5-mini' },
      generate: async () => ({ text: '{}', tokensUsed: { prompt: 0, completion: 0 } })
    });
    assert.equal(result.feasible, true);
  });

  it('aggregates tokens and returns infeasible response', async () => {
    let call = 0;
    const generate = async () => {
      call += 1;
      if (call === 1) {
        return { text: '{\"keywords\": [\"tasks\"]}', tokensUsed: { prompt: 5, completion: 1 } };
      }
      return {
        text: '{\"feasible\": false, \"reasoning\": \"no\", \"clarifyingQuestion\": \"?\", \"options\": [\"Show tasks\"]}',
        tokensUsed: { prompt: 7, completion: 2 }
      };
    };

    const result = await runFeasibilityStep({
      prompt: 'show payments',
      intent: { queries: ['listPayments'] },
      capabilityMap: sampleCapMap,
      llmConfig: { provider: 'openai', model: 'gpt-5-mini' },
      generate
    });

    assert.equal(result.feasible, false);
    assert.equal(result.tokensUsed.prompt, 12);
    assert.equal(result.tokensUsed.completion, 3);
    assert.deepEqual(result.options, ['Show tasks']);
    assert.ok(Array.isArray(result.keywords));
  });

  it('falls back when LLM response lacks clarifying question', async () => {
    let call = 0;
    const generate = async () => {
      call += 1;
      if (call === 1) {
        return { text: '{\"keywords\": [\"payments\"]}', tokensUsed: { prompt: 2, completion: 1 } };
      }
      return { text: '{}', tokensUsed: { prompt: 3, completion: 1 } };
    };

    const result = await runFeasibilityStep({
      prompt: 'show payments',
      intent: { queries: ['listPayments'] },
      capabilityMap: sampleCapMap,
      llmConfig: { provider: 'openai', model: 'gpt-5-mini' },
      generate
    });

    assert.equal(result.feasible, false);
    assert.ok(result.clarifyingQuestion.length > 0);
  });

  it('fallback returns feasible when refs are valid', async () => {
    let call = 0;
    const generate = async () => {
      call += 1;
      if (call === 1) {
        return { text: '{\"keywords\": [\"tasks\"]}', tokensUsed: { prompt: 1, completion: 1 } };
      }
      return { text: '{}', tokensUsed: { prompt: 1, completion: 1 } };
    };

    const result = await runFeasibilityStep({
      prompt: 'show tasks',
      intent: { queries: ['listTasks'], actions: ['createTask'] },
      capabilityMap: sampleCapMap,
      llmConfig: { provider: 'openai', model: 'gpt-5-mini' },
      generate
    });

    assert.equal(result.feasible, true);
  });

  it('fallback message mentions both queries and actions when missing', async () => {
    let call = 0;
    const generate = async () => {
      call += 1;
      if (call === 1) {
        return { text: '{\"keywords\": [\"payments\"]}', tokensUsed: { prompt: 1, completion: 1 } };
      }
      return { text: '{}', tokensUsed: { prompt: 1, completion: 1 } };
    };

    const result = await runFeasibilityStep({
      prompt: 'show payments',
      intent: { queries: ['listPayments'], actions: ['refundPayment'] },
      capabilityMap: sampleCapMap,
      llmConfig: { provider: 'openai', model: 'gpt-5-mini' },
      generate
    });

    assert.equal(result.feasible, false);
    assert.ok(result.clarifyingQuestion.includes('data sources'));
    assert.ok(result.clarifyingQuestion.includes('actions'));
  });

  it('fallback message mentions actions when only actions are missing', async () => {
    let call = 0;
    const generate = async () => {
      call += 1;
      if (call === 1) {
        return { text: '{\"keywords\": [\"refund\"]}', tokensUsed: { prompt: 1, completion: 1 } };
      }
      return { text: '{}', tokensUsed: { prompt: 1, completion: 1 } };
    };

    const result = await runFeasibilityStep({
      prompt: 'refund payment',
      intent: { queries: [], actions: ['refundPayment'] },
      capabilityMap: sampleCapMap,
      llmConfig: { provider: 'openai', model: 'gpt-5-mini' },
      generate
    });

    assert.equal(result.feasible, false);
    assert.ok(result.clarifyingQuestion.includes('actions'));
  });

  it('uses defaults when intent is missing and keywords empty', async () => {
    const prompts = [];
    const generate = async ({ prompt: promptText }) => {
      prompts.push(promptText);
      if (prompts.length === 1) {
        return { text: '{\"keywords\": []}' };
      }
      return { text: '{\"feasible\": true, \"reasoning\": \"ok\"}' };
    };

    const result = await runFeasibilityStep({
      prompt: 'show tasks',
      intent: undefined,
      capabilityMap: sampleCapMap,
      llmConfig: { provider: 'openai', model: 'gpt-5-mini' },
      generate
    });

    assert.equal(result.feasible, true);
    assert.ok(prompts[1].includes('Keywords:\nnone'));
    assert.deepEqual(result.tokensUsed, { prompt: 0, completion: 0 });
  });
});

describe('tokenizeText', () => {
  it('tokenizes text into lowercase tokens', () => {
    assert.deepEqual(tokenizeText('Show Tasks 123'), ['show', 'tasks', '123']);
  });

  it('returns empty array for non-string input', () => {
    assert.deepEqual(tokenizeText(null), []);
  });
});

describe('humanizeRef', () => {
  it('converts camelCase to spaced lowercase', () => {
    assert.equal(humanizeRef('listTasks'), 'list tasks');
  });

  it('returns empty string for non-string input', () => {
    assert.equal(humanizeRef(null), '');
  });

  it('returns empty string for whitespace input', () => {
    assert.equal(humanizeRef('   '), '');
  });
});

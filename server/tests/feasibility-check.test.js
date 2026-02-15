'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  checkFeasibility,
  buildNotFeasibleResponse,
  humanizeRef
} = require('../lib/feasibility-check');

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

describe('checkFeasibility', () => {
  it('returns feasible when capability map is null', () => {
    const result = checkFeasibility({ queries: ['listTasks'], actions: [] }, null);
    assert.deepEqual(result, { feasible: true });
  });

  it('returns feasible when intent has no queries/actions', () => {
    const result = checkFeasibility({ queries: [], actions: [] }, sampleCapMap);
    assert.deepEqual(result, { feasible: true });
  });

  it('returns feasible when intent is not an object', () => {
    const result = checkFeasibility(null, sampleCapMap);
    assert.deepEqual(result, { feasible: true });
  });

  it('returns feasible when all refs exist in the map', () => {
    const result = checkFeasibility({ queries: ['listTasks'], actions: ['createTask'] }, sampleCapMap);
    assert.deepEqual(result, { feasible: true });
  });

  it('returns not feasible with invalid query refs', () => {
    const result = checkFeasibility({ queries: ['listPayments'], actions: [] }, sampleCapMap);
    assert.equal(result.feasible, false);
    assert.deepEqual(result.invalidRefs.queries, ['listPayments']);
    assert.deepEqual(result.invalidRefs.actions, []);
  });

  it('returns not feasible with invalid action refs', () => {
    const result = checkFeasibility({ queries: [], actions: ['refundPayment'] }, sampleCapMap);
    assert.equal(result.feasible, false);
    assert.deepEqual(result.invalidRefs.queries, []);
    assert.deepEqual(result.invalidRefs.actions, ['refundPayment']);
  });

  it('returns not feasible when mix of valid and invalid refs', () => {
    const result = checkFeasibility({ queries: ['listTasks', 'listPayments'], actions: ['createTask', 'refundPayment'] }, sampleCapMap);
    assert.equal(result.feasible, false);
    assert.deepEqual(result.invalidRefs.queries, ['listPayments']);
    assert.deepEqual(result.invalidRefs.actions, ['refundPayment']);
  });

  it('returns available capabilities in suggestion', () => {
    const result = checkFeasibility({ queries: ['listPayments'], actions: [] }, sampleCapMap);
    assert.equal(result.feasible, false);
    assert.ok(result.suggestion.queries.includes('listTasks'));
    assert.ok(result.suggestion.actions.includes('createTask'));
  });

  it('handles empty queries/actions objects in capability map', () => {
    const emptyMap = { queries: {}, actions: {} };
    const result = checkFeasibility({ queries: ['listTasks'], actions: ['createTask'] }, emptyMap);
    assert.equal(result.feasible, false);
    assert.deepEqual(result.suggestion, { queries: [], actions: [] });
  });
});

describe('buildNotFeasibleResponse', () => {
  it('builds question mentioning invalid data sources', () => {
    const feasibility = {
      feasible: false,
      invalidRefs: { queries: ['listPayments'], actions: [] },
      suggestion: { queries: ['listTasks'], actions: [] }
    };
    const response = buildNotFeasibleResponse(feasibility, sampleCapMap);
    assert.ok(response.clarifyingQuestion.toLowerCase().includes('data sources'));
  });

  it('builds question mentioning invalid actions', () => {
    const feasibility = {
      feasible: false,
      invalidRefs: { queries: [], actions: ['refundPayment'] },
      suggestion: { queries: [], actions: ['createTask'] }
    };
    const response = buildNotFeasibleResponse(feasibility, sampleCapMap);
    assert.ok(response.clarifyingQuestion.toLowerCase().includes('actions'));
  });

  it('limits options to 4 with queries prioritized over actions', () => {
    const feasibility = {
      feasible: false,
      invalidRefs: { queries: ['listPayments'], actions: ['refundPayment'] },
      suggestion: {
        queries: ['listTasks', 'getTask', 'getStats'],
        actions: ['createTask', 'deleteTask', 'archiveTask']
      }
    };
    const response = buildNotFeasibleResponse(feasibility, sampleCapMap);
    assert.equal(response.options.length, 4);
    assert.deepEqual(response.options.slice(0, 3), [
      humanizeRef('listTasks'),
      humanizeRef('getTask'),
      humanizeRef('getStats')
    ]);
  });

  it('includes feasibility metadata object', () => {
    const feasibility = {
      feasible: false,
      invalidRefs: { queries: ['listPayments'], actions: [] },
      suggestion: { queries: ['listTasks'], actions: [] }
    };
    const response = buildNotFeasibleResponse(feasibility, sampleCapMap);
    assert.equal(response.feasibility.feasible, false);
    assert.deepEqual(response.feasibility.invalidRefs, feasibility.invalidRefs);
  });

  it('returns empty options when no capabilities available', () => {
    const feasibility = {
      feasible: false,
      invalidRefs: { queries: ['listPayments'], actions: [] },
      suggestion: { queries: [], actions: [] }
    };
    const response = buildNotFeasibleResponse(feasibility, { queries: {}, actions: {} });
    assert.deepEqual(response.options, []);
  });

  it('falls back to capability map suggestions when suggestion is missing', () => {
    const feasibility = {
      feasible: false,
      invalidRefs: { queries: ['listPayments'], actions: [] }
    };
    const response = buildNotFeasibleResponse(feasibility, null);
    assert.deepEqual(response.options, []);
    assert.ok(response.reasoning.includes('Unknown queries'));
  });

  it('handles non-array suggestion lists', () => {
    const feasibility = {
      feasible: false,
      invalidRefs: { queries: ['listPayments'], actions: [] },
      suggestion: { queries: 'listTasks', actions: null }
    };
    const response = buildNotFeasibleResponse(feasibility, sampleCapMap);
    assert.deepEqual(response.options, []);
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

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  fetchCapabilityMap,
  validateCapabilityMap,
  getEntities,
  getActions,
  getQueries,
  getCapabilities,
  matchCapability,
  generateQuickPrompts,
  humanize,
} = require('../src/capability-map');

// Load real capability map from test-projects for realistic tests
const REAL_CAP_MAP_PATH = path.join(
  __dirname, '..', '..', 'test-projects', 'express-tasks', 'public', 'n.codes.capabilities.json'
);
const REAL_CAP_MAP = JSON.parse(fs.readFileSync(REAL_CAP_MAP_PATH, 'utf8'));
const SAMPLE_CAP_MAP = {
  project: 'sample',
  entities: {
    task: { fields: ['id', 'title'] },
    user: { fields: ['id', 'name'] },
  },
  actions: {
    createTask: { endpoint: 'POST /tasks', description: 'Create a new task' },
    deleteTask: { endpoint: 'DELETE /tasks/:id', description: 'Delete a task' },
  },
  queries: {
    listTasks: { endpoint: 'GET /tasks', description: 'List all tasks' },
    listUsers: { endpoint: 'GET /users', description: 'List all users' },
  },
};

/** Create a mock fetch that resolves with given data. */
function mockFetch(data, { ok = true, status = 200, delay = 0 } = {}) {
  return async (_url, _opts) => {
    if (delay) await new Promise((r) => setTimeout(r, delay));
    if (_opts && _opts.signal && _opts.signal.aborted) {
      throw new DOMException('The operation was aborted.', 'AbortError');
    }
    return {
      ok,
      status,
      json: async () => data,
    };
  };
}

/** Create a mock fetch that rejects with a network error. */
function mockFetchError(message = 'Network error') {
  return async () => {
    throw new Error(message);
  };
}

/** Create a mock fetch that returns invalid JSON. */
function mockFetchBadJSON() {
  return async () => ({
    ok: true,
    status: 200,
    json: async () => { throw new SyntaxError('Unexpected token'); },
  });
}

describe('capability-map', () => {
  describe('fetchCapabilityMap', () => {
    it('fetches and returns a valid capability map', async () => {
      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: mockFetch(REAL_CAP_MAP),
      });
      assert.deepEqual(result, REAL_CAP_MAP);
    });

    it('passes the URL to the fetch function', async () => {
      let capturedUrl;
      const fetchFn = async (url, opts) => {
        capturedUrl = url;
        return { ok: true, json: async () => REAL_CAP_MAP };
      };
      await fetchCapabilityMap('/my/cap-map.json', { fetchFn });
      assert.equal(capturedUrl, '/my/cap-map.json');
    });

    it('returns null on HTTP error (non-ok response)', async () => {
      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: mockFetch(null, { ok: false, status: 404 }),
      });
      assert.equal(result, null);
    });

    it('returns null on network error', async () => {
      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: mockFetchError('fetch failed'),
      });
      assert.equal(result, null);
    });

    it('returns null on JSON parse error', async () => {
      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: mockFetchBadJSON(),
      });
      assert.equal(result, null);
    });

    it('returns null when fetch is not available', async () => {
      const result = await fetchCapabilityMap('/test.json', { fetchFn: undefined });
      assert.equal(result, null);
    });

    it('returns null when data fails validation', async () => {
      const badData = { notACapMap: true };
      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: mockFetch(badData),
      });
      assert.equal(result, null);
    });

    it('returns null for cap map missing project field', async () => {
      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: mockFetch({ entities: { task: {} } }),
      });
      assert.equal(result, null);
    });

    it('returns null for cap map with no entities/actions/queries', async () => {
      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: mockFetch({ project: 'test' }),
      });
      assert.equal(result, null);
    });

    it('times out after the configured timeout', async () => {
      const slowFetch = async (_url, opts) => {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(resolve, 5000);
          if (opts && opts.signal) {
            opts.signal.addEventListener('abort', () => {
              clearTimeout(timer);
              reject(new DOMException('The operation was aborted.', 'AbortError'));
            });
          }
        });
        return { ok: true, json: async () => REAL_CAP_MAP };
      };

      const start = Date.now();
      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: slowFetch,
        timeout: 50,
      });
      const elapsed = Date.now() - start;

      assert.equal(result, null);
      assert.ok(elapsed < 500, `Expected timeout within 500ms, took ${elapsed}ms`);
    });

    it('respects an external abort signal', async () => {
      const controller = new AbortController();
      // Abort immediately
      controller.abort();

      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: mockFetch(REAL_CAP_MAP),
        signal: controller.signal,
      });
      assert.equal(result, null);
    });

    it('accepts cap map with only entities', async () => {
      const data = { project: 'test', entities: { user: { fields: ['id'] } } };
      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: mockFetch(data),
      });
      assert.deepEqual(result, data);
    });

    it('accepts cap map with only actions', async () => {
      const data = { project: 'test', actions: { create: { endpoint: 'POST /' } } };
      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: mockFetch(data),
      });
      assert.deepEqual(result, data);
    });

    it('accepts cap map with only queries', async () => {
      const data = { project: 'test', queries: { list: { endpoint: 'GET /' } } };
      const result = await fetchCapabilityMap('/test.json', {
        fetchFn: mockFetch(data),
      });
      assert.deepEqual(result, data);
    });
  });

  describe('validateCapabilityMap', () => {
    it('returns true for a valid capability map', () => {
      assert.equal(validateCapabilityMap(REAL_CAP_MAP), true);
    });

    it('accepts projectName as project identifier', () => {
      assert.equal(validateCapabilityMap({ projectName: 'test', actions: { a: { endpoint: 'POST /' } } }), true);
    });

    it('returns false for null', () => {
      assert.equal(validateCapabilityMap(null), false);
    });

    it('returns false for a string', () => {
      assert.equal(validateCapabilityMap('bad'), false);
    });

    it('returns false for missing project in legacy map', () => {
      assert.equal(validateCapabilityMap({ entities: { x: {} }, actions: {}, queries: {} }), false);
    });

    it('returns false for empty project string in legacy map', () => {
      assert.equal(validateCapabilityMap({ project: '', entities: { x: {} }, actions: {}, queries: {} }), false);
    });

    it('returns false when entities/actions/queries are all empty', () => {
      assert.equal(validateCapabilityMap({ project: 'test', entities: {}, actions: {}, queries: {} }), false);
    });

    it('returns false when entities/actions/queries are missing', () => {
      assert.equal(validateCapabilityMap({ project: 'test' }), false);
    });
  });

  describe('getEntities', () => {
    it('returns entities from the sample cap map', () => {
      const entities = getEntities(SAMPLE_CAP_MAP);
      assert.ok('task' in entities);
      assert.ok('user' in entities);
      assert.deepEqual(entities.task.fields, ['id', 'title']);
    });

    it('returns empty object for null', () => {
      assert.deepEqual(getEntities(null), {});
    });

    it('returns empty object for cap map without entities', () => {
      assert.deepEqual(getEntities({ project: 'test', actions: {} }), {});
    });
  });

  describe('getActions', () => {
    it('returns actions from the sample cap map', () => {
      const actions = getActions(SAMPLE_CAP_MAP);
      assert.ok('createTask' in actions);
      assert.ok('deleteTask' in actions);
      assert.equal(actions.createTask.endpoint, 'POST /tasks');
    });

    it('returns empty object for null', () => {
      assert.deepEqual(getActions(null), {});
    });

    it('returns empty object for cap map without actions', () => {
      assert.deepEqual(getActions({ project: 'test' }), {});
    });
  });

  describe('getQueries', () => {
    it('returns queries from the sample cap map', () => {
      const queries = getQueries(SAMPLE_CAP_MAP);
      assert.ok('listTasks' in queries);
      assert.ok('listUsers' in queries);
    });

    it('returns empty object for null', () => {
      assert.deepEqual(getQueries(null), {});
    });

    it('returns empty object for cap map without queries', () => {
      assert.deepEqual(getQueries({ project: 'test' }), {});
    });
  });

  describe('getCapabilities', () => {
    it('returns merged action + query capabilities from sample cap map', () => {
      const caps = getCapabilities(SAMPLE_CAP_MAP);
      assert.equal(caps.length, 4); // 2 actions + 2 queries

      const actionNames = caps.filter((c) => c.type === 'action').map((c) => c.name);
      assert.deepEqual(actionNames, ['createTask', 'deleteTask']);

      const queryNames = caps.filter((c) => c.type === 'query').map((c) => c.name);
      assert.deepEqual(queryNames, ['listTasks', 'listUsers']);
    });

    it('includes descriptions', () => {
      const caps = getCapabilities(SAMPLE_CAP_MAP);
      const createTask = caps.find((c) => c.name === 'createTask');
      assert.equal(createTask.description, 'Create a new task');
      assert.equal(createTask.type, 'action');
    });

    it('returns empty array for null', () => {
      assert.deepEqual(getCapabilities(null), []);
    });

    it('returns empty array for cap map with no actions/queries', () => {
      assert.deepEqual(getCapabilities({ project: 'test', entities: { x: {} } }), []);
    });

    it('handles missing description gracefully', () => {
      const capMap = {
        project: 'test',
        actions: { doThing: { endpoint: 'POST /thing' } },
      };
      const caps = getCapabilities(capMap);
      assert.equal(caps.length, 1);
      assert.equal(caps[0].description, '');
    });
  });

  describe('matchCapability', () => {
    it('matches a prompt to a query capability', () => {
      const result = matchCapability('List all tasks', SAMPLE_CAP_MAP);
      assert.ok(result);
      assert.equal(result.name, 'listTasks');
      assert.equal(result.type, 'query');
    });

    it('matches a prompt to an action capability', () => {
      const result = matchCapability('Create a new task', SAMPLE_CAP_MAP);
      assert.ok(result);
      assert.equal(result.name, 'createTask');
      assert.equal(result.type, 'action');
    });

    it('matches delete action', () => {
      const result = matchCapability('Delete this task', SAMPLE_CAP_MAP);
      assert.ok(result);
      assert.equal(result.name, 'deleteTask');
    });

    it('returns null for unrelated prompt', () => {
      const result = matchCapability('Tell me about the weather', SAMPLE_CAP_MAP);
      assert.equal(result, null);
    });

    it('returns null for null prompt', () => {
      assert.equal(matchCapability(null, SAMPLE_CAP_MAP), null);
    });

    it('returns null for null capMap', () => {
      assert.equal(matchCapability('List tasks', null), null);
    });

    it('matches user-related queries', () => {
      const result = matchCapability('Show all users', SAMPLE_CAP_MAP);
      assert.ok(result);
      assert.equal(result.name, 'listUsers');
    });
  });

  describe('humanize', () => {
    it('converts camelCase to sentence case', () => {
      assert.equal(humanize('listTasks'), 'List tasks');
      assert.equal(humanize('createUser'), 'Create user');
      assert.equal(humanize('getTask'), 'Get task');
    });

    it('handles single word', () => {
      assert.equal(humanize('tasks'), 'Tasks');
    });

    it('handles multiple capitals', () => {
      assert.equal(humanize('listAllUsers'), 'List all users');
    });
  });

  describe('generateQuickPrompts', () => {
    it('generates prompts from the real capability map', () => {
      const prompts = generateQuickPrompts(SAMPLE_CAP_MAP);
      assert.ok(prompts.length > 0);
      assert.ok(prompts.length <= 4);
      // Each prompt has label and prompt fields
      prompts.forEach((p) => {
        assert.ok(typeof p.label === 'string');
        assert.ok(typeof p.prompt === 'string');
        assert.ok(p.label.length > 0);
        assert.ok(p.prompt.length > 0);
      });
    });

    it('prioritises queries over actions', () => {
      const prompts = generateQuickPrompts(SAMPLE_CAP_MAP);
      // First prompts should come from queries in the sample map
      assert.ok(prompts[0].label.includes('List all tasks') || prompts[0].prompt.includes('List all tasks'));
    });

    it('returns at most 4 prompts', () => {
      const bigMap = {
        project: 'big',
        queries: {
          q1: { description: 'Query 1' },
          q2: { description: 'Query 2' },
          q3: { description: 'Query 3' },
        },
        actions: {
          a1: { description: 'Action 1' },
          a2: { description: 'Action 2' },
          a3: { description: 'Action 3' },
        },
      };
      const prompts = generateQuickPrompts(bigMap);
      assert.equal(prompts.length, 4);
    });

    it('returns empty array for null', () => {
      assert.deepEqual(generateQuickPrompts(null), []);
    });

    it('returns empty array for cap map with no actions or queries', () => {
      assert.deepEqual(generateQuickPrompts({ project: 'test', entities: { x: {} } }), []);
    });

    it('uses humanized names when description is missing', () => {
      const capMap = {
        project: 'test',
        queries: { listItems: { endpoint: 'GET /items' } },
      };
      const prompts = generateQuickPrompts(capMap);
      assert.equal(prompts.length, 1);
      assert.equal(prompts[0].label, 'List items');
    });

    it('frames actions as form/build requests', () => {
      const capMap = {
        project: 'test',
        actions: { createTask: { description: 'Create a new task' } },
      };
      const prompts = generateQuickPrompts(capMap);
      assert.equal(prompts.length, 1);
      assert.ok(prompts[0].prompt.startsWith('Build a form to'));
    });
  });
});

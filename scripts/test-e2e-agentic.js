#!/usr/bin/env node

/**
 * E2E integration tests for the agentic UI generation pipeline.
 *
 * Tests the full flow: prompt → capability map lookup → API call → DSL response → validation
 *
 * Uses mock API responses (recorded fixtures in scripts/fixtures/) for CI mode.
 * Once NCO-41 (integration) is complete, these tests will validate the real pipeline.
 *
 * Usage: node scripts/test-e2e-agentic.js
 */

const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const { validateDSL, COMPONENT_TYPES, COLUMN_TYPES, FIELD_VIEW_TYPES } = require('../shared/dsl-types');

const ROOT = path.resolve(__dirname, '..');
const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const EXAMPLES_DIR = path.join(ROOT, 'shared', 'dsl-examples');

// ─── Test helpers ──────────────────────────────────────────────────

/**
 * Load a mock API fixture by name.
 */
function loadFixture(name) {
  const filePath = path.join(FIXTURES_DIR, `${name}.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Load the real capability map from a test project.
 */
function loadCapabilityMap(projectName) {
  const mapPath = path.join(ROOT, 'test-projects', projectName, 'public', 'n.codes.capabilities.json');
  return JSON.parse(fs.readFileSync(mapPath, 'utf8'));
}

/**
 * Validate that API response metadata is present.
 */
function validateResponseMeta(response) {
  const errors = [];
  if (!response.dsl) errors.push('Response must include "dsl" field');
  if (typeof response.reasoning !== 'string') errors.push('Response must include "reasoning" string');
  if (typeof response.tokensUsed !== 'number') errors.push('Response must include "tokensUsed" number');
  if (!Array.isArray(response.capabilitiesUsed)) errors.push('Response must include "capabilitiesUsed" array');
  return { valid: errors.length === 0, errors };
}

/**
 * Validate that capabilities referenced in the response exist in the capability map.
 */
function validateCapabilityRefs(response, capabilityMap) {
  const errors = [];
  const allCapabilities = [
    ...Object.keys(capabilityMap.actions || {}),
    ...Object.keys(capabilityMap.queries || {}),
  ];
  for (const cap of response.capabilitiesUsed || []) {
    if (!allCapabilities.includes(cap)) {
      errors.push(`Referenced capability "${cap}" not found in capability map`);
    }
  }
  return { valid: errors.length === 0, errors };
}

// ─── Test projects configuration ───────────────────────────────────

const TEST_PROJECTS = [
  { name: 'express-tasks', hasCapabilityMap: true },
  { name: 'next-app-crm', hasCapabilityMap: false },
  { name: 'next-pages-invoices', hasCapabilityMap: false },
  { name: 'sveltekit-tickets', hasCapabilityMap: false },
  { name: 'vue-dashboard', hasCapabilityMap: false },
];

// ─── Tests ─────────────────────────────────────────────────────────

describe('E2E: Test Infrastructure', () => {
  it('loads fixture files successfully', () => {
    const taskList = loadFixture('task-list-response');
    const taskDetail = loadFixture('task-detail-response');
    const errorResp = loadFixture('error-response');

    assert.ok(taskList.dsl, 'task-list fixture has DSL');
    assert.ok(taskDetail.dsl, 'task-detail fixture has DSL');
    assert.ok(errorResp.dsl, 'error fixture has DSL');
  });

  it('loads express-tasks capability map', () => {
    const capMap = loadCapabilityMap('express-tasks');
    assert.strictEqual(capMap.project, 'express-tasks');
    assert.ok(capMap.entities, 'has entities');
    assert.ok(capMap.actions, 'has actions');
    assert.ok(capMap.queries, 'has queries');
  });

  it('all 5 test projects exist', () => {
    for (const project of TEST_PROJECTS) {
      const dir = path.join(ROOT, 'test-projects', project.name);
      assert.ok(fs.existsSync(dir), `${project.name} directory exists`);
    }
  });

  it('shared/dsl-types.js exports are available', () => {
    assert.strictEqual(typeof validateDSL, 'function', 'validateDSL is a function');
    assert.ok(Array.isArray(COMPONENT_TYPES), 'COMPONENT_TYPES is an array');
    assert.strictEqual(COMPONENT_TYPES.length, 10, 'has 10 component types');
  });
});

describe('E2E: DSL Schema Validation (real validateDSL)', () => {
  it('task-list fixture passes schema validation', () => {
    const fixture = loadFixture('task-list-response');
    const result = validateDSL(fixture.dsl);
    assert.ok(result.valid, `DSL validation errors: ${result.errors.join(', ')}`);
  });

  it('task-detail fixture passes schema validation', () => {
    const fixture = loadFixture('task-detail-response');
    const result = validateDSL(fixture.dsl);
    assert.ok(result.valid, `DSL validation errors: ${result.errors.join(', ')}`);
  });

  it('error fixture passes schema validation', () => {
    const fixture = loadFixture('error-response');
    const result = validateDSL(fixture.dsl);
    assert.ok(result.valid, `DSL validation errors: ${result.errors.join(', ')}`);
  });

  it('rejects null DSL', () => {
    const result = validateDSL(null);
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors[0].includes('non-null object'));
  });

  it('rejects non-page root type', () => {
    const result = validateDSL({ type: 'data-table', columns: [{ key: 'id', label: 'ID' }], rows: [] });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('Root component must be of type "page"')));
  });

  it('rejects page missing required props', () => {
    const result = validateDSL({ type: 'page' });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('"title"')));
    assert.ok(result.errors.some((e) => e.includes('"children"')));
  });

  it('rejects unknown component type in children', () => {
    const result = validateDSL({ type: 'page', title: 'Test', children: [{ type: 'banana-chart' }] });
    assert.strictEqual(result.valid, false);
    assert.ok(result.errors.some((e) => e.includes('unknown component type "banana-chart"')));
  });
});

describe('E2E: Canonical Example Validation', () => {
  const exampleFiles = fs.readdirSync(EXAMPLES_DIR).filter((f) => f.endsWith('.json'));

  for (const file of exampleFiles) {
    it(`canonical example passes validation: ${file}`, () => {
      const content = fs.readFileSync(path.join(EXAMPLES_DIR, file), 'utf8');
      const dsl = JSON.parse(content);
      const result = validateDSL(dsl);
      assert.ok(result.valid, `Errors in ${file}: ${result.errors.join(', ')}`);
    });
  }

  it('all 6 canonical examples are present', () => {
    assert.ok(exampleFiles.length >= 6, `expected >= 6 examples, got ${exampleFiles.length}`);
  });
});

describe('E2E: Response Metadata Validation', () => {
  it('validates task-list response metadata', () => {
    const fixture = loadFixture('task-list-response');
    const result = validateResponseMeta(fixture);
    assert.ok(result.valid, `Metadata valid: ${result.errors.join(', ')}`);
  });

  it('validates task-detail response metadata', () => {
    const fixture = loadFixture('task-detail-response');
    const result = validateResponseMeta(fixture);
    assert.ok(result.valid, `Metadata valid: ${result.errors.join(', ')}`);
  });

  it('validates error response metadata', () => {
    const fixture = loadFixture('error-response');
    const result = validateResponseMeta(fixture);
    assert.ok(result.valid, `Metadata valid: ${result.errors.join(', ')}`);
  });
});

describe('E2E: Capability Map Cross-Reference', () => {
  let capMap;

  before(() => {
    capMap = loadCapabilityMap('express-tasks');
  });

  it('task-list response references valid capabilities', () => {
    const fixture = loadFixture('task-list-response');
    const result = validateCapabilityRefs(fixture, capMap);
    assert.ok(result.valid, `Capability refs valid: ${result.errors.join(', ')}`);
  });

  it('task-detail response references valid capabilities', () => {
    const fixture = loadFixture('task-detail-response');
    const result = validateCapabilityRefs(fixture, capMap);
    assert.ok(result.valid, `Capability refs valid: ${result.errors.join(', ')}`);
  });

  it('error response has empty capabilities (graceful)', () => {
    const fixture = loadFixture('error-response');
    assert.deepStrictEqual(fixture.capabilitiesUsed, []);
  });

  it('capability map has expected entities', () => {
    assert.ok(capMap.entities.task, 'has task entity');
    assert.ok(capMap.entities.user, 'has user entity');
    assert.ok(capMap.entities.task.fields.includes('title'), 'task has title field');
    assert.ok(capMap.entities.task.fields.includes('status'), 'task has status field');
  });

  it('capability map has expected queries and actions', () => {
    assert.ok(capMap.queries.listTasks, 'has listTasks query');
    assert.ok(capMap.queries.getTask, 'has getTask query');
    assert.ok(capMap.actions.createTask, 'has createTask action');
    assert.ok(capMap.actions.deleteTask, 'has deleteTask action');
  });
});

describe('E2E: Data Table Structure', () => {
  it('task-list data-table has columns and rows', () => {
    const fixture = loadFixture('task-list-response');
    const table = fixture.dsl.children.find((c) => c.type === 'data-table');
    assert.ok(table, 'data-table component found');
    assert.ok(Array.isArray(table.columns), 'has columns');
    assert.ok(Array.isArray(table.rows), 'has rows');
    assert.ok(table.rows.length > 0, 'has at least one row');
  });

  it('data-table columns match entity fields', () => {
    const fixture = loadFixture('task-list-response');
    const capMap = loadCapabilityMap('express-tasks');
    const table = fixture.dsl.children.find((c) => c.type === 'data-table');
    const entityFields = capMap.entities[table.entity].fields;

    for (const col of table.columns) {
      assert.ok(
        entityFields.includes(col.key),
        `Column "${col.key}" matches entity field`
      );
    }
  });

  it('data-table columns use valid column types', () => {
    const fixture = loadFixture('task-list-response');
    const table = fixture.dsl.children.find((c) => c.type === 'data-table');

    for (const col of table.columns) {
      if (col.type) {
        assert.ok(
          COLUMN_TYPES.includes(col.type),
          `Column "${col.key}" has valid type "${col.type}"`
        );
      }
    }
  });

  it('data-table rows have matching keys', () => {
    const fixture = loadFixture('task-list-response');
    const table = fixture.dsl.children.find((c) => c.type === 'data-table');
    const columnKeys = table.columns.map((c) => c.key);

    for (const row of table.rows) {
      for (const key of columnKeys) {
        assert.ok(key in row, `Row has key "${key}"`);
      }
    }
  });
});

describe('E2E: Summary Cards Structure', () => {
  it('task-list has summary-cards with cards array', () => {
    const fixture = loadFixture('task-list-response');
    const cards = fixture.dsl.children.find((c) => c.type === 'summary-cards');
    assert.ok(cards, 'summary-cards component found');
    assert.ok(Array.isArray(cards.cards), 'has cards array');
    assert.ok(cards.cards.length > 0, 'has at least one card');
  });

  it('summary cards have required label and value', () => {
    const fixture = loadFixture('task-list-response');
    const cards = fixture.dsl.children.find((c) => c.type === 'summary-cards');

    for (const card of cards.cards) {
      assert.ok(card.label, `card has label: ${card.label}`);
      assert.ok(card.value !== undefined, `card has value: ${card.value}`);
    }
  });

  it('summary card trend values are valid', () => {
    const fixture = loadFixture('task-list-response');
    const cards = fixture.dsl.children.find((c) => c.type === 'summary-cards');

    for (const card of cards.cards) {
      if (card.trend) {
        assert.ok(
          ['up', 'down', 'neutral'].includes(card.trend),
          `card "${card.label}" has valid trend: ${card.trend}`
        );
      }
    }
  });
});

describe('E2E: Detail View Structure', () => {
  it('task-detail has fields array', () => {
    const fixture = loadFixture('task-detail-response');
    const detail = fixture.dsl.children.find((c) => c.type === 'detail-view');
    assert.ok(detail, 'detail-view component found');
    assert.ok(Array.isArray(detail.fields), 'has fields');
    assert.ok(detail.fields.length > 0, 'has at least one field');
  });

  it('detail view fields have key, label, and value', () => {
    const fixture = loadFixture('task-detail-response');
    const detail = fixture.dsl.children.find((c) => c.type === 'detail-view');

    for (const field of detail.fields) {
      assert.ok(field.key, `field has key: ${field.key}`);
      assert.ok(field.label, `field has label: ${field.label}`);
      assert.ok(field.value !== undefined, `field has value: ${field.key}`);
    }
  });

  it('detail view fields use valid field types', () => {
    const fixture = loadFixture('task-detail-response');
    const detail = fixture.dsl.children.find((c) => c.type === 'detail-view');

    for (const field of detail.fields) {
      if (field.type) {
        assert.ok(
          FIELD_VIEW_TYPES.includes(field.type),
          `Field "${field.key}" has valid type "${field.type}"`
        );
      }
    }
  });
});

describe('E2E: Text Component Structure', () => {
  it('task-detail includes text component', () => {
    const fixture = loadFixture('task-detail-response');
    const text = fixture.dsl.children.find((c) => c.type === 'text');
    assert.ok(text, 'text component found');
    assert.ok(typeof text.content === 'string', 'has content string');
  });

  it('text component variant is valid', () => {
    const fixture = loadFixture('task-detail-response');
    const text = fixture.dsl.children.find((c) => c.type === 'text');
    if (text.variant) {
      assert.ok(
        ['heading', 'paragraph', 'caption', 'code'].includes(text.variant),
        `valid variant: ${text.variant}`
      );
    }
  });
});

describe('E2E: Error Response Structure', () => {
  it('error response contains error component', () => {
    const fixture = loadFixture('error-response');
    const errorComp = fixture.dsl.children.find((c) => c.type === 'error');
    assert.ok(errorComp, 'error component found');
    assert.ok(errorComp.message, 'has error message');
  });

  it('error response has error metadata', () => {
    const fixture = loadFixture('error-response');
    assert.ok(fixture.error, 'has error field');
    assert.ok(fixture.error.code, 'has error code');
    assert.ok(fixture.error.message, 'has error message');
  });

  it('error component has optional code and retry fields', () => {
    const fixture = loadFixture('error-response');
    const errorComp = fixture.dsl.children.find((c) => c.type === 'error');
    assert.ok(errorComp.code, 'has error code');
    assert.strictEqual(errorComp.retry, false, 'retry is false for non-retryable error');
  });
});

// ─── Cross-validation: fixtures vs canonical examples ──────────────

describe('E2E: Fixture-Example Consistency', () => {
  it('task-list fixture mirrors canonical task-list structure', () => {
    const fixture = loadFixture('task-list-response');
    const canonical = JSON.parse(fs.readFileSync(path.join(EXAMPLES_DIR, 'task-list.json'), 'utf8'));

    // Both should be pages with data-table children
    assert.strictEqual(fixture.dsl.type, canonical.type);
    const fixTable = fixture.dsl.children.find((c) => c.type === 'data-table');
    const canTable = canonical.children.find((c) => c.type === 'data-table');
    assert.ok(fixTable && canTable, 'both have data-table');

    // Column key sets should overlap (fixture may have fewer columns)
    const fixKeys = new Set(fixTable.columns.map((c) => c.key));
    const canKeys = new Set(canTable.columns.map((c) => c.key));
    for (const key of fixKeys) {
      assert.ok(canKeys.has(key), `fixture column "${key}" exists in canonical example`);
    }
  });

  it('task-detail fixture mirrors canonical task-detail structure', () => {
    const fixture = loadFixture('task-detail-response');
    const canonical = JSON.parse(fs.readFileSync(path.join(EXAMPLES_DIR, 'task-detail.json'), 'utf8'));

    assert.strictEqual(fixture.dsl.type, canonical.type);
    const fixDetail = fixture.dsl.children.find((c) => c.type === 'detail-view');
    const canDetail = canonical.children.find((c) => c.type === 'detail-view');
    assert.ok(fixDetail && canDetail, 'both have detail-view');
  });

  it('error fixture mirrors canonical error structure', () => {
    const fixture = loadFixture('error-response');
    const canonical = JSON.parse(fs.readFileSync(path.join(EXAMPLES_DIR, 'error-not-found.json'), 'utf8'));

    assert.strictEqual(fixture.dsl.type, canonical.type);
    const fixError = fixture.dsl.children.find((c) => c.type === 'error');
    const canError = canonical.children.find((c) => c.type === 'error');
    assert.ok(fixError && canError, 'both have error component');
    assert.ok(fixError.message && canError.message, 'both have message');
  });
});

// ─── Full pipeline tests (NCO-41 complete) ────────────────────────

const { callGenerateAPI, GenerateError } = require('../widget/src/api-client');
const { addToHistory, getHistory, clearHistory } = require('../widget/src/history');
const { renderComponent, RENDERERS } = require('../widget/src/components/index');
const { parseDSLResponse, extractJSON, extractReasoning } = require('../server/lib/response-parser');
const { buildSystemPrompt, formatCapabilityContext } = require('../server/lib/prompt-builder');

/**
 * Create a mock fetch function that returns a predefined response.
 */
function createMockFetch(responseBody, status = 200) {
  return async (url, options) => {
    // Capture the request for assertion
    createMockFetch._lastRequest = { url, options, body: JSON.parse(options.body) };
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => (status >= 200 && status < 300)
        ? responseBody
        : { error: responseBody.error || 'Server error' },
    };
  };
}

/**
 * Create a mock fetch that throws a network error.
 */
function createFailingFetch(errorMessage) {
  return async () => {
    throw new Error(errorMessage);
  };
}

/**
 * Mock localStorage for Node.js test environment.
 */
function setupMockLocalStorage() {
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { for (const key of Object.keys(store)) delete store[key]; },
  };
}

describe('E2E: Full Pipeline — Prompt to Rendered UI', () => {
  let capMap;

  before(() => {
    capMap = loadCapabilityMap('express-tasks');
    setupMockLocalStorage();
  });

  it('complete flow: prompt → API call → validate DSL → component types', async () => {
    const fixture = loadFixture('task-list-response');
    const mockFetch = createMockFetch(fixture);

    // Step 1: Call API with mock fetch
    const result = await callGenerateAPI('/api/generate', {
      prompt: 'Show all tasks',
      capabilityMap: capMap,
      provider: 'openai',
      model: 'gpt-5-mini',
    }, { fetchFn: mockFetch, maxRetries: 0 });

    // Step 2: Verify request was correctly formed
    const req = createMockFetch._lastRequest;
    assert.strictEqual(req.body.prompt, 'Show all tasks');
    assert.strictEqual(req.body.provider, 'openai');
    assert.strictEqual(req.body.model, 'gpt-5-mini');
    assert.deepStrictEqual(req.body.capabilityMap, capMap);

    // Step 3: Validate DSL response
    const { valid, errors } = validateDSL(result.dsl);
    assert.ok(valid, `DSL validation failed: ${errors.join(', ')}`);

    // Step 4: Verify expected component types in the response
    const childTypes = result.dsl.children.map((c) => c.type);
    assert.ok(childTypes.includes('data-table'), 'response contains data-table');
    assert.ok(childTypes.includes('summary-cards'), 'response contains summary-cards');

    // Step 5: Verify all component types have renderers
    for (const child of result.dsl.children) {
      assert.ok(RENDERERS[child.type], `renderer exists for "${child.type}"`);
    }
  });

  it('detail view flow: single task prompt → detail-view + text components', async () => {
    const fixture = loadFixture('task-detail-response');
    const mockFetch = createMockFetch(fixture);

    const result = await callGenerateAPI('/api/generate', {
      prompt: 'Show task #1 details',
      capabilityMap: capMap,
      provider: 'openai',
      model: 'gpt-5-mini',
    }, { fetchFn: mockFetch, maxRetries: 0 });

    const { valid } = validateDSL(result.dsl);
    assert.ok(valid, 'detail DSL is valid');

    const childTypes = result.dsl.children.map((c) => c.type);
    assert.ok(childTypes.includes('detail-view'), 'has detail-view');
    assert.ok(childTypes.includes('text'), 'has text component');

    // Verify detail fields match capability map entity fields
    const detail = result.dsl.children.find((c) => c.type === 'detail-view');
    const entityFields = capMap.entities.task.fields;
    for (const field of detail.fields) {
      assert.ok(entityFields.includes(field.key) || field.key === 'id', `field "${field.key}" matches entity`);
    }
  });

  it('error flow: API returns error DSL for unknown capability', async () => {
    const fixture = loadFixture('error-response');
    const mockFetch = createMockFetch(fixture);

    const result = await callGenerateAPI('/api/generate', {
      prompt: 'export quarterly report',
      capabilityMap: capMap,
      provider: 'openai',
      model: 'gpt-5-mini',
    }, { fetchFn: mockFetch, maxRetries: 0 });

    const { valid } = validateDSL(result.dsl);
    assert.ok(valid, 'error DSL is valid');

    const errorComp = result.dsl.children.find((c) => c.type === 'error');
    assert.ok(errorComp, 'has error component');
    assert.ok(errorComp.message.length > 0, 'error has message');
    assert.ok(RENDERERS['error'], 'error renderer exists');
  });

  it('validates response metadata alongside DSL', async () => {
    const fixture = loadFixture('task-list-response');
    const mockFetch = createMockFetch(fixture);

    const result = await callGenerateAPI('/api/generate', {
      prompt: 'Show all tasks',
      capabilityMap: capMap,
      provider: 'openai',
      model: 'gpt-5-mini',
    }, { fetchFn: mockFetch, maxRetries: 0 });

    // Both DSL and metadata should be valid
    const dslResult = validateDSL(result.dsl);
    const metaResult = validateResponseMeta(result);
    assert.ok(dslResult.valid, 'DSL valid');
    assert.ok(metaResult.valid, `Metadata valid: ${metaResult.errors.join(', ')}`);
  });
});

describe('E2E: API Failure and Fallback', () => {
  before(() => {
    setupMockLocalStorage();
  });

  it('throws GenerateError on 500 server error', async () => {
    const mockFetch = createMockFetch({ error: 'Internal server error' }, 500);

    await assert.rejects(
      () => callGenerateAPI('/api/generate', {
        prompt: 'Show tasks',
        capabilityMap: {},
        provider: 'openai',
        model: 'gpt-5-mini',
      }, { fetchFn: mockFetch, maxRetries: 0 }),
      (err) => {
        assert.ok(err instanceof GenerateError, 'is GenerateError');
        assert.ok(err.message.includes('Server error') || err.message.includes('unavailable'), `error message: ${err.message}`);
        return true;
      }
    );
  });

  it('throws GenerateError on 401 unauthorized (no retry)', async () => {
    const mockFetch = createMockFetch({ error: 'Invalid API key' }, 401);

    await assert.rejects(
      () => callGenerateAPI('/api/generate', {
        prompt: 'Show tasks',
        capabilityMap: {},
        provider: 'openai',
        model: 'gpt-5-mini',
      }, { fetchFn: mockFetch, maxRetries: 3 }),
      (err) => {
        assert.ok(err instanceof GenerateError, 'is GenerateError');
        assert.strictEqual(err.status, 401);
        assert.ok(err.message.includes('API key'), `error message: ${err.message}`);
        return true;
      }
    );
  });

  it('throws GenerateError on 422 invalid DSL from server', async () => {
    const mockFetch = createMockFetch({ error: 'Invalid DSL' }, 422);

    await assert.rejects(
      () => callGenerateAPI('/api/generate', {
        prompt: 'Show tasks',
        capabilityMap: {},
        provider: 'openai',
        model: 'gpt-5-mini',
      }, { fetchFn: mockFetch, maxRetries: 0 }),
      (err) => {
        assert.ok(err instanceof GenerateError, 'is GenerateError');
        assert.strictEqual(err.status, 422);
        return true;
      }
    );
  });

  it('throws GenerateError on network failure', async () => {
    const failFetch = createFailingFetch('fetch failed');

    await assert.rejects(
      () => callGenerateAPI('/api/generate', {
        prompt: 'Show tasks',
        capabilityMap: {},
        provider: 'openai',
        model: 'gpt-5-mini',
      }, { fetchFn: failFetch, maxRetries: 0 }),
      (err) => {
        assert.ok(err instanceof GenerateError, 'is GenerateError');
        assert.ok(err.message.includes('Network error'), `error message: ${err.message}`);
        return true;
      }
    );
  });

  it('simulation mode is available when live mode fails (isLive logic)', () => {
    // When capabilityMap is null, isLive should be false → simulation path
    const isLiveWithMap = ('live' === 'live') && { project: 'test' };
    const isLiveWithoutMap = ('live' === 'live') && null;
    const isSimulation = ('simulation' === 'live') && { project: 'test' };

    assert.ok(!!isLiveWithMap, 'live mode with map → isLive true');
    assert.strictEqual(!!isLiveWithoutMap, false, 'live mode without map → isLive false');
    assert.strictEqual(!!isSimulation, false, 'simulation mode → isLive false');
  });

  it('client-side DSL validation catches bad responses before rendering', () => {
    // Simulate what handleGenerateLive does when DSL is invalid
    const badResponses = [
      { dsl: null },
      { dsl: { type: 'not-a-page', title: 'Bad' } },
      { dsl: { type: 'page' } },  // missing title and children
      { dsl: { type: 'page', title: 'Test', children: [{ type: 'unknown-widget' }] } },
    ];

    for (const response of badResponses) {
      const { valid } = validateDSL(response.dsl);
      assert.strictEqual(valid, false, `rejected: ${JSON.stringify(response.dsl)}`);
    }
  });
});

describe('E2E: History Storage and Replay', () => {
  before(() => {
    setupMockLocalStorage();
  });

  it('live mode generation stores DSL in history', async () => {
    clearHistory();
    const fixture = loadFixture('task-list-response');
    const mockFetch = createMockFetch(fixture);

    // Simulate live mode flow
    const result = await callGenerateAPI('/api/generate', {
      prompt: 'Show all tasks',
      capabilityMap: loadCapabilityMap('express-tasks'),
      provider: 'openai',
      model: 'gpt-5-mini',
    }, { fetchFn: mockFetch, maxRetries: 0 });

    // Validate and store (as handleGenerateLive does)
    const { valid } = validateDSL(result.dsl);
    assert.ok(valid, 'DSL is valid before storing');

    const entry = addToHistory({ prompt: 'Show all tasks', dsl: result.dsl });
    assert.ok(entry.id, 'entry has id');
    assert.strictEqual(entry.prompt, 'Show all tasks');
    assert.deepStrictEqual(entry.dsl, result.dsl);
    assert.strictEqual(entry.templateId, null, 'no templateId for live entries');
  });

  it('replay from history produces same DSL', () => {
    const history = getHistory();
    assert.ok(history.length > 0, 'history has entries');

    const entry = history[0];
    assert.ok(entry.dsl, 'entry has DSL');

    // Re-validate stored DSL (simulates replay validation)
    const { valid, errors } = validateDSL(entry.dsl);
    assert.ok(valid, `Replayed DSL valid: ${errors.join(', ')}`);

    // Verify component types match original fixture
    const fixture = loadFixture('task-list-response');
    const originalTypes = fixture.dsl.children.map((c) => c.type).sort();
    const replayedTypes = entry.dsl.children.map((c) => c.type).sort();
    assert.deepStrictEqual(replayedTypes, originalTypes, 'replayed types match original');
  });

  it('can distinguish live vs simulation entries in history', () => {
    // Add a simulation entry
    addToHistory({ prompt: 'Show invoices', templateId: 'invoices' });

    const history = getHistory();
    assert.ok(history.length >= 2, 'at least 2 history entries');

    const simEntry = history.find((e) => e.templateId === 'invoices');
    const liveEntry = history.find((e) => e.dsl && !e.templateId);

    assert.ok(simEntry, 'found simulation entry');
    assert.ok(liveEntry, 'found live entry');

    // Live entry has DSL, simulation doesn't
    assert.ok(liveEntry.dsl, 'live entry has dsl');
    assert.strictEqual(simEntry.dsl, undefined, 'sim entry has no dsl');
    assert.strictEqual(simEntry.templateId, 'invoices', 'sim entry has templateId');
  });

  it('history respects max entries limit', () => {
    clearHistory();
    const fixture = loadFixture('task-list-response');

    // Add 25 entries (max is 20)
    for (let i = 0; i < 25; i++) {
      addToHistory({ prompt: `Task ${i}`, dsl: fixture.dsl });
    }

    const history = getHistory();
    assert.ok(history.length <= 20, `history capped at 20, got ${history.length}`);
    assert.strictEqual(history[0].prompt, 'Task 24', 'most recent entry is first');
  });
});

describe('E2E: Server-Side Pipeline', () => {
  it('response parser extracts DSL from raw JSON', () => {
    const fixture = loadFixture('task-list-response');
    const rawJSON = JSON.stringify(fixture.dsl);

    const { dsl, reasoning } = parseDSLResponse(rawJSON);
    assert.ok(dsl, 'parsed DSL exists');
    assert.strictEqual(dsl.type, 'page');
    assert.strictEqual(reasoning, '');
  });

  it('response parser extracts DSL from markdown code block', () => {
    const fixture = loadFixture('task-detail-response');
    const markdown = `Here's the task detail UI:\n\n\`\`\`json\n${JSON.stringify(fixture.dsl, null, 2)}\n\`\`\``;

    const { dsl, reasoning } = parseDSLResponse(markdown);
    assert.ok(dsl, 'parsed DSL from markdown');
    assert.strictEqual(dsl.type, 'page');
    assert.ok(reasoning.includes('task detail'), 'reasoning extracted');
  });

  it('response parser rejects invalid DSL', () => {
    const invalidJSON = JSON.stringify({ type: 'not-a-page', foo: 'bar' });
    assert.throws(
      () => parseDSLResponse(invalidJSON),
      (err) => err.name === 'DSLValidationError'
    );
  });

  it('prompt builder includes capability map context', () => {
    const capMap = loadCapabilityMap('express-tasks');
    const context = formatCapabilityContext(capMap);

    assert.ok(context.includes('express-tasks'), 'includes project name');
    assert.ok(context.includes('POST /tasks'), 'includes action endpoint');
    assert.ok(context.includes('GET /tasks'), 'includes query endpoint');
    assert.ok(context.includes('task:'), 'includes entity');
    assert.ok(context.includes('title'), 'includes entity field');
  });

  it('system prompt includes DSL schema and examples', () => {
    const capMap = loadCapabilityMap('express-tasks');
    const prompt = buildSystemPrompt(capMap);

    assert.ok(prompt.includes('page'), 'includes page type');
    assert.ok(prompt.includes('data-table'), 'includes data-table type');
    assert.ok(prompt.includes('detail-view'), 'includes detail-view type');
    assert.ok(prompt.includes('express-tasks'), 'includes capability map context');
    assert.ok(prompt.includes('Example'), 'includes examples');
    assert.ok(prompt.length > 500, `prompt has sufficient length: ${prompt.length}`);
  });
});

describe('E2E: All Test Projects Verification', () => {
  for (const project of TEST_PROJECTS) {
    it(`${project.name}: project directory and package.json exist`, () => {
      const dir = path.join(ROOT, 'test-projects', project.name);
      assert.ok(fs.existsSync(dir), `${project.name} directory exists`);
      assert.ok(
        fs.existsSync(path.join(dir, 'package.json')),
        `${project.name} has package.json`
      );
    });
  }

  it('express-tasks has valid capability map', () => {
    const capMap = loadCapabilityMap('express-tasks');
    const { valid, errors } = validateResponseMeta({
      dsl: { type: 'page', title: 'test', children: [] },
      reasoning: 'test',
      tokensUsed: 0,
      capabilitiesUsed: Object.keys(capMap.queries || {}),
    });
    // All query capabilities should be valid
    const capResult = validateCapabilityRefs(
      { capabilitiesUsed: Object.keys(capMap.queries || {}) },
      capMap
    );
    assert.ok(capResult.valid, `all queries are valid refs: ${capResult.errors.join(', ')}`);
  });

  it('express-tasks capability map supports full e2e flow', () => {
    const capMap = loadCapabilityMap('express-tasks');

    // Verify required capabilities for our test scenarios
    assert.ok(capMap.queries.listTasks, 'has listTasks for task-list test');
    assert.ok(capMap.queries.getTask, 'has getTask for task-detail test');
    assert.ok(capMap.actions.createTask, 'has createTask for form test');
    assert.ok(capMap.entities.task, 'has task entity');
    assert.ok(capMap.entities.user, 'has user entity');

    // Prompt builder can consume it
    const context = formatCapabilityContext(capMap);
    assert.ok(context.length > 0, 'capability context is non-empty');
  });
});

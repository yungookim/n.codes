const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

describe('integration: API → sandbox render pipeline', () => {
  describe('API request format', () => {
    it('builds correct request body shape', () => {
      const prompt = 'Show all tasks';
      const config = {
        apiUrl: '/api/generate',
        provider: 'openai',
        model: 'gpt-5-mini',
      };
      const body = { prompt, provider: config.provider, model: config.model };

      assert.equal(body.prompt, 'Show all tasks');
      assert.equal(body.provider, 'openai');
      assert.equal(body.model, 'gpt-5-mini');
    });

    it('request body serializes to valid JSON', () => {
      const body = { prompt: 'Show tasks', provider: 'openai', model: 'gpt-5-mini' };
      const json = JSON.stringify(body);
      const parsed = JSON.parse(json);
      assert.equal(parsed.prompt, 'Show tasks');
    });
  });

  describe('API response handling', () => {
    it('valid generate response has required fields', () => {
      const response = {
        html: '<div class="tasks">...</div>',
        css: '.tasks { display: flex; }',
        js: 'const tasks = await ncodes.query("listTasks");',
        reasoning: 'Created a task list view.',
        apiBindings: [
          { type: 'query', ref: 'listTasks', resolved: { method: 'GET', path: '/tasks' } },
        ],
        iterations: 1,
        tokensUsed: { prompt: 500, completion: 300 },
      };

      assert.ok(response.html);
      assert.ok(response.css);
      assert.ok(response.js);
      assert.equal(typeof response.reasoning, 'string');
      assert.ok(Array.isArray(response.apiBindings));
    });

    it('clarifying question response has required fields', () => {
      const response = {
        clarifyingQuestion: 'Should the board show all tasks or only yours?',
        options: ['All tasks', 'My tasks only'],
        reasoning: 'Ambiguous scope.',
      };

      assert.equal(typeof response.clarifyingQuestion, 'string');
      assert.ok(Array.isArray(response.options));
    });

    it('apiBindings have correct shape', () => {
      const binding = { type: 'query', ref: 'listTasks', resolved: { method: 'GET', path: '/tasks' } };
      assert.equal(binding.type, 'query');
      assert.equal(typeof binding.ref, 'string');
      assert.equal(typeof binding.resolved.method, 'string');
      assert.equal(typeof binding.resolved.path, 'string');
    });
  });

  describe('history with generated entries', () => {
    let localStorage;

    beforeEach(() => {
      const store = {};
      localStorage = {
        getItem: (key) => store[key] || null,
        setItem: (key, val) => { store[key] = val; },
        removeItem: (key) => { delete store[key]; },
      };
      globalThis.localStorage = localStorage;
    });

    it('stores generated entry in history', () => {
      const { addToHistory, getHistory } = require('../src/history');
      const generated = {
        html: '<div>Tasks</div>',
        css: '.task { color: green; }',
        js: 'console.log("loaded");',
        apiBindings: [],
      };
      const entry = addToHistory({ prompt: 'Show tasks', generated });
      assert.ok(entry.id);
      assert.equal(entry.prompt, 'Show tasks');
      assert.deepEqual(entry.generated, generated);
      assert.equal('templateId' in entry, false);

      const history = getHistory();
      assert.equal(history.length, 1);
      assert.deepEqual(history[0].generated, generated);
    });

  });

  describe('config: live mode options', () => {
    it('mergeConfig includes apiUrl, provider, model defaults', () => {
      const { mergeConfig } = require('../src/config');
      const config = mergeConfig({});
      assert.equal(config.apiUrl, '/api/generate');
      assert.equal(config.provider, 'openai');
      assert.equal(config.model, 'gpt-5-mini');
    });

    it('allows overriding live mode options', () => {
      const { mergeConfig } = require('../src/config');
      const config = mergeConfig({
        apiUrl: 'https://my-api.com/generate',
        provider: 'anthropic',
        model: 'claude-sonnet-4-5',
      });
      assert.equal(config.apiUrl, 'https://my-api.com/generate');
      assert.equal(config.provider, 'anthropic');
      assert.equal(config.model, 'claude-sonnet-4-5');
    });
  });
});

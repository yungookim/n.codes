'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createMessageHandler } = require('../src/message-handler');

// Suppress console output during tests
let _origLog, _origWarn, _origError;
let _logCalls, _warnCalls, _errorCalls;

beforeEach(() => {
  _logCalls = [];
  _warnCalls = [];
  _errorCalls = [];
  _origLog = console.log;
  _origWarn = console.warn;
  _origError = console.error;
  console.log = (...args) => _logCalls.push(args);
  console.warn = (...args) => _warnCalls.push(args);
  console.error = (...args) => _errorCalls.push(args);
});

afterEach(() => {
  console.log = _origLog;
  console.warn = _origWarn;
  console.error = _origError;
});

// --- Mock iframe ---

function createMockIframe() {
  const postedMessages = [];
  const contentWindow = {
    postMessage(data, origin) {
      postedMessages.push({ data, origin });
    },
  };
  return { contentWindow, _postedMessages: postedMessages };
}

// --- Mock fetch ---

function createMockFetch(responseData, opts) {
  const fetchOpts = opts || {};
  const calls = [];
  async function mockFetch(url, options) {
    calls.push({ url, options });
    if (fetchOpts.fail) {
      return {
        ok: false,
        status: fetchOpts.status || 500,
        json: async () => ({ error: fetchOpts.errorMsg || 'Server error' }),
      };
    }
    if (fetchOpts.networkError) {
      throw new Error('Network error');
    }
    return {
      ok: true,
      status: 200,
      json: async () => responseData,
    };
  }
  mockFetch.calls = calls;
  return mockFetch;
}

// --- Sample bindings ---

const sampleBindings = [
  { type: 'query', ref: 'listTasks', resolved: { method: 'GET', path: '/api/tasks' } },
  { type: 'action', ref: 'createTask', resolved: { method: 'POST', path: '/api/tasks' } },
];

describe('createMessageHandler', () => {

  it('returns an object with start, stop, handler', () => {
    const iframe = createMockIframe();
    const handler = createMessageHandler(iframe, sampleBindings);
    assert.ok(typeof handler.start === 'function');
    assert.ok(typeof handler.stop === 'function');
    assert.ok(typeof handler.handler === 'function');
  });

  describe('handler — query requests', () => {
    it('proxies a valid query request and returns data', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch([{ id: 1, title: 'Task 1' }]);
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      const event = {
        data: {
          type: 'ncodes:api-request',
          id: 'req-1',
          method: 'query',
          ref: 'listTasks',
          params: {},
        },
        source: iframe.contentWindow,
      };

      handler(event);
      // Wait for async handling
      await new Promise(r => setTimeout(r, 10));

      assert.equal(mockFetch.calls.length, 1);
      assert.equal(mockFetch.calls[0].url, '/api/tasks');
      assert.equal(mockFetch.calls[0].options.method, 'GET');

      // Should post response back
      assert.equal(iframe._postedMessages.length, 1);
      assert.equal(iframe._postedMessages[0].data.type, 'ncodes:api-response');
      assert.equal(iframe._postedMessages[0].data.id, 'req-1');
      assert.deepEqual(iframe._postedMessages[0].data.data, [{ id: 1, title: 'Task 1' }]);
      assert.equal(iframe._postedMessages[0].data.error, null);
    });

    it('appends query params for GET requests', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch([]);
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-2',
          method: 'query',
          ref: 'listTasks',
          params: { status: 'todo' },
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      assert.ok(mockFetch.calls[0].url.includes('status=todo'));
    });
  });

  describe('handler — action requests', () => {
    it('proxies a valid action request with POST method', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch({ id: 7, title: 'New task' });
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-3',
          method: 'action',
          ref: 'createTask',
          data: { title: 'New task', status: 'todo' },
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      assert.equal(mockFetch.calls.length, 1);
      assert.equal(mockFetch.calls[0].options.method, 'POST');
      assert.ok(mockFetch.calls[0].options.headers['Content-Type'].includes('application/json'));
      const body = JSON.parse(mockFetch.calls[0].options.body);
      assert.equal(body.title, 'New task');
    });
  });

  describe('handler — ref validation', () => {
    it('rejects unknown refs with error', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch(null);
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-4',
          method: 'query',
          ref: 'unknownRef',
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      // Should not have called fetch
      assert.equal(mockFetch.calls.length, 0);

      // Should send error response
      assert.equal(iframe._postedMessages.length, 1);
      assert.ok(iframe._postedMessages[0].data.error.includes('unknownRef'));
    });

    it('rejects query method on action ref', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch(null);
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-5',
          method: 'query',
          ref: 'createTask', // This is an action, not a query
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      assert.equal(mockFetch.calls.length, 0);
      assert.ok(iframe._postedMessages[0].data.error.includes('not a query'));
    });

    it('rejects action method on query ref', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch(null);
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-6',
          method: 'action',
          ref: 'listTasks', // This is a query, not an action
          data: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      assert.equal(mockFetch.calls.length, 0);
      assert.ok(iframe._postedMessages[0].data.error.includes('not an action'));
    });
  });

  describe('handler — ignores irrelevant messages', () => {
    it('ignores messages without ncodes:api-request type', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch(null);
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: { type: 'some-other-message', id: 'req-7' },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      assert.equal(mockFetch.calls.length, 0);
      assert.equal(iframe._postedMessages.length, 0);
    });

    it('ignores messages with no data', () => {
      const iframe = createMockIframe();
      const { handler } = createMessageHandler(iframe, sampleBindings);

      // Should not throw
      handler({ data: null, source: iframe.contentWindow });
      handler({ source: iframe.contentWindow });
    });

    it('ignores messages without an id', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch(null);
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          method: 'query',
          ref: 'listTasks',
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));
      assert.equal(mockFetch.calls.length, 0);
    });
  });

  describe('handler — error handling', () => {
    it('sends error when fetch returns non-OK status', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch(null, { fail: true, status: 404, errorMsg: 'Not found' });
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-8',
          method: 'query',
          ref: 'listTasks',
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      assert.equal(iframe._postedMessages.length, 1);
      assert.ok(iframe._postedMessages[0].data.error);
    });

    it('sends error when fetch throws network error', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch(null, { networkError: true });
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-9',
          method: 'query',
          ref: 'listTasks',
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      assert.equal(iframe._postedMessages.length, 1);
      assert.ok(iframe._postedMessages[0].data.error.includes('Network error'));
    });
  });

  describe('handler — response format', () => {
    it('sends ncodes:api-response with correct fields', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch({ count: 42 });
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-10',
          method: 'query',
          ref: 'listTasks',
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      const msg = iframe._postedMessages[0].data;
      assert.equal(msg.type, 'ncodes:api-response');
      assert.equal(msg.id, 'req-10');
      assert.deepEqual(msg.data, { count: 42 });
      assert.equal(msg.error, null);
    });
  });

  describe('empty bindings', () => {
    it('rejects all refs when bindings are empty', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch(null);
      const { handler } = createMessageHandler(iframe, [], { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-11',
          method: 'query',
          ref: 'listTasks',
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      assert.equal(mockFetch.calls.length, 0);
      assert.ok(iframe._postedMessages[0].data.error);
    });
  });

  describe('debug logging', () => {
    it('logs request received on valid api-request', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch([]);
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-log-1',
          method: 'query',
          ref: 'listTasks',
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      const reqLog = _logCalls.find(c => c[0] === '[n.codes:handler] request received');
      assert.ok(reqLog, 'should log request received');
      assert.equal(reqLog[1].ref, 'listTasks');
    });

    it('logs ref resolved on successful binding lookup', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch([]);
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-log-2',
          method: 'query',
          ref: 'listTasks',
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      const refLog = _logCalls.find(c => c[0] === '[n.codes:handler] ref resolved');
      assert.ok(refLog, 'should log ref resolved');
      assert.equal(refLog[1].path, '/api/tasks');
    });

    it('warns on unknown ref', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch(null);
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-log-3',
          method: 'query',
          ref: 'nonexistent',
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      const warnLog = _warnCalls.find(c => c[0] === '[n.codes:handler] unknown ref');
      assert.ok(warnLog, 'should warn on unknown ref');
      assert.equal(warnLog[1], 'nonexistent');
    });

    it('logs fetch complete after successful fetch', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch({ ok: true });
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-log-4',
          method: 'query',
          ref: 'listTasks',
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      const fetchLog = _logCalls.find(c => c[0] === '[n.codes:handler] fetch complete');
      assert.ok(fetchLog, 'should log fetch complete');
      assert.equal(fetchLog[1].ok, true);
    });

    it('logs response sent', async () => {
      const iframe = createMockIframe();
      const mockFetch = createMockFetch({ data: 'test' });
      const { handler } = createMessageHandler(iframe, sampleBindings, { fetchFn: mockFetch });

      handler({
        data: {
          type: 'ncodes:api-request',
          id: 'req-log-5',
          method: 'query',
          ref: 'listTasks',
          params: {},
        },
        source: iframe.contentWindow,
      });

      await new Promise(r => setTimeout(r, 10));

      const respLog = _logCalls.find(c => c[0] === '[n.codes:handler] response sent');
      assert.ok(respLog, 'should log response sent');
      assert.equal(respLog[1].hasData, true);
    });
  });

  describe('sandbox error forwarding', () => {
    it('logs sandbox errors forwarded from the iframe', () => {
      const iframe = createMockIframe();
      const { handler } = createMessageHandler(iframe, sampleBindings);

      handler({
        data: {
          type: 'ncodes:sandbox-error',
          message: 'ReferenceError: foo is not defined',
          lineno: 42,
          colno: 5,
        },
        source: iframe.contentWindow,
      });

      const errLog = _errorCalls.find(c => c[0] === '[n.codes:sandbox] Error in generated code:');
      assert.ok(errLog, 'should log sandbox error');
      assert.equal(errLog[1], 'ReferenceError: foo is not defined');
      assert.equal(errLog[3], 42);
    });
  });
});

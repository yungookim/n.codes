'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { getBridgeScript } = require('../src/api-bridge');

describe('getBridgeScript', () => {

  it('returns a non-empty string', () => {
    const script = getBridgeScript();
    assert.ok(typeof script === 'string');
    assert.ok(script.length > 0);
  });

  it('defines window.ncodes object', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('window.ncodes'));
  });

  it('defines ncodes.query function', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('query'));
    assert.ok(script.includes('sendRequest'));
  });

  it('defines ncodes.action function', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('action'));
  });

  it('uses postMessage for communication', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('postMessage'));
  });

  it('sends ncodes:api-request messages', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('ncodes:api-request'));
  });

  it('listens for ncodes:api-response messages', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('ncodes:api-response'));
  });

  it('includes a request timeout mechanism', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('REQUEST_TIMEOUT'));
    assert.ok(script.includes('setTimeout'));
  });

  it('generates unique request IDs', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('generateId'));
    assert.ok(script.includes('ncodes-req-'));
  });

  it('serializes appInfo into the script', () => {
    const appInfo = { name: 'Acme CRM', entities: ['tasks', 'users'] };
    const script = getBridgeScript(appInfo);
    assert.ok(script.includes('Acme CRM'));
    assert.ok(script.includes('tasks'));
    assert.ok(script.includes('users'));
  });

  it('defaults appInfo when not provided', () => {
    const script = getBridgeScript();
    // Should contain serialized default
    assert.ok(script.includes('app:'));
  });

  it('defaults appInfo when null is provided', () => {
    const script = getBridgeScript(null);
    assert.ok(typeof script === 'string');
    assert.ok(script.includes('window.ncodes'));
  });

  it('sends params for query requests', () => {
    const script = getBridgeScript();
    assert.ok(script.includes("method === 'query'"));
    assert.ok(script.includes('params'));
  });

  it('sends data for action requests', () => {
    const script = getBridgeScript();
    assert.ok(script.includes("method === 'action'"));
    assert.ok(script.includes('data'));
  });

  it('is wrapped in an IIFE for isolation', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('(function()'));
    assert.ok(script.includes('use strict'));
  });

  it('includes debug logging for requests', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('[n.codes:bridge] request'));
  });

  it('includes debug logging for responses', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('[n.codes:bridge] response'));
  });

  it('includes debug logging for timeouts', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('[n.codes:bridge] timeout'));
  });

  it('includes global error handler for sandbox error forwarding', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('ncodes:sandbox-error'));
    assert.ok(script.includes('[n.codes:bridge] JS error:'));
  });

  it('forwards error details to parent via postMessage', () => {
    const script = getBridgeScript();
    assert.ok(script.includes('event.message'));
    assert.ok(script.includes('event.lineno'));
    assert.ok(script.includes('event.colno'));
  });
});

'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

// Set up minimal DOM mock before requiring sandbox
const { setupDOM, teardownDOM, MockElement } = require('./components/dom-mock');

// Patch MockElement to track parentNode (needed for sandbox destroy)
const _origAppendChild = MockElement.prototype.appendChild;
MockElement.prototype.appendChild = function(child) {
  child.parentNode = this;
  return _origAppendChild.call(this, child);
};
const _origRemoveChild = MockElement.prototype.removeChild;
MockElement.prototype.removeChild = function(child) {
  child.parentNode = null;
  return _origRemoveChild.call(this, child);
};

// We need additional DOM capabilities for sandbox tests
let _listeners = [];

beforeEach(() => {
  setupDOM();

  // Add window mock with addEventListener/removeEventListener
  global.window = {
    addEventListener(type, fn) { _listeners.push({ type, fn }); },
    removeEventListener(type, fn) {
      _listeners = _listeners.filter(l => !(l.type === type && l.fn === fn));
    },
  };
});

afterEach(() => {
  _listeners = [];
  delete global.window;
  teardownDOM();
});

const { createSandbox, destroyActiveSandbox, getActiveSandbox, buildSrcdoc } = require('../src/sandbox');

// --- buildSrcdoc ---

describe('buildSrcdoc', () => {
  it('returns a valid HTML document', () => {
    const html = buildSrcdoc('/* bridge */', '<p>Hello</p>', '.p { color: red; }', 'alert(1)');
    assert.ok(html.includes('<!DOCTYPE html>'));
    assert.ok(html.includes('<html>'));
    assert.ok(html.includes('</html>'));
    assert.ok(html.includes('<head>'));
    assert.ok(html.includes('<body>'));
  });

  it('includes the bridge script', () => {
    const html = buildSrcdoc('window.ncodes = {};', '<div></div>', '', '');
    assert.ok(html.includes('window.ncodes = {}'));
  });

  it('includes generated HTML in the body', () => {
    const html = buildSrcdoc('', '<div class="kanban">Board</div>', '', '');
    assert.ok(html.includes('<div class="kanban">Board</div>'));
  });

  it('includes generated CSS in a style tag', () => {
    const html = buildSrcdoc('', '', '.kanban { display: flex; }', '');
    assert.ok(html.includes('.kanban { display: flex; }'));
    assert.ok(html.includes('<style>'));
  });

  it('includes generated JS in a script tag after body content', () => {
    const html = buildSrcdoc('', '<p>Hi</p>', '', 'console.log("init")');
    // JS should come after HTML content
    const bodyIdx = html.indexOf('<p>Hi</p>');
    const jsIdx = html.indexOf('console.log("init")');
    assert.ok(jsIdx > bodyIdx);
  });

  it('omits CSS style tag when CSS is empty', () => {
    const html = buildSrcdoc('', '<p>Hi</p>', '', '');
    // Should have base reset style but no extra style tag
    const styleCount = (html.match(/<style>/g) || []).length;
    // 1 for the base reset, 0 for empty css
    assert.equal(styleCount, 1);
  });

  it('omits JS script tag when JS is empty', () => {
    const html = buildSrcdoc('/* bridge */', '<p>Hi</p>', '', '');
    // Should have 1 script tag for bridge, no extra for empty JS
    const scriptCount = (html.match(/<script>/g) || []).length;
    assert.equal(scriptCount, 1);
  });

  it('includes base reset styles', () => {
    const html = buildSrcdoc('', '', '', '');
    assert.ok(html.includes('box-sizing: border-box'));
    assert.ok(html.includes('font-family'));
  });

  it('includes viewport meta tag', () => {
    const html = buildSrcdoc('', '', '', '');
    assert.ok(html.includes('viewport'));
    assert.ok(html.includes('width=device-width'));
  });
});

// --- createSandbox ---

describe('createSandbox', () => {
  it('creates an iframe element', () => {
    const container = document.createElement('div');
    const sandbox = createSandbox(container, {
      html: '<p>Hello</p>',
      css: '',
      js: '',
      apiBindings: [],
    });

    assert.equal(container.children.length, 1);
    assert.equal(container.children[0].tagName, 'IFRAME');
    assert.ok(sandbox.iframe);
  });

  it('sets sandbox attribute to allow-scripts', () => {
    const container = document.createElement('div');
    const sandbox = createSandbox(container, {
      html: '<p>Test</p>',
      css: '',
      js: '',
      apiBindings: [],
    });

    assert.equal(sandbox.iframe.getAttribute('sandbox'), 'allow-scripts');
  });

  it('sets srcdoc attribute', () => {
    const container = document.createElement('div');
    const sandbox = createSandbox(container, {
      html: '<p>Hello</p>',
      css: '.p { color: red; }',
      js: 'console.log("ok")',
      apiBindings: [],
    });

    const srcdoc = sandbox.iframe.getAttribute('srcdoc');
    assert.ok(srcdoc);
    assert.ok(srcdoc.includes('<!DOCTYPE html>'));
    assert.ok(srcdoc.includes('<p>Hello</p>'));
    assert.ok(srcdoc.includes('.p { color: red; }'));
    assert.ok(srcdoc.includes('console.log("ok")'));
  });

  it('styles iframe to fill container', () => {
    const container = document.createElement('div');
    const sandbox = createSandbox(container, {
      html: '',
      css: '',
      js: '',
      apiBindings: [],
    });

    assert.equal(sandbox.iframe.style.width, '100%');
    assert.equal(sandbox.iframe.style.height, '100%');
    assert.equal(sandbox.iframe.style.border, 'none');
  });

  it('returns a destroy function', () => {
    const container = document.createElement('div');
    const sandbox = createSandbox(container, {
      html: '<p>Hi</p>',
      css: '',
      js: '',
      apiBindings: [],
    });

    assert.ok(typeof sandbox.destroy === 'function');
  });

  it('destroy removes iframe from container', () => {
    const container = document.createElement('div');
    const sandbox = createSandbox(container, {
      html: '<p>Hi</p>',
      css: '',
      js: '',
      apiBindings: [],
    });

    assert.equal(container.children.length, 1);
    sandbox.destroy();
    assert.equal(container.children.length, 0);
  });

  it('tracks active sandbox', () => {
    const container = document.createElement('div');
    const sandbox = createSandbox(container, {
      html: '',
      css: '',
      js: '',
      apiBindings: [],
    });

    assert.equal(getActiveSandbox(), sandbox);
  });

  it('cleans up previous sandbox when creating a new one', () => {
    const container = document.createElement('div');

    const sandbox1 = createSandbox(container, {
      html: '<p>First</p>',
      css: '',
      js: '',
      apiBindings: [],
    });

    const sandbox2 = createSandbox(container, {
      html: '<p>Second</p>',
      css: '',
      js: '',
      apiBindings: [],
    });

    // sandbox1 should have been destroyed
    assert.equal(getActiveSandbox(), sandbox2);
    // Container should only have 1 iframe (the second one)
    assert.equal(container.children.length, 1);
  });
});

// --- destroyActiveSandbox ---

describe('destroyActiveSandbox', () => {
  it('destroys the active sandbox', () => {
    const container = document.createElement('div');
    createSandbox(container, {
      html: '',
      css: '',
      js: '',
      apiBindings: [],
    });

    assert.ok(getActiveSandbox());
    destroyActiveSandbox();
    assert.equal(getActiveSandbox(), null);
  });

  it('is a no-op when no sandbox is active', () => {
    destroyActiveSandbox(); // should not throw
    assert.equal(getActiveSandbox(), null);
  });
});

// --- sandbox error forwarding ---

describe('sandbox error forwarding', () => {
  it('bridge script includes error handler that posts sandbox-error messages', () => {
    const container = document.createElement('div');
    const sandbox = createSandbox(container, {
      html: '<p>Test</p>',
      css: '',
      js: '',
      apiBindings: [],
    });

    const srcdoc = sandbox.iframe.getAttribute('srcdoc');
    assert.ok(srcdoc.includes('ncodes:sandbox-error'), 'srcdoc should include error forwarding');
    assert.ok(srcdoc.includes('[n.codes:bridge] JS error:'), 'srcdoc should include error logging');
  });

  it('message handler listens for sandbox-error messages', () => {
    const container = document.createElement('div');

    // Capture console.error calls
    const errors = [];
    const origError = console.error;
    console.error = (...args) => errors.push(args);

    createSandbox(container, {
      html: '<p>Test</p>',
      css: '',
      js: '',
      apiBindings: [],
    });

    // Simulate a sandbox error message arriving
    const listener = _listeners.find(l => l.type === 'message');
    assert.ok(listener, 'should register a message listener');

    listener.fn({
      data: {
        type: 'ncodes:sandbox-error',
        message: 'TypeError: x is undefined',
        lineno: 10,
        colno: 3,
      },
    });

    const errLog = errors.find(c => c[0] === '[n.codes:sandbox] Error in generated code:');
    assert.ok(errLog, 'should log sandbox error to parent console');
    assert.equal(errLog[1], 'TypeError: x is undefined');

    console.error = origError;
  });
});

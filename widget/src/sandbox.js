'use strict';

/**
 * Sandbox renderer — creates a secure iframe to render
 * LLM-generated HTML/CSS/JS with an API bridge.
 */

const { getBridgeScript } = require('./api-bridge');
const { createMessageHandler } = require('./message-handler');

// Track active sandbox for cleanup
let _activeSandbox = null;

/**
 * Create a sandboxed iframe and render generated code.
 *
 * @param {HTMLElement} container - Parent element to attach the iframe to
 * @param {object} content - Generated content from the server
 * @param {string} content.html - Generated HTML markup
 * @param {string} content.css - Generated CSS styles
 * @param {string} content.js - Generated JavaScript
 * @param {Array} content.apiBindings - API binding whitelist
 * @param {object} [options]
 * @param {object} [options.appInfo] - App info for the bridge (name, entities)
 * @param {function} [options.fetchFn] - Custom fetch for testing
 * @returns {{ iframe: HTMLIFrameElement, destroy: function }}
 */
function createSandbox(container, content, options) {
  // Clean up any existing sandbox first
  destroyActiveSandbox();

  const opts = options || {};
  const { html, css, js, apiBindings } = content;

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.display = 'block';
  iframe.style.backgroundColor = 'transparent';

  // Build srcdoc: bridge script + CSS + HTML + generated JS
  const bridgeScript = getBridgeScript(opts.appInfo);
  const srcdoc = buildSrcdoc(bridgeScript, html || '', css || '', js || '');
  iframe.setAttribute('srcdoc', srcdoc);

  // Set up message handler for API proxying
  const messageHandler = createMessageHandler(iframe, apiBindings || [], {
    fetchFn: opts.fetchFn,
  });
  messageHandler.start();

  // Append to container
  container.appendChild(iframe);

  const sandbox = {
    iframe: iframe,
    messageHandler: messageHandler,
    destroy: function() {
      messageHandler.stop();
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
      if (_activeSandbox === sandbox) {
        _activeSandbox = null;
      }
    },
  };

  _activeSandbox = sandbox;
  return sandbox;
}

/**
 * Build the srcdoc HTML string for the iframe.
 *
 * @param {string} bridgeScript - The API bridge JavaScript
 * @param {string} html - Generated HTML content
 * @param {string} css - Generated CSS styles
 * @param {string} js - Generated JavaScript
 * @returns {string} Complete HTML document for srcdoc
 */
function buildSrcdoc(bridgeScript, html, css, js) {
  return '<!DOCTYPE html>'
    + '<html><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1">'
    + '<style>'
    + '*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }'
    + 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; '
    + 'color: #ededed; background: transparent; padding: 16px; }'
    + '</style>'
    + (css ? '<style>' + css + '</style>' : '')
    + '<script>' + bridgeScript + '<\/script>'
    + '</head><body>'
    + html
    + (js ? '<script>' + js + '<\/script>' : '')
    + '</body></html>';
}

/**
 * Destroy the currently active sandbox, if any.
 */
function destroyActiveSandbox() {
  if (_activeSandbox) {
    _activeSandbox.destroy();
    _activeSandbox = null;
  }
}

/**
 * Get the currently active sandbox (for testing).
 * @returns {object|null}
 */
function getActiveSandbox() {
  return _activeSandbox;
}

module.exports = { createSandbox, destroyActiveSandbox, getActiveSandbox, buildSrcdoc };

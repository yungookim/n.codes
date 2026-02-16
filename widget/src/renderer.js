/**
 * Renders generated UI content into a container element.
 *
 * Rendering path:
 *   renderGenerated() — renders LLM-generated HTML/CSS/JS in a sandboxed iframe
 */

const { createSandbox, destroyActiveSandbox } = require('./sandbox');

/**
 * Render LLM-generated code in a sandboxed iframe.
 *
 * @param {HTMLElement} container - Target DOM element
 * @param {object} content - Server response content
 * @param {string} content.html - Generated HTML
 * @param {string} content.css - Generated CSS
 * @param {string} content.js - Generated JS
 * @param {Array} content.apiBindings - API binding whitelist
 * @param {object} [options]
 * @param {object} [options.appInfo] - App info for the bridge
 * @param {function} [options.fetchFn] - Custom fetch for testing
 * @returns {{ iframe, destroy }}
 */
function renderGenerated(container, content, options) {
  clearRenderedUI(container);
  return createSandbox(container, content, options);
}

function clearRenderedUI(container) {
  if (!container) return;
  destroyActiveSandbox();
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

module.exports = { renderGenerated, clearRenderedUI };

/**
 * Renders generated UI content into a container element.
 *
 * Two rendering paths:
 *   1. renderGenerated() — Live mode: renders LLM-generated HTML/CSS/JS in a sandboxed iframe
 *   2. renderGeneratedUI() — Simulation mode: renders trusted template HTML inline (no sandbox)
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

/**
 * Render trusted template HTML (simulation mode) — inline, no sandbox.
 * Uses DOMParser to safely parse trusted template HTML from simulation.js.
 */
function renderGeneratedUI(container, trustedTemplateHTML) {
  clearRenderedUI(container);

  const parser = new DOMParser();
  const doc = parser.parseFromString(trustedTemplateHTML, 'text/html');
  const nodes = doc.body.childNodes;
  while (nodes.length > 0) {
    container.appendChild(nodes[0]);
  }

  setupActionHandlers(container);
  return container;
}

function clearRenderedUI(container) {
  if (!container) return;
  destroyActiveSandbox();
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function setupActionHandlers(container) {
  // Remind buttons
  const remindBtns = container.querySelectorAll('.action-btn.remind');
  remindBtns.forEach((btn) => {
    btn.addEventListener('click', function () {
      const originalText = this.textContent;
      this.textContent = 'Sent!';
      this.style.background = 'var(--ncodes-accent)';
      this.style.color = '#000';
      this.disabled = true;
      setTimeout(() => {
        this.textContent = originalText;
        this.style.background = '';
        this.style.color = '';
        this.disabled = false;
      }, 2000);
    });
  });

  // Send All button
  const sendAllBtn = container.querySelector('.action-btn.primary');
  if (sendAllBtn && sendAllBtn.textContent.includes('Send All')) {
    sendAllBtn.addEventListener('click', function () {
      const originalText = this.textContent;
      this.textContent = 'All reminders sent!';
      this.disabled = true;
      remindBtns.forEach((btn) => {
        btn.textContent = 'Sent!';
        btn.style.background = 'var(--ncodes-accent)';
        btn.style.color = '#000';
        btn.disabled = true;
      });
      setTimeout(() => {
        this.textContent = originalText;
        this.disabled = false;
        remindBtns.forEach((btn) => {
          btn.textContent = 'Send Reminder';
          btn.style.background = '';
          btn.style.color = '';
          btn.disabled = false;
        });
      }, 2000);
    });
  }

  // Archive danger button
  const archiveBtn = container.querySelector('.action-btn.danger');
  if (archiveBtn) {
    archiveBtn.addEventListener('click', function () {
      this.textContent = 'Archived!';
      this.style.background = 'var(--ncodes-accent)';
      this.disabled = true;
    });
  }

  // Select all checkbox
  const selectAll = container.querySelector('[data-ncodes-select-all]');
  if (selectAll) {
    selectAll.addEventListener('change', function () {
      const checkboxes = container.querySelectorAll('.row-checkbox');
      const countEl = container.querySelector('.selection-count');
      checkboxes.forEach((cb) => { cb.checked = this.checked; });
      if (countEl) {
        countEl.textContent = this.checked ? '234 selected' : '0 selected';
      }
    });
  }
}

module.exports = { renderGenerated, renderGeneratedUI, clearRenderedUI, setupActionHandlers };

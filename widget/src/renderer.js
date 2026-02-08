/**
 * Renders generated UI content into a container element (inline, not overlay).
 * Uses DOMParser to safely parse trusted template HTML from simulation.js.
 */

function renderGeneratedUI(container, trustedTemplateHTML) {
  // Clear any existing content
  clearRenderedUI(container);

  // Parse trusted template HTML using DOMParser (safe — no script execution)
  const parser = new DOMParser();
  const doc = parser.parseFromString(trustedTemplateHTML, 'text/html');
  const nodes = doc.body.childNodes;
  while (nodes.length > 0) {
    container.appendChild(nodes[0]);
  }

  // Action button handlers
  setupActionHandlers(container);

  return container;
}

function clearRenderedUI(container) {
  if (!container) return;
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

module.exports = { renderGeneratedUI, clearRenderedUI, setupActionHandlers };

/**
 * Slide-up prompt panel.
 * Built using safe DOM methods — no innerHTML with untrusted content.
 *
 * Two views:
 *   prompt-view (default) — intro, history, textarea, generate, quick prompts, status
 *   result-view (after generation / history click) — back button + generated UI
 */

function createPanel(config) {
  const panel = document.createElement('div');
  panel.className = `ncodes-panel ${config.position}`;

  // Header
  const header = document.createElement('div');
  header.className = 'panel-header';

  const title = document.createElement('div');
  title.className = 'panel-title';
  const logo = document.createElement('span');
  logo.className = 'panel-logo';
  logo.textContent = 'n';
  const titleText = document.createElement('span');
  titleText.textContent = config.panelTitle;
  title.appendChild(logo);
  title.appendChild(titleText);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'panel-close';
  closeBtn.setAttribute('data-ncodes-panel-close', '');
  closeBtn.textContent = '\u00D7';

  header.appendChild(title);
  header.appendChild(closeBtn);

  // Body
  const body = document.createElement('div');
  body.className = 'panel-body';

  // === Prompt View ===
  const promptView = document.createElement('div');
  promptView.className = 'prompt-view';

  const intro = document.createElement('div');
  intro.className = 'panel-intro';
  const introP = document.createElement('p');
  introP.textContent = config.panelIntro;
  intro.appendChild(introP);

  // History section (populated dynamically)
  const historySection = document.createElement('div');
  historySection.className = 'history-section';
  historySection.style.display = 'none';
  const historyLabel = document.createElement('div');
  historyLabel.className = 'history-label';
  historyLabel.textContent = 'Recent features';
  const historyList = document.createElement('div');
  historyList.className = 'history-list';
  historySection.appendChild(historyLabel);
  historySection.appendChild(historyList);

  const promptSection = document.createElement('div');
  promptSection.className = 'prompt-section';

  const textarea = document.createElement('textarea');
  textarea.className = 'prompt-input';
  textarea.placeholder = 'e.g., Show me overdue invoices with a remind button...';
  textarea.rows = 3;

  const generateBtn = document.createElement('button');
  generateBtn.className = 'generate-btn';
  const btnText = document.createElement('span');
  btnText.className = 'btn-text';
  btnText.textContent = 'Generate';
  const btnLoading = document.createElement('span');
  btnLoading.className = 'btn-loading';
  btnLoading.style.display = 'none';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.className = 'loading-dot';
    btnLoading.appendChild(dot);
  }
  generateBtn.appendChild(btnText);
  generateBtn.appendChild(btnLoading);

  promptSection.appendChild(textarea);
  promptSection.appendChild(generateBtn);

  promptView.appendChild(intro);
  promptView.appendChild(historySection);
  promptView.appendChild(promptSection);

  // Quick prompts
  if (config.quickPrompts.length > 0) {
    const quickSection = document.createElement('div');
    quickSection.className = 'quick-prompts';
    const quickLabel = document.createElement('div');
    quickLabel.className = 'quick-prompts-label';
    quickLabel.textContent = 'Try these examples:';
    quickSection.appendChild(quickLabel);

    config.quickPrompts.forEach((qp) => {
      const btn = document.createElement('button');
      btn.className = 'quick-prompt';
      btn.setAttribute('data-prompt', qp.prompt);
      btn.textContent = qp.label;
      quickSection.appendChild(btn);
    });

    promptView.appendChild(quickSection);
  }

  // Generation status
  const status = document.createElement('div');
  status.className = 'generation-status';
  status.style.display = 'none';
  const statusLine = document.createElement('div');
  statusLine.className = 'status-line';
  const statusIcon = document.createElement('span');
  statusIcon.className = 'status-icon spinning';
  statusIcon.textContent = '\u2699';
  const statusText = document.createElement('span');
  statusText.className = 'status-text';
  statusText.textContent = 'Analyzing request...';
  statusLine.appendChild(statusIcon);
  statusLine.appendChild(statusText);
  status.appendChild(statusLine);
  promptView.appendChild(status);

  // === Result View ===
  const resultView = document.createElement('div');
  resultView.className = 'result-view';

  const resultHeader = document.createElement('div');
  resultHeader.className = 'result-header';
  const backBtn = document.createElement('button');
  backBtn.className = 'result-back-btn';
  backBtn.setAttribute('data-ncodes-back', '');
  backBtn.textContent = '\u2190 Back';
  const resultPromptLabel = document.createElement('span');
  resultPromptLabel.className = 'result-prompt-label';
  resultHeader.appendChild(backBtn);
  resultHeader.appendChild(resultPromptLabel);

  const resultContent = document.createElement('div');
  resultContent.className = 'result-content';

  resultView.appendChild(resultHeader);
  resultView.appendChild(resultContent);

  body.appendChild(promptView);
  body.appendChild(resultView);

  panel.appendChild(header);
  panel.appendChild(body);

  return panel;
}

function openPanel(panel, trigger) {
  panel.classList.add('open');
  if (trigger) trigger.classList.add('hidden');
  const input = panel.querySelector('.prompt-input');
  if (input) input.focus();
}

function closePanel(panel, trigger) {
  panel.classList.remove('open');
  if (trigger) trigger.classList.remove('hidden');
  showPromptView(panel);
  resetPanelState(panel);
}

function resetPanelState(panel) {
  const status = panel.querySelector('.generation-status');
  const generateBtn = panel.querySelector('.generate-btn');
  if (status) status.style.display = 'none';
  if (generateBtn) {
    generateBtn.disabled = false;
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
  }
}

/**
 * Remove all child nodes from an element (safe alternative to innerHTML = '').
 */
function clearChildren(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}

function showResultView(panel, promptText) {
  panel.classList.add('expanded');
  const label = panel.querySelector('.result-prompt-label');
  if (label) label.textContent = promptText || '';
}

function showPromptView(panel) {
  panel.classList.remove('expanded');
  const resultContent = panel.querySelector('.result-content');
  if (resultContent) clearChildren(resultContent);
}

function getResultContainer(panel) {
  return panel.querySelector('.result-content');
}

/**
 * Rebuild history list DOM from array.
 * Each item: clickable row with prompt text, template badge, and delete button.
 */
function updateHistoryList(panel, history) {
  const section = panel.querySelector('.history-section');
  const list = panel.querySelector('.history-list');
  if (!section || !list) return;

  // Clear existing items
  clearChildren(list);

  if (history.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  history.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'history-item';
    row.setAttribute('data-history-id', item.id);
    row.setAttribute('data-template-id', item.templateId);

    const text = document.createElement('span');
    text.className = 'history-prompt-text';
    text.textContent = item.prompt;

    const badge = document.createElement('span');
    badge.className = 'history-badge';
    badge.textContent = item.templateId;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'history-delete';
    deleteBtn.setAttribute('data-history-delete', item.id);
    deleteBtn.textContent = '\u00D7';

    row.appendChild(text);
    row.appendChild(badge);
    row.appendChild(deleteBtn);
    list.appendChild(row);
  });
}

module.exports = {
  createPanel,
  openPanel,
  closePanel,
  resetPanelState,
  showResultView,
  showPromptView,
  getResultContainer,
  updateHistoryList,
};

/**
 * n.codes Widget SDK
 *
 * Public API:
 *   NCodes.init(config)  — Initialize the widget
 *   NCodes.open()        — Open the prompt panel
 *   NCodes.close()       — Close the prompt panel
 *   NCodes.destroy()     — Remove the widget entirely
 */

const { mergeConfig } = require('./config');
const { getStyles } = require('./styles');
const { createTrigger } = require('./trigger');
const {
  createPanel,
  openPanel,
  closePanel,
  showResultView,
  showPromptView,
  getResultContainer,
  updateHistoryList,
} = require('./panel');
const { findTemplate, getTemplateHTML, STATUS_MESSAGES } = require('./simulation');
const { renderGeneratedUI, clearRenderedUI } = require('./renderer');
const { getHistory, addToHistory, removeFromHistory } = require('./history');

let _state = null;

function init(userConfig) {
  if (_state) {
    destroy();
  }

  const config = mergeConfig(userConfig);

  // If no user is provided, the widget stays hidden (auth gate)
  if (!config.user) {
    _state = { config, mounted: false };
    return;
  }

  // Register CSS custom property for glow animation (must be document-level, not Shadow DOM)
  if (typeof CSS !== 'undefined' && CSS.registerProperty) {
    try {
      CSS.registerProperty({
        name: '--ncodes-glow-angle',
        syntax: '<angle>',
        initialValue: '0deg',
        inherits: false,
      });
    } catch (_) {
      // Already registered or unsupported — safe to ignore
    }
  }

  // Create shadow DOM host
  const host = document.createElement('div');
  host.id = 'ncodes-root';
  const shadow = host.attachShadow({ mode: 'open' });

  // Inject styles
  const styleEl = document.createElement('style');
  const resolvedTheme = config.theme === 'auto'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : config.theme;
  styleEl.textContent = getStyles(resolvedTheme);
  shadow.appendChild(styleEl);

  // Create trigger and panel
  const trigger = createTrigger(config, () => {
    openPanel(panel, trigger);
  });

  const panel = createPanel(config);

  shadow.appendChild(trigger);
  shadow.appendChild(panel);
  document.body.appendChild(host);

  _state = {
    config,
    host,
    shadow,
    trigger,
    panel,
    mounted: true,
    isGenerating: false,
  };

  // Wire up panel event listeners
  wireEvents();

  // Load history on init
  refreshHistoryList();
}

function wireEvents() {
  if (!_state || !_state.mounted) return;
  const { panel, trigger } = _state;

  // Panel close button
  const closeBtn = panel.querySelector('[data-ncodes-panel-close]');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closePanel(panel, trigger));
  }

  // Generate button
  const generateBtn = panel.querySelector('.generate-btn');
  if (generateBtn) {
    generateBtn.addEventListener('click', handleGenerate);
  }

  // Enter key in textarea
  const textarea = panel.querySelector('.prompt-input');
  if (textarea) {
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleGenerate();
      }
    });
  }

  // Quick prompt buttons
  const quickBtns = panel.querySelectorAll('.quick-prompt');
  quickBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = panel.querySelector('.prompt-input');
      if (input) {
        input.value = btn.getAttribute('data-prompt');
        input.focus();
      }
    });
  });

  // History list — event delegation for clicks and deletes
  const historyList = panel.querySelector('.history-list');
  if (historyList) {
    historyList.addEventListener('click', handleHistoryClick);
  }

  // Result view back button
  const backBtn = panel.querySelector('[data-ncodes-back]');
  if (backBtn) {
    backBtn.addEventListener('click', handleBack);
  }

  // Close on escape
  document.addEventListener('keydown', handleEscapeKey);

  // Close on click outside
  document.addEventListener('click', handleOutsideClick);
}

function handleEscapeKey(e) {
  if (!_state || !_state.mounted) return;
  if (e.key !== 'Escape') return;
  if (!_state.panel.classList.contains('open')) return;

  // If in result view, go back to prompt view first
  if (_state.panel.classList.contains('expanded')) {
    handleBack();
  } else {
    closePanel(_state.panel, _state.trigger);
  }
}

function handleOutsideClick(e) {
  if (!_state || !_state.mounted) return;
  // The host element catches clicks that go through the shadow DOM
  if (_state.panel.classList.contains('open') && !_state.host.contains(e.target)) {
    closePanel(_state.panel, _state.trigger);
  }
}

function handleBack() {
  if (!_state || !_state.mounted) return;
  const container = getResultContainer(_state.panel);
  clearRenderedUI(container);
  showPromptView(_state.panel);
}

function handleHistoryClick(e) {
  if (!_state || !_state.mounted) return;

  // Check if delete button was clicked
  const deleteBtn = e.target.closest('[data-history-delete]');
  if (deleteBtn) {
    e.stopPropagation();
    const id = deleteBtn.getAttribute('data-history-delete');
    removeFromHistory(id);
    refreshHistoryList();
    return;
  }

  // Check if a history item row was clicked
  const item = e.target.closest('.history-item');
  if (item) {
    const templateId = item.getAttribute('data-template-id');
    const promptText = item.querySelector('.history-prompt-text');
    const prompt = promptText ? promptText.textContent : '';
    showHistoryResult(templateId, prompt);
  }
}

function showHistoryResult(templateId, promptText) {
  if (!_state || !_state.mounted) return;
  const html = getTemplateHTML(templateId);
  const container = getResultContainer(_state.panel);
  clearRenderedUI(container);
  renderGeneratedUI(container, html);
  showResultView(_state.panel, promptText);
}

async function handleGenerate() {
  if (!_state || !_state.mounted || _state.isGenerating) return;

  const textarea = _state.panel.querySelector('.prompt-input');
  const prompt = textarea ? textarea.value.trim() : '';
  if (!prompt) return;

  _state.isGenerating = true;

  const generateBtn = _state.panel.querySelector('.generate-btn');
  if (generateBtn) {
    generateBtn.disabled = true;
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
  }

  // Animate status
  await animateStatus();

  // Find template and render
  const templateId = findTemplate(prompt);
  const html = getTemplateHTML(templateId);

  // Save to history
  addToHistory({ prompt, templateId });
  refreshHistoryList();

  // Render inline in result view
  const container = getResultContainer(_state.panel);
  clearRenderedUI(container);
  renderGeneratedUI(container, html);
  showResultView(_state.panel, prompt);

  // Reset generate button state
  if (generateBtn) {
    generateBtn.disabled = false;
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
  }
  const statusEl = _state.panel.querySelector('.generation-status');
  if (statusEl) statusEl.style.display = 'none';

  // Clear textarea for next prompt
  if (textarea) textarea.value = '';

  _state.isGenerating = false;
}

async function animateStatus() {
  if (!_state || !_state.mounted) return;

  const statusEl = _state.panel.querySelector('.generation-status');
  const statusText = _state.panel.querySelector('.status-text');
  if (!statusEl || !statusText) return;

  statusEl.style.display = 'block';

  for (let i = 0; i < STATUS_MESSAGES.length; i++) {
    statusText.textContent = STATUS_MESSAGES[i];
    const delay = i === STATUS_MESSAGES.length - 1 ? 300 : 400 + Math.random() * 300;
    await sleep(delay);
  }
}

function refreshHistoryList() {
  if (!_state || !_state.mounted) return;
  const history = getHistory();
  updateHistoryList(_state.panel, history);
}

function open() {
  if (!_state || !_state.mounted) return;
  openPanel(_state.panel, _state.trigger);
}

function close() {
  if (!_state || !_state.mounted) return;
  closePanel(_state.panel, _state.trigger);
}

function destroy() {
  if (!_state) return;

  document.removeEventListener('keydown', handleEscapeKey);
  document.removeEventListener('click', handleOutsideClick);

  if (_state.host && _state.host.parentNode) {
    _state.host.parentNode.removeChild(_state.host);
  }

  _state = null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { init, open, close, destroy };

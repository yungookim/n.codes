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
const { renderGenerated, clearRenderedUI } = require('./renderer');
const { getHistory, addToHistory, removeFromHistory } = require('./history');
const { callGenerateAPI, pollJobStatus } = require('./api-client');

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

  // Inject styles (generated UI now renders inside sandboxed iframe, no DSL styles needed)
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

  // Quick prompt buttons (static ones from config)
  wireQuickPromptClicks();

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

function wireQuickPromptClicks() {
  if (!_state || !_state.mounted) return;
  const quickBtns = _state.panel.querySelectorAll('.quick-prompt');
  quickBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = _state.panel.querySelector('.prompt-input');
      if (input) {
        input.value = btn.getAttribute('data-prompt');
        input.focus();
      }
    });
  });
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
    const historyId = item.getAttribute('data-history-id');
    const promptText = item.querySelector('.history-prompt-text');
    const prompt = promptText ? promptText.textContent : '';
    showHistoryResult(historyId, prompt);
  }
}

function showHistoryResult(historyId, promptText) {
  if (!_state || !_state.mounted) return;

  const history = getHistory();
  const entry = history.find((h) => h.id === historyId);

  const container = getResultContainer(_state.panel);
  clearRenderedUI(container);

  if (entry && entry.generated) {
    // Live mode entry — re-render stored generated code in sandbox
    renderGenerated(container, {
      html: entry.generated.html,
      css: entry.generated.css,
      js: entry.generated.js,
      apiBindings: entry.generated.apiBindings,
    });
  } else {
    const generateBtn = _state.panel.querySelector('.generate-btn');
    const textarea = _state.panel.querySelector('.prompt-input');
    showErrorState(
      "This entry can't be replayed anymore. Please regenerate.",
      promptText,
      generateBtn,
      textarea
    );
    return;
  }

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

  await handleGenerateLive(prompt, generateBtn, textarea);

  _state.isGenerating = false;
}

/** Step-specific status messages shown during polling. */
const STEP_MESSAGES = {
  intent: 'Understanding your request...',
  feasibility: 'Checking what this app can do...',
  codegen: 'Writing HTML, CSS & JavaScript...',
  review: 'Reviewing generated code...',
  iterate: 'Fixing issues found by QA...',
  resolve: 'Resolving API connections...',
};

/**
 * Live mode: call API → poll for job completion → render generated HTML/CSS/JS in sandbox.
 * Handles clarifying questions from the server.
 * Shows step-level progress during polling, error state on failure.
 */
async function handleGenerateLive(prompt, generateBtn, textarea) {
  showLoadingState('Generating... this usually takes 1-2 minutes');

  try {
    const { config } = _state;
    const { jobId } = await callGenerateAPI(config.apiUrl, {
      prompt,
      provider: config.provider,
      model: config.model,
    });

    // Poll for completion with step progress updates
    const result = await pollJobStatus(config.apiUrl, jobId, {
      onProgress(step) {
        const message = STEP_MESSAGES[step] || 'Generating...';
        updateStepProgress(step, message);
      },
    });

    // Handle clarifying question response
    if (result.clarifyingQuestion) {
      hideLoadingState();
      showClarifyingQuestion(result.clarifyingQuestion, result.options, prompt, generateBtn, textarea);
      return;
    }

    // Save generated content to history
    addToHistory({
      prompt,
      generated: {
        html: result.html,
        css: result.css,
        js: result.js,
        apiBindings: result.apiBindings,
      },
    });
    refreshHistoryList();

    // Render in sandbox
    hideLoadingState();
    const container = getResultContainer(_state.panel);
    clearRenderedUI(container);
    renderGenerated(container, {
      html: result.html,
      css: result.css,
      js: result.js,
      apiBindings: result.apiBindings,
    });
    showResultView(_state.panel, prompt);
    resetGenerateUI(generateBtn, textarea);
  } catch (err) {
    hideLoadingState();
    console.warn('[n.codes] Live generation failed:', err.message);
    showErrorState(err.message, prompt, generateBtn, textarea);
  }
}

/**
 * Show a clarifying question in the panel with clickable option buttons.
 */
function showClarifyingQuestion(question, options, originalPrompt, generateBtn, textarea) {
  if (!_state || !_state.mounted) return;

  const container = getResultContainer(_state.panel);
  clearRenderedUI(container);

  const wrapper = document.createElement('div');
  wrapper.className = 'ncodes-clarifying-question';

  const questionEl = document.createElement('div');
  questionEl.className = 'ncodes-clarifying-text';
  questionEl.textContent = question;
  wrapper.appendChild(questionEl);

  if (Array.isArray(options) && options.length > 0) {
    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'ncodes-clarifying-options';

    options.forEach((option) => {
      const btn = document.createElement('button');
      btn.className = 'ncodes-clarifying-option';
      btn.textContent = option;
      btn.addEventListener('click', () => {
        // Re-submit with the answer appended to the prompt
        const newPrompt = originalPrompt + ' — ' + option;
        if (textarea) textarea.value = newPrompt;
        showPromptView(_state.panel);
        resetGenerateUI(generateBtn, textarea);
        _state.isGenerating = false;
        handleGenerate();
      });
      optionsDiv.appendChild(btn);
    });

    wrapper.appendChild(optionsDiv);
  }

  container.appendChild(wrapper);
  showResultView(_state.panel, originalPrompt);
  resetGenerateUI(generateBtn, textarea);
}

function resetGenerateUI(generateBtn, textarea) {
  if (generateBtn) {
    generateBtn.disabled = false;
    const btnText = generateBtn.querySelector('.btn-text');
    const btnLoading = generateBtn.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'inline';
    if (btnLoading) btnLoading.style.display = 'none';
  }
  const statusEl = _state.panel.querySelector('.generation-status');
  if (statusEl) statusEl.style.display = 'none';

  if (textarea) textarea.value = '';
}

function showLoadingState(message) {
  if (!_state || !_state.mounted) return;
  const statusEl = _state.panel.querySelector('.generation-status');
  const statusText = _state.panel.querySelector('.status-text');
  const statusIcon = _state.panel.querySelector('.status-icon');
  const stepEl = _state.panel.querySelector('.status-step');
  if (statusEl) statusEl.style.display = 'block';
  if (statusText) statusText.textContent = message || 'Generating with AI...';
  if (statusIcon) statusIcon.classList.add('spinning');
  if (stepEl) stepEl.textContent = '';
}

function updateStepProgress(step, message) {
  if (!_state || !_state.mounted) return;
  const statusText = _state.panel.querySelector('.status-text');
  const stepEl = _state.panel.querySelector('.status-step');
  if (statusText) statusText.textContent = message;
  if (stepEl) stepEl.textContent = step;
}

function hideLoadingState() {
  if (!_state || !_state.mounted) return;
  const statusEl = _state.panel.querySelector('.generation-status');
  if (statusEl) statusEl.style.display = 'none';
}

function showErrorState(message, prompt, generateBtn, textarea) {
  if (!_state || !_state.mounted) return;

  const container = getResultContainer(_state.panel);
  clearRenderedUI(container);

  // Build error UI using safe DOM APIs
  const errorDiv = document.createElement('div');
  errorDiv.className = 'ncodes-error-state';

  const iconEl = document.createElement('div');
  iconEl.className = 'ncodes-error-icon';
  iconEl.textContent = '\u26A0'; // warning sign

  const msgEl = document.createElement('div');
  msgEl.className = 'ncodes-error-message';
  msgEl.textContent = message;

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'ncodes-error-actions';

  const retryBtn = document.createElement('button');
  retryBtn.className = 'ncodes-error-retry';
  retryBtn.textContent = 'Try again';
  retryBtn.addEventListener('click', () => {
    // Re-populate textarea and re-trigger generation
    if (textarea) textarea.value = prompt;
    showPromptView(_state.panel);
    resetGenerateUI(generateBtn, textarea);
    _state.isGenerating = false;
    handleGenerate();
  });

  actionsDiv.appendChild(retryBtn);

  errorDiv.appendChild(iconEl);
  errorDiv.appendChild(msgEl);
  errorDiv.appendChild(actionsDiv);
  container.appendChild(errorDiv);

  showResultView(_state.panel, prompt);
  resetGenerateUI(generateBtn, textarea);
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

module.exports = { init, open, close, destroy };

/**
 * n.codes Demo Application
 * Simulates the prompt → generated UI experience
 */

(function() {
  'use strict';

  // DOM Elements
  const trigger = document.getElementById('ncodes-trigger');
  const panel = document.getElementById('ncodes-panel');
  const panelClose = document.getElementById('panel-close');
  const promptInput = document.getElementById('prompt-input');
  const generateBtn = document.getElementById('generate-btn');
  const quickPrompts = document.querySelectorAll('.quick-prompt');
  const generationStatus = document.getElementById('generation-status');
  const defaultContent = document.getElementById('default-content');
  const generatedContent = document.getElementById('generated-content');

  // Template mapping based on prompt keywords
  const promptTemplates = {
    'invoice': 'template-invoices',
    'overdue': 'template-invoices',
    'reminder': 'template-invoices',
    'health': 'template-dashboard',
    'dashboard': 'template-dashboard',
    'engagement': 'template-dashboard',
    'churn': 'template-dashboard',
    'archive': 'template-archive',
    'inactive': 'template-archive',
    'bulk': 'template-archive',
    'user': 'template-archive'
  };

  // Generation status messages for the typing animation
  const statusMessages = [
    'Analyzing request...',
    'Mapping to capabilities...',
    'Selecting components...',
    'Generating UI...',
    'Applying styles...',
    'Done!'
  ];

  // State
  let isGenerating = false;

  /**
   * Toggle panel visibility
   */
  function openPanel() {
    panel.classList.add('open');
    trigger.classList.add('hidden');
    promptInput.focus();
  }

  function closePanel() {
    panel.classList.remove('open');
    trigger.classList.remove('hidden');
    resetGenerationState();
  }

  /**
   * Reset generation state
   */
  function resetGenerationState() {
    generationStatus.style.display = 'none';
    generateBtn.disabled = false;
    generateBtn.querySelector('.btn-text').style.display = 'inline';
    generateBtn.querySelector('.btn-loading').style.display = 'none';
    isGenerating = false;
  }

  /**
   * Find the appropriate template based on prompt keywords
   */
  function findTemplate(prompt) {
    const lowerPrompt = prompt.toLowerCase();

    for (const [keyword, templateId] of Object.entries(promptTemplates)) {
      if (lowerPrompt.includes(keyword)) {
        return document.getElementById(templateId);
      }
    }

    // Default to invoices template
    return document.getElementById('template-invoices');
  }

  /**
   * Safely clear all children from an element
   */
  function clearChildren(element) {
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }

  /**
   * Animate status messages
   */
  async function animateStatus() {
    const statusText = generationStatus.querySelector('.status-text');
    generationStatus.style.display = 'block';

    for (let i = 0; i < statusMessages.length; i++) {
      statusText.textContent = statusMessages[i];

      // Shorter delay for "Done!"
      const delay = i === statusMessages.length - 1 ? 300 : 400 + Math.random() * 300;
      await sleep(delay);
    }
  }

  /**
   * Generate UI from prompt
   */
  async function generateUI() {
    const prompt = promptInput.value.trim();

    if (!prompt || isGenerating) return;

    isGenerating = true;

    // Update button state
    generateBtn.disabled = true;
    generateBtn.querySelector('.btn-text').style.display = 'none';
    generateBtn.querySelector('.btn-loading').style.display = 'flex';

    // Animate status messages
    await animateStatus();

    // Find and clone the appropriate template
    const template = findTemplate(prompt);
    const content = template.content.cloneNode(true);

    // Safely clear and inject content using DOM methods
    clearChildren(generatedContent);
    generatedContent.appendChild(content);

    // Switch views
    defaultContent.style.display = 'none';
    generatedContent.style.display = 'block';

    // Setup close button in generated UI
    setupGeneratedUIHandlers();

    // Close panel after short delay
    await sleep(300);
    closePanel();
  }

  /**
   * Setup event handlers for generated UI
   */
  function setupGeneratedUIHandlers() {
    // Close button
    const closeBtn = generatedContent.querySelector('#close-generated');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeGeneratedUI);
    }

    // Action buttons (remind, etc.) - add toast feedback
    const actionBtns = generatedContent.querySelectorAll('.action-btn.remind');
    actionBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const originalText = this.textContent;
        this.textContent = 'Sent!';
        this.style.background = 'var(--accent)';
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

    // Send All Reminders button
    const sendAllBtn = generatedContent.querySelector('.action-btn.primary');
    if (sendAllBtn && sendAllBtn.textContent.includes('Send All')) {
      sendAllBtn.addEventListener('click', function() {
        const originalText = this.textContent;
        this.textContent = 'All reminders sent!';
        this.disabled = true;

        // Also update individual buttons
        const remindBtns = generatedContent.querySelectorAll('.action-btn.remind');
        remindBtns.forEach(btn => {
          btn.textContent = 'Sent!';
          btn.style.background = 'var(--accent)';
          btn.style.color = '#000';
          btn.disabled = true;
        });

        setTimeout(() => {
          this.textContent = originalText;
          this.disabled = false;
          remindBtns.forEach(btn => {
            btn.textContent = 'Send Reminder';
            btn.style.background = '';
            btn.style.color = '';
            btn.disabled = false;
          });
        }, 2000);
      });
    }

    // Archive button
    const archiveBtn = generatedContent.querySelector('.action-btn.danger');
    if (archiveBtn) {
      archiveBtn.addEventListener('click', function() {
        this.textContent = 'Archived!';
        this.style.background = 'var(--accent)';
        this.disabled = true;

        setTimeout(() => {
          closeGeneratedUI();
        }, 1500);
      });
    }

    // Select all checkbox
    const selectAll = generatedContent.querySelector('#select-all');
    if (selectAll) {
      selectAll.addEventListener('change', function() {
        const checkboxes = generatedContent.querySelectorAll('.row-checkbox');
        const selectionCount = generatedContent.querySelector('.selection-count');

        checkboxes.forEach(cb => cb.checked = this.checked);

        if (selectionCount) {
          selectionCount.textContent = this.checked ? '234 selected' : '0 selected';
        }
      });
    }

    // Individual row checkboxes
    const rowCheckboxes = generatedContent.querySelectorAll('.row-checkbox');
    rowCheckboxes.forEach(cb => {
      cb.addEventListener('change', updateSelectionCount);
    });
  }

  /**
   * Update selection count for archive UI
   */
  function updateSelectionCount() {
    const checkboxes = generatedContent.querySelectorAll('.row-checkbox');
    const selectionCount = generatedContent.querySelector('.selection-count');
    const selectAll = generatedContent.querySelector('#select-all');

    const checked = Array.from(checkboxes).filter(cb => cb.checked).length;

    if (selectionCount) {
      // Calculate based on checked visible + assume rest are checked
      const visibleChecked = checked;
      const totalIfAllChecked = visibleChecked === checkboxes.length ? 234 : visibleChecked;
      selectionCount.textContent = `${totalIfAllChecked} selected`;
    }

    if (selectAll) {
      selectAll.checked = checked === checkboxes.length;
    }
  }

  /**
   * Close generated UI and return to default
   */
  function closeGeneratedUI() {
    generatedContent.style.display = 'none';
    defaultContent.style.display = 'block';
    promptInput.value = '';
  }

  /**
   * Helper: Sleep for ms
   */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Event Listeners
  trigger.addEventListener('click', openPanel);
  panelClose.addEventListener('click', closePanel);

  generateBtn.addEventListener('click', generateUI);

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateUI();
    }
  });

  quickPrompts.forEach(btn => {
    btn.addEventListener('click', () => {
      promptInput.value = btn.dataset.prompt;
      promptInput.focus();
    });
  });

  // Close panel on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      closePanel();
    }
  });

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (panel.classList.contains('open') &&
        !panel.contains(e.target) &&
        !trigger.contains(e.target)) {
      closePanel();
    }
  });

  // Prevent panel close when clicking inside
  panel.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // ==================== Walkthrough System ====================
  const WALKTHROUGH_STORAGE_KEY = 'ncodes-demo-walkthrough-completed';

  // Walkthrough DOM elements
  const walkthroughOverlay = document.getElementById('walkthrough-overlay');
  const tooltipWelcome = document.getElementById('tooltip-welcome');
  const tooltipTrigger = document.getElementById('tooltip-trigger');
  const tooltipPanel = document.getElementById('tooltip-panel');

  // Walkthrough state
  let currentStep = 0;
  let walkthroughActive = false;

  /**
   * Check if walkthrough has been completed before
   */
  function hasCompletedWalkthrough() {
    try {
      return localStorage.getItem(WALKTHROUGH_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Mark walkthrough as completed
   */
  function markWalkthroughCompleted() {
    try {
      localStorage.setItem(WALKTHROUGH_STORAGE_KEY, 'true');
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Start the walkthrough
   */
  function startWalkthrough() {
    walkthroughActive = true;
    currentStep = 1;
    walkthroughOverlay.classList.add('active');
    showStep(1);
  }

  /**
   * End the walkthrough
   */
  function endWalkthrough() {
    walkthroughActive = false;
    currentStep = 0;

    // Hide all tooltips
    tooltipWelcome.classList.remove('active');
    tooltipTrigger.classList.remove('active');
    tooltipPanel.classList.remove('active');

    // Hide overlay
    walkthroughOverlay.classList.remove('active');

    // Remove highlight from trigger
    trigger.classList.remove('walkthrough-highlight');

    // Mark as completed
    markWalkthroughCompleted();
  }

  /**
   * Show a specific step
   */
  function showStep(step) {
    currentStep = step;

    // Hide all tooltips first
    tooltipWelcome.classList.remove('active');
    tooltipTrigger.classList.remove('active');
    tooltipPanel.classList.remove('active');

    // Remove highlight
    trigger.classList.remove('walkthrough-highlight');

    switch (step) {
      case 1:
        // Welcome - centered, no highlight
        tooltipWelcome.classList.add('active');
        break;

      case 2:
        // Trigger button - highlight the button
        tooltipTrigger.classList.add('active');
        trigger.classList.add('walkthrough-highlight');
        break;

      case 3:
        // Panel tooltip - only if panel is open
        tooltipPanel.classList.add('active');
        break;
    }
  }

  /**
   * Go to next step
   */
  function nextStep() {
    if (currentStep === 1) {
      showStep(2);
    } else if (currentStep === 2) {
      // Step 2 → open panel and show step 3
      openPanel();
      // Small delay to let panel animate open
      setTimeout(() => showStep(3), 300);
    } else if (currentStep === 3) {
      endWalkthrough();
    }
  }

  /**
   * Go to previous step
   */
  function prevStep() {
    if (currentStep === 2) {
      showStep(1);
    } else if (currentStep === 3) {
      closePanel();
      showStep(2);
    }
  }

  // Make walkthrough functions globally accessible (for onclick handlers)
  window.startWalkthrough = startWalkthrough;
  window.endWalkthrough = endWalkthrough;
  window.nextStep = nextStep;
  window.prevStep = prevStep;

  // Handle trigger click during walkthrough step 2
  const originalTriggerClick = trigger.onclick;
  trigger.addEventListener('click', () => {
    if (walkthroughActive && currentStep === 2) {
      // Panel will open via existing handler, then show step 3
      setTimeout(() => showStep(3), 300);
    }
  });

  // Auto-start walkthrough on first visit (after small delay for page to settle)
  if (!hasCompletedWalkthrough()) {
    setTimeout(startWalkthrough, 500);
  }

})();

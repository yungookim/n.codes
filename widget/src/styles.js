/**
 * All widget CSS as a JS string, injected into Shadow DOM.
 * Ported from public/demo/styles.css (trigger, panel, and generated UI sections).
 */

function getStyles(theme) {
  const isDark = theme !== 'light';

  const vars = isDark ? `
    --ncodes-bg-body: #050505;
    --ncodes-bg-card: #0f0f0f;
    --ncodes-bg-panel: #0d0d0d;
    --ncodes-border-color: #262626;
    --ncodes-border-light: #1a1a1a;
    --ncodes-text-main: #ededed;
    --ncodes-text-muted: #a1a1aa;
    --ncodes-text-dim: #52525b;
    --ncodes-accent: #4ade80;
    --ncodes-accent-dim: rgba(74, 222, 128, 0.1);
    --ncodes-accent-hover: #86efac;
    --ncodes-danger: #f87171;
    --ncodes-danger-dim: rgba(248, 113, 113, 0.1);
    --ncodes-warning: #fbbf24;
    --ncodes-warning-dim: rgba(251, 191, 36, 0.1);
  ` : `
    --ncodes-bg-body: #ffffff;
    --ncodes-bg-card: #f9fafb;
    --ncodes-bg-panel: #ffffff;
    --ncodes-border-color: #e5e7eb;
    --ncodes-border-light: #f3f4f6;
    --ncodes-text-main: #111827;
    --ncodes-text-muted: #6b7280;
    --ncodes-text-dim: #9ca3af;
    --ncodes-accent: #22c55e;
    --ncodes-accent-dim: rgba(34, 197, 94, 0.1);
    --ncodes-accent-hover: #16a34a;
    --ncodes-danger: #ef4444;
    --ncodes-danger-dim: rgba(239, 68, 68, 0.1);
    --ncodes-warning: #f59e0b;
    --ncodes-warning-dim: rgba(245, 158, 11, 0.1);
  `;

  return `
    :host {
      ${vars}
      --ncodes-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --ncodes-mono: 'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
      all: initial;
      font-family: var(--ncodes-font);
      color: var(--ncodes-text-main);
    }

    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    /* ===== Trigger Button ===== */
    .ncodes-trigger {
      position: fixed;
      bottom: 16px;
      left: 50%;
      transform: translateX(-50%);
      height: 36px;
      padding: 0 16px;
      border-radius: 99px;
      background: var(--ncodes-bg-card);
      border: 1px solid var(--ncodes-border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--ncodes-text-muted);
      font-size: 13px;
      font-weight: 500;
      font-family: var(--ncodes-font);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
      z-index: 10000;
      animation: ncodes-breathe 3s infinite ease-in-out;
    }

    .ncodes-trigger.bottom-right {
      left: auto;
      right: 16px;
      transform: none;
    }

    .ncodes-trigger.bottom-left {
      left: 16px;
      transform: none;
    }

    @keyframes ncodes-breathe {
      0% {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        border-color: var(--ncodes-border-color);
      }
      50% {
        box-shadow: 0 0 25px var(--ncodes-accent-dim), 0 0 10px var(--ncodes-accent-dim);
        border-color: var(--ncodes-accent);
      }
      100% {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        border-color: var(--ncodes-border-color);
      }
    }

    .ncodes-trigger svg {
      width: 16px;
      height: 16px;
      color: var(--ncodes-accent);
    }

    .ncodes-trigger:hover {
      background: var(--ncodes-bg-panel);
      border-color: var(--ncodes-accent);
      color: var(--ncodes-text-main);
      box-shadow: 0 6px 30px rgba(0, 0, 0, 0.4);
    }

    .ncodes-trigger:active {
      transform: translateX(-50%) scale(0.98);
    }

    .ncodes-trigger.bottom-right:active,
    .ncodes-trigger.bottom-left:active {
      transform: scale(0.98);
    }

    .ncodes-trigger.hidden {
      opacity: 0;
      pointer-events: none;
      transform: translateX(-50%) scale(0.9);
    }

    .ncodes-trigger.bottom-right.hidden {
      transform: scale(0.9);
    }

    .ncodes-trigger.bottom-left.hidden {
      transform: scale(0.9);
    }

    /* ===== Panel ===== */
    @keyframes ncodes-glow-rotate {
      from { --ncodes-glow-angle: 0deg; }
      to { --ncodes-glow-angle: 360deg; }
    }

    @keyframes ncodes-glow-breathe {
      0%, 100% {
        box-shadow:
          0 20px 60px rgba(0, 0, 0, 0.5),
          0 0 20px rgba(74, 222, 128, 0.1),
          0 0 40px rgba(74, 222, 128, 0.05);
      }
      50% {
        box-shadow:
          0 20px 60px rgba(0, 0, 0, 0.5),
          0 0 40px rgba(74, 222, 128, 0.25),
          0 0 80px rgba(74, 222, 128, 0.12),
          0 0 120px rgba(74, 222, 128, 0.06);
      }
    }

    .ncodes-panel {
      position: fixed;
      bottom: 64px;
      left: 50%;
      transform: translateX(-50%) scale(0.95);
      width: 400px;
      max-height: calc(100vh - 100px);
      background: var(--ncodes-bg-panel);
      border: 1px solid transparent;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      z-index: 10001;
      display: flex;
      flex-direction: column;
      opacity: 0;
      pointer-events: none;
      transform-origin: bottom center;
      transition: all 0.2s ease;
    }

    .ncodes-panel.open {
      transform: translateX(-50%) scale(1);
      opacity: 1;
      pointer-events: auto;
      --ncodes-glow-angle: 0deg;
      animation:
        ncodes-glow-rotate 4s linear infinite,
        ncodes-glow-breathe 3s ease-in-out infinite;
      background:
        linear-gradient(var(--ncodes-bg-panel), var(--ncodes-bg-panel)) padding-box,
        conic-gradient(
          from var(--ncodes-glow-angle, 0deg),
          var(--ncodes-accent),
          rgba(74, 222, 128, 0.15),
          rgba(56, 189, 248, 0.6),
          rgba(139, 92, 246, 0.5),
          var(--ncodes-accent),
          rgba(74, 222, 128, 0.15),
          var(--ncodes-accent)
        ) border-box;
      border: 1.5px solid transparent;
    }

    .ncodes-panel.bottom-right {
      left: auto;
      right: 16px;
      transform: scale(0.95);
      transform-origin: bottom right;
    }

    .ncodes-panel.bottom-left {
      left: 16px;
      transform: scale(0.95);
      transform-origin: bottom left;
    }

    .ncodes-panel.bottom-right.open {
      transform: scale(1);
    }

    .ncodes-panel.bottom-left.open {
      transform: scale(1);
    }

    .panel-header {
      padding: 16px 20px;
      border-bottom: 1px solid var(--ncodes-border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .panel-title {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 15px;
    }

    .panel-logo {
      width: 28px;
      height: 28px;
      background: var(--ncodes-accent);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      color: #000;
      font-size: 16px;
      font-family: var(--ncodes-mono);
    }

    .panel-close {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: var(--ncodes-text-dim);
      font-size: 20px;
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      font-family: var(--ncodes-font);
    }

    .panel-close:hover {
      background: var(--ncodes-bg-card);
      color: var(--ncodes-text-main);
    }

    .panel-body {
      padding: 20px;
      overflow-y: auto;
    }

    .panel-intro {
      margin-bottom: 20px;
    }

    .panel-intro p {
      color: var(--ncodes-text-muted);
      font-size: 14px;
      line-height: 1.5;
    }

    /* ===== Prompt Section ===== */
    .prompt-section {
      margin-bottom: 24px;
    }

    .prompt-input {
      width: 100%;
      background: var(--ncodes-bg-body);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 10px;
      padding: 14px 16px;
      color: var(--ncodes-text-main);
      font-size: 14px;
      font-family: var(--ncodes-font);
      resize: none;
      margin-bottom: 12px;
      transition: border-color 0.15s ease;
    }

    .prompt-input:focus {
      outline: none;
      border-color: var(--ncodes-accent);
    }

    .prompt-input::placeholder {
      color: var(--ncodes-text-dim);
    }

    .generate-btn {
      width: 100%;
      padding: 12px 20px;
      background: var(--ncodes-accent);
      border: none;
      border-radius: 10px;
      color: #000;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-family: var(--ncodes-font);
    }

    .generate-btn:hover {
      background: var(--ncodes-accent-hover);
    }

    .generate-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-loading {
      display: flex;
      gap: 4px;
    }

    .loading-dot {
      width: 6px;
      height: 6px;
      background: #000;
      border-radius: 50%;
      animation: ncodes-bounce 1.4s infinite ease-in-out both;
    }

    .loading-dot:nth-child(1) { animation-delay: -0.32s; }
    .loading-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes ncodes-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* ===== Quick Prompts ===== */
    .quick-prompts {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .quick-prompts-label {
      font-size: 12px;
      color: var(--ncodes-text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
      margin-bottom: 4px;
    }

    .quick-prompt {
      padding: 10px 14px;
      background: var(--ncodes-bg-body);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 8px;
      color: var(--ncodes-text-muted);
      font-size: 13px;
      text-align: left;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: var(--ncodes-font);
    }

    .quick-prompt:hover {
      border-color: var(--ncodes-accent);
      color: var(--ncodes-text-main);
      background: var(--ncodes-accent-dim);
    }

    /* ===== Generation Status ===== */
    .generation-status {
      margin-top: 20px;
      padding: 16px;
      background: var(--ncodes-bg-body);
      border-radius: 10px;
      border: 1px solid var(--ncodes-border-color);
    }

    .status-line {
      display: flex;
      align-items: center;
      gap: 10px;
      color: var(--ncodes-text-muted);
      font-size: 13px;
    }

    .status-icon {
      font-size: 16px;
    }

    .status-icon.spinning {
      animation: ncodes-spin 1s linear infinite;
    }

    @keyframes ncodes-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ===== Panel Expansion (result view) — centered dialog ===== */
    .ncodes-panel.expanded {
      width: 80vw;
      height: 80vh;
      max-width: 1200px;
      max-height: 80vh;
      top: 50%;
      left: 50% !important;
      right: auto !important;
      bottom: auto;
      transform: translate(-50%, -50%) !important;
      transform-origin: center center;
      border-radius: 16px;
    }

    /* ===== View Toggling ===== */
    .result-view {
      display: none;
    }

    .ncodes-panel.expanded .prompt-view {
      display: none;
    }

    .ncodes-panel.expanded .result-view {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }

    .ncodes-panel.expanded .panel-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    /* ===== History Section ===== */
    .history-section {
      margin-bottom: 20px;
    }

    .history-label {
      font-size: 12px;
      color: var(--ncodes-text-dim);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .history-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      background: var(--ncodes-bg-body);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: var(--ncodes-font);
    }

    .history-item:hover {
      border-color: var(--ncodes-accent);
      background: var(--ncodes-accent-dim);
    }

    .history-prompt-text {
      flex: 1;
      font-size: 13px;
      color: var(--ncodes-text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .history-item:hover .history-prompt-text {
      color: var(--ncodes-text-main);
    }

    .history-badge {
      font-size: 10px;
      padding: 2px 8px;
      background: var(--ncodes-bg-card);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 4px;
      color: var(--ncodes-text-dim);
      font-family: var(--ncodes-mono);
      flex-shrink: 0;
    }

    .history-delete {
      width: 22px;
      height: 22px;
      border: none;
      background: transparent;
      color: var(--ncodes-text-dim);
      font-size: 14px;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      flex-shrink: 0;
      font-family: var(--ncodes-font);
    }

    .history-delete:hover {
      background: var(--ncodes-danger-dim);
      color: var(--ncodes-danger);
    }

    /* ===== Result View ===== */
    .result-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--ncodes-border-color);
    }

    .result-back-btn {
      padding: 6px 12px;
      border: 1px solid var(--ncodes-border-color);
      background: var(--ncodes-bg-body);
      color: var(--ncodes-text-muted);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 6px;
      transition: all 0.15s ease;
      font-family: var(--ncodes-font);
      flex-shrink: 0;
    }

    .result-back-btn:hover {
      background: var(--ncodes-bg-card);
      color: var(--ncodes-text-main);
    }

    .result-prompt-label {
      font-size: 13px;
      color: var(--ncodes-text-dim);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .result-content {
      overflow-y: auto;
      flex: 1;
      background: var(--ncodes-bg-card);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 12px;
    }

    /* ===== Generated UI (inline) ===== */

    .generated-header {
      padding: 20px 24px;
      border-bottom: 1px solid var(--ncodes-border-color);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .generated-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .generated-title h2 {
      font-size: 18px;
      font-weight: 600;
      color: var(--ncodes-text-main);
    }

    .generated-badge {
      font-size: 11px;
      padding: 4px 10px;
      background: var(--ncodes-accent-dim);
      color: var(--ncodes-accent);
      border-radius: 99px;
      font-family: var(--ncodes-mono);
      font-weight: 500;
    }

    .close-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: 1px solid var(--ncodes-border-color);
      background: var(--ncodes-bg-body);
      color: var(--ncodes-text-muted);
      transition: all 0.15s ease;
      font-family: var(--ncodes-font);
    }

    .close-btn:hover {
      background: var(--ncodes-bg-card);
      color: var(--ncodes-text-main);
    }

    .generated-body {
      padding: 24px;
    }

    /* ===== Data Table (for generated UIs) ===== */
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }

    .data-table th {
      text-align: left;
      color: var(--ncodes-text-dim);
      font-weight: 500;
      padding: 12px 16px;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid var(--ncodes-border-color);
    }

    .data-table td {
      padding: 16px;
      color: var(--ncodes-text-muted);
      border-bottom: 1px solid var(--ncodes-border-light);
      vertical-align: middle;
    }

    .data-table tbody tr:last-child td {
      border-bottom: none;
    }

    .customer-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 36px;
      height: 36px;
      background: var(--ncodes-bg-body);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--ncodes-text-muted);
      flex-shrink: 0;
    }

    .customer-name {
      font-weight: 500;
      color: var(--ncodes-text-main);
      margin-bottom: 2px;
    }

    .customer-email {
      font-size: 12px;
      color: var(--ncodes-text-dim);
    }

    .mono {
      font-family: var(--ncodes-mono);
      font-size: 13px;
    }

    .amount {
      font-family: var(--ncodes-mono);
      color: var(--ncodes-text-main);
      font-weight: 500;
    }

    .overdue-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }

    .overdue-badge.mild {
      background: var(--ncodes-warning-dim);
      color: var(--ncodes-warning);
    }

    .overdue-badge.moderate {
      background: rgba(251, 146, 60, 0.1);
      color: #fb923c;
    }

    .overdue-badge.severe {
      background: var(--ncodes-danger-dim);
      color: var(--ncodes-danger);
    }

    .action-btn {
      padding: 8px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
      font-family: var(--ncodes-font);
    }

    .action-btn.remind {
      background: var(--ncodes-accent-dim);
      color: var(--ncodes-accent);
    }

    .action-btn.remind:hover {
      background: var(--ncodes-accent);
      color: #000;
    }

    .action-btn.primary {
      background: var(--ncodes-accent);
      color: #000;
    }

    .action-btn.primary:hover {
      background: var(--ncodes-accent-hover);
    }

    .action-btn.secondary {
      background: var(--ncodes-bg-body);
      border: 1px solid var(--ncodes-border-color);
      color: var(--ncodes-text-muted);
    }

    .action-btn.secondary:hover {
      color: var(--ncodes-text-main);
    }

    .action-btn.danger {
      background: var(--ncodes-danger);
      color: #fff;
    }

    .table-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 20px;
      margin-top: 8px;
      border-top: 1px solid var(--ncodes-border-color);
    }

    .table-info {
      font-size: 13px;
      color: var(--ncodes-text-dim);
    }

    /* ===== Health Dashboard Styles ===== */
    .health-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .health-stat {
      background: var(--ncodes-bg-body);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 12px;
      padding: 20px;
    }

    .health-stat-value {
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .health-stat.healthy .health-stat-value { color: var(--ncodes-accent); }
    .health-stat.at-risk .health-stat-value { color: var(--ncodes-warning); }
    .health-stat.churning .health-stat-value { color: var(--ncodes-danger); }

    .health-stat-label {
      font-size: 13px;
      color: var(--ncodes-text-muted);
      margin-bottom: 12px;
    }

    .health-bar {
      height: 4px;
      background: var(--ncodes-border-color);
      border-radius: 2px;
      overflow: hidden;
    }

    .health-bar-fill {
      height: 100%;
      border-radius: 2px;
    }

    .health-stat.healthy .health-bar-fill { background: var(--ncodes-accent); }
    .health-stat.at-risk .health-bar-fill { background: var(--ncodes-warning); }
    .health-stat.churning .health-bar-fill { background: var(--ncodes-danger); }

    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    .dashboard-card {
      background: var(--ncodes-bg-body);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 12px;
      padding: 20px;
    }

    .dashboard-card h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--ncodes-text-main);
      margin-bottom: 16px;
    }

    .risk-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .risk-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .risk-customer {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--ncodes-text-muted);
    }

    .risk-score {
      font-family: var(--ncodes-mono);
      font-size: 13px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 4px;
    }

    .risk-score.high {
      background: var(--ncodes-danger-dim);
      color: var(--ncodes-danger);
    }

    .risk-score.medium {
      background: var(--ncodes-warning-dim);
      color: var(--ncodes-warning);
    }

    .avatar.small {
      width: 28px;
      height: 28px;
      font-size: 10px;
    }

    .mini-chart {
      display: flex;
      align-items: flex-end;
      gap: 8px;
      height: 80px;
      margin-bottom: 8px;
    }

    .chart-bar {
      flex: 1;
      background: linear-gradient(to top, var(--ncodes-accent), rgba(74, 222, 128, 0.3));
      border-radius: 4px 4px 0 0;
      min-height: 10px;
    }

    .chart-labels {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: var(--ncodes-text-dim);
    }

    .dashboard-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    /* ===== Archive Styles ===== */
    .archive-info {
      background: var(--ncodes-bg-body);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin-bottom: 20px;
    }

    .archive-stat-value {
      font-size: 48px;
      font-weight: 600;
      color: var(--ncodes-warning);
      display: block;
    }

    .archive-stat-label {
      font-size: 14px;
      color: var(--ncodes-text-muted);
    }

    .selection-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--ncodes-bg-body);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 8px 8px 0 0;
      border-bottom: none;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      color: var(--ncodes-text-muted);
      cursor: pointer;
    }

    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
      accent-color: var(--ncodes-accent);
    }

    .selection-count {
      font-size: 12px;
      color: var(--ncodes-text-dim);
    }

    .data-table.selectable {
      border: 1px solid var(--ncodes-border-color);
      border-radius: 0 0 8px 8px;
    }

    .row-checkbox {
      width: 16px;
      height: 16px;
      accent-color: var(--ncodes-accent);
    }

    .muted {
      color: var(--ncodes-text-dim);
    }

    .type-badge {
      display: inline-block;
      padding: 4px 10px;
      background: var(--ncodes-bg-card);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
      color: var(--ncodes-text-muted);
    }

    .status-badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 500;
    }

    .status-badge.inactive {
      background: var(--ncodes-border-color);
      color: var(--ncodes-text-dim);
    }

    .archive-actions {
      display: flex;
      gap: 12px;
    }

    /* ===== Responsive ===== */
    @media (max-width: 768px) {
      .ncodes-panel {
        width: calc(100% - 32px);
        left: 16px !important;
        right: 16px;
        transform: scale(0.95) !important;
      }

      .ncodes-panel.open {
        transform: scale(1) !important;
      }

      .ncodes-panel.expanded {
        width: 95vw;
        height: 90vh;
        max-height: 90vh;
      }

      .health-stats {
        grid-template-columns: 1fr;
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
  `;
}

module.exports = { getStyles };

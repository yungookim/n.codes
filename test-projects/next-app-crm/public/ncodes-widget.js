var NCodes=(()=>{var l=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var X=l((lt,_)=>{var $={user:null,capabilityMapUrl:"/n.codes.capabilities.json",mode:"simulation",theme:"dark",position:"bottom-center",triggerLabel:"Build with AI",panelTitle:"n.codes",panelIntro:"Describe the UI you need and it will be generated instantly.",quickPrompts:[]},V=new Set(["simulation","live"]),O=new Set(["dark","light","auto"]),G=new Set(["bottom-center","bottom-right","bottom-left"]);function F(e){if(!e||typeof e!="object")throw new Error("NCodes.init() requires a config object.");if(e.mode&&!V.has(e.mode))throw new Error(`Invalid mode "${e.mode}". Use: ${Array.from(V).join(", ")}`);if(e.theme&&!O.has(e.theme))throw new Error(`Invalid theme "${e.theme}". Use: ${Array.from(O).join(", ")}`);if(e.position&&!G.has(e.position))throw new Error(`Invalid position "${e.position}". Use: ${Array.from(G).join(", ")}`);return!0}function Se(e){return F(e),{...$,...e}}_.exports={DEFAULTS:$,validateConfig:F,mergeConfig:Se}});var K=l((pt,J)=>{function Ce(e){return`
    @property --ncodes-glow-angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }

    :host {
      ${e!=="light"?`
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
  `:`
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
  `}
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
      animation: ncodes-glow-rotate 4s linear infinite;
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
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.5),
        0 0 30px rgba(74, 222, 128, 0.15),
        0 0 60px rgba(74, 222, 128, 0.08);
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

    /* ===== Panel Expansion (result view) \u2014 centered dialog ===== */
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
  `}J.exports={getStyles:Ce}});var W=l((ut,Q)=>{function Ee(){let e=document.createElementNS("http://www.w3.org/2000/svg","svg");e.setAttribute("width","18"),e.setAttribute("height","18"),e.setAttribute("viewBox","0 0 24 24"),e.setAttribute("fill","none"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","2.5");let t=document.createElementNS("http://www.w3.org/2000/svg","path");t.setAttribute("d","M7 4h-3v16h3"),t.setAttribute("stroke-linecap","round"),t.setAttribute("stroke-linejoin","round");let n=document.createElementNS("http://www.w3.org/2000/svg","path");return n.setAttribute("d","M17 4h3v16h-3"),n.setAttribute("stroke-linecap","round"),n.setAttribute("stroke-linejoin","round"),e.appendChild(t),e.appendChild(n),e}function Ae(e,t){let n=document.createElement("button");n.className=`ncodes-trigger ${e.position}`,n.title="Open n.codes",n.appendChild(Ee());let a=document.createElement("span");return a.textContent=e.triggerLabel,n.appendChild(a),n.addEventListener("click",t),n}function Te(e){e.classList.remove("hidden")}function qe(e){e.classList.add("hidden")}Q.exports={createTrigger:Ae,showTrigger:Te,hideTrigger:qe}});var ne=l((mt,te)=>{function Le(e){let t=document.createElement("div");t.className=`ncodes-panel ${e.position}`;let n=document.createElement("div");n.className="panel-header";let a=document.createElement("div");a.className="panel-title";let r=document.createElement("span");r.className="panel-logo",r.textContent="n";let i=document.createElement("span");i.textContent=e.panelTitle,a.appendChild(r),a.appendChild(i);let s=document.createElement("button");s.className="panel-close",s.setAttribute("data-ncodes-panel-close",""),s.textContent="\xD7",n.appendChild(a),n.appendChild(s);let c=document.createElement("div");c.className="panel-body";let d=document.createElement("div");d.className="prompt-view";let p=document.createElement("div");p.className="panel-intro";let B=document.createElement("p");B.textContent=e.panelIntro,p.appendChild(B);let h=document.createElement("div");h.className="history-section",h.style.display="none";let T=document.createElement("div");T.className="history-label",T.textContent="Recent features";let j=document.createElement("div");j.className="history-list",h.appendChild(T),h.appendChild(j);let v=document.createElement("div");v.className="prompt-section";let g=document.createElement("textarea");g.className="prompt-input",g.placeholder="e.g., Show me overdue invoices with a remind button...",g.rows=3;let x=document.createElement("button");x.className="generate-btn";let q=document.createElement("span");q.className="btn-text",q.textContent="Generate";let f=document.createElement("span");f.className="btn-loading",f.style.display="none";for(let u=0;u<3;u++){let m=document.createElement("span");m.className="loading-dot",f.appendChild(m)}if(x.appendChild(q),x.appendChild(f),v.appendChild(g),v.appendChild(x),d.appendChild(p),d.appendChild(h),d.appendChild(v),e.quickPrompts.length>0){let u=document.createElement("div");u.className="quick-prompts";let m=document.createElement("div");m.className="quick-prompts-label",m.textContent="Try these examples:",u.appendChild(m),e.quickPrompts.forEach(U=>{let E=document.createElement("button");E.className="quick-prompt",E.setAttribute("data-prompt",U.prompt),E.textContent=U.label,u.appendChild(E)}),d.appendChild(u)}let y=document.createElement("div");y.className="generation-status",y.style.display="none";let k=document.createElement("div");k.className="status-line";let L=document.createElement("span");L.className="status-icon spinning",L.textContent="\u2699";let N=document.createElement("span");N.className="status-text",N.textContent="Analyzing request...",k.appendChild(L),k.appendChild(N),y.appendChild(k),d.appendChild(y);let w=document.createElement("div");w.className="result-view";let S=document.createElement("div");S.className="result-header";let C=document.createElement("button");C.className="result-back-btn",C.setAttribute("data-ncodes-back",""),C.textContent="\u2190 Back";let D=document.createElement("span");D.className="result-prompt-label",S.appendChild(C),S.appendChild(D);let H=document.createElement("div");return H.className="result-content",w.appendChild(S),w.appendChild(H),c.appendChild(d),c.appendChild(w),t.appendChild(n),t.appendChild(c),t}function Ne(e,t){e.classList.add("open"),t&&t.classList.add("hidden");let n=e.querySelector(".prompt-input");n&&n.focus()}function Ie(e,t){e.classList.remove("open"),t&&t.classList.remove("hidden"),ee(e),Y(e)}function Y(e){let t=e.querySelector(".generation-status"),n=e.querySelector(".generate-btn");if(t&&(t.style.display="none"),n){n.disabled=!1;let a=n.querySelector(".btn-text"),r=n.querySelector(".btn-loading");a&&(a.style.display="inline"),r&&(r.style.display="none")}}function Z(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function ze(e,t){e.classList.add("expanded");let n=e.querySelector(".result-prompt-label");n&&(n.textContent=t||"")}function ee(e){e.classList.remove("expanded");let t=e.querySelector(".result-content");t&&Z(t)}function Me(e){return e.querySelector(".result-content")}function Re(e,t){let n=e.querySelector(".history-section"),a=e.querySelector(".history-list");if(!(!n||!a)){if(Z(a),t.length===0){n.style.display="none";return}n.style.display="block",t.forEach(r=>{let i=document.createElement("div");i.className="history-item",i.setAttribute("data-history-id",r.id),i.setAttribute("data-template-id",r.templateId);let s=document.createElement("span");s.className="history-prompt-text",s.textContent=r.prompt;let c=document.createElement("span");c.className="history-badge",c.textContent=r.templateId;let d=document.createElement("button");d.className="history-delete",d.setAttribute("data-history-delete",r.id),d.textContent="\xD7",i.appendChild(s),i.appendChild(c),i.appendChild(d),a.appendChild(i)})}}te.exports={createPanel:Le,openPanel:Ne,closePanel:Ie,resetPanelState:Y,showResultView:ze,showPromptView:ee,getResultContainer:Me,updateHistoryList:Re}});var re=l((ht,se)=>{var ae={invoice:"invoices",overdue:"invoices",reminder:"invoices",health:"dashboard",dashboard:"dashboard",engagement:"dashboard",churn:"dashboard",archive:"archive",inactive:"archive",bulk:"archive",user:"archive"},Pe=["Analyzing request...","Mapping to capabilities...","Selecting components...","Generating UI...","Applying styles...","Done!"];function Be(e){let t=e.toLowerCase();for(let[n,a]of Object.entries(ae))if(t.includes(n))return a;return"invoices"}function je(e){return e==="invoices"?oe():e==="dashboard"?De():e==="archive"?He():oe()}function oe(){return`
    <div class="generated-header">
      <div class="generated-title">
        <h2>Overdue Invoices Over $500</h2>
        <span class="generated-badge">n.codes</span>
      </div>
      <button class="close-btn" data-ncodes-close>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Close
      </button>
    </div>
    <div class="generated-body">
      <table class="data-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Invoice #</th>
            <th>Amount</th>
            <th>Days Overdue</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="customer-cell">
                <span class="avatar">AC</span>
                <div>
                  <div class="customer-name">Acme Corp</div>
                  <div class="customer-email">billing@acme.co</div>
                </div>
              </div>
            </td>
            <td class="mono">INV-2024-089</td>
            <td class="amount">$2,450.00</td>
            <td><span class="overdue-badge severe">45 days</span></td>
            <td><button class="action-btn remind">Send Reminder</button></td>
          </tr>
          <tr>
            <td>
              <div class="customer-cell">
                <span class="avatar">TI</span>
                <div>
                  <div class="customer-name">TechStart Inc</div>
                  <div class="customer-email">accounts@techstart.io</div>
                </div>
              </div>
            </td>
            <td class="mono">INV-2024-076</td>
            <td class="amount">$1,890.00</td>
            <td><span class="overdue-badge moderate">28 days</span></td>
            <td><button class="action-btn remind">Send Reminder</button></td>
          </tr>
          <tr>
            <td>
              <div class="customer-cell">
                <span class="avatar">GS</span>
                <div>
                  <div class="customer-name">Global Systems</div>
                  <div class="customer-email">finance@globalsys.com</div>
                </div>
              </div>
            </td>
            <td class="mono">INV-2024-092</td>
            <td class="amount">$3,200.00</td>
            <td><span class="overdue-badge severe">52 days</span></td>
            <td><button class="action-btn remind">Send Reminder</button></td>
          </tr>
          <tr>
            <td>
              <div class="customer-cell">
                <span class="avatar">NV</span>
                <div>
                  <div class="customer-name">Nova Ventures</div>
                  <div class="customer-email">ap@novaventures.co</div>
                </div>
              </div>
            </td>
            <td class="mono">INV-2024-081</td>
            <td class="amount">$875.00</td>
            <td><span class="overdue-badge mild">14 days</span></td>
            <td><button class="action-btn remind">Send Reminder</button></td>
          </tr>
          <tr>
            <td>
              <div class="customer-cell">
                <span class="avatar">SP</span>
                <div>
                  <div class="customer-name">Spark Partners</div>
                  <div class="customer-email">billing@sparkpartners.io</div>
                </div>
              </div>
            </td>
            <td class="mono">INV-2024-067</td>
            <td class="amount">$4,100.00</td>
            <td><span class="overdue-badge severe">61 days</span></td>
            <td><button class="action-btn remind">Send Reminder</button></td>
          </tr>
        </tbody>
      </table>
      <div class="table-footer">
        <span class="table-info">Showing 5 invoices totaling $12,515.00</span>
        <button class="action-btn primary">Send All Reminders</button>
      </div>
    </div>
  `}function De(){return`
    <div class="generated-header">
      <div class="generated-title">
        <h2>Customer Health Dashboard</h2>
        <span class="generated-badge">n.codes</span>
      </div>
      <button class="close-btn" data-ncodes-close>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Close
      </button>
    </div>
    <div class="generated-body">
      <div class="health-stats">
        <div class="health-stat healthy">
          <div class="health-stat-value">847</div>
          <div class="health-stat-label">Healthy</div>
          <div class="health-bar"><div class="health-bar-fill" style="width:66%"></div></div>
        </div>
        <div class="health-stat at-risk">
          <div class="health-stat-value">312</div>
          <div class="health-stat-label">At Risk</div>
          <div class="health-bar"><div class="health-bar-fill" style="width:24%"></div></div>
        </div>
        <div class="health-stat churning">
          <div class="health-stat-value">125</div>
          <div class="health-stat-label">Churning</div>
          <div class="health-bar"><div class="health-bar-fill" style="width:10%"></div></div>
        </div>
      </div>
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <h3>Top At-Risk Customers</h3>
          <div class="risk-list">
            <div class="risk-item">
              <div class="risk-customer"><span class="avatar small">MC</span><span>MegaCorp Ltd</span></div>
              <div class="risk-score high">23%</div>
            </div>
            <div class="risk-item">
              <div class="risk-customer"><span class="avatar small">DF</span><span>DataFlow Inc</span></div>
              <div class="risk-score high">31%</div>
            </div>
            <div class="risk-item">
              <div class="risk-customer"><span class="avatar small">QS</span><span>QuickServe</span></div>
              <div class="risk-score medium">45%</div>
            </div>
            <div class="risk-item">
              <div class="risk-customer"><span class="avatar small">BT</span><span>BlueTech</span></div>
              <div class="risk-score medium">52%</div>
            </div>
          </div>
        </div>
        <div class="dashboard-card">
          <h3>Engagement Trends</h3>
          <div class="mini-chart">
            <div class="chart-bar" style="height:40%"></div>
            <div class="chart-bar" style="height:55%"></div>
            <div class="chart-bar" style="height:45%"></div>
            <div class="chart-bar" style="height:70%"></div>
            <div class="chart-bar" style="height:65%"></div>
            <div class="chart-bar" style="height:80%"></div>
            <div class="chart-bar" style="height:75%"></div>
          </div>
          <div class="chart-labels">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
      </div>
      <div class="dashboard-actions">
        <button class="action-btn secondary">Export Report</button>
        <button class="action-btn primary">Schedule Outreach</button>
      </div>
    </div>
  `}function He(){return`
    <div class="generated-header">
      <div class="generated-title">
        <h2>Bulk Archive Inactive Users</h2>
        <span class="generated-badge">n.codes</span>
      </div>
      <button class="close-btn" data-ncodes-close>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Close
      </button>
    </div>
    <div class="generated-body">
      <div class="archive-info">
        <span class="archive-stat-value">234</span>
        <span class="archive-stat-label">users inactive for 90+ days</span>
      </div>
      <div class="selection-header">
        <label class="checkbox-label">
          <input type="checkbox" checked data-ncodes-select-all>
          <span>Select All (234)</span>
        </label>
        <span class="selection-count">234 selected</span>
      </div>
      <table class="data-table selectable">
        <thead>
          <tr><th width="40"></th><th>User</th><th>Last Active</th><th>Account Type</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr>
            <td><input type="checkbox" checked class="row-checkbox"></td>
            <td><div class="customer-cell"><span class="avatar">JD</span><div><div class="customer-name">John Doe</div><div class="customer-email">john.doe@example.com</div></div></div></td>
            <td class="muted">Oct 15, 2024</td>
            <td><span class="type-badge">Free</span></td>
            <td><span class="status-badge inactive">Inactive</span></td>
          </tr>
          <tr>
            <td><input type="checkbox" checked class="row-checkbox"></td>
            <td><div class="customer-cell"><span class="avatar">SJ</span><div><div class="customer-name">Sarah Johnson</div><div class="customer-email">sarah.j@company.co</div></div></div></td>
            <td class="muted">Sep 28, 2024</td>
            <td><span class="type-badge">Pro</span></td>
            <td><span class="status-badge inactive">Inactive</span></td>
          </tr>
          <tr>
            <td><input type="checkbox" checked class="row-checkbox"></td>
            <td><div class="customer-cell"><span class="avatar">MK</span><div><div class="customer-name">Mike Kim</div><div class="customer-email">m.kim@startup.io</div></div></div></td>
            <td class="muted">Sep 12, 2024</td>
            <td><span class="type-badge">Free</span></td>
            <td><span class="status-badge inactive">Inactive</span></td>
          </tr>
          <tr>
            <td><input type="checkbox" checked class="row-checkbox"></td>
            <td><div class="customer-cell"><span class="avatar">EW</span><div><div class="customer-name">Emma Wilson</div><div class="customer-email">emma@agency.com</div></div></div></td>
            <td class="muted">Aug 30, 2024</td>
            <td><span class="type-badge">Team</span></td>
            <td><span class="status-badge inactive">Inactive</span></td>
          </tr>
          <tr>
            <td><input type="checkbox" checked class="row-checkbox"></td>
            <td><div class="customer-cell"><span class="avatar">RL</span><div><div class="customer-name">Robert Lee</div><div class="customer-email">rlee@corp.net</div></div></div></td>
            <td class="muted">Aug 15, 2024</td>
            <td><span class="type-badge">Free</span></td>
            <td><span class="status-badge inactive">Inactive</span></td>
          </tr>
        </tbody>
      </table>
      <div class="table-footer">
        <span class="table-info">Showing 5 of 234 inactive users</span>
        <div class="archive-actions">
          <button class="action-btn secondary">Cancel</button>
          <button class="action-btn danger">Archive 234 Users</button>
        </div>
      </div>
    </div>
  `}se.exports={PROMPT_TEMPLATES:ae,STATUS_MESSAGES:Pe,findTemplate:Be,getTemplateHTML:je}});var le=l((bt,ce)=>{function Ue(e,t){de(e);let r=new DOMParser().parseFromString(t,"text/html").body.childNodes;for(;r.length>0;)e.appendChild(r[0]);return ie(e),e}function de(e){if(e)for(;e.firstChild;)e.removeChild(e.firstChild)}function ie(e){let t=e.querySelectorAll(".action-btn.remind");t.forEach(i=>{i.addEventListener("click",function(){let s=this.textContent;this.textContent="Sent!",this.style.background="var(--ncodes-accent)",this.style.color="#000",this.disabled=!0,setTimeout(()=>{this.textContent=s,this.style.background="",this.style.color="",this.disabled=!1},2e3)})});let n=e.querySelector(".action-btn.primary");n&&n.textContent.includes("Send All")&&n.addEventListener("click",function(){let i=this.textContent;this.textContent="All reminders sent!",this.disabled=!0,t.forEach(s=>{s.textContent="Sent!",s.style.background="var(--ncodes-accent)",s.style.color="#000",s.disabled=!0}),setTimeout(()=>{this.textContent=i,this.disabled=!1,t.forEach(s=>{s.textContent="Send Reminder",s.style.background="",s.style.color="",s.disabled=!1})},2e3)});let a=e.querySelector(".action-btn.danger");a&&a.addEventListener("click",function(){this.textContent="Archived!",this.style.background="var(--ncodes-accent)",this.disabled=!0});let r=e.querySelector("[data-ncodes-select-all]");r&&r.addEventListener("change",function(){let i=e.querySelectorAll(".row-checkbox"),s=e.querySelector(".selection-count");i.forEach(c=>{c.checked=this.checked}),s&&(s.textContent=this.checked?"234 selected":"0 selected")})}ce.exports={renderGeneratedUI:Ue,clearRenderedUI:de,setupActionHandlers:ie}});var ue=l((vt,pe)=>{var b="ncodes:history";function I(){try{let e=localStorage.getItem(b);if(!e)return[];let t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function Ve({prompt:e,templateId:t}){let n=I(),a={id:String(Date.now()),prompt:e,templateId:t,timestamp:Date.now()};return n.unshift(a),n.length>20&&(n.length=20),localStorage.setItem(b,JSON.stringify(n)),a}function Oe(e){let t=I().filter(n=>n.id!==e);return localStorage.setItem(b,JSON.stringify(t)),t}function Ge(){localStorage.removeItem(b)}pe.exports={getHistory:I,addToHistory:Ve,removeFromHistory:Oe,clearHistory:Ge,STORAGE_KEY:b,MAX_ENTRIES:20}});var it=l((gt,we)=>{var{mergeConfig:$e}=X(),{getStyles:Fe}=K(),{createTrigger:_e}=W(),{createPanel:Xe,openPanel:he,closePanel:A,showResultView:be,showPromptView:Je,getResultContainer:M,updateHistoryList:Ke}=ne(),{findTemplate:Qe,getTemplateHTML:ve,STATUS_MESSAGES:z}=re(),{renderGeneratedUI:ge,clearRenderedUI:R}=le(),{getHistory:We,addToHistory:Ye,removeFromHistory:Ze}=ue(),o=null;function et(e){o&&ke();let t=$e(e);if(!t.user){o={config:t,mounted:!1};return}let n=document.createElement("div");n.id="ncodes-root";let a=n.attachShadow({mode:"open"}),r=document.createElement("style"),i=t.theme==="auto"?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":t.theme;r.textContent=Fe(i),a.appendChild(r);let s=_e(t,()=>{he(c,s)}),c=Xe(t);a.appendChild(s),a.appendChild(c),document.body.appendChild(n),o={config:t,host:n,shadow:a,trigger:s,panel:c,mounted:!0,isGenerating:!1},tt(),P()}function tt(){if(!o||!o.mounted)return;let{panel:e,trigger:t}=o,n=e.querySelector("[data-ncodes-panel-close]");n&&n.addEventListener("click",()=>A(e,t));let a=e.querySelector(".generate-btn");a&&a.addEventListener("click",me);let r=e.querySelector(".prompt-input");r&&r.addEventListener("keydown",d=>{d.key==="Enter"&&!d.shiftKey&&(d.preventDefault(),me())}),e.querySelectorAll(".quick-prompt").forEach(d=>{d.addEventListener("click",()=>{let p=e.querySelector(".prompt-input");p&&(p.value=d.getAttribute("data-prompt"),p.focus())})});let s=e.querySelector(".history-list");s&&s.addEventListener("click",nt);let c=e.querySelector("[data-ncodes-back]");c&&c.addEventListener("click",ye),document.addEventListener("keydown",xe),document.addEventListener("click",fe)}function xe(e){!o||!o.mounted||e.key==="Escape"&&o.panel.classList.contains("open")&&(o.panel.classList.contains("expanded")?ye():A(o.panel,o.trigger))}function fe(e){!o||!o.mounted||o.panel.classList.contains("open")&&!o.host.contains(e.target)&&A(o.panel,o.trigger)}function ye(){if(!o||!o.mounted)return;let e=M(o.panel);R(e),Je(o.panel)}function nt(e){if(!o||!o.mounted)return;let t=e.target.closest("[data-history-delete]");if(t){e.stopPropagation();let a=t.getAttribute("data-history-delete");Ze(a),P();return}let n=e.target.closest(".history-item");if(n){let a=n.getAttribute("data-template-id"),r=n.querySelector(".history-prompt-text"),i=r?r.textContent:"";ot(a,i)}}function ot(e,t){if(!o||!o.mounted)return;let n=ve(e),a=M(o.panel);R(a),ge(a,n),be(o.panel,t)}async function me(){if(!o||!o.mounted||o.isGenerating)return;let e=o.panel.querySelector(".prompt-input"),t=e?e.value.trim():"";if(!t)return;o.isGenerating=!0;let n=o.panel.querySelector(".generate-btn");if(n){n.disabled=!0;let c=n.querySelector(".btn-text"),d=n.querySelector(".btn-loading");c&&(c.style.display="none"),d&&(d.style.display="flex")}await at();let a=Qe(t),r=ve(a);Ye({prompt:t,templateId:a}),P();let i=M(o.panel);if(R(i),ge(i,r),be(o.panel,t),n){n.disabled=!1;let c=n.querySelector(".btn-text"),d=n.querySelector(".btn-loading");c&&(c.style.display="inline"),d&&(d.style.display="none")}let s=o.panel.querySelector(".generation-status");s&&(s.style.display="none"),e&&(e.value=""),o.isGenerating=!1}async function at(){if(!o||!o.mounted)return;let e=o.panel.querySelector(".generation-status"),t=o.panel.querySelector(".status-text");if(!(!e||!t)){e.style.display="block";for(let n=0;n<z.length;n++){t.textContent=z[n];let a=n===z.length-1?300:400+Math.random()*300;await dt(a)}}}function P(){if(!o||!o.mounted)return;let e=We();Ke(o.panel,e)}function st(){!o||!o.mounted||he(o.panel,o.trigger)}function rt(){!o||!o.mounted||A(o.panel,o.trigger)}function ke(){o&&(document.removeEventListener("keydown",xe),document.removeEventListener("click",fe),o.host&&o.host.parentNode&&o.host.parentNode.removeChild(o.host),o=null)}function dt(e){return new Promise(t=>setTimeout(t,e))}we.exports={init:et,open:st,close:rt,destroy:ke}});return it();})();
if(typeof module!=="undefined")module.exports=NCodes;
//# sourceMappingURL=ncodes-widget.js.map

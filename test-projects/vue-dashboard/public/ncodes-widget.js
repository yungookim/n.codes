var NCodes=(()=>{var y=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var Z=y((Rt,K)=>{var W={user:null,apiUrl:"/api/generate",provider:"openai",model:"gpt-5-mini",theme:"dark",position:"bottom-center",triggerLabel:"Build with AI",panelTitle:"n.codes",panelIntro:"Describe the UI you need and it will be generated instantly.",quickPrompts:[]},X=new Set(["dark","light","auto"]),Q=new Set(["bottom-center","bottom-right","bottom-left"]);function Y(e){if(!e||typeof e!="object")throw new Error("NCodes.init() requires a config object.");if(e.mode&&e.mode!=="live")throw new Error('Simulation mode is no longer supported. Remove mode or set it to "live".');if(e.theme&&!X.has(e.theme))throw new Error(`Invalid theme "${e.theme}". Use: ${Array.from(X).join(", ")}`);if(e.position&&!Q.has(e.position))throw new Error(`Invalid position "${e.position}". Use: ${Array.from(Q).join(", ")}`);return!0}function Me(e){return Y(e),{...W,...e}}K.exports={DEFAULTS:W,validateConfig:Y,mergeConfig:Me}});var te=y((jt,ee)=>{function _e(e){return`
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

    .status-step {
      display: inline-block;
      font-size: 11px;
      color: var(--ncodes-text-dim);
      font-family: var(--ncodes-mono);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-left: 26px;
      margin-top: 6px;
    }

    .status-step:empty {
      display: none;
    }

    .status-step::after {
      content: '';
      animation: ncodes-dots 1.4s steps(4, end) infinite;
    }

    @keyframes ncodes-dots {
      0% { content: ''; }
      25% { content: '.'; }
      50% { content: '..'; }
      75% { content: '...'; }
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

    /* ===== Error State ===== */
    .ncodes-error-state {
      text-align: center;
      padding: 32px 20px;
    }

    .ncodes-error-icon {
      font-size: 32px;
      margin-bottom: 12px;
    }

    .ncodes-error-message {
      font-size: 14px;
      color: var(--ncodes-text-muted);
      line-height: 1.5;
      margin-bottom: 20px;
      max-width: 320px;
      margin-left: auto;
      margin-right: auto;
    }

    .ncodes-error-actions {
      display: flex;
      gap: 10px;
      justify-content: center;
    }

    .ncodes-error-retry {
      padding: 8px 18px;
      background: var(--ncodes-accent);
      border: none;
      border-radius: 8px;
      color: #000;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--ncodes-font);
      transition: background 0.15s ease;
    }

    .ncodes-error-retry:hover {
      background: var(--ncodes-accent-hover);
    }

    .ncodes-error-fallback {
      padding: 8px 18px;
      background: transparent;
      border: 1px solid var(--ncodes-border-color);
      border-radius: 8px;
      color: var(--ncodes-text-muted);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      font-family: var(--ncodes-font);
      transition: border-color 0.15s ease;
    }

    .ncodes-error-fallback:hover {
      border-color: var(--ncodes-text-muted);
    }

    /* ===== Clarifying Question ===== */
    .ncodes-clarifying-question {
      padding: 32px 20px;
      text-align: center;
    }

    .ncodes-clarifying-text {
      font-size: 15px;
      color: var(--ncodes-text-main);
      line-height: 1.5;
      margin-bottom: 20px;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    .ncodes-clarifying-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 320px;
      margin: 0 auto;
    }

    .ncodes-clarifying-option {
      padding: 10px 16px;
      background: var(--ncodes-bg-body);
      border: 1px solid var(--ncodes-border-color);
      border-radius: 8px;
      color: var(--ncodes-text-muted);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: var(--ncodes-font);
    }

    .ncodes-clarifying-option:hover {
      border-color: var(--ncodes-accent);
      color: var(--ncodes-text-main);
      background: var(--ncodes-accent-dim);
    }

    /* ===== Sandbox iframe ===== */
    .result-content iframe {
      width: 100%;
      height: 100%;
      min-height: 400px;
    }
  `}ee.exports={getStyles:_e}});var oe=y((Ut,ne)=>{function De(){let e=document.createElementNS("http://www.w3.org/2000/svg","svg");e.setAttribute("width","18"),e.setAttribute("height","18"),e.setAttribute("viewBox","0 0 24 24"),e.setAttribute("fill","none"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","2.5");let t=document.createElementNS("http://www.w3.org/2000/svg","path");t.setAttribute("d","M7 4h-3v16h3"),t.setAttribute("stroke-linecap","round"),t.setAttribute("stroke-linejoin","round");let n=document.createElementNS("http://www.w3.org/2000/svg","path");return n.setAttribute("d","M17 4h3v16h-3"),n.setAttribute("stroke-linecap","round"),n.setAttribute("stroke-linejoin","round"),e.appendChild(t),e.appendChild(n),e}function Oe(e,t){let n=document.createElement("button");n.className=`ncodes-trigger ${e.position}`,n.title="Open n.codes",n.appendChild(De());let r=document.createElement("span");return r.textContent=e.triggerLabel,n.appendChild(r),n.addEventListener("click",t),n}function Be(e){e.classList.remove("hidden")}function Ge(e){e.classList.add("hidden")}ne.exports={createTrigger:Oe,showTrigger:Be,hideTrigger:Ge}});var de=y((Mt,ie)=>{function He(e){let t=document.createElement("div");t.className=`ncodes-panel ${e.position}`;let n=document.createElement("div");n.className="panel-header";let r=document.createElement("div");r.className="panel-title";let a=document.createElement("span");a.className="panel-logo",a.textContent="n";let s=document.createElement("span");s.textContent=e.panelTitle,r.appendChild(a),r.appendChild(s);let i=document.createElement("button");i.className="panel-close",i.setAttribute("data-ncodes-panel-close",""),i.textContent="\xD7",n.appendChild(r),n.appendChild(i);let c=document.createElement("div");c.className="panel-body";let d=document.createElement("div");d.className="prompt-view";let u=document.createElement("div");u.className="panel-intro";let b=document.createElement("p");b.textContent=e.panelIntro,u.appendChild(b);let l=document.createElement("div");l.className="history-section",l.style.display="none";let p=document.createElement("div");p.className="history-label",p.textContent="Recent features";let m=document.createElement("div");m.className="history-list",l.appendChild(p),l.appendChild(m);let f=document.createElement("div");f.className="prompt-section";let E=document.createElement("textarea");E.className="prompt-input",E.placeholder="e.g., Show me overdue invoices with a remind button...",E.rows=3;let g=document.createElement("button");g.className="generate-btn";let v=document.createElement("span");v.className="btn-text",v.textContent="Generate";let w=document.createElement("span");w.className="btn-loading",w.style.display="none";for(let q=0;q<3;q++){let N=document.createElement("span");N.className="loading-dot",w.appendChild(N)}if(g.appendChild(v),g.appendChild(w),f.appendChild(E),f.appendChild(g),d.appendChild(u),d.appendChild(l),d.appendChild(f),e.quickPrompts.length>0){let q=document.createElement("div");q.className="quick-prompts";let N=document.createElement("div");N.className="quick-prompts-label",N.textContent="Try these examples:",q.appendChild(N),e.quickPrompts.forEach(V=>{let M=document.createElement("button");M.className="quick-prompt",M.setAttribute("data-prompt",V.prompt),M.textContent=V.label,q.appendChild(M)}),d.appendChild(q)}let x=document.createElement("div");x.className="generation-status",x.style.display="none";let A=document.createElement("div");A.className="status-line";let k=document.createElement("span");k.className="status-icon spinning",k.textContent="\u2699";let S=document.createElement("span");S.className="status-text",S.textContent="Analyzing request...",A.appendChild(k),A.appendChild(S),x.appendChild(A);let R=document.createElement("div");R.className="status-step",x.appendChild(R),d.appendChild(x);let C=document.createElement("div");C.className="result-view";let j=document.createElement("div");j.className="result-header";let U=document.createElement("button");U.className="result-back-btn",U.setAttribute("data-ncodes-back",""),U.textContent="\u2190 Back";let $=document.createElement("span");$.className="result-prompt-label",j.appendChild(U),j.appendChild($);let J=document.createElement("div");return J.className="result-content",C.appendChild(j),C.appendChild(J),c.appendChild(d),c.appendChild(C),t.appendChild(n),t.appendChild(c),t}function Fe(e,t){e.classList.add("open"),t&&t.classList.add("hidden");let n=e.querySelector(".prompt-input");n&&n.focus()}function $e(e,t){e.classList.remove("open"),t&&t.classList.remove("hidden"),se(e),re(e)}function re(e){let t=e.querySelector(".generation-status"),n=e.querySelector(".generate-btn");if(t&&(t.style.display="none"),n){n.disabled=!1;let r=n.querySelector(".btn-text"),a=n.querySelector(".btn-loading");r&&(r.style.display="inline"),a&&(a.style.display="none")}}function ae(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function Je(e,t){e.classList.add("expanded");let n=e.querySelector(".result-prompt-label");n&&(n.textContent=t||"")}function se(e){e.classList.remove("expanded");let t=e.querySelector(".result-content");t&&ae(t)}function Ve(e){return e.querySelector(".result-content")}function Xe(e,t){let n=e.querySelector(".history-section"),r=e.querySelector(".history-list");if(!(!n||!r)){if(ae(r),t.length===0){n.style.display="none";return}n.style.display="block",t.forEach(a=>{let s=document.createElement("div");s.className="history-item",s.setAttribute("data-history-id",a.id);let i=document.createElement("span");i.className="history-prompt-text",i.textContent=a.prompt;let c=document.createElement("button");c.className="history-delete",c.setAttribute("data-history-delete",a.id),c.textContent="\xD7",s.appendChild(i),s.appendChild(c),r.appendChild(s)})}}function Qe(e,t){let n=e.querySelector(".prompt-view");if(!n)return;let r=n.querySelector(".quick-prompts");if(r&&r.remove(),!t||t.length===0)return;let a=document.createElement("div");a.className="quick-prompts";let s=document.createElement("div");s.className="quick-prompts-label",s.textContent="Try these examples:",a.appendChild(s),t.forEach(c=>{let d=document.createElement("button");d.className="quick-prompt",d.setAttribute("data-prompt",c.prompt),d.textContent=c.label,a.appendChild(d)});let i=n.querySelector(".generation-status");i?n.insertBefore(a,i):n.appendChild(a)}ie.exports={createPanel:He,openPanel:Fe,closePanel:$e,resetPanelState:re,showResultView:Je,showPromptView:se,getResultContainer:Ve,updateHistoryList:Xe,updateQuickPrompts:Qe}});var le=y((_t,ce)=>{"use strict";function We(e){return`
(function() {
  'use strict';

  var REQUEST_TIMEOUT = 30000;
  var _requestId = 0;
  var _pending = {};

  function generateId() {
    return 'ncodes-req-' + (++_requestId) + '-' + Date.now();
  }

  function sendRequest(method, ref, payload) {
    return new Promise(function(resolve, reject) {
      var id = generateId();
      console.log('[n.codes:bridge] request', method, ref, payload);

      var timeoutHandle = setTimeout(function() {
        delete _pending[id];
        console.warn('[n.codes:bridge] timeout', id, ref);
        reject(new Error('API request timed out after ' + REQUEST_TIMEOUT + 'ms'));
      }, REQUEST_TIMEOUT);

      _pending[id] = { resolve: resolve, reject: reject, timeout: timeoutHandle };

      // targetOrigin '*' is required: this iframe has an opaque origin
      // (sandbox without allow-same-origin), so no specific origin to target.
      window.parent.postMessage({
        type: 'ncodes:api-request',
        id: id,
        method: method,
        ref: ref,
        params: method === 'query' ? payload : undefined,
        data: method === 'action' ? payload : undefined
      }, '*');
    });
  }

  window.addEventListener('message', function(event) {
    if (!event.data || event.data.type !== 'ncodes:api-response') return;

    var id = event.data.id;
    var handler = _pending[id];
    if (!handler) return;

    clearTimeout(handler.timeout);
    delete _pending[id];

    console.log('[n.codes:bridge] response', id, event.data.error ? 'ERROR' : 'OK', event.data.data);

    if (event.data.error) {
      handler.reject(new Error(event.data.error));
    } else {
      handler.resolve(event.data.data);
    }
  });

  window.addEventListener('error', function(event) {
    console.error('[n.codes:bridge] JS error:', event.message, 'at', event.filename, ':', event.lineno);
    // targetOrigin '*' required \u2014 see note above about opaque origins.
    window.parent.postMessage({
      type: 'ncodes:sandbox-error',
      message: event.message,
      lineno: event.lineno,
      colno: event.colno
    }, '*');
  });

  window.ncodes = {
    query: function(ref, params) {
      return sendRequest('query', ref, params || {});
    },
    action: function(ref, data) {
      return sendRequest('action', ref, data || {});
    },
    app: ${JSON.stringify(e||{name:"",entities:[]})}
  };
})();
`}ce.exports={getBridgeScript:We}});var ue=y((Dt,pe)=>{"use strict";function Ye(e,t,n){let a=(n||{}).fetchFn||globalThis.fetch,s={};if(Array.isArray(t))for(let l of t)s[l.ref]={type:l.type,method:l.resolved.method,path:l.resolved.path};function i(l){if(!l.data||l.data.type!=="ncodes:api-request"){l.data&&l.data.type==="ncodes:sandbox-error"&&console.error("[n.codes:sandbox] Error in generated code:",l.data.message,"line:",l.data.lineno);return}if(e.contentWindow&&l.source!==e.contentWindow)return;let{id:p,method:m,ref:f,params:E,data:g}=l.data;!p||!f||(console.log("[n.codes:handler] request received",{id:p,method:m,ref:f}),c(p,m,f,E,g))}async function c(l,p,m,f,E){try{let g=s[m];if(!g){console.warn("[n.codes:handler] unknown ref",m,"available:",Object.keys(s)),d(l,null,"Unknown API reference: "+m);return}if(console.log("[n.codes:handler] ref resolved",{ref:m,path:g.path,method:g.method}),p==="query"&&g.type!=="query"){d(l,null,'Reference "'+m+'" is not a query');return}if(p==="action"&&g.type!=="action"){d(l,null,'Reference "'+m+'" is not an action');return}let v={credentials:"include"},w=g.path;if(g.method==="GET"){if(f&&Object.keys(f).length>0){let k=new URLSearchParams;for(let[R,C]of Object.entries(f))C!=null&&k.append(R,String(C));let S=w.includes("?")?"&":"?";w=w+S+k.toString()}v.method="GET"}else v.method=g.method,v.headers={"Content-Type":"application/json"},v.body=JSON.stringify(E||f||{});let x=await a(w,v);if(console.log("[n.codes:handler] fetch complete",{id:l,ref:m,status:x.status,ok:x.ok}),!x.ok){let k=await x.json().catch(function(){return{}}),S=k&&k.error||"Request failed ("+x.status+")";d(l,null,S);return}let A=await x.json();d(l,A,null)}catch(g){d(l,null,g.message||"Network error")}}function d(l,p,m){console.log("[n.codes:handler] response sent",{id:l,hasData:!!p,error:m||null}),e.contentWindow&&e.contentWindow.postMessage({type:"ncodes:api-response",id:l,data:p,error:m},"*")}function u(){window.addEventListener("message",i)}function b(){window.removeEventListener("message",i)}return{start:u,stop:b,handler:i}}pe.exports={createMessageHandler:Ye}});var he=y((Ot,fe)=>{"use strict";var{getBridgeScript:Ke}=le(),{createMessageHandler:Ze}=ue(),T=null;function et(e,t,n){ge();let r=n||{},{html:a,css:s,js:i,apiBindings:c}=t,d=document.createElement("iframe");d.setAttribute("sandbox","allow-scripts"),d.style.width="100%",d.style.height="100%",d.style.border="none",d.style.display="block",d.style.backgroundColor="transparent";let u=Ke(r.appInfo),b=me(u,a||"",s||"",i||"");d.setAttribute("srcdoc",b);let l=Ze(d,c||[],{fetchFn:r.fetchFn});l.start(),e.appendChild(d);let p={iframe:d,messageHandler:l,destroy:function(){l.stop(),d.parentNode&&d.parentNode.removeChild(d),T===p&&(T=null)}};return T=p,p}function me(e,t,n,r){return'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #ededed; background: transparent; padding: 16px; }</style>'+(n?"<style>"+n+"</style>":"")+"<script>"+e+"<\/script></head><body>"+t+(r?"<script>"+r+"<\/script>":"")+"</body></html>"}function ge(){T&&(T.destroy(),T=null)}function tt(){return T}fe.exports={createSandbox:et,destroyActiveSandbox:ge,getActiveSandbox:tt,buildSrcdoc:me}});var ye=y((Bt,xe)=>{var{createSandbox:nt,destroyActiveSandbox:ot}=he();function rt(e,t,n){return be(e),nt(e,t,n)}function be(e){if(e)for(ot();e.firstChild;)e.removeChild(e.firstChild)}xe.exports={renderGenerated:rt,clearRenderedUI:be}});var we=y((Gt,ve)=>{var L="ncodes:history";function B(){try{let e=localStorage.getItem(L);if(!e)return[];let t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function at({prompt:e,generated:t}){let n=B(),r={id:String(Date.now()),prompt:e,timestamp:Date.now()};return t&&(r.generated=t),n.unshift(r),n.length>20&&(n.length=20),localStorage.setItem(L,JSON.stringify(n)),r}function st(e){let t=B().filter(n=>n.id!==e);return localStorage.setItem(L,JSON.stringify(t)),t}function it(){localStorage.removeItem(L)}ve.exports={getHistory:B,addToHistory:at,removeFromHistory:st,clearHistory:it,STORAGE_KEY:L,MAX_ENTRIES:20}});var Te=y((Ht,qe)=>{async function dt(e,t,n={}){let{timeout:r=3e4,maxRetries:a=3,fetchFn:s}=n,i=s||globalThis.fetch,c;for(let d=0;d<=a;d++){if(d>0){let u=1e3*Math.pow(2,d-1);await Ce(u)}try{return await ct(i,e,t,r)}catch(u){if(c=u,u instanceof h&&u.status>=400&&u.status<500)throw u}}throw c}async function ct(e,t,n,r){let a=new AbortController,s=setTimeout(()=>a.abort(),r);try{let i=await e(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n),signal:a.signal});if(!i.ok){let c=await i.json().catch(()=>({})),d=ke(i.status,c);throw new h(d,i.status,c)}return i.json()}catch(i){throw i instanceof h?i:i.name==="AbortError"?new h("Request timed out. The AI is taking too long to respond.",0,null):new h("Network error. Please check your connection and try again.",0,null)}finally{clearTimeout(s)}}function ke(e,t){let n=t&&t.error;return e===401?"API key is missing or invalid. Please check your configuration.":e===400?n||"Invalid request. Please try a different prompt.":e===422?"The AI generated an invalid response. Please try again.":e===429?"Rate limit exceeded. Please wait a moment and try again.":e>=500?"Server error. The AI service may be temporarily unavailable.":n||`Unexpected error (${e}).`}var h=class extends Error{constructor(t,n,r){super(t),this.name="GenerateError",this.status=n,this.data=r}},Ee=2e3,Se=5*60*1e3;async function lt(e,t,n={}){let{interval:r=Ee,maxDuration:a=Se,onProgress:s,fetchFn:i}=n,c=i||globalThis.fetch,u=`${e.replace(/\/api\/generate\/?$/,"")}/api/jobs/${t}`,b=Date.now();for(;;){if(Date.now()-b>=a)throw new h("Generation is taking longer than expected. Please try again.",0,null);let p;try{let m=await c(u);if(!m.ok){if(m.status===404)throw new h("Job not found. It may have expired.",404,null);let f=await m.json().catch(()=>({}));throw new h(f.error||`Polling error (${m.status})`,m.status,f)}p=await m.json()}catch(m){throw m instanceof h?m:new h("Network error while checking generation status.",0,null)}if(p.status==="running"){p.step&&typeof s=="function"&&s(p.step),await Ce(r);continue}if(p.status==="completed"||p.status==="clarification")return p.result;throw p.status==="failed"?new h(p.error||"Generation failed. Please try again.",0,null):new h(`Unexpected job status: ${p.status}`,0,null)}}function Ce(e){return new Promise(t=>setTimeout(t,e))}qe.exports={callGenerateAPI:dt,pollJobStatus:lt,GenerateError:h,classifyError:ke,DEFAULT_TIMEOUT:3e4,MAX_RETRIES:3,BASE_DELAY:1e3,DEFAULT_POLL_INTERVAL:Ee,DEFAULT_MAX_POLL_DURATION:Se}});var zt=y((Ft,Ue)=>{var{mergeConfig:pt}=Z(),{getStyles:ut}=te(),{createTrigger:mt}=oe(),{createPanel:gt,openPanel:Ae,closePanel:D,showResultView:O,showPromptView:H,getResultContainer:z,updateHistoryList:ft}=de(),{renderGenerated:Ne,clearRenderedUI:P}=ye(),{getHistory:Le,addToHistory:ht,removeFromHistory:bt}=we(),{callGenerateAPI:xt,pollJobStatus:yt}=Te(),o=null;function vt(e){o&&je();let t=pt(e);if(!t.user){o={config:t,mounted:!1};return}if(typeof CSS<"u"&&CSS.registerProperty)try{CSS.registerProperty({name:"--ncodes-glow-angle",syntax:"<angle>",initialValue:"0deg",inherits:!1})}catch{}let n=document.createElement("div");n.id="ncodes-root";let r=n.attachShadow({mode:"open"}),a=document.createElement("style"),s=t.theme==="auto"?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":t.theme;a.textContent=ut(s),r.appendChild(a);let i=mt(t,()=>{Ae(c,i)}),c=gt(t);r.appendChild(i),r.appendChild(c),document.body.appendChild(n),o={config:t,host:n,shadow:r,trigger:i,panel:c,mounted:!0,isGenerating:!1},wt(),F()}function wt(){if(!o||!o.mounted)return;let{panel:e,trigger:t}=o,n=e.querySelector("[data-ncodes-panel-close]");n&&n.addEventListener("click",()=>D(e,t));let r=e.querySelector(".generate-btn");r&&r.addEventListener("click",_);let a=e.querySelector(".prompt-input");a&&a.addEventListener("keydown",c=>{c.key==="Enter"&&!c.shiftKey&&(c.preventDefault(),_())}),kt();let s=e.querySelector(".history-list");s&&s.addEventListener("click",Et);let i=e.querySelector("[data-ncodes-back]");i&&i.addEventListener("click",Pe),document.addEventListener("keydown",Ie),document.addEventListener("click",ze)}function kt(){if(!o||!o.mounted)return;o.panel.querySelectorAll(".quick-prompt").forEach(t=>{t.addEventListener("click",()=>{let n=o.panel.querySelector(".prompt-input");n&&(n.value=t.getAttribute("data-prompt"),n.focus())})})}function Ie(e){!o||!o.mounted||e.key==="Escape"&&o.panel.classList.contains("open")&&(o.panel.classList.contains("expanded")?Pe():D(o.panel,o.trigger))}function ze(e){!o||!o.mounted||o.panel.classList.contains("open")&&!o.host.contains(e.target)&&D(o.panel,o.trigger)}function Pe(){if(!o||!o.mounted)return;let e=z(o.panel);P(e),H(o.panel)}function Et(e){if(!o||!o.mounted)return;let t=e.target.closest("[data-history-delete]");if(t){e.stopPropagation();let r=t.getAttribute("data-history-delete");bt(r),F();return}let n=e.target.closest(".history-item");if(n){let r=n.getAttribute("data-history-id"),a=n.querySelector(".history-prompt-text"),s=a?a.textContent:"";St(r,s)}}function St(e,t){if(!o||!o.mounted)return;let r=Le().find(s=>s.id===e),a=z(o.panel);if(P(a),r&&r.generated)Ne(a,{html:r.generated.html,css:r.generated.css,js:r.generated.js,apiBindings:r.generated.apiBindings});else{let s=o.panel.querySelector(".generate-btn"),i=o.panel.querySelector(".prompt-input");Re("This entry can't be replayed anymore. Please regenerate.",t,s,i);return}O(o.panel,t)}async function _(){if(!o||!o.mounted||o.isGenerating)return;let e=o.panel.querySelector(".prompt-input"),t=e?e.value.trim():"";if(!t)return;o.isGenerating=!0;let n=o.panel.querySelector(".generate-btn");if(n){n.disabled=!0;let r=n.querySelector(".btn-text"),a=n.querySelector(".btn-loading");r&&(r.style.display="none"),a&&(a.style.display="flex")}await qt(t,n,e),o.isGenerating=!1}var Ct={intent:"Understanding your request...",feasibility:"Checking what this app can do...",codegen:"Writing HTML, CSS & JavaScript...",review:"Reviewing generated code...",iterate:"Fixing issues found by QA...",resolve:"Resolving API connections..."};async function qt(e,t,n){At("Generating... this usually takes 1-2 minutes");try{let{config:r}=o,{jobId:a}=await xt(r.apiUrl,{prompt:e,provider:r.provider,model:r.model}),s=await yt(r.apiUrl,a,{onProgress(c){let d=Ct[c]||"Generating...";Nt(c,d)}});if(s.clarifyingQuestion){G(),Tt(s.clarifyingQuestion,s.options,e,t,n);return}ht({prompt:e,generated:{html:s.html,css:s.css,js:s.js,apiBindings:s.apiBindings}}),F(),G();let i=z(o.panel);P(i),Ne(i,{html:s.html,css:s.css,js:s.js,apiBindings:s.apiBindings}),O(o.panel,e),I(t,n)}catch(r){G(),console.warn("[n.codes] Live generation failed:",r.message),Re(r.message,e,t,n)}}function Tt(e,t,n,r,a){if(!o||!o.mounted)return;let s=z(o.panel);P(s);let i=document.createElement("div");i.className="ncodes-clarifying-question";let c=document.createElement("div");if(c.className="ncodes-clarifying-text",c.textContent=e,i.appendChild(c),Array.isArray(t)&&t.length>0){let d=document.createElement("div");d.className="ncodes-clarifying-options",t.forEach(u=>{let b=document.createElement("button");b.className="ncodes-clarifying-option",b.textContent=u,b.addEventListener("click",()=>{let l=n+" \u2014 "+u;a&&(a.value=l),H(o.panel),I(r,a),o.isGenerating=!1,_()}),d.appendChild(b)}),i.appendChild(d)}s.appendChild(i),O(o.panel,n),I(r,a)}function I(e,t){if(e){e.disabled=!1;let r=e.querySelector(".btn-text"),a=e.querySelector(".btn-loading");r&&(r.style.display="inline"),a&&(a.style.display="none")}let n=o.panel.querySelector(".generation-status");n&&(n.style.display="none"),t&&(t.value="")}function At(e){if(!o||!o.mounted)return;let t=o.panel.querySelector(".generation-status"),n=o.panel.querySelector(".status-text"),r=o.panel.querySelector(".status-icon"),a=o.panel.querySelector(".status-step");t&&(t.style.display="block"),n&&(n.textContent=e||"Generating with AI..."),r&&r.classList.add("spinning"),a&&(a.textContent="")}function Nt(e,t){if(!o||!o.mounted)return;let n=o.panel.querySelector(".status-text"),r=o.panel.querySelector(".status-step");n&&(n.textContent=t),r&&(r.textContent=e)}function G(){if(!o||!o.mounted)return;let e=o.panel.querySelector(".generation-status");e&&(e.style.display="none")}function Re(e,t,n,r){if(!o||!o.mounted)return;let a=z(o.panel);P(a);let s=document.createElement("div");s.className="ncodes-error-state";let i=document.createElement("div");i.className="ncodes-error-icon",i.textContent="\u26A0";let c=document.createElement("div");c.className="ncodes-error-message",c.textContent=e;let d=document.createElement("div");d.className="ncodes-error-actions";let u=document.createElement("button");u.className="ncodes-error-retry",u.textContent="Try again",u.addEventListener("click",()=>{r&&(r.value=t),H(o.panel),I(n,r),o.isGenerating=!1,_()}),d.appendChild(u),s.appendChild(i),s.appendChild(c),s.appendChild(d),a.appendChild(s),O(o.panel,t),I(n,r)}function F(){if(!o||!o.mounted)return;let e=Le();ft(o.panel,e)}function Lt(){!o||!o.mounted||Ae(o.panel,o.trigger)}function It(){!o||!o.mounted||D(o.panel,o.trigger)}function je(){o&&(document.removeEventListener("keydown",Ie),document.removeEventListener("click",ze),o.host&&o.host.parentNode&&o.host.parentNode.removeChild(o.host),o=null)}Ue.exports={init:vt,open:Lt,close:It,destroy:je}});return zt();})();
if(typeof module!=="undefined")module.exports=NCodes;
//# sourceMappingURL=ncodes-widget.js.map

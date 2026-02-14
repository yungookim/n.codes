var NCodes=(()=>{var x=(e,t)=>()=>(t||e((t={exports:{}}).exports,t),t.exports);var ne=x((en,te)=>{var Z={user:null,apiUrl:"/api/generate",provider:"openai",model:"gpt-5-mini",mode:"simulation",theme:"dark",position:"bottom-center",triggerLabel:"Build with AI",panelTitle:"n.codes",panelIntro:"Describe the UI you need and it will be generated instantly.",quickPrompts:[]},W=new Set(["simulation","live"]),K=new Set(["dark","light","auto"]),Y=new Set(["bottom-center","bottom-right","bottom-left"]);function ee(e){if(!e||typeof e!="object")throw new Error("NCodes.init() requires a config object.");if(e.mode&&!W.has(e.mode))throw new Error(`Invalid mode "${e.mode}". Use: ${Array.from(W).join(", ")}`);if(e.theme&&!K.has(e.theme))throw new Error(`Invalid theme "${e.theme}". Use: ${Array.from(K).join(", ")}`);if(e.position&&!Y.has(e.position))throw new Error(`Invalid position "${e.position}". Use: ${Array.from(Y).join(", ")}`);return!0}function Je(e){return ee(e),{...Z,...e}}te.exports={DEFAULTS:Z,validateConfig:ee,mergeConfig:Je}});var ae=x((tn,oe)=>{function Qe(e){return`
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
  `}oe.exports={getStyles:Qe}});var se=x((nn,re)=>{function Xe(){let e=document.createElementNS("http://www.w3.org/2000/svg","svg");e.setAttribute("width","18"),e.setAttribute("height","18"),e.setAttribute("viewBox","0 0 24 24"),e.setAttribute("fill","none"),e.setAttribute("stroke","currentColor"),e.setAttribute("stroke-width","2.5");let t=document.createElementNS("http://www.w3.org/2000/svg","path");t.setAttribute("d","M7 4h-3v16h3"),t.setAttribute("stroke-linecap","round"),t.setAttribute("stroke-linejoin","round");let n=document.createElementNS("http://www.w3.org/2000/svg","path");return n.setAttribute("d","M17 4h3v16h-3"),n.setAttribute("stroke-linecap","round"),n.setAttribute("stroke-linejoin","round"),e.appendChild(t),e.appendChild(n),e}function We(e,t){let n=document.createElement("button");n.className=`ncodes-trigger ${e.position}`,n.title="Open n.codes",n.appendChild(Xe());let o=document.createElement("span");return o.textContent=e.triggerLabel,n.appendChild(o),n.addEventListener("click",t),n}function Ke(e){e.classList.remove("hidden")}function Ye(e){e.classList.add("hidden")}re.exports={createTrigger:We,showTrigger:Ke,hideTrigger:Ye}});var pe=x((on,le)=>{function Ze(e){let t=document.createElement("div");t.className=`ncodes-panel ${e.position}`;let n=document.createElement("div");n.className="panel-header";let o=document.createElement("div");o.className="panel-title";let r=document.createElement("span");r.className="panel-logo",r.textContent="n";let s=document.createElement("span");s.textContent=e.panelTitle,o.appendChild(r),o.appendChild(s);let i=document.createElement("button");i.className="panel-close",i.setAttribute("data-ncodes-panel-close",""),i.textContent="\xD7",n.appendChild(o),n.appendChild(i);let c=document.createElement("div");c.className="panel-body";let d=document.createElement("div");d.className="prompt-view";let u=document.createElement("div");u.className="panel-intro";let h=document.createElement("p");h.textContent=e.panelIntro,u.appendChild(h);let l=document.createElement("div");l.className="history-section",l.style.display="none";let p=document.createElement("div");p.className="history-label",p.textContent="Recent features";let m=document.createElement("div");m.className="history-list",l.appendChild(p),l.appendChild(m);let b=document.createElement("div");b.className="prompt-section";let S=document.createElement("textarea");S.className="prompt-input",S.placeholder="e.g., Show me overdue invoices with a remind button...",S.rows=3;let g=document.createElement("button");g.className="generate-btn";let y=document.createElement("span");y.className="btn-text",y.textContent="Generate";let w=document.createElement("span");w.className="btn-loading",w.style.display="none";for(let T=0;T<3;T++){let I=document.createElement("span");I.className="loading-dot",w.appendChild(I)}if(g.appendChild(y),g.appendChild(w),b.appendChild(S),b.appendChild(g),d.appendChild(u),d.appendChild(l),d.appendChild(b),e.quickPrompts.length>0){let T=document.createElement("div");T.className="quick-prompts";let I=document.createElement("div");I.className="quick-prompts-label",I.textContent="Try these examples:",T.appendChild(I),e.quickPrompts.forEach(X=>{let D=document.createElement("button");D.className="quick-prompt",D.setAttribute("data-prompt",X.prompt),D.textContent=X.label,T.appendChild(D)}),d.appendChild(T)}let f=document.createElement("div");f.className="generation-status",f.style.display="none";let L=document.createElement("div");L.className="status-line";let k=document.createElement("span");k.className="status-icon spinning",k.textContent="\u2699";let E=document.createElement("span");E.className="status-text",E.textContent="Analyzing request...",L.appendChild(k),L.appendChild(E),f.appendChild(L);let M=document.createElement("div");M.className="status-step",f.appendChild(M),d.appendChild(f);let C=document.createElement("div");C.className="result-view";let j=document.createElement("div");j.className="result-header";let U=document.createElement("button");U.className="result-back-btn",U.setAttribute("data-ncodes-back",""),U.textContent="\u2190 Back";let J=document.createElement("span");J.className="result-prompt-label",j.appendChild(U),j.appendChild(J);let Q=document.createElement("div");return Q.className="result-content",C.appendChild(j),C.appendChild(Q),c.appendChild(d),c.appendChild(C),t.appendChild(n),t.appendChild(c),t}function et(e,t){e.classList.add("open"),t&&t.classList.add("hidden");let n=e.querySelector(".prompt-input");n&&n.focus()}function tt(e,t){e.classList.remove("open"),t&&t.classList.remove("hidden"),ce(e),ie(e)}function ie(e){let t=e.querySelector(".generation-status"),n=e.querySelector(".generate-btn");if(t&&(t.style.display="none"),n){n.disabled=!1;let o=n.querySelector(".btn-text"),r=n.querySelector(".btn-loading");o&&(o.style.display="inline"),r&&(r.style.display="none")}}function de(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function nt(e,t){e.classList.add("expanded");let n=e.querySelector(".result-prompt-label");n&&(n.textContent=t||"")}function ce(e){e.classList.remove("expanded");let t=e.querySelector(".result-content");t&&de(t)}function ot(e){return e.querySelector(".result-content")}function at(e,t){let n=e.querySelector(".history-section"),o=e.querySelector(".history-list");if(!(!n||!o)){if(de(o),t.length===0){n.style.display="none";return}n.style.display="block",t.forEach(r=>{let s=document.createElement("div");s.className="history-item",s.setAttribute("data-history-id",r.id),s.setAttribute("data-template-id",r.templateId);let i=document.createElement("span");i.className="history-prompt-text",i.textContent=r.prompt;let c=document.createElement("span");c.className="history-badge",c.textContent=r.templateId;let d=document.createElement("button");d.className="history-delete",d.setAttribute("data-history-delete",r.id),d.textContent="\xD7",s.appendChild(i),s.appendChild(c),s.appendChild(d),o.appendChild(s)})}}function rt(e,t){let n=e.querySelector(".prompt-view");if(!n)return;let o=n.querySelector(".quick-prompts");if(o&&o.remove(),!t||t.length===0)return;let r=document.createElement("div");r.className="quick-prompts";let s=document.createElement("div");s.className="quick-prompts-label",s.textContent="Try these examples:",r.appendChild(s),t.forEach(c=>{let d=document.createElement("button");d.className="quick-prompt",d.setAttribute("data-prompt",c.prompt),d.textContent=c.label,r.appendChild(d)});let i=n.querySelector(".generation-status");i?n.insertBefore(r,i):n.appendChild(r)}le.exports={createPanel:Ze,openPanel:et,closePanel:tt,resetPanelState:ie,showResultView:nt,showPromptView:ce,getResultContainer:ot,updateHistoryList:at,updateQuickPrompts:rt}});var ge=x((an,he)=>{var me={invoice:"invoices",overdue:"invoices",reminder:"invoices",health:"dashboard",dashboard:"dashboard",engagement:"dashboard",churn:"dashboard",archive:"archive",inactive:"archive",bulk:"archive",user:"archive"},st=["Analyzing request...","Mapping to capabilities...","Selecting components...","Generating UI...","Applying styles...","Done!"];function it(e){let t=e.toLowerCase();for(let[n,o]of Object.entries(me))if(t.includes(n))return o;return"invoices"}function dt(e){return e==="invoices"?ue():e==="dashboard"?ct():e==="archive"?lt():ue()}function ue(){return`
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
  `}function ct(){return`
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
  `}function lt(){return`
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
  `}he.exports={PROMPT_TEMPLATES:me,STATUS_MESSAGES:st,findTemplate:it,getTemplateHTML:dt}});var ve=x((rn,be)=>{"use strict";function pt(e){return`
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
`}be.exports={getBridgeScript:pt}});var xe=x((sn,fe)=>{"use strict";function ut(e,t,n){let r=(n||{}).fetchFn||globalThis.fetch,s={};if(Array.isArray(t))for(let l of t)s[l.ref]={type:l.type,method:l.resolved.method,path:l.resolved.path};function i(l){if(!l.data||l.data.type!=="ncodes:api-request"){l.data&&l.data.type==="ncodes:sandbox-error"&&console.error("[n.codes:sandbox] Error in generated code:",l.data.message,"line:",l.data.lineno);return}if(e.contentWindow&&l.source!==e.contentWindow)return;let{id:p,method:m,ref:b,params:S,data:g}=l.data;!p||!b||(console.log("[n.codes:handler] request received",{id:p,method:m,ref:b}),c(p,m,b,S,g))}async function c(l,p,m,b,S){try{let g=s[m];if(!g){console.warn("[n.codes:handler] unknown ref",m,"available:",Object.keys(s)),d(l,null,"Unknown API reference: "+m);return}if(console.log("[n.codes:handler] ref resolved",{ref:m,path:g.path,method:g.method}),p==="query"&&g.type!=="query"){d(l,null,'Reference "'+m+'" is not a query');return}if(p==="action"&&g.type!=="action"){d(l,null,'Reference "'+m+'" is not an action');return}let y={credentials:"include"},w=g.path;if(g.method==="GET"){if(b&&Object.keys(b).length>0){let k=new URLSearchParams;for(let[M,C]of Object.entries(b))C!=null&&k.append(M,String(C));let E=w.includes("?")?"&":"?";w=w+E+k.toString()}y.method="GET"}else y.method=g.method,y.headers={"Content-Type":"application/json"},y.body=JSON.stringify(S||b||{});let f=await r(w,y);if(console.log("[n.codes:handler] fetch complete",{id:l,ref:m,status:f.status,ok:f.ok}),!f.ok){let k=await f.json().catch(function(){return{}}),E=k&&k.error||"Request failed ("+f.status+")";d(l,null,E);return}let L=await f.json();d(l,L,null)}catch(g){d(l,null,g.message||"Network error")}}function d(l,p,m){console.log("[n.codes:handler] response sent",{id:l,hasData:!!p,error:m||null}),e.contentWindow&&e.contentWindow.postMessage({type:"ncodes:api-response",id:l,data:p,error:m},"*")}function u(){window.addEventListener("message",i)}function h(){window.removeEventListener("message",i)}return{start:u,stop:h,handler:i}}fe.exports={createMessageHandler:ut}});var Se=x((dn,ke)=>{"use strict";var{getBridgeScript:mt}=ve(),{createMessageHandler:ht}=xe(),A=null;function gt(e,t,n){we();let o=n||{},{html:r,css:s,js:i,apiBindings:c}=t,d=document.createElement("iframe");d.setAttribute("sandbox","allow-scripts"),d.style.width="100%",d.style.height="100%",d.style.border="none",d.style.display="block",d.style.backgroundColor="transparent";let u=mt(o.appInfo),h=ye(u,r||"",s||"",i||"");d.setAttribute("srcdoc",h);let l=ht(d,c||[],{fetchFn:o.fetchFn});l.start(),e.appendChild(d);let p={iframe:d,messageHandler:l,destroy:function(){l.stop(),d.parentNode&&d.parentNode.removeChild(d),A===p&&(A=null)}};return A=p,p}function ye(e,t,n,o){return'<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #ededed; background: transparent; padding: 16px; }</style>'+(n?"<style>"+n+"</style>":"")+"<script>"+e+"<\/script></head><body>"+t+(o?"<script>"+o+"<\/script>":"")+"</body></html>"}function we(){A&&(A.destroy(),A=null)}function bt(){return A}ke.exports={createSandbox:gt,destroyActiveSandbox:we,getActiveSandbox:bt,buildSrcdoc:ye}});var Te=x((cn,Ce)=>{var{createSandbox:vt,destroyActiveSandbox:ft}=Se();function xt(e,t,n){return H(e),vt(e,t,n)}function yt(e,t){H(e);let r=new DOMParser().parseFromString(t,"text/html").body.childNodes;for(;r.length>0;)e.appendChild(r[0]);return Ee(e),e}function H(e){if(e)for(ft();e.firstChild;)e.removeChild(e.firstChild)}function Ee(e){let t=e.querySelectorAll(".action-btn.remind");t.forEach(s=>{s.addEventListener("click",function(){let i=this.textContent;this.textContent="Sent!",this.style.background="var(--ncodes-accent)",this.style.color="#000",this.disabled=!0,setTimeout(()=>{this.textContent=i,this.style.background="",this.style.color="",this.disabled=!1},2e3)})});let n=e.querySelector(".action-btn.primary");n&&n.textContent.includes("Send All")&&n.addEventListener("click",function(){let s=this.textContent;this.textContent="All reminders sent!",this.disabled=!0,t.forEach(i=>{i.textContent="Sent!",i.style.background="var(--ncodes-accent)",i.style.color="#000",i.disabled=!0}),setTimeout(()=>{this.textContent=s,this.disabled=!1,t.forEach(i=>{i.textContent="Send Reminder",i.style.background="",i.style.color="",i.disabled=!1})},2e3)});let o=e.querySelector(".action-btn.danger");o&&o.addEventListener("click",function(){this.textContent="Archived!",this.style.background="var(--ncodes-accent)",this.disabled=!0});let r=e.querySelector("[data-ncodes-select-all]");r&&r.addEventListener("change",function(){let s=e.querySelectorAll(".row-checkbox"),i=e.querySelector(".selection-count");s.forEach(c=>{c.checked=this.checked}),i&&(i.textContent=this.checked?"234 selected":"0 selected")})}Ce.exports={renderGenerated:xt,renderGeneratedUI:yt,clearRenderedUI:H,setupActionHandlers:Ee}});var qe=x((ln,Ae)=>{var P="ncodes:history";function F(){try{let e=localStorage.getItem(P);if(!e)return[];let t=JSON.parse(e);return Array.isArray(t)?t:[]}catch{return[]}}function wt({prompt:e,templateId:t,generated:n}){let o=F(),r={id:String(Date.now()),prompt:e,templateId:t||null,timestamp:Date.now()};return n&&(r.generated=n),o.unshift(r),o.length>20&&(o.length=20),localStorage.setItem(P,JSON.stringify(o)),r}function kt(e){let t=F().filter(n=>n.id!==e);return localStorage.setItem(P,JSON.stringify(t)),t}function St(){localStorage.removeItem(P)}Ae.exports={getHistory:F,addToHistory:wt,removeFromHistory:kt,clearHistory:St,STORAGE_KEY:P,MAX_ENTRIES:20}});var ze=x((pn,Pe)=>{async function Et(e,t,n={}){let{timeout:o=3e4,maxRetries:r=3,fetchFn:s}=n,i=s||globalThis.fetch,c;for(let d=0;d<=r;d++){if(d>0){let u=1e3*Math.pow(2,d-1);await Re(u)}try{return await Ct(i,e,t,o)}catch(u){if(c=u,u instanceof v&&u.status>=400&&u.status<500)throw u}}throw c}async function Ct(e,t,n,o){let r=new AbortController,s=setTimeout(()=>r.abort(),o);try{let i=await e(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n),signal:r.signal});if(!i.ok){let c=await i.json().catch(()=>({})),d=Le(i.status,c);throw new v(d,i.status,c)}return i.json()}catch(i){throw i instanceof v?i:i.name==="AbortError"?new v("Request timed out. The AI is taking too long to respond.",0,null):new v("Network error. Please check your connection and try again.",0,null)}finally{clearTimeout(s)}}function Le(e,t){let n=t&&t.error;return e===401?"API key is missing or invalid. Please check your configuration.":e===400?n||"Invalid request. Please try a different prompt.":e===422?"The AI generated an invalid response. Please try again.":e===429?"Rate limit exceeded. Please wait a moment and try again.":e>=500?"Server error. The AI service may be temporarily unavailable.":n||`Unexpected error (${e}).`}var v=class extends Error{constructor(t,n,o){super(t),this.name="GenerateError",this.status=n,this.data=o}},Ie=2e3,Ne=5*60*1e3;async function Tt(e,t,n={}){let{interval:o=Ie,maxDuration:r=Ne,onProgress:s,fetchFn:i}=n,c=i||globalThis.fetch,u=`${e.replace(/\/api\/generate\/?$/,"")}/api/jobs/${t}`,h=Date.now();for(;;){if(Date.now()-h>=r)throw new v("Generation is taking longer than expected. Please try again.",0,null);let p;try{let m=await c(u);if(!m.ok){if(m.status===404)throw new v("Job not found. It may have expired.",404,null);let b=await m.json().catch(()=>({}));throw new v(b.error||`Polling error (${m.status})`,m.status,b)}p=await m.json()}catch(m){throw m instanceof v?m:new v("Network error while checking generation status.",0,null)}if(p.status==="running"){p.step&&typeof s=="function"&&s(p.step),await Re(o);continue}if(p.status==="completed"||p.status==="clarification")return p.result;throw p.status==="failed"?new v(p.error||"Generation failed. Please try again.",0,null):new v(`Unexpected job status: ${p.status}`,0,null)}}function Re(e){return new Promise(t=>setTimeout(t,e))}Pe.exports={callGenerateAPI:Et,pollJobStatus:Tt,GenerateError:v,classifyError:Le,DEFAULT_TIMEOUT:3e4,MAX_RETRIES:3,BASE_DELAY:1e3,DEFAULT_POLL_INTERVAL:Ie,DEFAULT_MAX_POLL_DURATION:Ne}});var Yt=x((mn,Ve)=>{var{mergeConfig:At}=ne(),{getStyles:qt}=ae(),{createTrigger:Lt}=se(),{createPanel:It,openPanel:Me,closePanel:G,showResultView:z,showPromptView:O,getResultContainer:N,updateHistoryList:Nt}=pe(),{findTemplate:Rt,getTemplateHTML:je,STATUS_MESSAGES:$}=ge(),{renderGenerated:Ue,renderGeneratedUI:De,clearRenderedUI:R}=Te(),{getHistory:Oe,addToHistory:_e,removeFromHistory:Pt}=qe(),{callGenerateAPI:zt,pollJobStatus:Mt,GenerateError:un}=ze(),a=null;function jt(e){a&&$e();let t=At(e);if(!t.user){a={config:t,mounted:!1};return}if(typeof CSS<"u"&&CSS.registerProperty)try{CSS.registerProperty({name:"--ncodes-glow-angle",syntax:"<angle>",initialValue:"0deg",inherits:!1})}catch{}let n=document.createElement("div");n.id="ncodes-root";let o=n.attachShadow({mode:"open"}),r=document.createElement("style"),s=t.theme==="auto"?window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light":t.theme;r.textContent=qt(s),o.appendChild(r);let i=Lt(t,()=>{Me(c,i)}),c=It(t);o.appendChild(i),o.appendChild(c),document.body.appendChild(n),a={config:t,host:n,shadow:o,trigger:i,panel:c,mounted:!0,isGenerating:!1},Ut(),B()}function Ut(){if(!a||!a.mounted)return;let{panel:e,trigger:t}=a,n=e.querySelector("[data-ncodes-panel-close]");n&&n.addEventListener("click",()=>G(e,t));let o=e.querySelector(".generate-btn");o&&o.addEventListener("click",_);let r=e.querySelector(".prompt-input");r&&r.addEventListener("keydown",c=>{c.key==="Enter"&&!c.shiftKey&&(c.preventDefault(),_())}),Dt();let s=e.querySelector(".history-list");s&&s.addEventListener("click",_t);let i=e.querySelector("[data-ncodes-back]");i&&i.addEventListener("click",He),document.addEventListener("keydown",Ge),document.addEventListener("click",Be)}function Dt(){if(!a||!a.mounted)return;a.panel.querySelectorAll(".quick-prompt").forEach(t=>{t.addEventListener("click",()=>{let n=a.panel.querySelector(".prompt-input");n&&(n.value=t.getAttribute("data-prompt"),n.focus())})})}function Ot(e){return Rt(e)}function Ge(e){!a||!a.mounted||e.key==="Escape"&&a.panel.classList.contains("open")&&(a.panel.classList.contains("expanded")?He():G(a.panel,a.trigger))}function Be(e){!a||!a.mounted||a.panel.classList.contains("open")&&!a.host.contains(e.target)&&G(a.panel,a.trigger)}function He(){if(!a||!a.mounted)return;let e=N(a.panel);R(e),O(a.panel)}function _t(e){if(!a||!a.mounted)return;let t=e.target.closest("[data-history-delete]");if(t){e.stopPropagation();let o=t.getAttribute("data-history-delete");Pt(o),B();return}let n=e.target.closest(".history-item");if(n){let o=n.getAttribute("data-history-id"),r=n.querySelector(".history-prompt-text"),s=r?r.textContent:"";Gt(o,s)}}function Gt(e,t){if(!a||!a.mounted)return;let o=Oe().find(s=>s.id===e),r=N(a.panel);if(R(r),o&&o.generated)Ue(r,{html:o.generated.html,css:o.generated.css,js:o.generated.js,apiBindings:o.generated.apiBindings});else{let s=o?o.templateId:"invoices",i=je(s);De(r,i)}z(a.panel,t)}async function _(){if(!a||!a.mounted||a.isGenerating)return;let e=a.panel.querySelector(".prompt-input"),t=e?e.value.trim():"";if(!t)return;a.isGenerating=!0;let n=a.panel.querySelector(".generate-btn");if(n){n.disabled=!0;let s=n.querySelector(".btn-text"),i=n.querySelector(".btn-loading");s&&(s.style.display="none"),i&&(i.style.display="flex")}let{config:o}=a;o.mode==="live"?await Ht(t,n,e):await Fe(t,n,e),a.isGenerating=!1}var Bt={intent:"Understanding your request...",codegen:"Writing HTML, CSS & JavaScript...",review:"Reviewing generated code...",iterate:"Fixing issues found by QA...",resolve:"Resolving API connections..."};async function Ht(e,t,n){$t("Generating... this usually takes 1-2 minutes");try{let{config:o}=a,{jobId:r}=await zt(o.apiUrl,{prompt:e,provider:o.provider,model:o.model}),s=await Mt(o.apiUrl,r,{onProgress(c){let d=Bt[c]||"Generating...";Vt(c,d)}});if(s.clarifyingQuestion){V(),Ft(s.clarifyingQuestion,s.options,e,t,n);return}_e({prompt:e,generated:{html:s.html,css:s.css,js:s.js,apiBindings:s.apiBindings}}),B(),V();let i=N(a.panel);R(i),Ue(i,{html:s.html,css:s.css,js:s.js,apiBindings:s.apiBindings}),z(a.panel,e),q(t,n)}catch(o){V(),console.warn("[n.codes] Live generation failed:",o.message),Jt(o.message,e,t,n)}}function Ft(e,t,n,o,r){if(!a||!a.mounted)return;let s=N(a.panel);R(s);let i=document.createElement("div");i.className="ncodes-clarifying-question";let c=document.createElement("div");if(c.className="ncodes-clarifying-text",c.textContent=e,i.appendChild(c),Array.isArray(t)&&t.length>0){let d=document.createElement("div");d.className="ncodes-clarifying-options",t.forEach(u=>{let h=document.createElement("button");h.className="ncodes-clarifying-option",h.textContent=u,h.addEventListener("click",()=>{let l=n+" \u2014 "+u;r&&(r.value=l),O(a.panel),q(o,r),a.isGenerating=!1,_()}),d.appendChild(h)}),i.appendChild(d)}s.appendChild(i),z(a.panel,n),q(o,r)}async function Fe(e,t,n){await Qt();let o=Ot(e),r=je(o);_e({prompt:e,templateId:o}),B();let s=N(a.panel);R(s),De(s,r),z(a.panel,e),q(t,n)}function q(e,t){if(e){e.disabled=!1;let o=e.querySelector(".btn-text"),r=e.querySelector(".btn-loading");o&&(o.style.display="inline"),r&&(r.style.display="none")}let n=a.panel.querySelector(".generation-status");n&&(n.style.display="none"),t&&(t.value="")}function $t(e){if(!a||!a.mounted)return;let t=a.panel.querySelector(".generation-status"),n=a.panel.querySelector(".status-text"),o=a.panel.querySelector(".status-icon"),r=a.panel.querySelector(".status-step");t&&(t.style.display="block"),n&&(n.textContent=e||"Generating with AI..."),o&&o.classList.add("spinning"),r&&(r.textContent="")}function Vt(e,t){if(!a||!a.mounted)return;let n=a.panel.querySelector(".status-text"),o=a.panel.querySelector(".status-step");n&&(n.textContent=t),o&&(o.textContent=e)}function V(){if(!a||!a.mounted)return;let e=a.panel.querySelector(".generation-status");e&&(e.style.display="none")}function Jt(e,t,n,o){if(!a||!a.mounted)return;let r=N(a.panel);R(r);let s=document.createElement("div");s.className="ncodes-error-state";let i=document.createElement("div");i.className="ncodes-error-icon",i.textContent="\u26A0";let c=document.createElement("div");c.className="ncodes-error-message",c.textContent=e;let d=document.createElement("div");d.className="ncodes-error-actions";let u=document.createElement("button");u.className="ncodes-error-retry",u.textContent="Try again",u.addEventListener("click",()=>{o&&(o.value=t),O(a.panel),q(n,o),a.isGenerating=!1,_()});let h=document.createElement("button");h.className="ncodes-error-fallback",h.textContent="Use demo mode",h.addEventListener("click",async()=>{O(a.panel),q(n,o),a.isGenerating=!1,o&&(o.value=t),a.isGenerating=!0,await Fe(t,n,o),a.isGenerating=!1}),d.appendChild(u),d.appendChild(h),s.appendChild(i),s.appendChild(c),s.appendChild(d),r.appendChild(s),z(a.panel,t),q(n,o)}async function Qt(){if(!a||!a.mounted)return;let e=a.panel.querySelector(".generation-status"),t=a.panel.querySelector(".status-text");if(!(!e||!t)){e.style.display="block";for(let n=0;n<$.length;n++){t.textContent=$[n];let o=n===$.length-1?300:400+Math.random()*300;await Kt(o)}}}function B(){if(!a||!a.mounted)return;let e=Oe();Nt(a.panel,e)}function Xt(){!a||!a.mounted||Me(a.panel,a.trigger)}function Wt(){!a||!a.mounted||G(a.panel,a.trigger)}function $e(){a&&(document.removeEventListener("keydown",Ge),document.removeEventListener("click",Be),a.host&&a.host.parentNode&&a.host.parentNode.removeChild(a.host),a=null)}function Kt(e){return new Promise(t=>setTimeout(t,e))}Ve.exports={init:jt,open:Xt,close:Wt,destroy:$e}});return Yt();})();
if(typeof module!=="undefined")module.exports=NCodes;
//# sourceMappingURL=ncodes-widget.js.map

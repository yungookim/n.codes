/**
 * Simulation mode: keyword → template matching engine.
 * Ported from public/demo/app.js promptTemplates and template HTML.
 */

const PROMPT_TEMPLATES = {
  invoice: 'invoices',
  overdue: 'invoices',
  reminder: 'invoices',
  health: 'dashboard',
  dashboard: 'dashboard',
  engagement: 'dashboard',
  churn: 'dashboard',
  archive: 'archive',
  inactive: 'archive',
  bulk: 'archive',
  user: 'archive',
};

const STATUS_MESSAGES = [
  'Analyzing request...',
  'Mapping to capabilities...',
  'Selecting components...',
  'Generating UI...',
  'Applying styles...',
  'Done!',
];

function findTemplate(prompt) {
  const lower = prompt.toLowerCase();
  for (const [keyword, templateId] of Object.entries(PROMPT_TEMPLATES)) {
    if (lower.includes(keyword)) {
      return templateId;
    }
  }
  return 'invoices';
}

function getTemplateHTML(templateId) {
  if (templateId === 'invoices') return getInvoicesHTML();
  if (templateId === 'dashboard') return getDashboardHTML();
  if (templateId === 'archive') return getArchiveHTML();
  return getInvoicesHTML();
}

function getInvoicesHTML() {
  return `
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
  `;
}

function getDashboardHTML() {
  return `
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
  `;
}

function getArchiveHTML() {
  return `
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
  `;
}

module.exports = {
  PROMPT_TEMPLATES,
  STATUS_MESSAGES,
  findTemplate,
  getTemplateHTML,
};

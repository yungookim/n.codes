// Shared job store and template matching for the mock generation backend

export const jobs = new Map<string, any>();

const baseCss = `
  .ncodes-view {
    font-family: system-ui, -apple-system, sans-serif;
    background: #0a0a0f; color: #e2e8f0;
    padding: 20px; border-radius: 8px; min-height: 200px;
  }
  .ncodes-view h2 { color: #4ade80; margin: 0 0 16px; font-size: 18px; font-weight: 600; }
  .ncodes-view table { width: 100%; border-collapse: collapse; }
  .ncodes-view th {
    text-align: left; padding: 8px 12px; border-bottom: 1px solid #1e293b;
    color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  .ncodes-view td { padding: 8px 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }
  .ncodes-view .badge {
    display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: 500;
  }
  .ncodes-view .badge-paid { background: #065f46; color: #6ee7b7; }
  .ncodes-view .badge-pending { background: #78350f; color: #fcd34d; }
  .ncodes-view .badge-overdue { background: #7f1d1d; color: #fca5a5; }
  .ncodes-view .stat-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px; margin-bottom: 16px;
  }
  .ncodes-view .stat-card { background: #111118; border-radius: 8px; padding: 16px; }
  .ncodes-view .stat-card .label { color: #64748b; font-size: 12px; }
  .ncodes-view .stat-card .num { font-size: 24px; font-weight: 700; color: #4ade80; }
  .ncodes-view form label {
    display: block; color: #94a3b8; font-size: 13px; margin-bottom: 4px;
  }
  .ncodes-view form input,
  .ncodes-view form select,
  .ncodes-view form textarea {
    width: 100%; padding: 8px 12px;
    background: #111118; border: 1px solid #2d2d3a;
    border-radius: 6px; color: #e2e8f0; font-size: 14px;
    margin-bottom: 12px; box-sizing: border-box;
  }
  .ncodes-view form button {
    background: #4ade80; color: #0a0a0f; border: none;
    padding: 8px 20px; border-radius: 6px;
    font-weight: 600; cursor: pointer; font-size: 14px;
  }
  .ncodes-view .loading { color: #64748b; font-style: italic; }
`;

interface Template {
  keywords: string[];
  build: () => any;
}

const templates: Record<string, Template> = {
  invoiceList: {
    keywords: ["invoice", "invoices", "list", "all", "billing"],
    build: () => ({
      html:
        '<div class="ncodes-view">' +
        "<h2>Invoices</h2>" +
        '<div class="loading">Loading invoices...</div>' +
        '<table style="display:none">' +
        "<thead><tr><th>Invoice #</th><th>Customer</th><th>Amount</th><th>Status</th><th>Due Date</th></tr></thead>" +
        '<tbody id="invoice-rows"></tbody>' +
        "</table></div>",
      css: baseCss,
      js: [
        "(async function() {",
        '  var invoices = await ncodes.query("listInvoices");',
        '  var tbody = document.getElementById("invoice-rows");',
        '  var table = tbody.closest("table");',
        '  document.querySelector(".loading").style.display = "none";',
        '  table.style.display = "table";',
        "  invoices.forEach(function(inv) {",
        '    var row = document.createElement("tr");',
        '    var tdNum = document.createElement("td");',
        "    tdNum.textContent = inv.invoiceNumber;",
        '    var tdCust = document.createElement("td");',
        "    tdCust.textContent = inv.customerName;",
        '    var tdAmt = document.createElement("td");',
        '    tdAmt.textContent = "$" + inv.amount.toLocaleString();',
        '    var tdStatus = document.createElement("td");',
        '    var badge = document.createElement("span");',
        '    badge.className = "badge badge-" + inv.status;',
        "    badge.textContent = inv.status;",
        "    tdStatus.appendChild(badge);",
        '    var tdDue = document.createElement("td");',
        "    tdDue.textContent = inv.dueDate;",
        "    row.appendChild(tdNum);",
        "    row.appendChild(tdCust);",
        "    row.appendChild(tdAmt);",
        "    row.appendChild(tdStatus);",
        "    row.appendChild(tdDue);",
        "    tbody.appendChild(row);",
        "  });",
        "})();",
      ].join("\n"),
      apiBindings: [
        { type: "query", ref: "listInvoices", resolved: { method: "GET", path: "/api/invoices" } },
      ],
    }),
  },

  customerOverview: {
    keywords: ["customer", "customers", "client", "clients"],
    build: () => ({
      html:
        '<div class="ncodes-view">' +
        "<h2>Customers</h2>" +
        '<div class="loading">Loading customers...</div>' +
        '<div id="customer-content" style="display:none">' +
        '<div class="stat-grid" id="customer-stats"></div>' +
        "<table><thead><tr><th>Name</th><th>Company</th><th>Invoices</th><th>Total Spent</th></tr></thead>" +
        '<tbody id="customer-rows"></tbody></table></div></div>',
      css: baseCss,
      js: [
        "(async function() {",
        '  var customers = await ncodes.query("listCustomers");',
        '  document.querySelector(".loading").style.display = "none";',
        '  document.getElementById("customer-content").style.display = "block";',
        '  var statsEl = document.getElementById("customer-stats");',
        "  var totalSpent = customers.reduce(function(s, c) { return s + c.totalSpent; }, 0);",
        '  [{l:"Total Customers",v:customers.length},{l:"Total Revenue",v:"$"+totalSpent.toLocaleString()}].forEach(function(s) {',
        '    var card = document.createElement("div");',
        '    card.className = "stat-card";',
        '    var label = document.createElement("div");',
        '    label.className = "label";',
        "    label.textContent = s.l;",
        '    var num = document.createElement("div");',
        '    num.className = "num";',
        "    num.textContent = s.v;",
        "    card.appendChild(label);",
        "    card.appendChild(num);",
        "    statsEl.appendChild(card);",
        "  });",
        '  var tbody = document.getElementById("customer-rows");',
        "  customers.forEach(function(c) {",
        '    var row = document.createElement("tr");',
        '    var tdName = document.createElement("td");',
        "    tdName.textContent = c.name;",
        '    var tdCompany = document.createElement("td");',
        "    tdCompany.textContent = c.company;",
        '    var tdInv = document.createElement("td");',
        "    tdInv.textContent = c.totalInvoices;",
        '    var tdSpent = document.createElement("td");',
        '    tdSpent.textContent = "$" + c.totalSpent.toLocaleString();',
        "    row.appendChild(tdName);",
        "    row.appendChild(tdCompany);",
        "    row.appendChild(tdInv);",
        "    row.appendChild(tdSpent);",
        "    tbody.appendChild(row);",
        "  });",
        "})();",
      ].join("\n"),
      apiBindings: [
        { type: "query", ref: "listCustomers", resolved: { method: "GET", path: "/api/customers" } },
      ],
    }),
  },

  createInvoice: {
    keywords: ["create", "new", "add", "form"],
    build: () => ({
      html:
        '<div class="ncodes-view">' +
        "<h2>Create Invoice</h2>" +
        '<div class="loading">Loading customers...</div>' +
        '<form id="create-invoice-form" style="display:none">' +
        "<label>Customer</label>" +
        '<select id="inv-customer"><option value="">Select customer</option></select>' +
        "<label>Amount</label>" +
        '<input type="number" id="inv-amount" placeholder="0.00" step="0.01" required />' +
        "<label>Due Date</label>" +
        '<input type="date" id="inv-due" required />' +
        "<label>Description</label>" +
        '<textarea id="inv-desc" rows="3" placeholder="Invoice description"></textarea>' +
        "<button type=\"submit\">Create Invoice</button>" +
        "</form>" +
        '<div id="form-result" style="display:none;margin-top:12px"></div></div>',
      css: baseCss,
      js: [
        "(async function() {",
        '  var customers = await ncodes.query("listCustomers");',
        '  var select = document.getElementById("inv-customer");',
        '  var form = document.getElementById("create-invoice-form");',
        '  document.querySelector(".loading").style.display = "none";',
        '  form.style.display = "block";',
        "  customers.forEach(function(c) {",
        '    var opt = document.createElement("option");',
        '    opt.value = c.id + "|" + c.name;',
        '    opt.textContent = c.name + " (" + c.company + ")";',
        "    select.appendChild(opt);",
        "  });",
        '  form.addEventListener("submit", async function(e) {',
        "    e.preventDefault();",
        '    var parts = document.getElementById("inv-customer").value.split("|");',
        '    var result = await ncodes.action("createInvoice", {',
        "      customerId: parts[0],",
        "      customerName: parts[1],",
        '      amount: document.getElementById("inv-amount").value,',
        '      dueDate: document.getElementById("inv-due").value,',
        '      description: document.getElementById("inv-desc").value',
        "    });",
        '    var el = document.getElementById("form-result");',
        '    el.style.display = "block";',
        '    el.textContent = "Invoice created: " + result.invoiceNumber;',
        '    el.style.color = "#4ade80";',
        "  });",
        "})();",
      ].join("\n"),
      apiBindings: [
        { type: "query", ref: "listCustomers", resolved: { method: "GET", path: "/api/customers" } },
        { type: "action", ref: "createInvoice", resolved: { method: "POST", path: "/api/invoices" } },
      ],
    }),
  },
};

export function matchTemplate(prompt: string): string {
  const lower = prompt.toLowerCase();
  let best: string | null = null;
  let bestScore = 0;

  for (const [name, tpl] of Object.entries(templates)) {
    const score = tpl.keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }

  return best || "invoiceList";
}

export function buildResult(templateName: string) {
  const tpl = templates[templateName];
  const result = tpl.build();
  return {
    ...result,
    reasoning: "Matched \"" + templateName + "\" template based on prompt keywords.",
    iterations: 1,
    tokensUsed: { prompt: 0, completion: 0 },
  };
}

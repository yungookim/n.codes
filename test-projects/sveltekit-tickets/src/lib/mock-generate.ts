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
  .ncodes-view .badge-open { background: #78350f; color: #fcd34d; }
  .ncodes-view .badge-in-progress { background: #1e3a5f; color: #7dd3fc; }
  .ncodes-view .badge-resolved { background: #065f46; color: #6ee7b7; }
  .ncodes-view .badge-high { background: #7f1d1d; color: #fca5a5; }
  .ncodes-view .badge-medium { background: #78350f; color: #fcd34d; }
  .ncodes-view .badge-low { background: #1e3a5f; color: #7dd3fc; }
  .ncodes-view .detail-header {
    border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px;
  }
  .ncodes-view .detail-header .title { font-size: 16px; font-weight: 600; }
  .ncodes-view .detail-header .meta { color: #64748b; font-size: 13px; margin-top: 4px; }
  .ncodes-view .comment {
    background: #111118; border-radius: 6px; padding: 12px; margin-bottom: 8px;
  }
  .ncodes-view .comment .author { color: #4ade80; font-weight: 500; font-size: 13px; }
  .ncodes-view .comment .text { font-size: 14px; margin-top: 4px; }
  .ncodes-view .comment .time { color: #64748b; font-size: 12px; margin-top: 4px; }
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
  ticketList: {
    keywords: ["ticket", "tickets", "list", "all", "show", "support"],
    build: () => ({
      html:
        '<div class="ncodes-view">' +
        "<h2>Support Tickets</h2>" +
        '<div class="loading">Loading tickets...</div>' +
        '<table style="display:none">' +
        "<thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Priority</th><th>Assignee</th></tr></thead>" +
        '<tbody id="ticket-rows"></tbody>' +
        "</table></div>",
      css: baseCss,
      js: [
        "(async function() {",
        '  var tickets = await ncodes.query("listTickets");',
        '  var tbody = document.getElementById("ticket-rows");',
        '  var table = tbody.closest("table");',
        '  document.querySelector(".loading").style.display = "none";',
        '  table.style.display = "table";',
        "  tickets.forEach(function(t) {",
        '    var row = document.createElement("tr");',
        '    var tdId = document.createElement("td");',
        '    tdId.textContent = "#" + t.id;',
        '    var tdTitle = document.createElement("td");',
        "    tdTitle.textContent = t.title;",
        '    var tdStatus = document.createElement("td");',
        '    var statusBadge = document.createElement("span");',
        '    statusBadge.className = "badge badge-" + t.status;',
        "    statusBadge.textContent = t.status;",
        "    tdStatus.appendChild(statusBadge);",
        '    var tdPri = document.createElement("td");',
        '    var priBadge = document.createElement("span");',
        '    priBadge.className = "badge badge-" + t.priority;',
        "    priBadge.textContent = t.priority;",
        "    tdPri.appendChild(priBadge);",
        '    var tdAssignee = document.createElement("td");',
        "    tdAssignee.textContent = t.assignee;",
        "    row.appendChild(tdId);",
        "    row.appendChild(tdTitle);",
        "    row.appendChild(tdStatus);",
        "    row.appendChild(tdPri);",
        "    row.appendChild(tdAssignee);",
        "    tbody.appendChild(row);",
        "  });",
        "})();",
      ].join("\n"),
      apiBindings: [
        { type: "query", ref: "listTickets", resolved: { method: "GET", path: "/api/tickets" } },
      ],
    }),
  },

  ticketDetail: {
    keywords: ["detail", "view", "comments", "specific"],
    build: () => ({
      html:
        '<div class="ncodes-view">' +
        "<h2>Ticket Detail</h2>" +
        '<div class="loading">Loading ticket...</div>' +
        '<div id="ticket-detail" style="display:none">' +
        '<div class="detail-header">' +
        '<div class="title" id="detail-title"></div>' +
        '<div class="meta" id="detail-meta"></div>' +
        "</div>" +
        '<p id="detail-desc" style="font-size:14px;line-height:1.6;margin-bottom:16px"></p>' +
        '<h3 style="color:#94a3b8;font-size:13px;text-transform:uppercase;margin-bottom:8px">Comments</h3>' +
        '<div id="detail-comments"></div>' +
        "</div></div>",
      css: baseCss,
      js: [
        "(async function() {",
        '  var tickets = await ncodes.query("listTickets");',
        "  var ticket = tickets[0];",
        '  var comments = await ncodes.query("getComments");',
        '  document.querySelector(".loading").style.display = "none";',
        '  document.getElementById("ticket-detail").style.display = "block";',
        '  document.getElementById("detail-title").textContent = "#" + ticket.id + " " + ticket.title;',
        '  var metaEl = document.getElementById("detail-meta");',
        '  var statusBadge = document.createElement("span");',
        '  statusBadge.className = "badge badge-" + ticket.status;',
        "  statusBadge.textContent = ticket.status;",
        "  metaEl.appendChild(statusBadge);",
        '  var metaText = document.createTextNode(" \\u00b7 " + ticket.priority + " priority \\u00b7 " + ticket.assignee);',
        "  metaEl.appendChild(metaText);",
        '  document.getElementById("detail-desc").textContent = ticket.description;',
        '  var container = document.getElementById("detail-comments");',
        "  comments.forEach(function(c) {",
        '    var div = document.createElement("div");',
        '    div.className = "comment";',
        '    var author = document.createElement("div");',
        '    author.className = "author";',
        "    author.textContent = c.author;",
        '    var text = document.createElement("div");',
        '    text.className = "text";',
        "    text.textContent = c.text;",
        '    var time = document.createElement("div");',
        '    time.className = "time";',
        "    time.textContent = c.createdAt;",
        "    div.appendChild(author);",
        "    div.appendChild(text);",
        "    div.appendChild(time);",
        "    container.appendChild(div);",
        "  });",
        "})();",
      ].join("\n"),
      apiBindings: [
        { type: "query", ref: "listTickets", resolved: { method: "GET", path: "/api/tickets" } },
        { type: "query", ref: "getComments", resolved: { method: "GET", path: "/api/tickets/1/comments" } },
      ],
    }),
  },

  createTicket: {
    keywords: ["create", "new", "add", "form", "report"],
    build: () => ({
      html:
        '<div class="ncodes-view">' +
        "<h2>Create Ticket</h2>" +
        '<form id="create-ticket-form">' +
        "<label>Title</label>" +
        '<input type="text" id="ticket-title" placeholder="Brief summary of the issue" required />' +
        "<label>Description</label>" +
        '<textarea id="ticket-desc" rows="4" placeholder="Detailed description"></textarea>' +
        "<label>Priority</label>" +
        '<select id="ticket-priority">' +
        '<option value="low">Low</option>' +
        '<option value="medium" selected>Medium</option>' +
        '<option value="high">High</option>' +
        "</select>" +
        "<label>Assignee</label>" +
        '<input type="text" id="ticket-assignee" placeholder="Assignee name" />' +
        "<button type=\"submit\">Create Ticket</button>" +
        "</form>" +
        '<div id="form-result" style="display:none;margin-top:12px"></div></div>',
      css: baseCss,
      js: [
        "(async function() {",
        '  document.getElementById("create-ticket-form").addEventListener("submit", async function(e) {',
        "    e.preventDefault();",
        '    var result = await ncodes.action("createTicket", {',
        '      title: document.getElementById("ticket-title").value,',
        '      description: document.getElementById("ticket-desc").value,',
        '      priority: document.getElementById("ticket-priority").value,',
        '      assignee: document.getElementById("ticket-assignee").value',
        "    });",
        '    var el = document.getElementById("form-result");',
        '    el.style.display = "block";',
        '    el.textContent = "Ticket #" + result.id + " created: " + result.title;',
        '    el.style.color = "#4ade80";',
        "  });",
        "})();",
      ].join("\n"),
      apiBindings: [
        { type: "action", ref: "createTicket", resolved: { method: "POST", path: "/api/tickets" } },
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

  return best || "ticketList";
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

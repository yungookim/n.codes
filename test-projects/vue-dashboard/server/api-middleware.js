import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

let backendPromise = null;
async function getBackend() {
  if (!backendPromise) {
    backendPromise = import('../../shared/real-backend.js');
  }
  const mod = await backendPromise;
  return mod.default || mod;
}

const projects = [
  { id: 1, name: 'Website Redesign', status: 'active', progress: 72, owner: 'Alice Chen', startDate: '2026-01-10', dueDate: '2026-03-15', tasksTotal: 24, tasksCompleted: 17 },
  { id: 2, name: 'Mobile App v2', status: 'active', progress: 45, owner: 'Bob Martinez', startDate: '2026-01-20', dueDate: '2026-04-30', tasksTotal: 36, tasksCompleted: 16 },
  { id: 3, name: 'API Migration', status: 'planning', progress: 10, owner: 'Carol Nguyen', startDate: '2026-02-01', dueDate: '2026-05-15', tasksTotal: 18, tasksCompleted: 2 },
  { id: 4, name: 'Analytics Dashboard', status: 'completed', progress: 100, owner: 'Alice Chen', startDate: '2025-11-01', dueDate: '2026-01-31', tasksTotal: 15, tasksCompleted: 15 },
];

const tasks = [
  { id: 1, title: 'Design system tokens', project: 'Website Redesign', status: 'done', priority: 'high', assignee: 'Alice Chen' },
  { id: 2, title: 'Implement responsive nav', project: 'Website Redesign', status: 'in-progress', priority: 'high', assignee: 'Bob Martinez' },
  { id: 3, title: 'Set up CI/CD pipeline', project: 'Mobile App v2', status: 'done', priority: 'high', assignee: 'Carol Nguyen' },
  { id: 4, title: 'User auth flow', project: 'Mobile App v2', status: 'in-progress', priority: 'high', assignee: 'Alice Chen' },
  { id: 5, title: 'Push notifications', project: 'Mobile App v2', status: 'todo', priority: 'medium', assignee: 'Bob Martinez' },
  { id: 6, title: 'API versioning strategy', project: 'API Migration', status: 'in-progress', priority: 'high', assignee: 'Carol Nguyen' },
  { id: 7, title: 'Write migration scripts', project: 'API Migration', status: 'todo', priority: 'medium', assignee: 'Alice Chen' },
  { id: 8, title: 'Landing page hero', project: 'Website Redesign', status: 'todo', priority: 'medium', assignee: 'Bob Martinez' },
];

const members = [
  { id: 1, name: 'Alice Chen', role: 'Lead Engineer', email: 'alice@example.com', avatar: 'AC', activeProjects: 3, tasksCompleted: 34 },
  { id: 2, name: 'Bob Martinez', role: 'Frontend Developer', email: 'bob@example.com', avatar: 'BM', activeProjects: 2, tasksCompleted: 22 },
  { id: 3, name: 'Carol Nguyen', role: 'Backend Developer', email: 'carol@example.com', avatar: 'CN', activeProjects: 2, tasksCompleted: 17 },
];

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
  .ncodes-view .badge-active { background: #065f46; color: #6ee7b7; }
  .ncodes-view .badge-planning { background: #78350f; color: #fcd34d; }
  .ncodes-view .badge-completed { background: #1e3a5f; color: #7dd3fc; }
  .ncodes-view .badge-done { background: #065f46; color: #6ee7b7; }
  .ncodes-view .badge-in-progress { background: #1e3a5f; color: #7dd3fc; }
  .ncodes-view .badge-todo { background: #3f3f46; color: #a1a1aa; }
  .ncodes-view .progress-bar {
    background: #1e293b; border-radius: 4px; height: 6px; overflow: hidden; display: inline-block; width: 80px; vertical-align: middle;
  }
  .ncodes-view .progress-fill { background: #4ade80; height: 100%; border-radius: 4px; }
  .ncodes-view .stat-grid {
    display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px; margin-bottom: 16px;
  }
  .ncodes-view .stat-card { background: #111118; border-radius: 8px; padding: 16px; }
  .ncodes-view .stat-card .label { color: #64748b; font-size: 12px; }
  .ncodes-view .stat-card .num { font-size: 24px; font-weight: 700; color: #4ade80; }
  .ncodes-view .kanban { display: flex; gap: 12px; overflow-x: auto; }
  .ncodes-view .kanban-col {
    flex: 1; min-width: 200px; background: #111118; border-radius: 8px; padding: 12px;
  }
  .ncodes-view .kanban-col h3 {
    font-size: 13px; color: #94a3b8; text-transform: uppercase;
    margin: 0 0 12px; letter-spacing: 0.05em;
  }
  .ncodes-view .kanban-card {
    background: #1a1a24; border: 1px solid #2d2d3a;
    border-radius: 6px; padding: 10px; margin-bottom: 8px; font-size: 13px;
  }
  .ncodes-view .kanban-card .title { font-weight: 500; margin-bottom: 4px; }
  .ncodes-view .kanban-card .meta { color: #64748b; font-size: 12px; }
  .ncodes-view .member-card {
    background: #111118; border-radius: 8px; padding: 16px;
    display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
  }
  .ncodes-view .avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: #4ade80; color: #0a0a0f;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 14px; flex-shrink: 0;
  }
  .ncodes-view .member-info .name { font-weight: 600; font-size: 14px; }
  .ncodes-view .member-info .role { color: #64748b; font-size: 13px; }
  .ncodes-view .member-stats { margin-left: auto; text-align: right; }
  .ncodes-view .member-stats .num { font-weight: 700; color: #4ade80; }
  .ncodes-view .member-stats .sub { color: #64748b; font-size: 11px; }
  .ncodes-view .loading { color: #64748b; font-style: italic; }
`;

const tplTemplates = {
  projectOverview: {
    keywords: ['project', 'projects', 'overview', 'list'],
    build: () => ({
      html:
        '<div class="ncodes-view">' +
        '<h2>Projects</h2>' +
        '<div class="loading">Loading projects...</div>' +
        '<table style="display:none">' +
        '<thead><tr><th>Project</th><th>Status</th><th>Progress</th><th>Owner</th><th>Due</th></tr></thead>' +
        '<tbody id="project-rows"></tbody>' +
        '</table></div>',
      css: baseCss,
      js: [
        '(async function() {',
        '  var projects = await ncodes.query("listProjects");',
        '  var tbody = document.getElementById("project-rows");',
        '  var table = tbody.closest("table");',
        '  document.querySelector(".loading").style.display = "none";',
        '  table.style.display = "table";',
        '  projects.forEach(function(p) {',
        '    var row = document.createElement("tr");',
        '    var tdName = document.createElement("td");',
        '    tdName.textContent = p.name;',
        '    var tdStatus = document.createElement("td");',
        '    var badge = document.createElement("span");',
        '    badge.className = "badge badge-" + p.status;',
        '    badge.textContent = p.status;',
        '    tdStatus.appendChild(badge);',
        '    var tdProgress = document.createElement("td");',
        '    var bar = document.createElement("div");',
        '    bar.className = "progress-bar";',
        '    var fill = document.createElement("div");',
        '    fill.className = "progress-fill";',
        '    fill.style.width = p.progress + "%";',
        '    bar.appendChild(fill);',
        '    tdProgress.appendChild(bar);',
        '    var pctText = document.createTextNode(" " + p.progress + "%");',
        '    tdProgress.appendChild(pctText);',
        '    var tdOwner = document.createElement("td");',
        '    tdOwner.textContent = p.owner;',
        '    var tdDue = document.createElement("td");',
        '    tdDue.textContent = p.dueDate;',
        '    row.appendChild(tdName);',
        '    row.appendChild(tdStatus);',
        '    row.appendChild(tdProgress);',
        '    row.appendChild(tdOwner);',
        '    row.appendChild(tdDue);',
        '    tbody.appendChild(row);',
        '  });',
        '})();',
      ].join('\n'),
      apiBindings: [
        { type: 'query', ref: 'listProjects', resolved: { method: 'GET', path: '/api/projects' } },
      ],
    }),
  },

  taskBoard: {
    keywords: ['task', 'tasks', 'board', 'kanban'],
    build: () => ({
      html:
        '<div class="ncodes-view">' +
        '<h2>Task Board</h2>' +
        '<div class="loading">Loading tasks...</div>' +
        '<div class="kanban" id="task-board" style="display:none"></div>' +
        '</div>',
      css: baseCss,
      js: [
        '(async function() {',
        '  var tasks = await ncodes.query("listTasks");',
        '  var board = document.getElementById("task-board");',
        '  document.querySelector(".loading").style.display = "none";',
        '  board.style.display = "flex";',
        '  var columns = { todo: "To Do", "in-progress": "In Progress", done: "Done" };',
        '  Object.keys(columns).forEach(function(status) {',
        '    var col = document.createElement("div");',
        '    col.className = "kanban-col";',
        '    var h3 = document.createElement("h3");',
        '    h3.textContent = columns[status];',
        '    col.appendChild(h3);',
        '    tasks.filter(function(t) { return t.status === status; }).forEach(function(t) {',
        '      var card = document.createElement("div");',
        '      card.className = "kanban-card";',
        '      var titleDiv = document.createElement("div");',
        '      titleDiv.className = "title";',
        '      titleDiv.textContent = t.title;',
        '      var metaDiv = document.createElement("div");',
        '      metaDiv.className = "meta";',
        '      metaDiv.textContent = t.project + " \\u00b7 " + t.assignee;',
        '      card.appendChild(titleDiv);',
        '      card.appendChild(metaDiv);',
        '      col.appendChild(card);',
        '    });',
        '    board.appendChild(col);',
        '  });',
        '})();',
      ].join('\n'),
      apiBindings: [
        { type: 'query', ref: 'listTasks', resolved: { method: 'GET', path: '/api/tasks' } },
      ],
    }),
  },

  teamDashboard: {
    keywords: ['team', 'member', 'members', 'people', 'dashboard'],
    build: () => ({
      html:
        '<div class="ncodes-view">' +
        '<h2>Team</h2>' +
        '<div class="loading">Loading team...</div>' +
        '<div id="team-content" style="display:none">' +
        '<div class="stat-grid" id="team-stats"></div>' +
        '<div id="member-list"></div>' +
        '</div></div>',
      css: baseCss,
      js: [
        '(async function() {',
        '  var members = await ncodes.query("listMembers");',
        '  document.querySelector(".loading").style.display = "none";',
        '  document.getElementById("team-content").style.display = "block";',
        '  var statsEl = document.getElementById("team-stats");',
        '  var totalCompleted = members.reduce(function(s, m) { return s + m.tasksCompleted; }, 0);',
        '  [{l:"Team Size",v:members.length},{l:"Tasks Completed",v:totalCompleted}].forEach(function(s) {',
        '    var card = document.createElement("div");',
        '    card.className = "stat-card";',
        '    var label = document.createElement("div");',
        '    label.className = "label";',
        '    label.textContent = s.l;',
        '    var num = document.createElement("div");',
        '    num.className = "num";',
        '    num.textContent = s.v;',
        '    card.appendChild(label);',
        '    card.appendChild(num);',
        '    statsEl.appendChild(card);',
        '  });',
        '  var list = document.getElementById("member-list");',
        '  members.forEach(function(m) {',
        '    var card = document.createElement("div");',
        '    card.className = "member-card";',
        '    var avatarDiv = document.createElement("div");',
        '    avatarDiv.className = "avatar";',
        '    avatarDiv.textContent = m.avatar;',
        '    var infoDiv = document.createElement("div");',
        '    infoDiv.className = "member-info";',
        '    var nameDiv = document.createElement("div");',
        '    nameDiv.className = "name";',
        '    nameDiv.textContent = m.name;',
        '    var roleDiv = document.createElement("div");',
        '    roleDiv.className = "role";',
        '    roleDiv.textContent = m.role;',
        '    infoDiv.appendChild(nameDiv);',
        '    infoDiv.appendChild(roleDiv);',
        '    var mstats = document.createElement("div");',
        '    mstats.className = "member-stats";',
        '    var numDiv = document.createElement("div");',
        '    numDiv.className = "num";',
        '    numDiv.textContent = m.tasksCompleted;',
        '    var subDiv = document.createElement("div");',
        '    subDiv.className = "sub";',
        '    subDiv.textContent = "completed";',
        '    mstats.appendChild(numDiv);',
        '    mstats.appendChild(subDiv);',
        '    card.appendChild(avatarDiv);',
        '    card.appendChild(infoDiv);',
        '    card.appendChild(mstats);',
        '    list.appendChild(card);',
        '  });',
        '})();',
      ].join('\n'),
      apiBindings: [
        { type: 'query', ref: 'listMembers', resolved: { method: 'GET', path: '/api/members' } },
      ],
    }),
  },
};

function matchTemplate(prompt) {
  const lower = prompt.toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const [name, tpl] of Object.entries(tplTemplates)) {
    const score = tpl.keywords.filter(k => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }

  return best || 'projectOverview';
}

/**
 * Read the full request body from an IncomingMessage (no body-parser in Vite dev).
 */
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Vite configureServer plugin middleware.
 * Handles:
 *   POST /api/generate
 *   GET  /api/jobs/:id
 *   GET  /api/projects
 *   GET  /api/tasks
 *   GET  /api/members
 */
function apiMiddleware(server) {
  server.middlewares.use(async (req, res, next) => {
    const sendJson = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
    };

    try {
      // POST /api/generate
      if (req.method === 'POST' && req.url === '/api/generate') {
        const backend = await getBackend();
        const body = await readBody(req);
        req.body = body;
        await backend.handleGenerateForProject(projectRoot, req, res);
        return;
      }

      if (req.method === 'POST' && req.url === '/api/generate/stream') {
        const backend = await getBackend();
        const body = await readBody(req);
        req.body = body;
        await backend.handleStreamGenerateForProject(projectRoot, req, res);
        return;
      }

      // GET /api/jobs/:id
      const jobMatch = req.url && req.url.match(/^\/api\/jobs\/([^/?]+)/);
      if (req.method === 'GET' && jobMatch) {
        const backend = await getBackend();
        req.params = { jobId: jobMatch[1] };
        await backend.handleGetJobForProject(projectRoot, req, res);
        return;
      }

      // Data APIs
      if (req.method === 'GET' && req.url === '/api/projects') {
        return sendJson(200, projects);
      }
      if (req.method === 'GET' && req.url === '/api/tasks') {
        return sendJson(200, tasks);
      }
      if (req.method === 'GET' && req.url === '/api/members') {
        return sendJson(200, members);
      }

      next();
    } catch (err) {
      console.error('[api-middleware]', err);
      sendJson(500, { error: 'Internal server error' });
    }
  });
}

export { apiMiddleware };

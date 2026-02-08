const express = require('express');
const path = require('path');
const ejs = require('ejs');
const router = express.Router();

// Helper: render a content partial, then wrap it in the layout
function renderWithLayout(res, locals) {
  const viewsDir = path.join(__dirname, '..', 'views');
  const contentPath = path.join(viewsDir, locals.view + '.ejs');

  ejs.renderFile(contentPath, locals, function(err, contentHtml) {
    if (err) {
      console.error('Content render error:', err);
      return res.status(500).send('Render error');
    }
    locals.content = contentHtml;
    res.render('layout', locals);
  });
}

// Shared mock data (mirrors the in-memory stores in route files)
function getTasks() {
  return [
    { id: 1, title: 'Set up CI/CD pipeline', status: 'done', priority: 'high', assignee: 'Alice Chen', createdAt: '2026-01-15' },
    { id: 2, title: 'Design user dashboard', status: 'in-progress', priority: 'high', assignee: 'Bob Martinez', createdAt: '2026-01-22' },
    { id: 3, title: 'Implement auth middleware', status: 'done', priority: 'high', assignee: 'Alice Chen', createdAt: '2026-01-28' },
    { id: 4, title: 'Write API documentation', status: 'todo', priority: 'medium', assignee: 'Carol Nguyen', createdAt: '2026-02-01' },
    { id: 5, title: 'Add email notifications', status: 'in-progress', priority: 'medium', assignee: 'Bob Martinez', createdAt: '2026-02-03' },
    { id: 6, title: 'Performance audit', status: 'todo', priority: 'low', assignee: 'Carol Nguyen', createdAt: '2026-02-06' }
  ];
}

function getUsers() {
  return [
    { id: 1, name: 'Alice Chen', email: 'alice@ncodes.dev', role: 'admin', joinedAt: '2025-11-10' },
    { id: 2, name: 'Bob Martinez', email: 'bob@ncodes.dev', role: 'developer', joinedAt: '2025-12-05' },
    { id: 3, name: 'Carol Nguyen', email: 'carol@ncodes.dev', role: 'developer', joinedAt: '2026-01-08' }
  ];
}

// GET / - Dashboard
router.get('/', (req, res) => {
  const tasks = getTasks();
  const users = getUsers();

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    done: tasks.filter(t => t.status === 'done').length,
    teamSize: users.length
  };

  const recentTasks = tasks.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);

  renderWithLayout(res, {
    view: 'dashboard',
    title: 'Dashboard',
    activePage: 'dashboard',
    currentUser: req.user,
    stats,
    recentTasks
  });
});

// GET /tasks-page - Tasks list view
router.get('/tasks-page', (req, res) => {
  const tasks = getTasks();

  renderWithLayout(res, {
    view: 'tasks',
    title: 'Tasks',
    activePage: 'tasks',
    currentUser: req.user,
    tasks
  });
});

// GET /users-page - Team members view
router.get('/users-page', (req, res) => {
  const users = getUsers();

  renderWithLayout(res, {
    view: 'users',
    title: 'Team Members',
    activePage: 'users',
    currentUser: req.user,
    users
  });
});

module.exports = router;

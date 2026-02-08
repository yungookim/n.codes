const express = require('express');
const router = express.Router();

// In-memory task store
const tasks = [
  {
    id: 1,
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing and deployment',
    status: 'done',
    priority: 'high',
    assignee: 'Alice Chen',
    createdAt: '2026-01-15'
  },
  {
    id: 2,
    title: 'Design user dashboard',
    description: 'Create wireframes and high-fidelity mockups for the main dashboard view',
    status: 'in-progress',
    priority: 'high',
    assignee: 'Bob Martinez',
    createdAt: '2026-01-22'
  },
  {
    id: 3,
    title: 'Implement auth middleware',
    description: 'Add JWT-based authentication with refresh token rotation',
    status: 'done',
    priority: 'high',
    assignee: 'Alice Chen',
    createdAt: '2026-01-28'
  },
  {
    id: 4,
    title: 'Write API documentation',
    description: 'Document all REST endpoints using OpenAPI 3.0 spec',
    status: 'todo',
    priority: 'medium',
    assignee: 'Carol Nguyen',
    createdAt: '2026-02-01'
  },
  {
    id: 5,
    title: 'Add email notifications',
    description: 'Send transactional emails for task assignments and status changes',
    status: 'in-progress',
    priority: 'medium',
    assignee: 'Bob Martinez',
    createdAt: '2026-02-03'
  },
  {
    id: 6,
    title: 'Performance audit',
    description: 'Profile slow queries and optimize database indexes',
    status: 'todo',
    priority: 'low',
    assignee: 'Carol Nguyen',
    createdAt: '2026-02-06'
  }
];

let nextId = 7;

// GET /tasks - list all tasks
router.get('/', (req, res) => {
  const { status, assignee } = req.query;
  let filtered = tasks;

  if (status) {
    filtered = filtered.filter(t => t.status === status);
  }
  if (assignee) {
    filtered = filtered.filter(t => t.assignee === assignee);
  }

  res.json(filtered);
});

// POST /tasks - create a new task
router.post('/', (req, res) => {
  const { title, description, status, priority, assignee } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const task = {
    id: nextId++,
    title,
    description: description || '',
    status: status || 'todo',
    priority: priority || 'medium',
    assignee: assignee || req.user.name,
    createdAt: new Date().toISOString().split('T')[0]
  };

  tasks.push(task);
  res.status(201).json(task);
});

// PUT /tasks/:id - update a task
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find(t => t.id === id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, status, priority, assignee } = req.body;

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (status !== undefined) task.status = status;
  if (priority !== undefined) task.priority = priority;
  if (assignee !== undefined) task.assignee = assignee;

  res.json(task);
});

// DELETE /tasks/:id - delete a task
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = tasks.findIndex(t => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const removed = tasks.splice(index, 1)[0];
  res.json(removed);
});

module.exports = router;

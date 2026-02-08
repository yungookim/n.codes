const express = require('express');
const router = express.Router();

// In-memory user store
const users = [
  {
    id: 1,
    name: 'Alice Chen',
    email: 'alice@ncodes.dev',
    role: 'admin',
    joinedAt: '2025-11-10'
  },
  {
    id: 2,
    name: 'Bob Martinez',
    email: 'bob@ncodes.dev',
    role: 'developer',
    joinedAt: '2025-12-05'
  },
  {
    id: 3,
    name: 'Carol Nguyen',
    email: 'carol@ncodes.dev',
    role: 'developer',
    joinedAt: '2026-01-08'
  }
];

let nextId = 4;

// GET /users - list all users
router.get('/', (req, res) => {
  res.json(users);
});

// POST /users - create a new user
router.post('/', (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(409).json({ error: 'A user with that email already exists' });
  }

  const user = {
    id: nextId++,
    name,
    email,
    role: role || 'developer',
    joinedAt: new Date().toISOString().split('T')[0]
  };

  users.push(user);
  res.status(201).json(user);
});

module.exports = router;

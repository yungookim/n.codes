const express = require('express');
const router = express.Router();

// Mock user database for login
const credentials = {
  'alice@ncodes.dev': { id: 1, name: 'Alice Chen', role: 'admin' },
  'bob@ncodes.dev': { id: 2, name: 'Bob Martinez', role: 'developer' },
  'carol@ncodes.dev': { id: 3, name: 'Carol Nguyen', role: 'developer' }
};

// POST /auth/login - mock login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = credentials[email];
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Mock auth: any password is accepted
  res.json({
    message: 'Login successful',
    user: {
      id: user.id,
      name: user.name,
      email,
      role: user.role
    },
    token: 'mock-jwt-token-' + user.id
  });
});

// GET /auth/me - current user info
router.get('/me', (req, res) => {
  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role
  });
});

module.exports = router;

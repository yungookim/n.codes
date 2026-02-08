const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock auth middleware - simulates an authenticated user on every request
app.use((req, res, next) => {
  req.user = {
    id: 1,
    name: 'Alice Chen',
    email: 'alice@ncodes.dev',
    role: 'admin',
    avatar: 'AC'
  };
  res.locals.currentUser = req.user;
  next();
});

// Mount routes
const tasksRouter = require('./routes/tasks');
const usersRouter = require('./routes/users');
const pagesRouter = require('./routes/pages');
const authRouter = require('./routes/auth');

app.use('/tasks', tasksRouter);
app.use('/users', usersRouter);
app.use('/auth', authRouter);
app.use('/', pagesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).send('Not found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal server error');
});

app.listen(PORT, () => {
  console.log(`express-tasks running at http://localhost:${PORT}`);
});

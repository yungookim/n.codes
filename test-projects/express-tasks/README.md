# Express Tasks

A minimal task manager built with Express and EJS. Dark-themed UI with mock auth, in-memory data, and server-rendered views.

## Quick Start

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Method | Path            | Description           |
|--------|-----------------|-----------------------|
| GET    | /               | Dashboard             |
| GET    | /tasks-page     | Tasks list view       |
| GET    | /users-page     | Team members view     |
| GET    | /tasks          | API: list tasks       |
| POST   | /tasks          | API: create task      |
| PUT    | /tasks/:id      | API: update task      |
| DELETE | /tasks/:id      | API: delete task      |
| GET    | /users          | API: list users       |
| POST   | /users          | API: create user      |
| POST   | /auth/login     | API: mock login       |
| GET    | /auth/me        | API: current user     |

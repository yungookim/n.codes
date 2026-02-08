const tasks = [
  {
    id: 't1',
    title: 'Design homepage wireframes',
    description: 'Create low-fidelity wireframes for the new homepage layout',
    status: 'done',
    priority: 'high',
    projectId: 'p1',
    assigneeId: 'u2',
    createdAt: '2025-11-20',
    dueDate: '2025-12-15'
  },
  {
    id: 't2',
    title: 'Implement responsive nav component',
    description: 'Build the main navigation with mobile hamburger menu',
    status: 'in-progress',
    priority: 'high',
    projectId: 'p1',
    assigneeId: 'u3',
    createdAt: '2026-01-10',
    dueDate: '2026-02-10'
  },
  {
    id: 't3',
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated builds and deployments',
    status: 'review',
    priority: 'medium',
    projectId: 'p1',
    assigneeId: 'u1',
    createdAt: '2026-01-15',
    dueDate: '2026-02-01'
  },
  {
    id: 't4',
    title: 'User authentication flow',
    description: 'Implement sign-up, login, and password reset screens',
    status: 'in-progress',
    priority: 'high',
    projectId: 'p2',
    assigneeId: 'u1',
    createdAt: '2026-01-08',
    dueDate: '2026-02-20'
  },
  {
    id: 't5',
    title: 'Push notification service',
    description: 'Integrate Firebase Cloud Messaging for push notifications',
    status: 'todo',
    priority: 'medium',
    projectId: 'p2',
    assigneeId: 'u2',
    createdAt: '2026-01-20',
    dueDate: '2026-03-15'
  },
  {
    id: 't6',
    title: 'Define GraphQL schema',
    description: 'Draft the GraphQL schema covering all existing REST endpoints',
    status: 'blocked',
    priority: 'high',
    projectId: 'p3',
    assigneeId: 'u3',
    createdAt: '2025-10-25',
    dueDate: '2025-12-01'
  },
  {
    id: 't7',
    title: 'Write data migration scripts',
    description: 'Create scripts to migrate legacy data formats to the new schema',
    status: 'todo',
    priority: 'low',
    projectId: 'p3',
    assigneeId: 'u2',
    createdAt: '2026-01-25',
    dueDate: '2026-03-01'
  },
  {
    id: 't8',
    title: 'Create Q4 report templates',
    description: 'Design and implement dashboard report templates for Q4 metrics',
    status: 'done',
    priority: 'medium',
    projectId: 'p4',
    assigneeId: 'u1',
    createdAt: '2025-09-01',
    dueDate: '2025-11-30'
  }
];

let nextId = 9;

export function getTasks() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(tasks.map((t) => ({ ...t })));
    }, 100);
  });
}

export function createTask(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const task = {
        id: `t${nextId++}`,
        title: data.title,
        description: data.description || '',
        status: 'todo',
        priority: data.priority || 'medium',
        projectId: data.projectId,
        assigneeId: data.assigneeId || null,
        createdAt: new Date().toISOString().slice(0, 10),
        dueDate: data.dueDate || null
      };
      tasks.push(task);
      resolve({ ...task });
    }, 120);
  });
}

export function updateTask(id, updates) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = tasks.findIndex((t) => t.id === id);
      if (index === -1) {
        reject(new Error(`Task ${id} not found`));
        return;
      }
      Object.assign(tasks[index], updates);
      resolve({ ...tasks[index] });
    }, 80);
  });
}

const projects = [
  {
    id: 'p1',
    name: 'Website Redesign',
    description: 'Complete overhaul of the marketing website with new brand guidelines',
    status: 'active',
    progress: 68,
    taskCount: 12,
    memberIds: ['u1', 'u2', 'u3'],
    createdAt: '2025-11-15',
    deadline: '2026-03-01'
  },
  {
    id: 'p2',
    name: 'Mobile App v2',
    description: 'Native iOS and Android app rebuild using React Native',
    status: 'active',
    progress: 34,
    taskCount: 24,
    memberIds: ['u1', 'u2'],
    createdAt: '2026-01-05',
    deadline: '2026-06-15'
  },
  {
    id: 'p3',
    name: 'API Migration',
    description: 'Migrate REST endpoints to GraphQL with backward compatibility',
    status: 'paused',
    progress: 15,
    taskCount: 8,
    memberIds: ['u2', 'u3'],
    createdAt: '2025-10-20',
    deadline: '2026-04-01'
  },
  {
    id: 'p4',
    name: 'Q4 Analytics Dashboard',
    description: 'Internal analytics dashboard for stakeholder reporting',
    status: 'completed',
    progress: 100,
    taskCount: 6,
    memberIds: ['u1'],
    createdAt: '2025-08-01',
    deadline: '2025-12-31'
  }
];

let nextId = 5;

export function getProjects() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(projects.map((p) => ({ ...p })));
    }, 120);
  });
}

export function createProject(data) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const project = {
        id: `p${nextId++}`,
        name: data.name,
        description: data.description || '',
        status: 'active',
        progress: 0,
        taskCount: 0,
        memberIds: data.memberIds || [],
        createdAt: new Date().toISOString().slice(0, 10),
        deadline: data.deadline || null
      };
      projects.push(project);
      resolve({ ...project });
    }, 150);
  });
}

export function updateProject(id, updates) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = projects.findIndex((p) => p.id === id);
      if (index === -1) {
        reject(new Error(`Project ${id} not found`));
        return;
      }
      Object.assign(projects[index], updates);
      resolve({ ...projects[index] });
    }, 100);
  });
}

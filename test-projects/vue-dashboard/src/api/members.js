const members = [
  {
    id: 'u1',
    name: 'Sarah Chen',
    email: 'sarah.chen@acme.io',
    role: 'Engineering Lead',
    avatar: 'SC',
    status: 'online',
    tasksCompleted: 34,
    tasksInProgress: 2
  },
  {
    id: 'u2',
    name: 'Marcus Rivera',
    email: 'marcus.r@acme.io',
    role: 'Senior Designer',
    avatar: 'MR',
    status: 'online',
    tasksCompleted: 21,
    tasksInProgress: 3
  },
  {
    id: 'u3',
    name: 'Anika Patel',
    email: 'anika.p@acme.io',
    role: 'Full Stack Developer',
    avatar: 'AP',
    status: 'away',
    tasksCompleted: 18,
    tasksInProgress: 1
  }
];

export function getMembers() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(members.map((m) => ({ ...m })));
    }, 90);
  });
}

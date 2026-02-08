<script setup>
import { ref, onMounted, computed } from 'vue';
import { getProjects } from '../api/projects.js';
import { getTasks } from '../api/tasks.js';
import { getMembers } from '../api/members.js';

const projects = ref([]);
const tasks = ref([]);
const members = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [p, t, m] = await Promise.all([
      getProjects(),
      getTasks(),
      getMembers()
    ]);
    projects.value = p;
    tasks.value = t;
    members.value = m;
  } finally {
    loading.value = false;
  }
});

const activeProjects = computed(() =>
  projects.value.filter((p) => p.status === 'active').length
);

const completedTasks = computed(() =>
  tasks.value.filter((t) => t.status === 'done').length
);

const inProgressTasks = computed(() =>
  tasks.value.filter((t) => t.status === 'in-progress').length
);

const blockedTasks = computed(() =>
  tasks.value.filter((t) => t.status === 'blocked').length
);

const overallProgress = computed(() => {
  if (projects.value.length === 0) return 0;
  const active = projects.value.filter((p) => p.status !== 'completed');
  if (active.length === 0) return 100;
  const total = active.reduce((sum, p) => sum + p.progress, 0);
  return Math.round(total / active.length);
});

const recentTasks = computed(() =>
  [...tasks.value]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
);

function priorityClass(priority) {
  return `priority-${priority}`;
}
</script>

<template>
  <div class="dashboard">
    <header class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-subtitle">Welcome back. Here is your project overview.</p>
    </header>

    <div v-if="loading" class="loading">Loading data...</div>

    <template v-else>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Active Projects</div>
          <div class="stat-value">{{ activeProjects }}</div>
          <div class="stat-detail">{{ projects.length }} total</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Tasks Completed</div>
          <div class="stat-value accent">{{ completedTasks }}</div>
          <div class="stat-detail">of {{ tasks.length }} total</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">In Progress</div>
          <div class="stat-value info">{{ inProgressTasks }}</div>
          <div class="stat-detail">tasks active now</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Blocked</div>
          <div class="stat-value danger">{{ blockedTasks }}</div>
          <div class="stat-detail">need attention</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card progress-card">
          <h2 class="card-title">Overall Progress</h2>
          <div class="progress-display">
            <div class="progress-percentage">{{ overallProgress }}%</div>
            <div class="progress-bar-track">
              <div
                class="progress-bar-fill"
                :style="{ width: overallProgress + '%' }"
              ></div>
            </div>
            <div class="progress-note">Average across active projects</div>
          </div>
        </div>

        <div class="card team-card">
          <h2 class="card-title">Team</h2>
          <ul class="team-list">
            <li
              v-for="member in members"
              :key="member.id"
              class="team-member"
            >
              <div class="member-avatar">{{ member.avatar }}</div>
              <div class="member-info">
                <div class="member-name">{{ member.name }}</div>
                <div class="member-role">{{ member.role }}</div>
              </div>
              <div class="member-status-dot" :class="member.status"></div>
            </li>
          </ul>
        </div>
      </div>

      <div class="card recent-card">
        <h2 class="card-title">Recent Tasks</h2>
        <table class="task-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in recentTasks" :key="task.id">
              <td class="task-title-cell">{{ task.title }}</td>
              <td>
                <span class="badge" :class="'badge-' + task.status">
                  {{ task.status }}
                </span>
              </td>
              <td>
                <span class="priority-dot" :class="priorityClass(task.priority)"></span>
                {{ task.priority }}
              </td>
              <td class="date-cell">{{ task.dueDate || '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 32px;
  max-width: 1100px;
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
}

.loading {
  color: var(--text-muted);
  font-size: 14px;
  padding: 40px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 6px;
}

.stat-value.accent {
  color: var(--accent);
}

.stat-value.info {
  color: var(--info);
}

.stat-value.danger {
  color: var(--danger);
}

.stat-detail {
  font-size: 12px;
  color: var(--text-muted);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 20px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}

.progress-display {
  text-align: center;
}

.progress-percentage {
  font-size: 48px;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
  margin-bottom: 16px;
}

.progress-bar-track {
  width: 100%;
  height: 8px;
  background-color: var(--bg-hover);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-bar-fill {
  height: 100%;
  background-color: var(--accent);
  border-radius: 4px;
  transition: width 0.6s ease;
}

.progress-note {
  font-size: 12px;
  color: var(--text-muted);
}

.team-list {
  list-style: none;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.team-member:last-child {
  border-bottom: none;
}

.member-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background-color: var(--accent-dim);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.member-info {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.member-role {
  font-size: 11px;
  color: var(--text-muted);
}

.member-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.member-status-dot.online {
  background-color: var(--accent);
}

.member-status-dot.away {
  background-color: var(--warning);
}

.member-status-dot.offline {
  background-color: var(--text-muted);
}

.task-table {
  width: 100%;
  border-collapse: collapse;
}

.task-table th {
  text-align: left;
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
}

.task-table td {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--text-secondary);
  border-bottom: 1px solid var(--border);
}

.task-title-cell {
  color: var(--text-primary);
  font-weight: 500;
}

.date-cell {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.priority-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-right: 6px;
}

.priority-high {
  background-color: var(--danger);
}

.priority-medium {
  background-color: var(--warning);
}

.priority-low {
  background-color: var(--text-muted);
}
</style>

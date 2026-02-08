<script setup>
import { ref, onMounted } from 'vue';
import { getMembers } from '../api/members.js';
import { getTasks } from '../api/tasks.js';
import { getProjects } from '../api/projects.js';

const members = ref([]);
const tasks = ref([]);
const projects = ref([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const [m, t, p] = await Promise.all([
      getMembers(),
      getTasks(),
      getProjects()
    ]);
    members.value = m;
    tasks.value = t;
    projects.value = p;
  } finally {
    loading.value = false;
  }
});

function getMemberTasks(memberId) {
  return tasks.value.filter((t) => t.assigneeId === memberId);
}

function getMemberProjects(memberId) {
  return projects.value.filter((p) => p.memberIds.includes(memberId));
}

function getActiveTasks(memberId) {
  return getMemberTasks(memberId).filter(
    (t) => t.status === 'in-progress' || t.status === 'review'
  ).length;
}

function getCompletedTasks(memberId) {
  return getMemberTasks(memberId).filter((t) => t.status === 'done').length;
}
</script>

<template>
  <div class="members-view">
    <header class="page-header">
      <h1 class="page-title">Team Members</h1>
      <p class="page-subtitle">Your team and their current workload</p>
    </header>

    <div v-if="loading" class="loading">Loading members...</div>

    <div v-else class="members-grid">
      <div
        v-for="member in members"
        :key="member.id"
        class="card member-card"
      >
        <div class="member-header">
          <div class="member-avatar-lg">{{ member.avatar }}</div>
          <div class="member-status-indicator" :class="member.status"></div>
        </div>
        <h3 class="member-name">{{ member.name }}</h3>
        <p class="member-role">{{ member.role }}</p>
        <p class="member-email">{{ member.email }}</p>

        <div class="member-stats">
          <div class="member-stat">
            <span class="stat-num">{{ getActiveTasks(member.id) }}</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="member-stat">
            <span class="stat-num accent">{{ getCompletedTasks(member.id) }}</span>
            <span class="stat-label">Completed</span>
          </div>
          <div class="member-stat">
            <span class="stat-num">{{ getMemberProjects(member.id).length }}</span>
            <span class="stat-label">Projects</span>
          </div>
        </div>

        <div class="member-projects">
          <h4 class="section-title">Assigned Projects</h4>
          <ul class="project-list">
            <li
              v-for="project in getMemberProjects(member.id)"
              :key="project.id"
              class="project-item"
            >
              <span class="project-dot" :class="'dot-' + project.status"></span>
              <span class="project-name">{{ project.name }}</span>
            </li>
            <li
              v-if="getMemberProjects(member.id).length === 0"
              class="no-projects"
            >
              No projects assigned
            </li>
          </ul>
        </div>

        <div class="member-tasks">
          <h4 class="section-title">Current Tasks</h4>
          <ul class="task-list">
            <li
              v-for="task in getMemberTasks(member.id).slice(0, 3)"
              :key="task.id"
              class="task-item"
            >
              <span class="badge" :class="'badge-' + task.status">
                {{ task.status }}
              </span>
              <span class="task-name">{{ task.title }}</span>
            </li>
            <li
              v-if="getMemberTasks(member.id).length === 0"
              class="no-tasks"
            >
              No tasks assigned
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.members-view {
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

.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.card {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px;
}

.member-card {
  transition: border-color 0.15s ease;
}

.member-card:hover {
  border-color: var(--text-muted);
}

.member-header {
  position: relative;
  display: inline-block;
  margin-bottom: 14px;
}

.member-avatar-lg {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: var(--accent-dim);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
}

.member-status-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 3px solid var(--bg-card);
}

.member-status-indicator.online {
  background-color: var(--accent);
}

.member-status-indicator.away {
  background-color: var(--warning);
}

.member-status-indicator.offline {
  background-color: var(--text-muted);
}

.member-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.member-role {
  font-size: 13px;
  color: var(--accent);
  font-weight: 500;
  margin-bottom: 2px;
}

.member-email {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 18px;
}

.member-stats {
  display: flex;
  gap: 16px;
  padding: 14px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}

.member-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-num.accent {
  color: var(--accent);
}

.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.member-projects {
  margin-bottom: 16px;
}

.project-list,
.task-list {
  list-style: none;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.project-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-active {
  background-color: var(--accent);
}

.dot-paused {
  background-color: var(--warning);
}

.dot-completed {
  background-color: var(--info);
}

.dot-archived {
  background-color: var(--text-muted);
}

.project-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}

.task-name {
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-projects,
.no-tasks {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}
</style>

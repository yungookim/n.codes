<script setup>
import { ref, onMounted, computed } from 'vue';
import { getTasks, createTask, updateTask } from '../api/tasks.js';
import { getProjects } from '../api/projects.js';
import { getMembers } from '../api/members.js';

const tasks = ref([]);
const projects = ref([]);
const members = ref([]);
const loading = ref(true);
const filterStatus = ref('all');
const showForm = ref(false);
const newTaskTitle = ref('');
const newTaskProject = ref('');
const newTaskPriority = ref('medium');

const statusOptions = ['all', 'todo', 'in-progress', 'review', 'done', 'blocked'];

onMounted(async () => {
  try {
    const [t, p, m] = await Promise.all([
      getTasks(),
      getProjects(),
      getMembers()
    ]);
    tasks.value = t;
    projects.value = p;
    members.value = m;
  } finally {
    loading.value = false;
  }
});

const filteredTasks = computed(() => {
  if (filterStatus.value === 'all') return tasks.value;
  return tasks.value.filter((t) => t.status === filterStatus.value);
});

const taskCounts = computed(() => {
  const counts = {};
  for (const status of statusOptions) {
    if (status === 'all') {
      counts[status] = tasks.value.length;
    } else {
      counts[status] = tasks.value.filter((t) => t.status === status).length;
    }
  }
  return counts;
});

function getProjectName(projectId) {
  const project = projects.value.find((p) => p.id === projectId);
  return project ? project.name : projectId;
}

function getAssigneeName(assigneeId) {
  if (!assigneeId) return 'Unassigned';
  const member = members.value.find((m) => m.id === assigneeId);
  return member ? member.name : assigneeId;
}

async function handleCreateTask() {
  if (!newTaskTitle.value.trim()) return;
  const task = await createTask({
    title: newTaskTitle.value.trim(),
    projectId: newTaskProject.value || projects.value[0]?.id,
    priority: newTaskPriority.value
  });
  tasks.value.push(task);
  newTaskTitle.value = '';
  newTaskProject.value = '';
  newTaskPriority.value = 'medium';
  showForm.value = false;
}

async function cycleStatus(task) {
  const order = ['todo', 'in-progress', 'review', 'done'];
  const currentIndex = order.indexOf(task.status);
  if (currentIndex === -1) return;
  const nextStatus = order[(currentIndex + 1) % order.length];
  const updated = await updateTask(task.id, { status: nextStatus });
  const index = tasks.value.findIndex((t) => t.id === task.id);
  if (index !== -1) {
    tasks.value[index] = updated;
  }
}
</script>

<template>
  <div class="tasks-view">
    <header class="page-header">
      <div class="header-row">
        <div>
          <h1 class="page-title">Tasks</h1>
          <p class="page-subtitle">Track and manage all tasks across projects</p>
        </div>
        <button class="btn-primary" @click="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ New Task' }}
        </button>
      </div>
    </header>

    <div v-if="showForm" class="card form-card">
      <h2 class="card-title">Create Task</h2>
      <div class="form-row">
        <div class="form-group form-group-grow">
          <label class="form-label">Title</label>
          <input
            v-model="newTaskTitle"
            type="text"
            class="form-input"
            placeholder="Task title..."
          />
        </div>
        <div class="form-group">
          <label class="form-label">Project</label>
          <select v-model="newTaskProject" class="form-input">
            <option value="">Select project</option>
            <option
              v-for="project in projects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Priority</label>
          <select v-model="newTaskPriority" class="form-input">
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <button class="btn-primary" @click="handleCreateTask">Create Task</button>
    </div>

    <div class="filter-bar">
      <button
        v-for="status in statusOptions"
        :key="status"
        class="filter-btn"
        :class="{ active: filterStatus === status }"
        @click="filterStatus = status"
      >
        {{ status === 'all' ? 'All' : status }}
        <span class="filter-count">{{ taskCounts[status] }}</span>
      </button>
    </div>

    <div v-if="loading" class="loading">Loading tasks...</div>

    <div v-else class="task-list">
      <div
        v-for="task in filteredTasks"
        :key="task.id"
        class="card task-card"
      >
        <div class="task-header">
          <div class="task-title-row">
            <button
              class="status-toggle"
              :class="'toggle-' + task.status"
              :title="'Click to advance status'"
              @click="cycleStatus(task)"
            >
              <span v-if="task.status === 'done'">&#10003;</span>
              <span v-else-if="task.status === 'blocked'">!</span>
              <span v-else>&nbsp;</span>
            </button>
            <h3 class="task-title" :class="{ 'task-done': task.status === 'done' }">
              {{ task.title }}
            </h3>
          </div>
          <span class="badge" :class="'badge-' + task.status">
            {{ task.status }}
          </span>
        </div>
        <p class="task-desc">{{ task.description }}</p>
        <div class="task-meta">
          <span class="meta-tag project-tag">{{ getProjectName(task.projectId) }}</span>
          <span class="meta-tag assignee-tag">{{ getAssigneeName(task.assigneeId) }}</span>
          <span class="meta-tag priority-tag" :class="'priority-' + task.priority">
            {{ task.priority }}
          </span>
          <span v-if="task.dueDate" class="meta-tag date-tag">Due {{ task.dueDate }}</span>
        </div>
      </div>

      <div v-if="filteredTasks.length === 0" class="empty-state">
        No tasks matching this filter.
      </div>
    </div>
  </div>
</template>

<style scoped>
.tasks-view {
  padding: 32px;
  max-width: 1100px;
}

.page-header {
  margin-bottom: 20px;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.btn-primary {
  padding: 8px 16px;
  background-color: var(--accent);
  color: #050505;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  transition: opacity 0.15s ease;
}

.btn-primary:hover {
  opacity: 0.85;
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

.form-card {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 12px;
  margin-bottom: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group-grow {
  flex: 1;
}

.form-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-input {
  padding: 8px 12px;
  background-color: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 13px;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent);
}

.filter-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 6px 12px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
  transition: all 0.15s ease;
}

.filter-btn:hover {
  border-color: var(--text-muted);
  color: var(--text-primary);
}

.filter-btn.active {
  border-color: var(--accent);
  background-color: var(--accent-dim);
  color: var(--accent);
}

.filter-count {
  display: inline-block;
  margin-left: 4px;
  padding: 0 5px;
  background-color: var(--bg-hover);
  border-radius: 8px;
  font-size: 11px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  transition: border-color 0.15s ease;
}

.task-card:hover {
  border-color: var(--text-muted);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-toggle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: none;
  color: var(--text-muted);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.status-toggle:hover {
  border-color: var(--accent);
}

.toggle-done {
  border-color: var(--accent);
  background-color: var(--accent);
  color: #050505;
}

.toggle-in-progress {
  border-color: var(--info);
}

.toggle-review {
  border-color: var(--warning);
}

.toggle-blocked {
  border-color: var(--danger);
  color: var(--danger);
}

.task-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.task-done {
  text-decoration: line-through;
  color: var(--text-muted);
}

.task-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  margin-left: 32px;
}

.task-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: 32px;
}

.meta-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.project-tag {
  background-color: var(--bg-hover);
  color: var(--text-secondary);
}

.assignee-tag {
  background-color: var(--bg-hover);
  color: var(--text-secondary);
}

.priority-tag {
  text-transform: capitalize;
}

.priority-high {
  background-color: rgba(248, 113, 113, 0.15);
  color: var(--danger);
}

.priority-medium {
  background-color: rgba(250, 204, 21, 0.15);
  color: var(--warning);
}

.priority-low {
  background-color: rgba(136, 136, 136, 0.15);
  color: var(--text-secondary);
}

.date-tag {
  background-color: var(--bg-hover);
  color: var(--text-muted);
  font-family: 'Courier New', monospace;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-size: 14px;
  padding: 40px 0;
}
</style>

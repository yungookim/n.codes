<script setup>
import { ref, onMounted } from 'vue';
import { getProjects, createProject } from '../api/projects.js';
import { getMembers } from '../api/members.js';

const projects = ref([]);
const members = ref([]);
const loading = ref(true);
const showForm = ref(false);
const newProjectName = ref('');
const newProjectDescription = ref('');

onMounted(async () => {
  try {
    const [p, m] = await Promise.all([getProjects(), getMembers()]);
    projects.value = p;
    members.value = m;
  } finally {
    loading.value = false;
  }
});

function getMemberNames(memberIds) {
  return memberIds
    .map((id) => {
      const member = members.value.find((m) => m.id === id);
      return member ? member.name : id;
    })
    .join(', ');
}

async function handleCreateProject() {
  if (!newProjectName.value.trim()) return;
  const project = await createProject({
    name: newProjectName.value.trim(),
    description: newProjectDescription.value.trim()
  });
  projects.value.push(project);
  newProjectName.value = '';
  newProjectDescription.value = '';
  showForm.value = false;
}
</script>

<template>
  <div class="projects-view">
    <header class="page-header">
      <div class="header-row">
        <div>
          <h1 class="page-title">Projects</h1>
          <p class="page-subtitle">Manage and track all team projects</p>
        </div>
        <button class="btn-primary" @click="showForm = !showForm">
          {{ showForm ? 'Cancel' : '+ New Project' }}
        </button>
      </div>
    </header>

    <div v-if="showForm" class="card form-card">
      <h2 class="card-title">Create Project</h2>
      <div class="form-group">
        <label class="form-label">Project Name</label>
        <input
          v-model="newProjectName"
          type="text"
          class="form-input"
          placeholder="Enter project name..."
        />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea
          v-model="newProjectDescription"
          class="form-input form-textarea"
          placeholder="Brief description..."
          rows="3"
        ></textarea>
      </div>
      <button class="btn-primary" @click="handleCreateProject">Create Project</button>
    </div>

    <div v-if="loading" class="loading">Loading projects...</div>

    <div v-else class="project-list">
      <div
        v-for="project in projects"
        :key="project.id"
        class="card project-card"
      >
        <div class="project-header">
          <h3 class="project-name">{{ project.name }}</h3>
          <span class="badge" :class="'badge-' + project.status">
            {{ project.status }}
          </span>
        </div>
        <p class="project-desc">{{ project.description }}</p>
        <div class="project-progress">
          <div class="progress-header">
            <span class="progress-label">Progress</span>
            <span class="progress-pct">{{ project.progress }}%</span>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: project.progress + '%' }"
            ></div>
          </div>
        </div>
        <div class="project-meta">
          <div class="meta-item">
            <span class="meta-label">Tasks</span>
            <span class="meta-value">{{ project.taskCount }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Team</span>
            <span class="meta-value">{{ getMemberNames(project.memberIds) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Deadline</span>
            <span class="meta-value mono">{{ project.deadline || '--' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.projects-view {
  padding: 32px;
  max-width: 1100px;
}

.page-header {
  margin-bottom: 24px;
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
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 6px;
}

.form-input {
  width: 100%;
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

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.project-card {
  transition: border-color 0.15s ease;
}

.project-card:hover {
  border-color: var(--text-muted);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.project-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.5;
}

.project-progress {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.progress-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.progress-pct {
  font-size: 12px;
  font-weight: 600;
  color: var(--accent);
}

.progress-track {
  width: 100%;
  height: 6px;
  background-color: var(--bg-hover);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--accent);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.project-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.meta-value {
  font-size: 13px;
  color: var(--text-secondary);
}

.meta-value.mono {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}
</style>

<script setup>
defineProps({
  currentView: {
    type: String,
    required: true
  },
  user: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['navigate', 'logout']);

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '##' },
  { id: 'projects', label: 'Projects', icon: '[]' },
  { id: 'tasks', label: 'Tasks', icon: '::' },
  { id: 'members', label: 'Members', icon: '@@' }
];
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo">
        <span class="logo-mark">&lt;/&gt;</span>
        <span class="logo-text">Dashboard</span>
      </div>
    </div>

    <nav class="sidebar-nav">
      <ul class="nav-list">
        <li
          v-for="item in navItems"
          :key="item.id"
          class="nav-item"
          :class="{ active: currentView === item.id }"
          @click="emit('navigate', item.id)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </li>
      </ul>
    </nav>

    <div class="sidebar-footer" v-if="user">
      <div class="user-info">
        <div class="user-avatar">{{ user.avatar }}</div>
        <div class="user-details">
          <div class="user-name">{{ user.name }}</div>
          <div class="user-role">{{ user.role }}</div>
        </div>
      </div>
      <button class="logout-btn" @click="emit('logout')">Sign out</button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  min-width: 240px;
  height: 100vh;
  background-color: var(--bg-secondary);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
}

.sidebar-header {
  padding: 20px 16px;
  border-bottom: 1px solid var(--border);
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-mark {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
  font-family: 'Courier New', monospace;
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

.sidebar-nav {
  flex: 1;
  padding: 12px 8px;
}

.nav-list {
  list-style: none;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 14px;
  transition: all 0.15s ease;
  margin-bottom: 2px;
}

.nav-item:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background-color: var(--accent-dim);
  color: var(--accent);
}

.nav-icon {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 700;
  width: 20px;
  text-align: center;
}

.nav-label {
  font-weight: 500;
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--accent-dim);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.user-details {
  overflow: hidden;
}

.user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 11px;
  color: var(--text-muted);
}

.logout-btn {
  width: 100%;
  padding: 6px 12px;
  background: none;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-secondary);
  font-size: 12px;
  transition: all 0.15s ease;
}

.logout-btn:hover {
  border-color: var(--danger);
  color: var(--danger);
}
</style>

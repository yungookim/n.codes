<script setup>
import { ref, onMounted } from 'vue';
import Sidebar from './components/Sidebar.vue';
import Dashboard from './views/Dashboard.vue';
import Projects from './views/Projects.vue';
import Tasks from './views/Tasks.vue';
import Members from './views/Members.vue';
import { getCurrentUser, logout as apiLogout } from './api/auth.js';

const currentView = ref('dashboard');
const user = ref(null);
const authLoading = ref(true);

onMounted(async () => {
  try {
    user.value = await getCurrentUser();
  } catch {
    user.value = null;
  } finally {
    authLoading.value = false;
  }
});

function navigate(view) {
  currentView.value = view;
}

async function handleLogout() {
  await apiLogout();
  user.value = null;
}
</script>

<template>
  <div class="app-layout" v-if="!authLoading">
    <Sidebar
      :current-view="currentView"
      :user="user"
      @navigate="navigate"
      @logout="handleLogout"
    />
    <main class="main-content">
      <Dashboard v-if="currentView === 'dashboard'" />
      <Projects v-else-if="currentView === 'projects'" />
      <Tasks v-else-if="currentView === 'tasks'" />
      <Members v-else-if="currentView === 'members'" />
    </main>
  </div>
  <div v-else class="app-loading">
    <span class="loading-text">Loading...</span>
  </div>
</template>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.app-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.loading-text {
  color: var(--text-muted);
  font-size: 14px;
}
</style>

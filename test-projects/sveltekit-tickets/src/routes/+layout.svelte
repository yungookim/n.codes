<script>
  import '../app.css';
  import Sidebar from '$lib/components/Sidebar.svelte';
</script>

<div class="app-layout">
  <Sidebar />
  <main class="main-content">
    <slot />
  </main>
</div>

<style>
  .app-layout {
    display: flex;
    min-height: 100vh;
  }

  .main-content {
    margin-left: var(--sidebar-width);
    flex: 1;
    padding: 32px;
    max-width: calc(100vw - var(--sidebar-width));
  }
</style>

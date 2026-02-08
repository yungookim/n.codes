<script>
  import { page } from '$app/stores';

  const navItems = [
    { href: '/', label: 'Dashboard', icon: 'grid' },
    { href: '/tickets', label: 'Tickets', icon: 'list' }
  ];

  const iconPaths = {
    grid: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
    list: 'M4 6h16M4 12h16M4 18h16'
  };
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <span class="logo-icon">S</span>
    <span class="logo-text">Tickets</span>
  </div>

  <div class="sidebar-user">
    <div class="user-avatar">JD</div>
    <div class="user-info">
      <span class="user-name">Jane Doe</span>
      <span class="user-role">Support Lead</span>
    </div>
  </div>

  <nav class="sidebar-nav">
    {#each navItems as item}
      <a
        href={item.href}
        class="nav-item"
        class:active={$page.url.pathname === item.href || (item.href === '/tickets' && $page.url.pathname.startsWith('/tickets'))}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d={iconPaths[item.icon]} />
        </svg>
        <span>{item.label}</span>
      </a>
    {/each}
  </nav>

  <div class="sidebar-footer">
    <div class="auth-status">
      <span class="auth-dot"></span>
      <span>Authenticated</span>
    </div>
  </div>
</aside>

<style>
  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: var(--sidebar-width);
    height: 100vh;
    background: var(--bg-secondary);
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    z-index: 100;
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--accent-dim);
    color: var(--accent);
    border-radius: var(--radius-sm);
    font-weight: 700;
    font-size: 0.9rem;
  }

  .logo-text {
    font-weight: 600;
    font-size: 1.1rem;
    color: var(--text-primary);
  }

  .sidebar-user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
  }

  .user-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .user-info {
    display: flex;
    flex-direction: column;
  }

  .user-name {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .user-role {
    font-size: 0.75rem;
    color: var(--text-secondary);
  }

  .sidebar-nav {
    flex: 1;
    padding: 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: var(--radius);
    color: var(--text-secondary);
    font-size: 0.9rem;
    transition: all 0.15s ease;
  }

  .nav-item:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .nav-item.active {
    background: var(--accent-dim);
    color: var(--accent);
  }

  .sidebar-footer {
    padding: 16px;
    border-top: 1px solid var(--border-color);
  }

  .auth-status {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .auth-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
  }
</style>

<script>
  import { onMount } from 'svelte';

  let tickets = [];
  let loading = true;

  onMount(async () => {
    const res = await fetch('/api/tickets');
    tickets = await res.json();
    loading = false;
  });

  $: openCount = tickets.filter(t => t.status === 'open').length;
  $: inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
  $: resolvedCount = tickets.filter(t => t.status === 'resolved').length;
  $: recentTickets = tickets.slice(0, 4);

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
</script>

<div class="dashboard">
  <div class="page-header">
    <h1>Dashboard</h1>
    <p class="page-subtitle">Support ticket overview</p>
  </div>

  {#if loading}
    <p class="loading-text">Loading tickets...</p>
  {:else}
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Open</div>
        <div class="stat-value stat-open">{openCount}</div>
        <div class="stat-bar stat-bar-open"></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">In Progress</div>
        <div class="stat-value stat-in-progress">{inProgressCount}</div>
        <div class="stat-bar stat-bar-in-progress"></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Resolved</div>
        <div class="stat-value stat-resolved">{resolvedCount}</div>
        <div class="stat-bar stat-bar-resolved"></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total</div>
        <div class="stat-value">{tickets.length}</div>
        <div class="stat-bar stat-bar-total"></div>
      </div>
    </div>

    <div class="section">
      <div class="section-header">
        <h2>Recent Tickets</h2>
        <a href="/tickets" class="view-all">View all</a>
      </div>
      <div class="tickets-list">
        {#each recentTickets as ticket}
          <a href="/tickets/{ticket.id}" class="ticket-row">
            <div class="ticket-main">
              <span class="ticket-id">#{ticket.id}</span>
              <span class="ticket-title">{ticket.title}</span>
            </div>
            <div class="ticket-meta">
              <span class="badge badge-priority-{ticket.priority}">{ticket.priority}</span>
              <span class="badge badge-status-{ticket.status}">{ticket.status.replace('-', ' ')}</span>
              <span class="ticket-date">{formatDate(ticket.createdAt)}</span>
            </div>
          </a>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard {
    max-width: 960px;
  }

  .page-header {
    margin-bottom: 32px;
  }

  .page-header h1 {
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .page-subtitle {
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  .loading-text {
    color: var(--text-secondary);
    padding: 40px 0;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 40px;
  }

  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 20px;
    position: relative;
    overflow: hidden;
  }

  .stat-label {
    font-size: 0.85rem;
    color: var(--text-secondary);
    margin-bottom: 8px;
  }

  .stat-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
  }

  .stat-open { color: var(--status-open); }
  .stat-in-progress { color: var(--status-in-progress); }
  .stat-resolved { color: var(--status-resolved); }

  .stat-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
  }

  .stat-bar-open { background: var(--status-open); }
  .stat-bar-in-progress { background: var(--status-in-progress); }
  .stat-bar-resolved { background: var(--status-resolved); }
  .stat-bar-total { background: var(--accent); }

  .section {
    margin-bottom: 32px;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .section-header h2 {
    font-size: 1.2rem;
    font-weight: 600;
  }

  .view-all {
    font-size: 0.85rem;
    color: var(--accent);
  }

  .tickets-list {
    display: flex;
    flex-direction: column;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .ticket-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
    transition: background 0.15s ease;
  }

  .ticket-row:last-child {
    border-bottom: none;
  }

  .ticket-row:hover {
    background: var(--bg-tertiary);
  }

  .ticket-main {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ticket-id {
    color: var(--text-muted);
    font-size: 0.85rem;
    font-family: monospace;
  }

  .ticket-title {
    font-size: 0.95rem;
  }

  .ticket-meta {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ticket-date {
    color: var(--text-secondary);
    font-size: 0.8rem;
    min-width: 90px;
    text-align: right;
  }
</style>

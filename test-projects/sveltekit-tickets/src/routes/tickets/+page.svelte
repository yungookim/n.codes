<script>
  import { onMount } from 'svelte';

  let tickets = [];
  let loading = true;
  let activeFilter = 'all';

  const filters = ['all', 'open', 'in-progress', 'resolved'];

  onMount(async () => {
    const res = await fetch('/api/tickets');
    tickets = await res.json();
    loading = false;
  });

  $: filteredTickets = activeFilter === 'all'
    ? tickets
    : tickets.filter(t => t.status === activeFilter);

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function filterLabel(f) {
    if (f === 'all') return 'All';
    if (f === 'in-progress') return 'In Progress';
    return f.charAt(0).toUpperCase() + f.slice(1);
  }

  function filterCount(f) {
    if (f === 'all') return tickets.length;
    return tickets.filter(t => t.status === f).length;
  }
</script>

<div class="tickets-page">
  <div class="page-header">
    <h1>Tickets</h1>
    <p class="page-subtitle">All support tickets</p>
  </div>

  {#if loading}
    <p class="loading-text">Loading tickets...</p>
  {:else}
    <div class="filters">
      {#each filters as f}
        <button
          class="filter-btn"
          class:active={activeFilter === f}
          on:click={() => activeFilter = f}
        >
          {filterLabel(f)}
          <span class="filter-count">{filterCount(f)}</span>
        </button>
      {/each}
    </div>

    <div class="tickets-table">
      <div class="table-header">
        <span class="col-id">ID</span>
        <span class="col-title">Title</span>
        <span class="col-assignee">Assignee</span>
        <span class="col-priority">Priority</span>
        <span class="col-status">Status</span>
        <span class="col-date">Created</span>
      </div>
      {#each filteredTickets as ticket}
        <a href="/tickets/{ticket.id}" class="table-row">
          <span class="col-id ticket-id">#{ticket.id}</span>
          <span class="col-title ticket-title">{ticket.title}</span>
          <span class="col-assignee">{ticket.assignee}</span>
          <span class="col-priority">
            <span class="badge badge-priority-{ticket.priority}">{ticket.priority}</span>
          </span>
          <span class="col-status">
            <span class="badge badge-status-{ticket.status}">{ticket.status.replace('-', ' ')}</span>
          </span>
          <span class="col-date">{formatDate(ticket.createdAt)}</span>
        </a>
      {:else}
        <div class="empty-state">No tickets match the selected filter.</div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .tickets-page {
    max-width: 1100px;
  }

  .page-header {
    margin-bottom: 24px;
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

  .filters {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    color: var(--text-secondary);
    font-size: 0.85rem;
    transition: all 0.15s ease;
  }

  .filter-btn:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .filter-btn.active {
    background: var(--accent-dim);
    border-color: rgba(74, 222, 128, 0.2);
    color: var(--accent);
  }

  .filter-count {
    background: var(--bg-tertiary);
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 0.75rem;
  }

  .filter-btn.active .filter-count {
    background: rgba(74, 222, 128, 0.15);
  }

  .tickets-table {
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    overflow: hidden;
  }

  .table-header {
    display: grid;
    grid-template-columns: 60px 1fr 120px 100px 120px 100px;
    gap: 12px;
    padding: 12px 16px;
    background: var(--bg-secondary);
    border-bottom: 1px solid var(--border-color);
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 500;
  }

  .table-row {
    display: grid;
    grid-template-columns: 60px 1fr 120px 100px 120px 100px;
    gap: 12px;
    padding: 14px 16px;
    background: var(--bg-card);
    border-bottom: 1px solid var(--border-color);
    color: var(--text-primary);
    font-size: 0.9rem;
    align-items: center;
    transition: background 0.15s ease;
  }

  .table-row:last-child {
    border-bottom: none;
  }

  .table-row:hover {
    background: var(--bg-tertiary);
  }

  .ticket-id {
    font-family: monospace;
    color: var(--text-muted);
    font-size: 0.85rem;
  }

  .ticket-title {
    font-weight: 500;
  }

  .col-assignee {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }

  .col-date {
    color: var(--text-secondary);
    font-size: 0.8rem;
  }

  .empty-state {
    padding: 40px;
    text-align: center;
    color: var(--text-secondary);
    background: var(--bg-card);
  }
</style>

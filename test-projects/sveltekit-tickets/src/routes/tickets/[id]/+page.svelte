<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let ticket = null;
  let comments = [];
  let loading = true;
  let newComment = '';
  let submitting = false;

  $: ticketId = $page.params.id;

  onMount(async () => {
    const [ticketRes, commentsRes] = await Promise.all([
      fetch(`/api/tickets/${ticketId}`),
      fetch(`/api/tickets/${ticketId}/comments`)
    ]);
    ticket = await ticketRes.json();
    comments = await commentsRes.json();
    loading = false;
  });

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async function submitComment() {
    if (!newComment.trim() || submitting) return;
    submitting = true;
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: newComment, author: 'Jane Doe' })
    });
    const comment = await res.json();
    comments = [...comments, comment];
    newComment = '';
    submitting = false;
  }

  async function updateStatus(newStatus) {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    ticket = await res.json();
  }
</script>

<div class="ticket-detail">
  {#if loading}
    <p class="loading-text">Loading ticket...</p>
  {:else if ticket}
    <div class="breadcrumb">
      <a href="/tickets">Tickets</a>
      <span class="breadcrumb-sep">/</span>
      <span>#{ticket.id}</span>
    </div>

    <div class="ticket-header">
      <div class="ticket-header-main">
        <h1>{ticket.title}</h1>
        <div class="ticket-badges">
          <span class="badge badge-priority-{ticket.priority}">{ticket.priority}</span>
          <span class="badge badge-status-{ticket.status}">{ticket.status.replace('-', ' ')}</span>
        </div>
      </div>
      <div class="status-actions">
        {#if ticket.status !== 'open'}
          <button class="status-btn" on:click={() => updateStatus('open')}>Reopen</button>
        {/if}
        {#if ticket.status !== 'in-progress'}
          <button class="status-btn" on:click={() => updateStatus('in-progress')}>Start Progress</button>
        {/if}
        {#if ticket.status !== 'resolved'}
          <button class="status-btn btn-resolve" on:click={() => updateStatus('resolved')}>Resolve</button>
        {/if}
      </div>
    </div>

    <div class="ticket-body">
      <div class="ticket-content">
        <div class="detail-section">
          <h3>Description</h3>
          <p class="description">{ticket.description}</p>
        </div>

        <div class="detail-section">
          <h3>Comments ({comments.length})</h3>
          <div class="comments-list">
            {#each comments as comment}
              <div class="comment">
                <div class="comment-header">
                  <div class="comment-avatar">{comment.author.split(' ').map(n => n[0]).join('')}</div>
                  <div class="comment-meta">
                    <span class="comment-author">{comment.author}</span>
                    <span class="comment-date">{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
                <p class="comment-body">{comment.body}</p>
              </div>
            {:else}
              <p class="no-comments">No comments yet.</p>
            {/each}
          </div>

          <div class="comment-form">
            <textarea
              bind:value={newComment}
              placeholder="Add a comment..."
              rows="3"
            ></textarea>
            <button
              class="submit-btn"
              on:click={submitComment}
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      </div>

      <div class="ticket-sidebar">
        <div class="sidebar-section">
          <span class="sidebar-label">Assignee</span>
          <span class="sidebar-value">{ticket.assignee}</span>
        </div>
        <div class="sidebar-section">
          <span class="sidebar-label">Reporter</span>
          <span class="sidebar-value">{ticket.reporter}</span>
        </div>
        <div class="sidebar-section">
          <span class="sidebar-label">Priority</span>
          <span class="sidebar-value">
            <span class="badge badge-priority-{ticket.priority}">{ticket.priority}</span>
          </span>
        </div>
        <div class="sidebar-section">
          <span class="sidebar-label">Status</span>
          <span class="sidebar-value">
            <span class="badge badge-status-{ticket.status}">{ticket.status.replace('-', ' ')}</span>
          </span>
        </div>
        <div class="sidebar-section">
          <span class="sidebar-label">Created</span>
          <span class="sidebar-value">{formatDate(ticket.createdAt)}</span>
        </div>
        <div class="sidebar-section">
          <span class="sidebar-label">Updated</span>
          <span class="sidebar-value">{formatDate(ticket.updatedAt)}</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .ticket-detail {
    max-width: 1100px;
  }

  .loading-text {
    color: var(--text-secondary);
    padding: 40px 0;
  }

  .breadcrumb {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .breadcrumb-sep {
    color: var(--text-muted);
  }

  .ticket-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 28px;
    gap: 20px;
  }

  .ticket-header-main h1 {
    font-size: 1.6rem;
    font-weight: 600;
    margin-bottom: 10px;
  }

  .ticket-badges {
    display: flex;
    gap: 8px;
  }

  .status-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
  }

  .status-btn {
    padding: 8px 16px;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    color: var(--text-secondary);
    font-size: 0.85rem;
    transition: all 0.15s ease;
  }

  .status-btn:hover {
    border-color: var(--border-hover);
    color: var(--text-primary);
  }

  .btn-resolve {
    background: var(--accent-dim);
    border-color: rgba(74, 222, 128, 0.2);
    color: var(--accent);
  }

  .btn-resolve:hover {
    background: rgba(74, 222, 128, 0.15);
  }

  .ticket-body {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 24px;
  }

  .ticket-content {
    min-width: 0;
  }

  .detail-section {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 20px;
    margin-bottom: 20px;
  }

  .detail-section h3 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-primary);
  }

  .description {
    color: var(--text-secondary);
    line-height: 1.7;
  }

  .comments-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-bottom: 20px;
  }

  .comment {
    padding: 14px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
  }

  .comment-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .comment-avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 50%;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .comment-meta {
    display: flex;
    flex-direction: column;
  }

  .comment-author {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text-primary);
  }

  .comment-date {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .comment-body {
    color: var(--text-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .no-comments {
    color: var(--text-muted);
    font-size: 0.9rem;
    padding: 12px 0;
  }

  .comment-form {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  textarea {
    width: 100%;
    padding: 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    color: var(--text-primary);
    font-family: inherit;
    font-size: 0.9rem;
    resize: vertical;
    outline: none;
    transition: border-color 0.15s ease;
  }

  textarea:focus {
    border-color: var(--accent);
  }

  .submit-btn {
    align-self: flex-end;
    padding: 10px 20px;
    background: var(--accent);
    border: none;
    border-radius: var(--radius);
    color: #050505;
    font-size: 0.85rem;
    font-weight: 600;
    transition: background 0.15s ease;
  }

  .submit-btn:hover:not(:disabled) {
    background: var(--accent-hover);
  }

  .submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ticket-sidebar {
    display: flex;
    flex-direction: column;
    gap: 0;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    padding: 4px 0;
    height: fit-content;
  }

  .sidebar-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-color);
  }

  .sidebar-section:last-child {
    border-bottom: none;
  }

  .sidebar-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .sidebar-value {
    font-size: 0.9rem;
    color: var(--text-secondary);
  }
</style>

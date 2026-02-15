'use strict';

const crypto = require('crypto');

/** Job statuses */
const STATUS = {
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CLARIFICATION: 'clarification',
};

/** Pipeline step names (ordered) */
const STEPS = ['intent', 'feasibility', 'codegen', 'review', 'iterate', 'resolve'];

/** Default TTL: 10 minutes */
const DEFAULT_TTL_MS = 10 * 60 * 1000;

/** Cleanup interval: 1 minute */
const CLEANUP_INTERVAL_MS = 60 * 1000;

class JobStore {
  constructor(options = {}) {
    this._jobs = new Map();
    this._ttl = options.ttl || DEFAULT_TTL_MS;
    this._cleanupTimer = null;
  }

  /**
   * Create a new job and return it.
   *
   * @param {string} prompt
   * @param {string} provider
   * @param {string} model
   * @returns {{ id: string, status: string, step: string|null, prompt: string, provider: string, model: string, createdAt: number, result: object|null, error: string|null }}
   */
  createJob(prompt, provider, model) {
    const id = crypto.randomUUID();
    const job = {
      id,
      status: STATUS.RUNNING,
      step: null,
      prompt,
      provider,
      model,
      createdAt: Date.now(),
      result: null,
      error: null,
    };
    this._jobs.set(id, job);
    this._ensureCleanup();
    return job;
  }

  /**
   * Get a job by ID.
   *
   * @param {string} id
   * @returns {object|null}
   */
  getJob(id) {
    return this._jobs.get(id) || null;
  }

  /**
   * Update a job with partial data.
   *
   * @param {string} id
   * @param {object} updates
   */
  updateJob(id, updates) {
    const job = this._jobs.get(id);
    if (!job) return;
    Object.assign(job, updates);
  }

  /**
   * Delete a job.
   *
   * @param {string} id
   */
  deleteJob(id) {
    this._jobs.delete(id);
  }

  /**
   * Get the number of active jobs.
   *
   * @returns {number}
   */
  get size() {
    return this._jobs.size;
  }

  /**
   * Remove expired jobs (older than TTL).
   */
  cleanup() {
    const now = Date.now();
    for (const [id, job] of this._jobs) {
      if (now - job.createdAt > this._ttl) {
        this._jobs.delete(id);
      }
    }
  }

  /**
   * Stop the cleanup timer (for graceful shutdown or testing).
   */
  destroy() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
    this._jobs.clear();
  }

  /** Start cleanup interval if not already running. */
  _ensureCleanup() {
    if (this._cleanupTimer) return;
    this._cleanupTimer = setInterval(() => this.cleanup(), CLEANUP_INTERVAL_MS);
    // Don't keep the process alive just for cleanup
    if (this._cleanupTimer.unref) {
      this._cleanupTimer.unref();
    }
  }
}

// Singleton instance used by the server
const jobStore = new JobStore();

module.exports = {
  jobStore,
  JobStore,
  STATUS,
  STEPS,
  DEFAULT_TTL_MS,
};

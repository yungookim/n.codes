'use strict';

const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { JobStore, STATUS, STEPS, DEFAULT_TTL_MS } = require('../lib/job-store');

describe('JobStore', () => {
  let store;

  afterEach(() => {
    if (store) store.destroy();
  });

  describe('createJob', () => {
    it('creates a job with a unique id and running status', () => {
      store = new JobStore();
      const job = store.createJob('show tasks', 'openai', 'gpt-5-mini');
      assert.ok(job.id);
      assert.equal(job.status, STATUS.RUNNING);
      assert.equal(job.step, null);
      assert.equal(job.prompt, 'show tasks');
      assert.equal(job.provider, 'openai');
      assert.equal(job.model, 'gpt-5-mini');
      assert.equal(job.result, null);
      assert.equal(job.error, null);
      assert.ok(job.createdAt > 0);
    });

    it('generates unique ids for different jobs', () => {
      store = new JobStore();
      const job1 = store.createJob('a', 'openai', 'gpt-5-mini');
      const job2 = store.createJob('b', 'openai', 'gpt-5-mini');
      assert.notEqual(job1.id, job2.id);
    });
  });

  describe('getJob', () => {
    it('returns the job by id', () => {
      store = new JobStore();
      const job = store.createJob('test', 'openai', 'gpt-5-mini');
      const retrieved = store.getJob(job.id);
      assert.equal(retrieved.id, job.id);
      assert.equal(retrieved.prompt, 'test');
    });

    it('returns null for unknown id', () => {
      store = new JobStore();
      assert.equal(store.getJob('nonexistent'), null);
    });
  });

  describe('updateJob', () => {
    it('updates job fields', () => {
      store = new JobStore();
      const job = store.createJob('test', 'openai', 'gpt-5-mini');
      store.updateJob(job.id, { status: STATUS.COMPLETED, step: null, result: { html: '<h1>Hi</h1>' } });
      const updated = store.getJob(job.id);
      assert.equal(updated.status, STATUS.COMPLETED);
      assert.equal(updated.step, null);
      assert.deepEqual(updated.result, { html: '<h1>Hi</h1>' });
    });

    it('does not throw for unknown id', () => {
      store = new JobStore();
      assert.doesNotThrow(() => store.updateJob('unknown', { status: 'failed' }));
    });

    it('can update step during running', () => {
      store = new JobStore();
      const job = store.createJob('test', 'openai', 'gpt-5-mini');
      store.updateJob(job.id, { step: 'codegen' });
      assert.equal(store.getJob(job.id).step, 'codegen');
    });
  });

  describe('deleteJob', () => {
    it('removes the job', () => {
      store = new JobStore();
      const job = store.createJob('test', 'openai', 'gpt-5-mini');
      store.deleteJob(job.id);
      assert.equal(store.getJob(job.id), null);
    });

    it('does not throw for unknown id', () => {
      store = new JobStore();
      assert.doesNotThrow(() => store.deleteJob('unknown'));
    });
  });

  describe('size', () => {
    it('returns the number of jobs', () => {
      store = new JobStore();
      assert.equal(store.size, 0);
      store.createJob('a', 'openai', 'gpt-5-mini');
      assert.equal(store.size, 1);
      store.createJob('b', 'openai', 'gpt-5-mini');
      assert.equal(store.size, 2);
    });
  });

  describe('cleanup', () => {
    it('removes expired jobs', () => {
      store = new JobStore({ ttl: 100 });
      const job = store.createJob('test', 'openai', 'gpt-5-mini');
      // Manually backdate the job
      store.getJob(job.id).createdAt = Date.now() - 200;
      store.cleanup();
      assert.equal(store.getJob(job.id), null);
    });

    it('keeps non-expired jobs', () => {
      store = new JobStore({ ttl: 10000 });
      const job = store.createJob('test', 'openai', 'gpt-5-mini');
      store.cleanup();
      assert.ok(store.getJob(job.id));
    });
  });

  describe('destroy', () => {
    it('clears all jobs and stops cleanup timer', () => {
      store = new JobStore();
      store.createJob('test', 'openai', 'gpt-5-mini');
      store.destroy();
      assert.equal(store.size, 0);
    });
  });
});

describe('STATUS constants', () => {
  it('has expected values', () => {
    assert.equal(STATUS.RUNNING, 'running');
    assert.equal(STATUS.COMPLETED, 'completed');
    assert.equal(STATUS.FAILED, 'failed');
    assert.equal(STATUS.CLARIFICATION, 'clarification');
  });
});

describe('STEPS', () => {
  it('has the expected pipeline steps in order', () => {
    assert.deepEqual(STEPS, ['intent', 'feasibility', 'codegen', 'review', 'iterate', 'resolve']);
  });
});

describe('DEFAULT_TTL_MS', () => {
  it('is 10 minutes', () => {
    assert.equal(DEFAULT_TTL_MS, 10 * 60 * 1000);
  });
});

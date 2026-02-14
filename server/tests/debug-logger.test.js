'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Use a temp directory for tests
const tmpDir = path.join(os.tmpdir(), 'ncodes-debug-test-' + Date.now());

describe('debug-logger', () => {

  let origCwd, origEnv;

  beforeEach(() => {
    origCwd = process.cwd;
    origEnv = process.env.DEBUG_NCODES;
    process.cwd = () => tmpDir;
    process.env.DEBUG_NCODES = '1';
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    process.cwd = origCwd;
    process.env.DEBUG_NCODES = origEnv;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  // Re-require after mocking cwd
  function loadModule() {
    const modulePath = require.resolve('../lib/debug-logger');
    delete require.cache[modulePath];
    return require('../lib/debug-logger');
  }

  it('isEnabled returns true when DEBUG_NCODES=1', () => {
    const { isEnabled } = loadModule();
    assert.equal(isEnabled(), true);
  });

  it('isEnabled returns false when env is not set and not in test-projects', () => {
    delete process.env.DEBUG_NCODES;
    process.cwd = () => '/some/other/path';
    const { isEnabled } = loadModule();
    assert.equal(isEnabled(), false);
  });

  it('isEnabled returns true when cwd includes test-projects', () => {
    delete process.env.DEBUG_NCODES;
    process.cwd = () => '/home/user/test-projects/express-tasks';
    const { isEnabled } = loadModule();
    assert.equal(isEnabled(), true);
  });

  it('writes debug artifacts to disk', async () => {
    const { writeDebugArtifacts } = loadModule();

    await writeDebugArtifacts('job-123', 'show tasks', 'openai', 'gpt-5-mini', {
      html: '<div>tasks</div>',
      css: '.task { color: red; }',
      js: 'console.log("init")',
      apiBindings: [{ type: 'query', ref: 'listTasks', resolved: { method: 'GET', path: '/api/tasks' } }],
      iterations: 2,
    });

    const debugDir = path.join(tmpDir, '.n.codes', 'debug', 'job-123');
    assert.ok(fs.existsSync(path.join(debugDir, 'generated.html')));
    assert.ok(fs.existsSync(path.join(debugDir, 'generated.css')));
    assert.ok(fs.existsSync(path.join(debugDir, 'generated.js')));
    assert.ok(fs.existsSync(path.join(debugDir, 'api-bindings.json')));
    assert.ok(fs.existsSync(path.join(debugDir, 'meta.json')));

    assert.equal(fs.readFileSync(path.join(debugDir, 'generated.html'), 'utf8'), '<div>tasks</div>');
    assert.equal(fs.readFileSync(path.join(debugDir, 'generated.css'), 'utf8'), '.task { color: red; }');
    assert.equal(fs.readFileSync(path.join(debugDir, 'generated.js'), 'utf8'), 'console.log("init")');

    const meta = JSON.parse(fs.readFileSync(path.join(debugDir, 'meta.json'), 'utf8'));
    assert.equal(meta.prompt, 'show tasks');
    assert.equal(meta.provider, 'openai');
    assert.equal(meta.model, 'gpt-5-mini');
    assert.equal(meta.iterations, 2);
    assert.ok(meta.timestamp);
  });

  it('skips writing when disabled', async () => {
    delete process.env.DEBUG_NCODES;
    process.cwd = () => '/some/other/path';
    const { writeDebugArtifacts } = loadModule();

    await writeDebugArtifacts('job-skip', 'test', 'openai', 'gpt-5-mini', {
      html: '<p>Hi</p>', css: '', js: '', iterations: 1,
    });

    const debugDir = path.join('/some/other/path', '.n.codes', 'debug', 'job-skip');
    assert.ok(!fs.existsSync(debugDir));
  });

  it('handles missing optional content gracefully', async () => {
    const { writeDebugArtifacts } = loadModule();

    await writeDebugArtifacts('job-minimal', 'test', 'openai', 'gpt-5-mini', {
      html: '<p>Hi</p>',
      css: '',
      js: '',
      iterations: 1,
    });

    const debugDir = path.join(tmpDir, '.n.codes', 'debug', 'job-minimal');
    assert.ok(fs.existsSync(path.join(debugDir, 'generated.html')));
    assert.ok(fs.existsSync(path.join(debugDir, 'meta.json')));
    // Empty css/js should not be written
    assert.ok(!fs.existsSync(path.join(debugDir, 'generated.css')));
    assert.ok(!fs.existsSync(path.join(debugDir, 'generated.js')));
  });

  it('cleans up old sessions beyond MAX_SESSIONS', async () => {
    const { writeDebugArtifacts, MAX_SESSIONS } = loadModule();

    // Create MAX_SESSIONS + 5 sessions
    for (let i = 0; i < MAX_SESSIONS + 5; i++) {
      await writeDebugArtifacts(`job-cleanup-${String(i).padStart(3, '0')}`, 'test', 'openai', 'gpt-5-mini', {
        html: `<p>${i}</p>`, css: '', js: '', iterations: 1,
      });
    }

    const debugDir = path.join(tmpDir, '.n.codes', 'debug');
    const remaining = fs.readdirSync(debugDir).filter(e =>
      fs.statSync(path.join(debugDir, e)).isDirectory()
    );

    assert.ok(remaining.length <= MAX_SESSIONS, `Expected at most ${MAX_SESSIONS} sessions, got ${remaining.length}`);
  });
});

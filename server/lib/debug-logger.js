'use strict';

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const MAX_SESSIONS = 20;

/**
 * Resolve the debug directory based on the current working directory.
 * Computed per-call (not at module load) so it respects cwd changes in tests.
 */
function getDebugDir() {
  return path.join(process.cwd(), '.n.codes', 'debug');
}

/**
 * Check whether debug writing is enabled.
 * Enabled when DEBUG_NCODES=1 or when cwd looks like a test-project.
 */
function isEnabled() {
  if (process.env.DEBUG_NCODES === '1') return true;
  if (process.cwd().includes('test-projects')) return true;
  return false;
}

/**
 * Write generated UI artifacts to disk for post-mortem debugging.
 *
 * @param {string} jobId
 * @param {string} prompt - Original user prompt
 * @param {string} provider
 * @param {string} model
 * @param {object} result - Pipeline result { html, css, js, apiBindings, iterations }
 */
async function writeDebugArtifacts(jobId, prompt, provider, model, result) {
  if (!isEnabled()) return;

  const debugDir = getDebugDir();
  const jobDir = path.join(debugDir, jobId);

  try {
    await fsp.mkdir(jobDir, { recursive: true });

    const writes = [];

    if (result.html) writes.push(fsp.writeFile(path.join(jobDir, 'generated.html'), result.html));
    if (result.css) writes.push(fsp.writeFile(path.join(jobDir, 'generated.css'), result.css));
    if (result.js) writes.push(fsp.writeFile(path.join(jobDir, 'generated.js'), result.js));

    if (result.apiBindings) {
      writes.push(fsp.writeFile(
        path.join(jobDir, 'api-bindings.json'),
        JSON.stringify(result.apiBindings, null, 2)
      ));
    }

    writes.push(fsp.writeFile(
      path.join(jobDir, 'meta.json'),
      JSON.stringify({
        prompt,
        provider,
        model,
        timestamp: new Date().toISOString(),
        iterations: result.iterations || 1,
        htmlLen: result.html?.length || 0,
        cssLen: result.css?.length || 0,
        jsLen: result.js?.length || 0,
      }, null, 2)
    ));

    await Promise.all(writes);

    await cleanupOldSessions(debugDir);

    console.log('[n.codes:debug] artifacts written to', jobDir);
  } catch (err) {
    console.warn('[n.codes:debug] failed to write artifacts:', err.message);
  }
}

/**
 * Remove oldest debug sessions, keeping only MAX_SESSIONS.
 */
async function cleanupOldSessions(debugDir) {
  try {
    const dir = debugDir || getDebugDir();
    if (!fs.existsSync(dir)) return;

    const dirents = await fsp.readdir(dir, { withFileTypes: true });
    const dirs = dirents.filter(e => e.isDirectory());

    const entries = await Promise.all(dirs.map(async (e) => {
      const metaPath = path.join(dir, e.name, 'meta.json');
      try {
        const meta = JSON.parse(await fsp.readFile(metaPath, 'utf8'));
        return { name: e.name, timestamp: meta.timestamp || '' };
      } catch {
        return { name: e.name, timestamp: '' };
      }
    }));

    entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    while (entries.length > MAX_SESSIONS) {
      const oldest = entries.shift();
      const dirPath = path.join(dir, oldest.name);
      await fsp.rm(dirPath, { recursive: true, force: true });
    }
  } catch {
    // cleanup is best-effort
  }
}

module.exports = { writeDebugArtifacts, isEnabled, MAX_SESSIONS };

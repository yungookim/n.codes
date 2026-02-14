'use strict';

const fs = require('fs');
const path = require('path');

const DEBUG_DIR = path.join(process.cwd(), '.n.codes', 'debug');
const MAX_SESSIONS = 20;

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

  const jobDir = path.join(DEBUG_DIR, jobId);

  try {
    fs.mkdirSync(jobDir, { recursive: true });

    if (result.html) fs.writeFileSync(path.join(jobDir, 'generated.html'), result.html);
    if (result.css) fs.writeFileSync(path.join(jobDir, 'generated.css'), result.css);
    if (result.js) fs.writeFileSync(path.join(jobDir, 'generated.js'), result.js);

    if (result.apiBindings) {
      fs.writeFileSync(
        path.join(jobDir, 'api-bindings.json'),
        JSON.stringify(result.apiBindings, null, 2)
      );
    }

    fs.writeFileSync(
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
    );

    cleanupOldSessions();

    console.log('[n.codes:debug] artifacts written to', jobDir);
  } catch (err) {
    console.warn('[n.codes:debug] failed to write artifacts:', err.message);
  }
}

/**
 * Remove oldest debug sessions, keeping only MAX_SESSIONS.
 */
function cleanupOldSessions() {
  try {
    if (!fs.existsSync(DEBUG_DIR)) return;

    const entries = fs.readdirSync(DEBUG_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => ({
        name: e.name,
        metaPath: path.join(DEBUG_DIR, e.name, 'meta.json'),
      }))
      .map(e => {
        try {
          const meta = JSON.parse(fs.readFileSync(e.metaPath, 'utf8'));
          return { name: e.name, timestamp: meta.timestamp || '' };
        } catch {
          return { name: e.name, timestamp: '' };
        }
      })
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    while (entries.length > MAX_SESSIONS) {
      const oldest = entries.shift();
      const dirPath = path.join(DEBUG_DIR, oldest.name);
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch {
    // cleanup is best-effort
  }
}

module.exports = { writeDebugArtifacts, isEnabled, MAX_SESSIONS };

const { PostHog } = require('posthog-node');
const os = require('os');
const path = require('path');
const fs = require('fs');

let client = null;
const POSTHOG_API_KEY = 'phc_7KZJvMd8f3VvFhbMHfnFEFHRBb6WGzl6aYaQIGQJdEz';

/**
 * Get or create a unique identifier for this user/machine
 */
function getAnonymousId() {
  const homeDir = os.homedir();
  const idFile = path.join(homeDir, '.n-codes-id');
  
  try {
    if (fs.existsSync(idFile)) {
      return fs.readFileSync(idFile, 'utf-8').trim();
    }
  } catch (e) {
    // If we can't read, generate a new one
  }

  // Generate a unique ID based on machine hostname + home dir
  const crypto = require('crypto');
  const machineId = crypto.createHash('sha256')
    .update(os.hostname() + homeDir + os.platform())
    .digest('hex')
    .substring(0, 16);

  try {
    fs.writeFileSync(idFile, machineId, 'utf-8');
  } catch (e) {
    // Silently fail if we can't write - still use the ID
  }

  return machineId;
}

/**
 * Initialize PostHog client
 */
function initPostHog() {
  if (!client) {
    client = new PostHog(POSTHOG_API_KEY, {
      host: 'https://us.posthog.com',
      flushInterval: 30000, // Flush every 30 seconds
      requestTimeout: 5000, // 5 second timeout to not block CLI
    });
  }
  return client;
}

/**
 * Track a command execution
 */
function trackCommand(command, args = {}, properties = {}) {
  // Check if user has opted out
  if (process.env.N_CODES_DISABLE_ANALYTICS) {
    return;
  }

  try {
    const ph = initPostHog();
    const distinctId = getAnonymousId();

    ph.capture({
      distinctId,
      event: `cli_${command}`,
      properties: {
        command,
        node_version: process.version,
        platform: os.platform(),
        arch: os.arch(),
        ...properties,
      },
    });
  } catch (e) {
    // Silently fail - never let tracking break the CLI
  }
}

/**
 * Track an error/exception
 */
function trackError(command, error) {
  // Check if user has opted out
  if (process.env.N_CODES_DISABLE_ANALYTICS) {
    return;
  }

  try {
    const ph = initPostHog();
    const distinctId = getAnonymousId();

    ph.capture({
      distinctId,
      event: 'cli_error',
      properties: {
        command,
        error_message: error.message,
        error_stack: error.stack?.split('\n').slice(0, 3).join(' | '),
        platform: os.platform(),
      },
    });
  } catch (e) {
    // Silently fail
  }
}

/**
 * Flush any pending analytics
 */
async function flushPostHog() {
  if (client) {
    return new Promise((resolve) => {
      client.flush(() => resolve());
    });
  }
}

module.exports = {
  trackCommand,
  trackError,
  flushPostHog,
  getAnonymousId,
};

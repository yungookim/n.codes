/**
 * API client for the n.codes generate endpoint.
 * Handles retries, timeouts, and error classification.
 */

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

/**
 * Call POST /api/generate with retry and timeout logic.
 *
 * @param {string} apiUrl - API endpoint URL
 * @param {object} body - Request body { prompt, provider, model }
 * @param {object} [options]
 * @param {number} [options.timeout] - Request timeout in ms (default 30000)
 * @param {number} [options.maxRetries] - Max retries (default 3)
 * @param {function} [options.fetchFn] - Custom fetch function (for testing)
 * @returns {Promise<{ dsl: object, reasoning: string, tokensUsed: number }>}
 * @throws {GenerateError}
 */
async function callGenerateAPI(apiUrl, body, options = {}) {
  const {
    timeout = DEFAULT_TIMEOUT,
    maxRetries = MAX_RETRIES,
    fetchFn,
  } = options;
  const doFetch = fetchFn || globalThis.fetch;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delay = BASE_DELAY * Math.pow(2, attempt - 1);
      await sleep(delay);
    }

    try {
      const result = await fetchWithTimeout(doFetch, apiUrl, body, timeout);
      return result;
    } catch (err) {
      lastError = err;
      // Don't retry client errors (4xx) — they won't succeed on retry
      if (err instanceof GenerateError && err.status >= 400 && err.status < 500) {
        throw err;
      }
      // Retry on network errors, timeouts, and server errors (5xx)
    }
  }

  throw lastError;
}

async function fetchWithTimeout(doFetch, apiUrl, body, timeout) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await doFetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = classifyError(response.status, errorData);
      throw new GenerateError(message, response.status, errorData);
    }

    return response.json();
  } catch (err) {
    if (err instanceof GenerateError) throw err;
    if (err.name === 'AbortError') {
      throw new GenerateError('Request timed out. The AI is taking too long to respond.', 0, null);
    }
    throw new GenerateError(
      'Network error. Please check your connection and try again.',
      0,
      null
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Map HTTP status + error data to a user-friendly message.
 */
function classifyError(status, errorData) {
  const serverMsg = errorData && errorData.error;

  if (status === 401) {
    return 'API key is missing or invalid. Please check your configuration.';
  }
  if (status === 400) {
    return serverMsg || 'Invalid request. Please try a different prompt.';
  }
  if (status === 422) {
    return 'The AI generated an invalid response. Please try again.';
  }
  if (status === 429) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }
  if (status >= 500) {
    return 'Server error. The AI service may be temporarily unavailable.';
  }
  return serverMsg || `Unexpected error (${status}).`;
}

class GenerateError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'GenerateError';
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_POLL_INTERVAL = 2000;
const DEFAULT_MAX_POLL_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Poll GET /api/jobs/:jobId until the job completes, fails, or needs clarification.
 *
 * @param {string} apiUrl - Base API URL (e.g., "http://localhost:3001")
 * @param {string} jobId - Job ID returned from POST /api/generate
 * @param {object} [options]
 * @param {number} [options.interval] - Poll interval in ms (default 2000)
 * @param {number} [options.maxDuration] - Max total poll duration in ms (default 5 min)
 * @param {function} [options.onProgress] - Callback: onProgress(step) for UI updates
 * @param {function} [options.fetchFn] - Custom fetch function (for testing)
 * @returns {Promise<object>} - Resolved result or clarification data
 * @throws {GenerateError}
 */
async function pollJobStatus(apiUrl, jobId, options = {}) {
  const {
    interval = DEFAULT_POLL_INTERVAL,
    maxDuration = DEFAULT_MAX_POLL_DURATION,
    onProgress,
    fetchFn,
  } = options;
  const doFetch = fetchFn || globalThis.fetch;

  // Normalize base URL: strip trailing /api/generate if present
  const baseUrl = apiUrl.replace(/\/api\/generate\/?$/, '');
  const pollUrl = `${baseUrl}/api/jobs/${jobId}`;

  const startTime = Date.now();

  while (true) {
    const elapsed = Date.now() - startTime;
    if (elapsed >= maxDuration) {
      throw new GenerateError(
        'Generation is taking longer than expected. Please try again.',
        0,
        null
      );
    }

    let data;
    try {
      const response = await doFetch(pollUrl);
      if (!response.ok) {
        if (response.status === 404) {
          throw new GenerateError('Job not found. It may have expired.', 404, null);
        }
        const errorData = await response.json().catch(() => ({}));
        throw new GenerateError(
          errorData.error || `Polling error (${response.status})`,
          response.status,
          errorData
        );
      }
      data = await response.json();
    } catch (err) {
      if (err instanceof GenerateError) throw err;
      throw new GenerateError(
        'Network error while checking generation status.',
        0,
        null
      );
    }

    if (data.status === 'running') {
      if (data.step && typeof onProgress === 'function') {
        onProgress(data.step);
      }
      await sleep(interval);
      continue;
    }

    if (data.status === 'completed') {
      return data.result;
    }

    if (data.status === 'clarification') {
      return data.result;
    }

    if (data.status === 'failed') {
      throw new GenerateError(
        data.error || 'Generation failed. Please try again.',
        0,
        null
      );
    }

    // Unknown status — treat as error
    throw new GenerateError(
      `Unexpected job status: ${data.status}`,
      0,
      null
    );
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  callGenerateAPI,
  pollJobStatus,
  GenerateError,
  classifyError,
  DEFAULT_TIMEOUT,
  MAX_RETRIES,
  BASE_DELAY,
  DEFAULT_POLL_INTERVAL,
  DEFAULT_MAX_POLL_DURATION,
};

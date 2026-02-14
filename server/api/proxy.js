'use strict';

const { loadCapabilityMap } = require('../lib/capability-map');
const { parseEndpoint, lookupRef } = require('../lib/capability-resolver');

/**
 * POST /api/proxy
 *
 * Proxies API calls from the widget to the host application.
 * Validates the ref against the capability map before proxying.
 *
 * Request body:
 *   { ref: string, type: 'query'|'action', params?: object, data?: object }
 *
 * Response:
 *   The proxied response data from the host app.
 */
async function handleProxy(req, res) {
  try {
    const { ref, type, params, data } = req.body;

    if (!ref || !type) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing required fields: ref, type' }));
      return;
    }

    if (type !== 'query' && type !== 'action') {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'type must be "query" or "action"' }));
      return;
    }

    const appOrigin = process.env.APP_ORIGIN;
    if (!appOrigin) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'APP_ORIGIN not configured' }));
      return;
    }

    const capabilityMap = loadCapabilityMap();
    if (!capabilityMap) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Capability map not available' }));
      return;
    }

    // Look up ref in capability map
    const entry = lookupRef(ref, type, capabilityMap);
    if (!entry) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Unknown ${type} ref "${ref}"` }));
      return;
    }

    // Parse endpoint to get method and path
    const resolved = parseEndpoint(entry.endpoint);
    if (!resolved) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Could not resolve endpoint for "${ref}"` }));
      return;
    }

    // Build the target URL
    let targetPath = resolved.path;

    // Substitute path parameters (e.g., /tasks/:id)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        targetPath = targetPath.replace(`:${key}`, encodeURIComponent(String(value)));
      }
    }

    let targetUrl = `${appOrigin.replace(/\/$/, '')}${targetPath}`;

    // For GET requests, add remaining params as query string
    if (resolved.method === 'GET' && params) {
      const queryParams = {};
      for (const [key, value] of Object.entries(params)) {
        // Skip params that were used as path params
        if (!resolved.path.includes(`:${key}`)) {
          queryParams[key] = value;
        }
      }
      const qs = new URLSearchParams(queryParams).toString();
      if (qs) {
        targetUrl += `?${qs}`;
      }
    }

    // Make the request to the host app
    const fetchOptions = {
      method: resolved.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    // Attach body for non-GET requests
    if (resolved.method !== 'GET' && data) {
      fetchOptions.body = JSON.stringify(data);
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Parse response
    const contentType = response.headers.get('content-type') || '';
    let responseData;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    // Return only the data (security boundary — no headers, no cookies)
    res.writeHead(response.status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: responseData }));
  } catch (error) {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Proxy error: ${error.message}` }));
  }
}

module.exports = {
  handleProxy
};

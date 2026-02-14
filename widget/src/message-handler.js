'use strict';

/**
 * Message handler — runs in the parent window.
 * Listens for postMessage from the sandboxed iframe,
 * validates refs against the apiBindings whitelist,
 * proxies fetch calls to the host app, and returns results.
 */

/**
 * Create a message handler for a specific iframe.
 *
 * @param {HTMLIFrameElement} iframe - The sandboxed iframe element
 * @param {Array} apiBindings - Whitelist of allowed API bindings
 *   Each: { type: 'query'|'action', ref: string, resolved: { method, path } }
 * @param {object} [options]
 * @param {function} [options.fetchFn] - Custom fetch (for testing)
 * @returns {{ start(), stop(), handler(event) }}
 */
function createMessageHandler(iframe, apiBindings, options) {
  const opts = options || {};
  const doFetch = opts.fetchFn || globalThis.fetch;

  // Build a lookup map: ref -> { type, method, path }
  const bindingsMap = {};
  if (Array.isArray(apiBindings)) {
    for (const binding of apiBindings) {
      bindingsMap[binding.ref] = {
        type: binding.type,
        method: binding.resolved.method,
        path: binding.resolved.path,
      };
    }
  }

  function handler(event) {
    if (!event.data || event.data.type !== 'ncodes:api-request') {
      // Listen for sandbox error forwarding
      if (event.data && event.data.type === 'ncodes:sandbox-error') {
        console.error('[n.codes:sandbox] Error in generated code:', event.data.message,
          'line:', event.data.lineno);
      }
      return;
    }

    // Validate source — must come from our iframe
    if (iframe.contentWindow && event.source !== iframe.contentWindow) return;

    const { id, method, ref, params, data } = event.data;
    if (!id || !ref) return;

    console.log('[n.codes:handler] request received', { id, method, ref });
    handleRequest(id, method, ref, params, data);
  }

  async function handleRequest(id, method, ref, params, data) {
    try {
      // Validate ref against whitelist
      const binding = bindingsMap[ref];
      if (!binding) {
        console.warn('[n.codes:handler] unknown ref', ref, 'available:', Object.keys(bindingsMap));
        sendResponse(id, null, 'Unknown API reference: ' + ref);
        return;
      }

      console.log('[n.codes:handler] ref resolved', { ref, path: binding.path, method: binding.method });

      // Validate method type matches
      if (method === 'query' && binding.type !== 'query') {
        sendResponse(id, null, 'Reference "' + ref + '" is not a query');
        return;
      }
      if (method === 'action' && binding.type !== 'action') {
        sendResponse(id, null, 'Reference "' + ref + '" is not an action');
        return;
      }

      // Build fetch options
      const fetchOpts = {
        credentials: 'include',
      };

      let url = binding.path;

      if (binding.method === 'GET') {
        // Append params as query string
        if (params && Object.keys(params).length > 0) {
          const searchParams = new URLSearchParams();
          for (const [key, value] of Object.entries(params)) {
            if (value != null) searchParams.append(key, String(value));
          }
          const sep = url.includes('?') ? '&' : '?';
          url = url + sep + searchParams.toString();
        }
        fetchOpts.method = 'GET';
      } else {
        fetchOpts.method = binding.method;
        fetchOpts.headers = { 'Content-Type': 'application/json' };
        fetchOpts.body = JSON.stringify(data || params || {});
      }

      const response = await doFetch(url, fetchOpts);
      console.log('[n.codes:handler] fetch complete', { id, ref, status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorData = await response.json().catch(function() { return {}; });
        const errorMsg = (errorData && errorData.error) || 'Request failed (' + response.status + ')';
        sendResponse(id, null, errorMsg);
        return;
      }

      const responseData = await response.json();
      sendResponse(id, responseData, null);
    } catch (err) {
      sendResponse(id, null, err.message || 'Network error');
    }
  }

  function sendResponse(id, data, error) {
    console.log('[n.codes:handler] response sent', { id, hasData: !!data, error: error || null });
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage({
      type: 'ncodes:api-response',
      id: id,
      data: data,
      error: error,
    }, '*');
  }

  function start() {
    window.addEventListener('message', handler);
  }

  function stop() {
    window.removeEventListener('message', handler);
  }

  return { start, stop, handler };
}

module.exports = { createMessageHandler };

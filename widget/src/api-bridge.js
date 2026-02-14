'use strict';

/**
 * API bridge script injected into the sandboxed iframe.
 * Provides window.ncodes.query() and window.ncodes.action()
 * which communicate with the parent window via postMessage.
 *
 * This is a string template (not a module) because it gets
 * injected as an inline <script> inside the iframe srcdoc.
 */

/**
 * Generate the bridge script string to inject into iframe srcdoc.
 *
 * @param {object} [appInfo] - App info from capability map
 * @param {string} [appInfo.name] - App name
 * @param {string[]} [appInfo.entities] - Available entity names
 * @returns {string} JavaScript source code as a string
 */
function getBridgeScript(appInfo) {
  const appJSON = JSON.stringify(appInfo || { name: '', entities: [] });

  return `
(function() {
  'use strict';

  var REQUEST_TIMEOUT = 30000;
  var _requestId = 0;
  var _pending = {};

  function generateId() {
    return 'ncodes-req-' + (++_requestId) + '-' + Date.now();
  }

  function sendRequest(method, ref, payload) {
    return new Promise(function(resolve, reject) {
      var id = generateId();
      console.log('[n.codes:bridge] request', method, ref, payload);

      var timeoutHandle = setTimeout(function() {
        delete _pending[id];
        console.warn('[n.codes:bridge] timeout', id, ref);
        reject(new Error('API request timed out after ' + REQUEST_TIMEOUT + 'ms'));
      }, REQUEST_TIMEOUT);

      _pending[id] = { resolve: resolve, reject: reject, timeout: timeoutHandle };

      window.parent.postMessage({
        type: 'ncodes:api-request',
        id: id,
        method: method,
        ref: ref,
        params: method === 'query' ? payload : undefined,
        data: method === 'action' ? payload : undefined
      }, '*');
    });
  }

  window.addEventListener('message', function(event) {
    if (!event.data || event.data.type !== 'ncodes:api-response') return;

    var id = event.data.id;
    var handler = _pending[id];
    if (!handler) return;

    clearTimeout(handler.timeout);
    delete _pending[id];

    console.log('[n.codes:bridge] response', id, event.data.error ? 'ERROR' : 'OK', event.data.data);

    if (event.data.error) {
      handler.reject(new Error(event.data.error));
    } else {
      handler.resolve(event.data.data);
    }
  });

  window.addEventListener('error', function(event) {
    console.error('[n.codes:bridge] JS error:', event.message, 'at', event.filename, ':', event.lineno);
    window.parent.postMessage({
      type: 'ncodes:sandbox-error',
      message: event.message,
      lineno: event.lineno,
      colno: event.colno
    }, '*');
  });

  window.ncodes = {
    query: function(ref, params) {
      return sendRequest('query', ref, params || {});
    },
    action: function(ref, data) {
      return sendRequest('action', ref, data || {});
    },
    app: ${appJSON}
  };
})();
`;
}

module.exports = { getBridgeScript };

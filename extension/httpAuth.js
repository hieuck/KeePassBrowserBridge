// HTTP Auth Detection and Handling Module
// Detects HTTP Basic Auth prompts and provides auto-fill capability

(function() {
  'use strict';

  // Detect HTTP 401 responses and prompt for credentials
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).then((response) => {
      if (response.status === 401 && response.headers.get('www-authenticate')) {
        handleHttpAuthChallenge(args[0], response);
      }
      return response;
    }).catch((error) => {
      throw error;
    });
  };

  // Detect XMLHttpRequest 401 responses
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._kbbUrl = url;
    return originalOpen.apply(this, [method, url, ...rest]);
  };

  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('readystatechange', function() {
      if (this.readyState === 4 && this.status === 401) {
        const authHeader = this.getResponseHeader('www-authenticate');
        if (authHeader) {
          handleHttpAuthChallenge(this._kbbUrl, { headers: { get: () => authHeader } });
        }
      }
    });
    return originalSend.apply(this, args);
  };

  function handleHttpAuthChallenge(url, response) {
    const authHeader = response.headers.get('www-authenticate');
    if (!authHeader) return;

    // Check if it's Basic auth
    if (authHeader.toLowerCase().includes('basic')) {
      // Request credentials from background script
      chrome.runtime.sendMessage({
        type: 'KBB_QUERY_HTTP_AUTH',
        url: url
      }, (response) => {
        const credentials = normalizeCredentialsResponse(response);
        if (credentials && credentials.username && credentials.password) {
          // Browser-level HTTP auth credentials are supplied by the background
          // webRequest handler; do not persist secrets in page-accessible storage.
          location.reload();
        }
      });
    }
  }

  function normalizeCredentialsResponse(response) {
    if (!response) return null;
    if (response.ok && response.response) return response.response;
    return response;
  }

  // Expose HTTP auth helper for manual use
  window.__kbbHttpAuth = {
    getStoredCredentials: () => {
      return null;
    },
    clearCredentials: () => {
      return null;
    }
  };
})();

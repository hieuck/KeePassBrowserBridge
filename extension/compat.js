// Browser Compatibility Layer
// Handles differences between Chrome, Firefox, Edge, and other browsers

(function() {
  'use strict';

  window.__kbbCompat = {
    /**
     * Detect current browser
     * @returns {string} - Browser name: 'chrome', 'firefox', 'edge', 'brave', 'unknown'
     */
    detectBrowser: function() {
      const ua = navigator.userAgent;
      
      if (ua.indexOf('Edg') > -1) return 'edge';
      if (ua.indexOf('Firefox') > -1) return 'firefox';
      if (ua.indexOf('Chrome') > -1) return 'chrome';
      if (ua.indexOf('Brave') > -1) return 'brave';
      
      return 'unknown';
    },

    /**
     * Get browser-specific storage API
     * @returns {Object} - Storage API compatible with all browsers
     */
    getStorage: function() {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        return chrome.storage.local;
      }
      if (typeof browser !== 'undefined' && browser.storage) {
        return browser.storage.local;
      }
      return null;
    },

    /**
     * Send message to background script
     * @param {Object} message - Message to send
     * @returns {Promise} - Response from background script
     */
    sendMessage: function(message) {
      return new Promise((resolve, reject) => {
        const sendFunc = chrome?.runtime?.sendMessage || browser?.runtime?.sendMessage;
        
        if (!sendFunc) {
          reject(new Error('Runtime messaging not available'));
          return;
        }

        sendFunc(message, (response) => {
          if (chrome?.runtime?.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (browser?.runtime?.lastError) {
            reject(new Error(browser.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    },

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} - Success status
     */
    copyToClipboard: async function(text) {
      try {
        // Try modern Clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }

        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textarea);
        return success;
      } catch (error) {
        console.error('Clipboard copy failed:', error);
        return false;
      }
    },

    /**
     * Get extension URL
     * @param {string} path - Relative path
     * @returns {string} - Full extension URL
     */
    getExtensionUrl: function(path) {
      const getUrl = chrome?.runtime?.getURL || browser?.runtime?.getURL;
      if (getUrl) {
        return getUrl(path);
      }
      return path;
    },

    /**
     * Listen for messages from background script
     * @param {Function} callback - Callback function
     */
    onMessage: function(callback) {
      const listener = chrome?.runtime?.onMessage || browser?.runtime?.onMessage;
      if (listener) {
        listener.addListener(callback);
      }
    },

    /**
     * Get current tab info
     * @returns {Promise<Object>} - Current tab information
     */
    getCurrentTab: async function() {
      try {
        const tabs = await (chrome?.tabs?.query || browser?.tabs?.query)({
          active: true,
          currentWindow: true
        });
        return tabs && tabs.length > 0 ? tabs[0] : null;
      } catch (error) {
        console.error('Failed to get current tab:', error);
        return null;
      }
    },

    /**
     * Execute script in tab
     * @param {number} tabId - Tab ID
     * @param {Object} options - Execution options
     * @returns {Promise} - Execution result
     */
    executeScript: async function(tabId, options) {
      try {
        const executeFunc = chrome?.scripting?.executeScript || browser?.tabs?.executeScript;
        if (!executeFunc) {
          throw new Error('Script execution not available');
        }
        return await executeFunc(tabId, options);
      } catch (error) {
        console.error('Script execution failed:', error);
        throw error;
      }
    },

    /**
     * Create context menu item
     * @param {Object} options - Menu item options
     */
    createContextMenu: function(options) {
      const createFunc = chrome?.contextMenus?.create || browser?.contextMenus?.create;
      if (createFunc) {
        createFunc(options);
      }
    },

    /**
     * Listen for context menu clicks
     * @param {Function} callback - Callback function
     */
    onContextMenuClick: function(callback) {
      const listener = chrome?.contextMenus?.onClicked || browser?.contextMenus?.onClicked;
      if (listener) {
        listener.addListener(callback);
      }
    },

    /**
     * Get browser name for display
     * @returns {string} - Browser display name
     */
    getBrowserName: function() {
      const browser = this.detectBrowser();
      const names = {
        'chrome': 'Google Chrome',
        'firefox': 'Mozilla Firefox',
        'edge': 'Microsoft Edge',
        'brave': 'Brave Browser',
        'unknown': 'Unknown Browser'
      };
      return names[browser] || names['unknown'];
    },

    /**
     * Check if browser supports a feature
     * @param {string} feature - Feature name
     * @returns {boolean} - Feature support status
     */
    supportsFeature: function(feature) {
      const browser = this.detectBrowser();
      const support = {
        'clipboardWrite': {
          'chrome': true,
          'firefox': true,
          'edge': true,
          'brave': true
        },
        'contextMenu': {
          'chrome': true,
          'firefox': true,
          'edge': true,
          'brave': true
        },
        'serviceWorker': {
          'chrome': true,
          'firefox': false,
          'edge': true,
          'brave': true
        },
        'persistentBackground': {
          'chrome': false,
          'firefox': true,
          'edge': false,
          'brave': false
        }
      };

      return support[feature] && support[feature][browser];
    }
  };

  // Expose global aliases for convenience
  window.kbbCompat = window.__kbbCompat;
})();

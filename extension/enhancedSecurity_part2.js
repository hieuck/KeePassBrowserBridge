// Enhanced Security Features Module - Part 2
// Screenshot protection and secure clipboard

(function() {
  'use strict';

  window.__kbbSecureClipboard = {
    clipboardTimers: new Map(),
    defaultClearTimeout: 30000, // 30 seconds

    /**
     * Copy to clipboard with auto-clear
     * @param {string} text - Text to copy
     * @param {number} clearAfterMs - Clear after milliseconds
     * @returns {Promise<boolean>} - Success status
     */
    copyWithAutoClear: async function(text, clearAfterMs) {
      clearAfterMs = clearAfterMs || this.defaultClearTimeout;

      try {
        await navigator.clipboard.writeText(text);
        
        // Set auto-clear timer
        const timerId = setTimeout(() => {
          navigator.clipboard.writeText('').catch(() => {});
          this.clipboardTimers.delete(timerId);
        }, clearAfterMs);

        this.clipboardTimers.set(timerId, true);
        return true;
      } catch (error) {
        console.error('Clipboard copy failed:', error);
        return false;
      }
    },

    /**
     * Clear clipboard immediately
     * @returns {Promise<boolean>} - Success status
     */
    clearClipboard: async function() {
      try {
        await navigator.clipboard.writeText('');
        return true;
      } catch (error) {
        console.error('Clipboard clear failed:', error);
        return false;
      }
    },

    /**
     * Cancel pending clipboard clear
     * @param {number} timerId - Timer ID to cancel
     */
    cancelClear: function(timerId) {
      if (this.clipboardTimers.has(timerId)) {
        clearTimeout(timerId);
        this.clipboardTimers.delete(timerId);
      }
    },

    /**
     * Set default clear timeout
     * @param {number} ms - Timeout in milliseconds
     */
    setDefaultClearTimeout: function(ms) {
      this.defaultClearTimeout = ms;
      chrome.storage.local.set({ kbb_clipboard_clear_timeout: ms });
    }
  };

  window.__kbbScreenshotProtection = {
    isProtected: false,

    /**
     * Enable screenshot protection
     */
    enableProtection: function() {
      this.isProtected = true;
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      
      // Prevent screenshot tools
      document.addEventListener('keydown', (e) => {
        if ((e.key === 'PrintScreen') || 
            (e.ctrlKey && e.shiftKey && e.key === 's')) {
          e.preventDefault();
        }
      });

      chrome.storage.local.set({ kbb_screenshot_protected: true });
    },

    /**
     * Disable screenshot protection
     */
    disableProtection: function() {
      this.isProtected = false;
      document.body.style.userSelect = 'auto';
      document.body.style.webkitUserSelect = 'auto';
      chrome.storage.local.set({ kbb_screenshot_protected: false });
    },

    /**
     * Check if protection is enabled
     * @returns {boolean} - Protection status
     */
    isProtectionEnabled: function() {
      return this.isProtected;
    }
  };

  // Expose globally
  window.__kbbSecureClipboard = window.__kbbSecureClipboard;
  window.__kbbScreenshotProtection = window.__kbbScreenshotProtection;
})();

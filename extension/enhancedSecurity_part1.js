// Enhanced Security Features Module - Part 1
// Biometric authentication and auto-lock functionality

(function() {
  'use strict';

  window.__kbbEnhancedSecurity = {
    // Security state
    isLocked: false,
    lastActivityTime: Date.now(),
    autoLockTimeout: 15 * 60 * 1000, // 15 minutes default
    biometricAvailable: false,

    /**
     * Initialize security features
     */
    initialize: async function() {
      this.checkBiometricAvailability();
      this.startActivityMonitoring();
      this.loadSecuritySettings();
    },

    /**
     * Check if biometric authentication is available
     */
    checkBiometricAvailability: async function() {
      try {
        if (window.PublicKeyCredential) {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          this.biometricAvailable = available;
          return available;
        }
      } catch (error) {
        console.error('Biometric check failed:', error);
      }
      return false;
    },

    /**
     * Authenticate with biometric
     * @returns {Promise<boolean>} - Authentication result
     */
    authenticateWithBiometric: async function() {
      if (!this.biometricAvailable) {
        return false;
      }

      try {
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            timeout: 60000,
            userVerification: 'preferred'
          }
        });

        if (credential) {
          this.unlock();
          return true;
        }
      } catch (error) {
        console.error('Biometric authentication failed:', error);
      }
      return false;
    },

    /**
     * Lock the extension
     */
    lock: function() {
      this.isLocked = true;
      chrome.storage.local.set({ kbb_locked: true });
      this.notifySecurityStateChange('locked');
    },

    /**
     * Unlock the extension
     */
    unlock: function() {
      this.isLocked = false;
      this.lastActivityTime = Math.max(Date.now(), this.lastActivityTime + 1);
      chrome.storage.local.set({ kbb_locked: false });
      this.notifySecurityStateChange('unlocked');
    },

    /**
     * Check if extension is locked
     * @returns {boolean} - Lock status
     */
    isExtensionLocked: function() {
      return this.isLocked;
    },

    /**
     * Start monitoring user activity
     */
    startActivityMonitoring: function() {
      document.addEventListener('mousedown', () => this.recordActivity());
      document.addEventListener('keydown', () => this.recordActivity());
      document.addEventListener('touchstart', () => this.recordActivity());
      
      // Check for auto-lock every minute
      setInterval(() => this.checkAutoLock(), 60000);
    },

    /**
     * Record user activity
     */
    recordActivity: function() {
      this.lastActivityTime = Math.max(Date.now(), this.lastActivityTime + 1);
      if (this.isLocked) {
        this.unlock();
      }
    },

    /**
     * Check if auto-lock should be triggered
     */
    checkAutoLock: function() {
      const inactiveTime = Date.now() - this.lastActivityTime;
      if (inactiveTime > this.autoLockTimeout && !this.isLocked) {
        this.lock();
      }
    },

    /**
     * Set auto-lock timeout
     * @param {number} minutes - Timeout in minutes
     */
    setAutoLockTimeout: function(minutes) {
      this.autoLockTimeout = minutes * 60 * 1000;
      chrome.storage.local.set({ kbb_auto_lock_timeout: minutes });
    },

    /**
     * Load security settings from storage
     */
    loadSecuritySettings: function() {
      chrome.storage.local.get(['kbb_locked', 'kbb_auto_lock_timeout'], (result) => {
        if (result.kbb_locked) {
          this.isLocked = true;
        }
        if (result.kbb_auto_lock_timeout) {
          this.autoLockTimeout = result.kbb_auto_lock_timeout * 60 * 1000;
        }
      });
    },

    /**
     * Notify security state change
     * @param {string} state - New security state
     */
    notifySecurityStateChange: function(state) {
      const event = new CustomEvent('kbb_security_state_changed', {
        detail: { state: state }
      });
      window.dispatchEvent(event);
    }
  };

  // Initialize on load
  window.__kbbEnhancedSecurity.initialize();
})();

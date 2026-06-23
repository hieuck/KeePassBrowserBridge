// Multi-Page Login Flow Detection Module
// Handles detection and tracking of multi-step login processes

(function() {
  'use strict';

  window.__kbbMultiPageLogin = {
    // Track login flow state across pages
    flowState: {
      isActive: false,
      startUrl: null,
      startTime: null,
      steps: [],
      lastFormData: null,
      sessionId: null
    },

    /**
     * Initialize multi-page login flow tracking
     * @param {string} initialUrl - Starting URL of login flow
     */
    initializeFlow: function(initialUrl) {
      this.flowState = {
        isActive: true,
        startUrl: initialUrl,
        startTime: Date.now(),
        steps: [{ url: initialUrl, timestamp: Date.now() }],
        lastFormData: null,
        sessionId: this.generateSessionId()
      };
      
      sessionStorage.setItem('kbb_login_flow', JSON.stringify(this.flowState));
    },

    /**
     * Detect if current page is part of a login flow
     * @returns {boolean} - True if in login flow
     */
    isInLoginFlow: function() {
      const stored = sessionStorage.getItem('kbb_login_flow');
      if (!stored) return false;

      try {
        const flow = JSON.parse(stored);
        // Flow expires after 30 minutes
        if (Date.now() - flow.startTime > 30 * 60 * 1000) {
          sessionStorage.removeItem('kbb_login_flow');
          return false;
        }
        return flow.isActive;
      } catch (e) {
        return false;
      }
    },

    /**
     * Record current page as part of login flow
     * @param {string} currentUrl - Current page URL
     */
    recordFlowStep: function(currentUrl) {
      const stored = sessionStorage.getItem('kbb_login_flow');
      if (!stored) return;

      try {
        const flow = JSON.parse(stored);
        flow.steps.push({
          url: currentUrl,
          timestamp: Date.now()
        });
        sessionStorage.setItem('kbb_login_flow', JSON.stringify(flow));
      } catch (e) {
        console.error('Failed to record flow step:', e);
      }
    },

    /**
     * Detect if page contains login form
     * @returns {boolean} - True if login form detected
     */
    hasLoginForm: function() {
      const passwordInputs = document.querySelectorAll('input[type="password"]');
      const usernameInputs = document.querySelectorAll('input[type="text"], input[type="email"]');
      
      return passwordInputs.length > 0 && usernameInputs.length > 0;
    },

    /**
     * Detect if page is likely an intermediate page (not login form)
     * @returns {boolean} - True if intermediate page
     */
    isIntermediatePage: function() {
      // Check for common intermediate page indicators
      const indicators = [
        'input[type="text"][name*="code"]', // Verification code
        'input[type="text"][name*="otp"]',  // OTP
        'input[type="text"][name*="verify"]', // Verification
        'button:contains("Next")',
        'button:contains("Continue")',
        'button:contains("Verify")'
      ];

      for (const selector of indicators) {
        if (document.querySelector(selector)) {
          return true;
        }
      }

      return false;
    },

    /**
     * Detect if page is likely a success page
     * @returns {boolean} - True if success page
     */
    isSuccessPage: function() {
      const successIndicators = [
        'Dashboard',
        'Home',
        'Welcome',
        'Inbox',
        'Account',
        'Profile'
      ];

      const pageText = ((document.body && (document.body.innerText || document.body.textContent)) || '').toLowerCase();
      for (const indicator of successIndicators) {
        if (pageText.includes(indicator.toLowerCase())) {
          return true;
        }
      }

      // Check for redirect meta tags
      const metaRefresh = document.querySelector('meta[http-equiv="refresh"]');
      if (metaRefresh) {
        return true;
      }

      return false;
    },

    /**
     * Complete login flow and cleanup
     */
    completeFlow: function() {
      sessionStorage.removeItem('kbb_login_flow');
      this.flowState.isActive = false;
    },

    /**
     * Generate unique session ID
     * @returns {string} - Session ID
     */
    generateSessionId: function() {
      return 'kbb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Get current flow state
     * @returns {object} - Current flow state
     */
    getFlowState: function() {
      const stored = sessionStorage.getItem('kbb_login_flow');
      if (!stored) return null;

      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    },

    /**
     * Analyze login flow for patterns
     * @returns {object} - Flow analysis
     */
    analyzeFlow: function() {
      const flow = this.getFlowState();
      if (!flow) return null;

      const analysis = {
        stepCount: flow.steps.length,
        duration: Date.now() - flow.startTime,
        urls: flow.steps.map(s => s.url),
        domainChanges: this.detectDomainChanges(flow.steps),
        estimatedSteps: this.estimateRemainingSteps()
      };

      return analysis;
    },

    /**
     * Detect domain changes in flow
     * @param {array} steps - Flow steps
     * @returns {number} - Number of domain changes
     */
    detectDomainChanges: function(steps) {
      let changes = 0;
      let lastDomain = null;

      for (const step of steps) {
        try {
          const url = new URL(step.url);
          const domain = url.hostname;
          if (lastDomain && domain !== lastDomain) {
            changes++;
          }
          lastDomain = domain;
        } catch (e) {
          // Invalid URL
        }
      }

      return changes;
    },

    /**
     * Estimate remaining steps in login flow
     * @returns {number} - Estimated remaining steps
     */
    estimateRemainingSteps: function() {
      const flow = this.getFlowState();
      if (!flow) return 0;

      // Based on common login flow patterns
      if (this.hasLoginForm()) {
        if (this.isIntermediatePage()) {
          return 1; // Likely one more step (success page)
        }
        return 0; // At login form, no more steps
      }

      if (this.isIntermediatePage()) {
        return 1; // One more step expected
      }

      if (this.isSuccessPage()) {
        return 0; // Flow complete
      }

      return 1; // Unknown, assume one more step
    }
  };

  // Auto-detect login flow on page load
  window.addEventListener('load', function() {
    if (window.__kbbMultiPageLogin.isInLoginFlow()) {
      window.__kbbMultiPageLogin.recordFlowStep(window.location.href);
    }
  });
})();

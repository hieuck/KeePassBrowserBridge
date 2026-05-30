// Password Quality Indicator Module
// Evaluates password strength and provides visual feedback

(function() {
  'use strict';

  const STRENGTH_LEVELS = {
    VERY_WEAK: { score: 0, label: 'Very Weak', color: '#e74c3c', width: '20%' },
    WEAK: { score: 1, label: 'Weak', color: '#e67e22', width: '40%' },
    FAIR: { score: 2, label: 'Fair', color: '#f39c12', width: '60%' },
    GOOD: { score: 3, label: 'Good', color: '#27ae60', width: '80%' },
    STRONG: { score: 4, label: 'Strong', color: '#2ecc71', width: '100%' }
  };

  window.__kbbPasswordQuality = {
    /**
     * Evaluate password strength
     * @param {string} password - Password to evaluate
     * @returns {object} - Strength info with score, label, color, width
     */
    evaluate: function(password) {
      if (!password) {
        return STRENGTH_LEVELS.VERY_WEAK;
      }

      let score = 0;
      const length = password.length;

      // Length scoring
      if (length >= 8) score++;
      if (length >= 12) score++;
      if (length >= 16) score++;

      // Character variety scoring
      const hasLower = /[a-z]/.test(password);
      const hasUpper = /[A-Z]/.test(password);
      const hasNumbers = /\d/.test(password);
      const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

      const varietyCount = [hasLower, hasUpper, hasNumbers, hasSymbols].filter(Boolean).length;
      if (varietyCount >= 2) score++;
      if (varietyCount >= 3) score++;
      if (varietyCount === 4) score++;

      // Common patterns (negative scoring)
      if (/(.)\1{2,}/.test(password)) score--; // Repeating characters
      if (/^[a-z]+$|^[A-Z]+$|^\d+$/.test(password)) score--; // Only one type
      if (/^(password|123456|qwerty|abc123)/i.test(password)) score -= 2; // Common passwords

      // Clamp score between 0 and 4
      score = Math.max(0, Math.min(4, score));

      return STRENGTH_LEVELS[Object.keys(STRENGTH_LEVELS)[score]];
    },

    /**
     * Create password strength indicator element
     * @param {string} password - Password to evaluate
     * @returns {HTMLElement} - Indicator element
     */
    createIndicator: function(password) {
      const strength = this.evaluate(password);
      
      const container = document.createElement('div');
      container.className = 'kbb-password-strength';
      container.style.cssText = `
        margin-top: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      `;

      const bar = document.createElement('div');
      bar.className = 'kbb-password-strength-bar';
      bar.style.cssText = `
        flex: 1;
        height: 4px;
        background: #e0e0e0;
        border-radius: 2px;
        overflow: hidden;
      `;

      const fill = document.createElement('div');
      fill.style.cssText = `
        height: 100%;
        width: ${strength.width};
        background: ${strength.color};
        transition: width 0.3s, background 0.3s;
      `;
      bar.appendChild(fill);

      const label = document.createElement('span');
      label.className = 'kbb-password-strength-label';
      label.textContent = strength.label;
      label.style.cssText = `
        font-size: 12px;
        color: ${strength.color};
        font-weight: 500;
        min-width: 60px;
      `;

      container.appendChild(bar);
      container.appendChild(label);

      return container;
    },

    /**
     * Update password strength indicator
     * @param {HTMLElement} indicator - Indicator element to update
     * @param {string} password - New password to evaluate
     */
    updateIndicator: function(indicator, password) {
      if (!indicator) return;

      const strength = this.evaluate(password);
      const fill = indicator.querySelector('div > div');
      const label = indicator.querySelector('span');

      if (fill) {
        fill.style.width = strength.width;
        fill.style.background = strength.color;
      }

      if (label) {
        label.textContent = strength.label;
        label.style.color = strength.color;
      }
    }
  };
})();

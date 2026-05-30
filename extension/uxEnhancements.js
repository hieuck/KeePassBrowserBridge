// UX Enhancements Module
// Animated transitions, custom themes, compact mode, and badge counters

(function() {
  'use strict';

  window.__kbbUXEnhancements = {
    currentTheme: 'default',
    compactMode: false,
    animationsEnabled: true,

    /**
     * Initialize UX enhancements
     */
    initialize: function() {
      this.loadUserPreferences();
      this.applyTheme(this.currentTheme);
      this.setupAnimations();
    },

    /**
     * Load user preferences from storage
     */
    loadUserPreferences: function() {
      chrome.storage.local.get(['kbb_theme', 'kbb_compact_mode', 'kbb_animations'], (result) => {
        if (result.kbb_theme) this.currentTheme = result.kbb_theme;
        if (result.kbb_compact_mode) this.compactMode = result.kbb_compact_mode;
        if (result.kbb_animations !== undefined) this.animationsEnabled = result.kbb_animations;
        
        this.applyTheme(this.currentTheme);
        this.toggleCompactMode(this.compactMode);
      });
    },

    /**
     * Apply custom theme
     * @param {string} themeName - Theme name
     */
    applyTheme: function(themeName) {
      const themes = {
        'default': {
          primary: '#176b87',
          secondary: '#0f5066',
          accent: '#4a90e2',
          success: '#067647',
          danger: '#b42318'
        },
        'ocean': {
          primary: '#0077b6',
          secondary: '#023e8a',
          accent: '#00b4d8',
          success: '#2ecc71',
          danger: '#e74c3c'
        },
        'forest': {
          primary: '#2d6a4f',
          secondary: '#1b4332',
          accent: '#52b788',
          success: '#40916c',
          danger: '#d62828'
        },
        'sunset': {
          primary: '#e07a5f',
          secondary: '#c45c3e',
          accent: '#f4a261',
          success: '#2a9d8f',
          danger: '#e63946'
        }
      };

      const theme = themes[themeName] || themes['default'];
      
      // Apply CSS custom properties
      const root = document.documentElement;
      root.style.setProperty('--accent', theme.primary);
      root.style.setProperty('--accent-strong', theme.secondary);
      
      this.currentTheme = themeName;
      chrome.storage.local.set({ kbb_theme: themeName });
    },

    /**
     * Toggle compact mode
     * @param {boolean} enabled - Enable compact mode
     */
    toggleCompactMode: function(enabled) {
      this.compactMode = enabled;
      document.body.classList.toggle('kbb-compact', enabled);
      chrome.storage.local.set({ kbb_compact_mode: enabled });
    },

    /**
     * Toggle animations
     * @param {boolean} enabled - Enable animations
     */
    toggleAnimations: function(enabled) {
      this.animationsEnabled = enabled;
      document.body.classList.toggle('kbb-no-animations', !enabled);
      chrome.storage.local.set({ kbb_animations: enabled });
    },

    /**
     * Setup smooth animations
     */
    setupAnimations: function() {
      if (!this.animationsEnabled) return;
      
      // Add transition class to body
      document.body.classList.add('kbb-animated');
      
      // Fade in effect
      document.body.style.opacity = '0';
      requestAnimationFrame(() => {
        document.body.style.transition = 'opacity 0.3s ease-in';
        document.body.style.opacity = '1';
      });
    },

    /**
     * Update extension badge
     * @param {number} count - Count to display
     */
    updateBadge: function(count) {
      if (chrome.action) {
        chrome.action.setBadgeText({ text: count > 0 ? count.toString() : '' });
        chrome.action.setBadgeBackgroundColor({ color: '#176b87' });
      }
    },

    /**
     * Get available themes
     * @returns {Array} - Theme names
     */
    getAvailableThemes: function() {
      return ['default', 'ocean', 'forest', 'sunset'];
    },

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification: function(message, type) {
      type = type || 'info';
      const notification = document.createElement('div');
      notification.className = `kbb-notification kbb-notification-${type}`;
      notification.textContent = message;
      
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.classList.add('kbb-notification-fade-out');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.__kbbUXEnhancements.initialize());
  } else {
    window.__kbbUXEnhancements.initialize();
  }
})();

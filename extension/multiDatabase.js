// Multiple Database Support Module
// Handles switching between multiple KeePass databases

(function() {
  'use strict';

  window.__kbbMultiDatabase = {
    // Store database configurations
    databases: [],
    currentDatabaseId: null,

    /**
     * Register a database
     * @param {Object} config - Database configuration
     */
    registerDatabase: function(config) {
      const db = {
        id: config.id || this.generateId(),
        name: config.name,
        path: config.path,
        isActive: config.isActive || false,
        lastAccessed: config.lastAccessed || Date.now(),
        entryCount: config.entryCount || 0,
        color: config.color || '#176b87'
      };

      this.databases.push(db);
      
      if (db.isActive) {
        this.currentDatabaseId = db.id;
      }

      this.saveDatabases();
      return db;
    },

    /**
     * Switch to a different database
     * @param {string} databaseId - Database ID to switch to
     * @returns {boolean} - Success status
     */
    switchDatabase: function(databaseId) {
      const db = this.databases.find(d => d.id === databaseId);
      if (!db) return false;

      // Deactivate current database
      if (this.currentDatabaseId) {
        const current = this.databases.find(d => d.id === this.currentDatabaseId);
        if (current) current.isActive = false;
      }

      // Activate new database
      db.isActive = true;
      db.lastAccessed = Math.max(Date.now(), db.lastAccessed + 1);
      this.currentDatabaseId = databaseId;

      this.saveDatabases();
      this.notifyDatabaseSwitch(db);
      return true;
    },

    /**
     * Get current active database
     * @returns {Object} - Current database
     */
    getCurrentDatabase: function() {
      return this.databases.find(d => d.id === this.currentDatabaseId);
    },

    /**
     * Get all databases
     * @returns {Array} - All databases
     */
    getAllDatabases: function() {
      return this.databases.sort((a, b) => b.lastAccessed - a.lastAccessed);
    },

    /**
     * Remove a database
     * @param {string} databaseId - Database ID to remove
     * @returns {boolean} - Success status
     */
    removeDatabase: function(databaseId) {
      const index = this.databases.findIndex(d => d.id === databaseId);
      if (index === -1) return false;

      this.databases.splice(index, 1);

      // If removed database was active, switch to first available
      if (this.currentDatabaseId === databaseId) {
        if (this.databases.length > 0) {
          this.switchDatabase(this.databases[0].id);
        } else {
          this.currentDatabaseId = null;
        }
      }

      this.saveDatabases();
      return true;
    },

    /**
     * Update database info
     * @param {string} databaseId - Database ID
     * @param {Object} updates - Fields to update
     * @returns {boolean} - Success status
     */
    updateDatabase: function(databaseId, updates) {
      const db = this.databases.find(d => d.id === databaseId);
      if (!db) return false;

      Object.assign(db, updates);
      this.saveDatabases();
      return true;
    },

    /**
     * Handle database conflicts
     * @param {Object} conflict - Conflict information
     * @returns {string} - Resolution strategy (keep_local, keep_remote, merge)
     */
    resolveConflict: function(conflict) {
      // Default strategy: keep most recent
      if (conflict.localTime > conflict.remoteTime) {
        return 'keep_local';
      } else if (conflict.remoteTime > conflict.localTime) {
        return 'keep_remote';
      } else {
        return 'merge';
      }
    },

    /**
     * Sync database with backend
     * @param {string} databaseId - Database ID to sync
     * @returns {Promise} - Sync result
     */
    syncDatabase: async function(databaseId) {
      const db = this.databases.find(d => d.id === databaseId);
      if (!db) return { success: false, error: 'Database not found' };

      try {
        const response = await chrome.runtime.sendMessage({
          type: 'KBB_SYNC_DATABASE',
          databaseId: databaseId
        });

        if (response.ok) {
          db.lastAccessed = Date.now();
          db.entryCount = response.response.entryCount || 0;
          this.saveDatabases();
          return { success: true, data: response.response };
        } else {
          return { success: false, error: response.error };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    },

    /**
     * Get database statistics
     * @param {string} databaseId - Database ID
     * @returns {Object} - Statistics
     */
    getStatistics: function(databaseId) {
      const db = this.databases.find(d => d.id === databaseId);
      if (!db) return null;

      return {
        name: db.name,
        entryCount: db.entryCount,
        lastAccessed: new Date(db.lastAccessed).toLocaleString(),
        isActive: db.isActive,
        color: db.color
      };
    },

    /**
     * Save databases to storage
     */
    saveDatabases: function() {
      chrome.storage.local.set({
        kbb_databases: this.databases,
        kbb_current_database: this.currentDatabaseId
      });
    },

    /**
     * Load databases from storage
     * @returns {Promise}
     */
    loadDatabases: async function() {
      return new Promise((resolve) => {
        chrome.storage.local.get(['kbb_databases', 'kbb_current_database'], (result) => {
          this.databases = result.kbb_databases || [];
          this.currentDatabaseId = result.kbb_current_database || null;
          resolve();
        });
      });
    },

    /**
     * Generate unique ID
     * @returns {string} - Unique ID
     */
    generateId: function() {
      return 'db_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Notify database switch
     * @param {Object} database - Switched database
     */
    notifyDatabaseSwitch: function(database) {
      const event = new CustomEvent('kbb_database_switched', {
        detail: { database: database }
      });
      window.dispatchEvent(event);
    }
  };

  // Load databases on initialization
  window.__kbbMultiDatabase.loadDatabases();
})();

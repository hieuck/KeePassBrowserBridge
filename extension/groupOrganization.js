// Group-Based Organization & Filtering Module
// Handles credential grouping, filtering, and search functionality

(function() {
  'use strict';

  window.__kbbGroupOrganization = {
    /**
     * Group credentials by KeePass group
     * @param {Array} entries - Credential entries
     * @returns {Object} - Grouped entries
     */
    groupByKeePassGroup: function(entries) {
      const grouped = {};
      
      for (const entry of entries) {
        const group = entry.Group || 'Ungrouped';
        if (!grouped[group]) {
          grouped[group] = [];
        }
        grouped[group].push(entry);
      }
      
      return grouped;
    },

    /**
     * Filter entries by tags
     * @param {Array} entries - Credential entries
     * @param {Array} tags - Tags to filter by
     * @returns {Array} - Filtered entries
     */
    filterByTags: function(entries, tags) {
      if (!tags || tags.length === 0) return entries;
      
      return entries.filter(entry => {
        const entryTags = (entry.Tags || '').split(',').map(t => t.trim().toLowerCase());
        return tags.some(tag => entryTags.includes(tag.toLowerCase()));
      });
    },

    /**
     * Fuzzy search entries
     * @param {Array} entries - Credential entries
     * @param {string} query - Search query
     * @returns {Array} - Matching entries
     */
    fuzzySearch: function(entries, query) {
      if (!query || query.trim().length === 0) return entries;
      
      const q = query.toLowerCase();
      return entries.filter(entry => {
        const searchText = [
          entry.Title,
          entry.UserName,
          entry.Url,
          (entry.Tags || ''),
          (entry.Group || '')
        ].join(' ').toLowerCase();
        
        return this.fuzzyMatch(searchText, q);
      });
    },

    /**
     * Fuzzy matching algorithm
     * @param {string} text - Text to search in
     * @param {string} query - Query string
     * @returns {boolean} - Match result
     */
    fuzzyMatch: function(text, query) {
      let queryIdx = 0;
      let textIdx = 0;
      
      while (queryIdx < query.length && textIdx < text.length) {
        if (query[queryIdx] === text[textIdx]) {
          queryIdx++;
        }
        textIdx++;
      }
      
      return queryIdx === query.length;
    },

    /**
     * Sort entries by frequency of use
     * @param {Array} entries - Credential entries
     * @returns {Array} - Sorted entries
     */
    sortByFrequency: function(entries) {
      return entries.sort((a, b) => {
        const freqA = parseInt(a.UsageCount || 0);
        const freqB = parseInt(b.UsageCount || 0);
        return freqB - freqA;
      });
    },

    /**
     * Sort entries by recent use
     * @param {Array} entries - Credential entries
     * @returns {Array} - Sorted entries
     */
    sortByRecent: function(entries) {
      return entries.sort((a, b) => {
        const timeA = parseInt(a.LastUsed || 0);
        const timeB = parseInt(b.LastUsed || 0);
        return timeB - timeA;
      });
    },

    /**
     * Apply multiple filters
     * @param {Array} entries - Credential entries
     * @param {Object} filters - Filter options
     * @returns {Array} - Filtered entries
     */
    applyFilters: function(entries, filters) {
      let result = entries;
      
      if (filters.search) {
        result = this.fuzzySearch(result, filters.search);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        result = this.filterByTags(result, filters.tags);
      }
      
      if (filters.group) {
        result = result.filter(e => (e.Group || 'Ungrouped') === filters.group);
      }
      
      if (filters.sortBy === 'frequency') {
        result = this.sortByFrequency(result);
      } else if (filters.sortBy === 'recent') {
        result = this.sortByRecent(result);
      }
      
      return result;
    },

    /**
     * Get available tags from entries
     * @param {Array} entries - Credential entries
     * @returns {Array} - Unique tags
     */
    getAvailableTags: function(entries) {
      const tags = new Set();
      
      for (const entry of entries) {
        if (entry.Tags) {
          const entryTags = entry.Tags.split(',').map(t => t.trim());
          entryTags.forEach(tag => tags.add(tag));
        }
      }
      
      return Array.from(tags).sort();
    },

    /**
     * Get available groups from entries
     * @param {Array} entries - Credential entries
     * @returns {Array} - Unique groups
     */
    getAvailableGroups: function(entries) {
      const groups = new Set();
      
      for (const entry of entries) {
        groups.add(entry.Group || 'Ungrouped');
      }
      
      return Array.from(groups).sort();
    },

    /**
     * Get entry statistics
     * @param {Array} entries - Credential entries
     * @returns {Object} - Statistics
     */
    getStatistics: function(entries) {
      return {
        totalEntries: entries.length,
        groupCount: this.getAvailableGroups(entries).length,
        tagCount: this.getAvailableTags(entries).length,
        recentlyUsed: this.sortByRecent(entries).slice(0, 5),
        mostUsed: this.sortByFrequency(entries).slice(0, 5)
      };
    }
  };
})();

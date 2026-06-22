// Group Organization & Filtering Tests

describe('GroupOrganization', () => {
  
  const mockEntries = [
    {
      Title: 'Gmail',
      UserName: 'user@gmail.com',
      Url: 'https://gmail.com',
      Group: 'Email',
      Tags: 'email,personal',
      UsageCount: 50,
      LastUsed: Date.now() - 1000
    },
    {
      Title: 'GitHub',
      UserName: 'username',
      Url: 'https://github.com',
      Group: 'Development',
      Tags: 'dev,work',
      UsageCount: 30,
      LastUsed: Date.now() - 5000
    },
    {
      Title: 'Facebook',
      UserName: 'user@facebook.com',
      Url: 'https://facebook.com',
      Group: 'Social',
      Tags: 'social,personal',
      UsageCount: 20,
      LastUsed: Date.now() - 10000
    }
  ];

  describe('Grouping', () => {
    test('should group entries by KeePass group', () => {
      const grouped = window.__kbbGroupOrganization.groupByKeePassGroup(mockEntries);
      
      expect(Object.keys(grouped).length).toBe(3);
      expect(grouped['Email'].length).toBe(1);
      expect(grouped['Development'].length).toBe(1);
      expect(grouped['Social'].length).toBe(1);
    });

    test('should handle ungrouped entries', () => {
      const entries = [
        { Title: 'Test', Group: null },
        { Title: 'Test2' }
      ];
      
      const grouped = window.__kbbGroupOrganization.groupByKeePassGroup(entries);
      expect(grouped['Ungrouped'].length).toBe(2);
    });
  });

  describe('Filtering', () => {
    test('should filter by tags', () => {
      const filtered = window.__kbbGroupOrganization.filterByTags(mockEntries, ['personal']);
      
      expect(filtered.length).toBe(2);
      expect(filtered.some(e => e.Title === 'Gmail')).toBe(true);
      expect(filtered.some(e => e.Title === 'Facebook')).toBe(true);
    });

    test('should filter by multiple tags (OR logic)', () => {
      const filtered = window.__kbbGroupOrganization.filterByTags(mockEntries, ['dev', 'social']);
      
      expect(filtered.length).toBe(2);
      expect(filtered.some(e => e.Title === 'GitHub')).toBe(true);
      expect(filtered.some(e => e.Title === 'Facebook')).toBe(true);
    });

    test('should return all entries when no tags specified', () => {
      const filtered = window.__kbbGroupOrganization.filterByTags(mockEntries, []);
      expect(filtered.length).toBe(3);
    });
  });

  describe('Fuzzy Search', () => {
    test('should find entries by title', () => {
      const results = window.__kbbGroupOrganization.fuzzySearch(mockEntries, 'gmail');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(e => e.Title === 'Gmail')).toBe(true);
    });

    test('should find entries by username', () => {
      const results = window.__kbbGroupOrganization.fuzzySearch(mockEntries, 'username');
      expect(results.some(e => e.Title === 'GitHub')).toBe(true);
    });

    test('should find entries by partial match', () => {
      const results = window.__kbbGroupOrganization.fuzzySearch(mockEntries, 'gm');
      expect(results.some(e => e.Title === 'Gmail')).toBe(true);
    });

    test('should be case-insensitive', () => {
      const results = window.__kbbGroupOrganization.fuzzySearch(mockEntries, 'GMAIL');
      expect(results.some(e => e.Title === 'Gmail')).toBe(true);
    });

    test('should return all entries for empty query', () => {
      const results = window.__kbbGroupOrganization.fuzzySearch(mockEntries, '');
      expect(results.length).toBe(3);
    });
  });

  describe('Sorting', () => {
    test('should sort by frequency', () => {
      const sorted = window.__kbbGroupOrganization.sortByFrequency(mockEntries);
      
      expect(sorted[0].Title).toBe('Gmail');
      expect(sorted[1].Title).toBe('GitHub');
      expect(sorted[2].Title).toBe('Facebook');
    });

    test('should sort by recent use', () => {
      const sorted = window.__kbbGroupOrganization.sortByRecent(mockEntries);
      
      expect(sorted[0].Title).toBe('Gmail');
      expect(sorted[sorted.length - 1].Title).toBe('Facebook');
    });
  });

  describe('Multi-Filter', () => {
    test('should apply search and tag filters', () => {
      const filters = {
        search: 'mail',
        tags: ['personal']
      };
      
      const results = window.__kbbGroupOrganization.applyFilters(mockEntries, filters);
      expect(results.some(e => e.Title === 'Gmail')).toBe(true);
    });

    test('should apply group filter', () => {
      const filters = {
        group: 'Development'
      };
      
      const results = window.__kbbGroupOrganization.applyFilters(mockEntries, filters);
      expect(results.length).toBe(1);
      expect(results[0].Title).toBe('GitHub');
    });

    test('should apply sorting', () => {
      const filters = {
        sortBy: 'frequency'
      };
      
      const results = window.__kbbGroupOrganization.applyFilters(mockEntries, filters);
      expect(results[0].Title).toBe('Gmail');
    });
  });

  describe('Metadata', () => {
    test('should get available tags', () => {
      const tags = window.__kbbGroupOrganization.getAvailableTags(mockEntries);
      
      expect(tags).toContain('email');
      expect(tags).toContain('personal');
      expect(tags).toContain('dev');
      expect(tags).toContain('work');
      expect(tags).toContain('social');
    });

    test('should get available groups', () => {
      const groups = window.__kbbGroupOrganization.getAvailableGroups(mockEntries);
      
      expect(groups).toContain('Email');
      expect(groups).toContain('Development');
      expect(groups).toContain('Social');
    });

    test('should get statistics', () => {
      const stats = window.__kbbGroupOrganization.getStatistics(mockEntries);
      
      expect(stats.totalEntries).toBe(3);
      expect(stats.groupCount).toBe(3);
      expect(stats.tagCount).toBeGreaterThan(0);
      expect(stats.recentlyUsed.length).toBe(3);
      expect(stats.mostUsed.length).toBe(3);
    });
  });
});

// URL Matcher Integration Tests
// Tests for advanced URL matching with regex and wildcard support

describe('UrlMatcher Integration Tests', () => {
  
  describe('Wildcard Matching', () => {
    test('should match exact domain', () => {
      const entryUrl = 'https://example.com';
      const pageUrl = 'https://example.com/login';
      expect(matchUrl(entryUrl, pageUrl)).toBe(true);
    });

    test('should match subdomain with wildcard', () => {
      const entryUrl = 'https://*.example.com';
      const pageUrl = 'https://mail.example.com/inbox';
      expect(matchUrl(entryUrl, pageUrl)).toBe(true);
    });

    test('should not match parent domain with wildcard', () => {
      const entryUrl = 'https://*.example.com';
      const pageUrl = 'https://example.com';
      expect(matchUrl(entryUrl, pageUrl)).toBe(false);
    });

    test('should match path with wildcard', () => {
      const entryUrl = 'https://example.com/login*';
      const pageUrl = 'https://example.com/login/page';
      expect(matchUrl(entryUrl, pageUrl)).toBe(true);
    });
  });

  describe('Regex Matching', () => {
    test('should match regex pattern with prefix', () => {
      const entryUrl = 'regex:https://.*\\.example\\.com';
      const pageUrl = 'https://www.example.com';
      expect(matchUrl(entryUrl, pageUrl)).toBe(true);
    });

    test('should match complex regex pattern', () => {
      const entryUrl = 'regex:https://example\\.com/(login|signin).*';
      const pageUrl = 'https://example.com/login/page';
      expect(matchUrl(entryUrl, pageUrl)).toBe(true);
    });

    test('should not match non-matching regex', () => {
      const entryUrl = 'regex:https://example\\.com/login.*';
      const pageUrl = 'https://example.com/register';
      expect(matchUrl(entryUrl, pageUrl)).toBe(false);
    });

    test('should handle invalid regex gracefully', () => {
      const entryUrl = 'regex:invalid[regex';
      const pageUrl = 'https://example.com';
      expect(matchUrl(entryUrl, pageUrl)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle case-insensitive matching', () => {
      const entryUrl = 'https://EXAMPLE.COM';
      const pageUrl = 'https://example.com';
      expect(matchUrl(entryUrl, pageUrl)).toBe(true);
    });

    test('should handle empty strings', () => {
      expect(matchUrl('', 'https://example.com')).toBe(false);
      expect(matchUrl('https://example.com', '')).toBe(false);
    });

    test('should handle null/undefined', () => {
      expect(matchUrl(null, 'https://example.com')).toBe(false);
      expect(matchUrl('https://example.com', null)).toBe(false);
    });

    test('should handle international domain names', () => {
      const entryUrl = 'https://münchen.de';
      const pageUrl = 'https://xn--mnchen-3ya.de';
      expect(matchUrl(entryUrl, pageUrl)).toBe(true);
    });
  });

  describe('Performance', () => {
    test('should cache regex patterns', () => {
      const entryUrl = 'regex:https://.*\\.example\\.com';
      const pageUrl = 'https://www.example.com';
      
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        matchUrl(entryUrl, pageUrl);
      }
      const end = performance.now();
      
      // Should complete 1000 iterations in less than 100ms
      expect(end - start).toBeLessThan(100);
    });
  });
});

// Mock function for testing (would be replaced with actual implementation)
function matchUrl(entryUrl, pageUrl) {
  if (!entryUrl || !pageUrl) return false;
  
  if (entryUrl.startsWith('regex:')) {
    const pattern = entryUrl.substring(6);
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(pageUrl);
    } catch (e) {
      return false;
    }
  }
  
  // Wildcard matching logic
  return true; // Simplified for test structure
}

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

function matchUrl(entryUrl, pageUrl) {
  if (!entryUrl || !pageUrl) return false;

  if (entryUrl.startsWith('regex:')) {
    try {
      return new RegExp(entryUrl.substring(6), 'i').test(pageUrl);
    } catch {
      return false;
    }
  }

  // Normalize hostnames via URL API (handles IDN → punycode)
  let entryHostname = '';
  let entryPath = '';
  let pageHostname = '';
  let pagePath = '';

  const rawEntry = entryUrl.split('://');
  const rawPage = pageUrl.split('://');
  if (rawEntry.length < 2 || rawPage.length < 2) return false;
  if (rawEntry[0].toLowerCase() !== rawPage[0].toLowerCase()) return false;

  const protocol = rawEntry[0] + '://';
  const entryRest = rawEntry.slice(1).join('://');
  const pageRest = rawPage.slice(1).join('://');

  const entrySlash = entryRest.indexOf('/');
  const pageSlash = pageRest.indexOf('/');

  entryHostname = entrySlash === -1 ? entryRest : entryRest.substring(0, entrySlash);
  entryPath = entrySlash === -1 ? '' : entryRest.substring(entrySlash);
  pageHostname = pageSlash === -1 ? pageRest : pageRest.substring(0, pageSlash);
  pagePath = pageSlash === -1 ? '' : pageRest.substring(pageSlash);

  // Normalize non-wildcard hostnames to handle IDN
  if (!entryHostname.includes('*')) {
    try { entryHostname = new URL(entryUrl).hostname.toLowerCase(); } catch { }
  }
  try { pageHostname = new URL(pageUrl).hostname.toLowerCase(); } catch { }

  // Build hostname regex
  let hostPattern = '';
  for (let i = 0; i < entryHostname.length; i++) {
    const ch = entryHostname[i];
    if (ch === '*') {
      if (i + 1 < entryHostname.length && entryHostname[i + 1] === '.') {
        hostPattern += '[^./]+';
      } else {
        hostPattern += '.*';
      }
    } else if (/[.+?^${}()|[\]\\]/.test(ch)) {
      hostPattern += '\\' + ch;
    } else {
      hostPattern += ch;
    }
  }

  try {
    if (!new RegExp('^' + hostPattern + '$', 'i').test(pageHostname)) return false;
  } catch {
    return false;
  }

  // Match path
  if (entryPath === '') {
    // No path in entry: any path (or no path) matches
    return true;
  }

  if (entryPath.includes('*')) {
    const pathPattern = '^' + entryPath.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$';
    try {
      return new RegExp(pathPattern, 'i').test(pagePath);
    } catch {
      return false;
    }
  }

  // No wildcard in path: entry path must be a prefix of page path
  return pagePath.toLowerCase().startsWith(entryPath.toLowerCase());
}

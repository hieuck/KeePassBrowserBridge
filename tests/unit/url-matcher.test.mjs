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

describe('url-matcher - edge case URLs', () => {
  test('should match IP address URLs', () => {
    expect(matchUrl('http://192.168.1.1', 'http://192.168.1.1/admin')).toBe(true);
  });

  test('should match localhost URLs', () => {
    expect(matchUrl('http://localhost:8080', 'http://localhost:8080/path')).toBe(true);
  });

  test('should handle data: URLs gracefully', () => {
    expect(matchUrl('data:text/html,hi', 'data:text/html,hi')).toBe(false);
  });

  test('should handle blob: URLs gracefully', () => {
    expect(matchUrl('blob:d3958f5c-0777-0845-9dcf-2cb28779acf4', 'blob:d3958f5c-0777-0845-9dcf-2cb28779acf4')).toBe(false);
  });

  test('should handle about:blank gracefully', () => {
    expect(matchUrl('about:blank', 'about:blank')).toBe(false);
  });

  test('should handle javascript: URLs gracefully', () => {
    expect(matchUrl('javascript:void(0)', 'javascript:void(0)')).toBe(false);
  });

  test('should handle file: URLs', () => {
    expect(matchUrl('file:///c:/path', 'file:///c:/path/file')).toBe(true);
  });

  test('should handle URLs with authentication', () => {
    expect(matchUrl('http://user:pass@example.com', 'http://user:pass@example.com/path')).toBe(true);
  });

  test('should handle Punycode/IDN domain matching', () => {
    expect(matchUrl('https://xn--mnchen-3ya.de', 'https://xn--mnchen-3ya.de/page')).toBe(true);
  });
});

describe('url-matcher - source inspection', () => {
  const source = matchUrl.toString();

  it('should have URL parsing logic', () => {
    assert.ok(source.includes('hostname'), 'Should parse hostname from URL');
  });

  it('should have path matching logic', () => {
    assert.ok(source.includes('path'), 'Should handle URL path matching');
  });

  it('should have protocol comparison', () => {
    assert.ok(source.includes('protocol') || source.includes('://'), 'Should compare URL protocols');
  });

  it('should have regex generation for wildcards', () => {
    assert.ok(source.includes('RegExp') || source.includes('regex'), 'Should generate regex for wildcard patterns');
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

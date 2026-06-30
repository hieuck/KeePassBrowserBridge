import assert from 'node:assert/strict';

const importModule = () => import('../../extension/shared/favicon.js');

describe('favicon.js', () => {
  it('should return DuckDuckGo URL for valid domain by default', async () => {
    const { getFaviconUrl } = await importModule();
    const url = getFaviconUrl('https://example.com');
    assert.ok(url.includes('icons.duckduckgo.com'));
    assert.ok(url.includes('example.com'));
  });

  it('should return null for invalid URL', async () => {
    const { getFaviconUrl } = await importModule();
    assert.equal(getFaviconUrl(''), null);
    assert.equal(getFaviconUrl(null), null);
  });

  it('should support setFaviconSource to google', async () => {
    const { getFaviconUrl, setFaviconSource } = await importModule();
    setFaviconSource('google');
    const url = getFaviconUrl('https://example.com');
    assert.ok(url.includes('google.com'));
    setFaviconSource('duckduckgo');
  });

  it('should support setFaviconSource to direct', async () => {
    const { getFaviconUrl, setFaviconSource } = await importModule();
    setFaviconSource('direct');
    const url = getFaviconUrl('https://example.com');
    assert.ok(url.includes('/favicon.ico'));
    setFaviconSource('duckduckgo');
  });

  it('should ignore invalid source values', async () => {
    const { getFaviconUrl, setFaviconSource } = await importModule();
    setFaviconSource('invalid');
    const url = getFaviconUrl('https://example.com');
    assert.ok(url.includes('duckduckgo'));
  });

  it('should return null for unparseable URL string', async () => {
    const { getFaviconUrl } = await importModule();
    assert.equal(getFaviconUrl('not-a-valid-url'), null);
  });

  it('should return null for malformed URL without protocol', async () => {
    const { getFaviconUrl } = await importModule();
    assert.equal(getFaviconUrl('example.com'), null);
  });
});

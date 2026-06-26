// RED: These tests define expected validator behavior
import { describe, it, assert } from 'vitest';

describe('validators.js - isValidUrl', () => {
  it('should return true for http URLs', async () => {
    const { isValidUrl } = await import('../../extension/shared/validators.js');
    assert.ok(isValidUrl('http://example.com'));
  });

  it('should return true for https URLs', async () => {
    const { isValidUrl } = await import('../../extension/shared/validators.js');
    assert.ok(isValidUrl('https://keepass.info/download'));
  });

  it('should return false for ftp URLs', async () => {
    const { isValidUrl } = await import('../../extension/shared/validators.js');
    assert.ok(!isValidUrl('ftp://files.example.com'));
  });

  it('should return false for empty string', async () => {
    const { isValidUrl } = await import('../../extension/shared/validators.js');
    assert.ok(!isValidUrl(''));
  });

  it('should return false for null', async () => {
    const { isValidUrl } = await import('../../extension/shared/validators.js');
    assert.ok(!isValidUrl(null));
  });

  it('should return false for undefined', async () => {
    const { isValidUrl } = await import('../../extension/shared/validators.js');
    assert.ok(!isValidUrl(undefined));
  });

  it('should return false for malformed strings', async () => {
    const { isValidUrl } = await import('../../extension/shared/validators.js');
    assert.ok(!isValidUrl('not-a-url'));
  });

  it('should return true for URLs with ports', async () => {
    const { isValidUrl } = await import('../../extension/shared/validators.js');
    assert.ok(isValidUrl('https://127.0.0.1:19455/bridge'));
  });

  it('should return true for URLs with query params', async () => {
    const { isValidUrl } = await import('../../extension/shared/validators.js');
    assert.ok(isValidUrl('https://example.com/path?q=test&page=1'));
  });
});

describe('validators.js - isValidEmail', () => {
  it('should return true for simple email', async () => {
    const { isValidEmail } = await import('../../extension/shared/validators.js');
    assert.ok(isValidEmail('user@example.com'));
  });

  it('should return true for email with subdomain', async () => {
    const { isValidEmail } = await import('../../extension/shared/validators.js');
    assert.ok(isValidEmail('test@mail.example.co.uk'));
  });

  it('should return false for missing @', async () => {
    const { isValidEmail } = await import('../../extension/shared/validators.js');
    assert.ok(!isValidEmail('userexample.com'));
  });

  it('should return false for empty string', async () => {
    const { isValidEmail } = await import('../../extension/shared/validators.js');
    assert.ok(!isValidEmail(''));
  });

  it('should return false for null', async () => {
    const { isValidEmail } = await import('../../extension/shared/validators.js');
    assert.ok(!isValidEmail(null));
  });

  it('should return false for email without domain', async () => {
    const { isValidEmail } = await import('../../extension/shared/validators.js');
    assert.ok(!isValidEmail('user@'));
  });
});

describe('validators.js - isNonEmpty', () => {
  it('should return true for non-empty string', async () => {
    const { isNonEmpty } = await import('../../extension/shared/validators.js');
    assert.ok(isNonEmpty('hello'));
  });

  it('should return false for empty string', async () => {
    const { isNonEmpty } = await import('../../extension/shared/validators.js');
    assert.ok(!isNonEmpty(''));
  });

  it('should return false for whitespace-only string', async () => {
    const { isNonEmpty } = await import('../../extension/shared/validators.js');
    assert.ok(!isNonEmpty('   '));
  });

  it('should return false for null', async () => {
    const { isNonEmpty } = await import('../../extension/shared/validators.js');
    assert.ok(!isNonEmpty(null));
  });

  it('should return false for numbers', async () => {
    const { isNonEmpty } = await import('../../extension/shared/validators.js');
    assert.ok(!isNonEmpty(42));
  });
});

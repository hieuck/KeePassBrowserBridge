import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'validators-functional.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const { isValidUrl, isValidEmail, isNonEmpty } = await import(
  path.join(projectRoot, 'extension', 'shared', 'validators.js')
);

describe('validators.js - isValidUrl functional', () => {
  it('should accept https://example.com', () => {
    assert.ok(isValidUrl('https://example.com'));
  });

  it('should accept http://localhost:19455', () => {
    assert.ok(isValidUrl('http://localhost:19455'));
  });

  it('should accept https://127.0.0.1/bridge', () => {
    assert.ok(isValidUrl('https://127.0.0.1/bridge'));
  });

  it('should reject ftp://files.example.com', () => {
    assert.equal(isValidUrl('ftp://files.example.com'), false);
  });

  it('should reject empty string', () => {
    assert.equal(isValidUrl(''), false);
  });

  it('should reject undefined', () => {
    assert.equal(isValidUrl(undefined), false);
  });

  it('should reject null', () => {
    assert.equal(isValidUrl(null), false);
  });

  it('should reject "not-a-url"', () => {
    assert.equal(isValidUrl('not-a-url'), false);
  });
});

describe('validators.js - isValidEmail functional', () => {
  it('should accept user@example.com', () => {
    assert.ok(isValidEmail('user@example.com'));
  });

  it('should accept user+tag@example.co.uk', () => {
    assert.ok(isValidEmail('user+tag@example.co.uk'));
  });

  it('should reject empty string', () => {
    assert.equal(isValidEmail(''), false);
  });

  it('should reject undefined', () => {
    assert.equal(isValidEmail(undefined), false);
  });

  it('should reject "not-an-email"', () => {
    assert.equal(isValidEmail('not-an-email'), false);
  });

  it('should reject missing domain', () => {
    assert.equal(isValidEmail('user@'), false);
  });
});

describe('validators.js - isNonEmpty functional', () => {
  it('should accept non-empty string', () => {
    assert.ok(isNonEmpty('hello'));
  });

  it('should accept string with whitespace', () => {
    assert.ok(isNonEmpty('  spaced  '));
  });

  it('should reject empty string', () => {
    assert.equal(isNonEmpty(''), false);
  });

  it('should reject whitespace-only string', () => {
    assert.equal(isNonEmpty('   '), false);
  });

  it('should reject null', () => {
    assert.equal(isNonEmpty(null), false);
  });

  it('should reject undefined', () => {
    assert.equal(isNonEmpty(undefined), false);
  });

  it('should reject number', () => {
    assert.equal(isNonEmpty(123), false);
  });
});

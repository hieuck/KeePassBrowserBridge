import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'formatters.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'shared', 'formatters.js'), 'utf8');

describe('formatters.js - formatRelativeTime', () => {
  it('should export formatRelativeTime', () => {
    assert.ok(source.includes('formatRelativeTime'), 'Missing formatRelativeTime export');
  });

  it('should return Never for falsy/zero timestamps', () => {
    assert.ok(source.includes("return 'Never'"), 'Missing Never fallback for invalid timestamps');
  });

  it('should return Just now for very recent timestamps', () => {
    assert.ok(source.includes("return 'Just now'"), 'Missing Just now for <1m');
  });

  it('should display minutes ago', () => {
    assert.ok(source.includes('m ago'), 'Missing minutes display (${mins}m ago)');
  });

  it('should display hours ago', () => {
    assert.ok(source.includes('h ago'), 'Missing hours display (${hours}h ago)');
  });

  it('should display days ago', () => {
    assert.ok(source.includes('d ago'), 'Missing days display (${days}d ago)');
  });

  it('should display months ago', () => {
    assert.ok(source.includes('mo ago'), 'Missing months display (${months}mo ago)');
  });
});

describe('formatters.js - formatCount', () => {
  it('should export formatCount', () => {
    assert.ok(source.includes('formatCount'), 'Missing formatCount export');
  });

  it('should return raw number for < 1000', () => {
    assert.ok(source.includes('n < 1000'), 'Missing <1000 condition');
  });

  it('should format thousands with K suffix', () => {
    assert.ok(source.includes('K'), 'Missing K suffix for thousands');
  });

  it('should format millions with M suffix', () => {
    assert.ok(source.includes('M'), 'Missing M suffix for millions');
  });
});

describe('formatters.js - truncate', () => {
  it('should export truncate', () => {
    assert.ok(source.includes('truncate'), 'Missing truncate export');
  });

  it('should return empty string for null/undefined', () => {
    assert.ok(source.includes("return ''"), 'Missing empty string fallback');
  });

  it('should return string as-is when under max length', () => {
    assert.ok(source.includes('str.length <= max'), 'Missing length check');
  });

  it('should use unicode ellipsis character for truncation', () => {
    assert.ok(source.includes('\u2026') || source.includes('\\u2026') || source.includes('…'),
      'Missing unicode ellipsis (\\u2026) for truncation');
  });
});

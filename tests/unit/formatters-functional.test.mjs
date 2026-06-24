import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'formatters-functional.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const { formatRelativeTime, formatCount, truncate } = await import(
  path.join(projectRoot, 'extension', 'shared', 'formatters.js')
);

describe('formatters.js - formatRelativeTime functional', () => {
  it('should return Never for null', () => {
    assert.equal(formatRelativeTime(null), 'Never');
  });

  it('should return Never for undefined', () => {
    assert.equal(formatRelativeTime(undefined), 'Never');
  });

  it('should return Never for 0', () => {
    assert.equal(formatRelativeTime(0), 'Never');
  });

  it('should return Never for negative values', () => {
    assert.equal(formatRelativeTime(-1000), 'Never');
  });

  it('should return Just now for very recent (10ms ago)', () => {
    const result = formatRelativeTime(Date.now() - 10);
    assert.equal(result, 'Just now');
  });

  it('should return minutes for values < 1 hour', () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    assert.equal(formatRelativeTime(fiveMinAgo), '5m ago');
  });

  it('should return hours for values < 24 hours', () => {
    const threeHoursAgo = Date.now() - 3 * 3600 * 1000;
    assert.equal(formatRelativeTime(threeHoursAgo), '3h ago');
  });

  it('should return days for values < 30 days', () => {
    const twoDaysAgo = Date.now() - 2 * 86400 * 1000;
    assert.equal(formatRelativeTime(twoDaysAgo), '2d ago');
  });

  it('should return months for values >= 30 days', () => {
    const threeMonthsAgo = Date.now() - 90 * 86400 * 1000;
    assert.equal(formatRelativeTime(threeMonthsAgo), '3mo ago');
  });

  it('should return 0m ago for exact minute boundary', () => {
    const exactlyOneMin = Date.now() - 60 * 1000;
    assert.equal(formatRelativeTime(exactlyOneMin), '1m ago');
  });

  it('should floor fractional minutes', () => {
    const oneAndHalfMin = Date.now() - 90 * 1000;
    assert.equal(formatRelativeTime(oneAndHalfMin), '1m ago');
  });
});

describe('formatters.js - formatCount functional', () => {
  it('should return "0" for 0', () => {
    assert.equal(formatCount(0), '0');
  });

  it('should return "999" for 999', () => {
    assert.equal(formatCount(999), '999');
  });

  it('should return "1.0K" for 1000', () => {
    assert.equal(formatCount(1000), '1.0K');
  });

  it('should return "1.5K" for 1500', () => {
    assert.equal(formatCount(1500), '1.5K');
  });

  it('should return "10.0K" for 10000', () => {
    assert.equal(formatCount(10000), '10.0K');
  });

  it('should return "1.0M" for 1000000', () => {
    assert.equal(formatCount(1000000), '1.0M');
  });

  it('should return "2.5M" for 2500000', () => {
    assert.equal(formatCount(2500000), '2.5M');
  });
});

describe('formatters.js - truncate functional', () => {
  it('should return empty for null', () => {
    assert.equal(truncate(null), '');
  });

  it('should return empty for undefined', () => {
    assert.equal(truncate(undefined), '');
  });

  it('should return short string as-is', () => {
    assert.equal(truncate('hello'), 'hello');
  });

  it('should return string at max length as-is', () => {
    assert.equal(truncate('12345', 5), '12345');
  });

  it('should truncate long string with ellipsis', () => {
    const result = truncate('hello world this is long', 10);
    assert.equal(result.length, 10);
    assert.ok(result.endsWith('\u2026'));
  });

  it('should use default max of 50', () => {
    const long = 'a'.repeat(100);
    const result = truncate(long);
    assert.equal(result.length, 50);
    assert.ok(result.endsWith('\u2026'));
  });
});

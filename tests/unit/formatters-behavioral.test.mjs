// RED: These tests define expected formatter behavior
import { describe, it, assert } from 'vitest';

describe('formatters.js - formatRelativeTime', () => {
  it('should return "Never" for null', async () => {
    const { formatRelativeTime } = await import('../../extension/shared/formatters.js');
    assert.equal(formatRelativeTime(null), 'Never');
  });

  it('should return "Never" for 0', async () => {
    const { formatRelativeTime } = await import('../../extension/shared/formatters.js');
    assert.equal(formatRelativeTime(0), 'Never');
  });

  it('should return "Just now" for very recent timestamps', async () => {
    const { formatRelativeTime } = await import('../../extension/shared/formatters.js');
    assert.equal(formatRelativeTime(Date.now() - 1000), 'Just now');
  });

  it('should return minutes ago for < 1 hour', async () => {
    const { formatRelativeTime } = await import('../../extension/shared/formatters.js');
    const result = formatRelativeTime(Date.now() - 5 * 60 * 1000);
    assert.ok(result.endsWith('m ago'));
  });

  it('should return hours ago for < 24 hours', async () => {
    const { formatRelativeTime } = await import('../../extension/shared/formatters.js');
    const result = formatRelativeTime(Date.now() - 3 * 3600 * 1000);
    assert.equal(result, '3h ago');
  });

  it('should return days ago for < 30 days', async () => {
    const { formatRelativeTime } = await import('../../extension/shared/formatters.js');
    const result = formatRelativeTime(Date.now() - 2 * 86400 * 1000);
    assert.equal(result, '2d ago');
  });

  it('should return months ago for >= 30 days', async () => {
    const { formatRelativeTime } = await import('../../extension/shared/formatters.js');
    const result = formatRelativeTime(Date.now() - 90 * 86400 * 1000);
    assert.equal(result, '3mo ago');
  });
});

describe('formatters.js - truncate', () => {
  it('should return empty string for null', async () => {
    const { truncate } = await import('../../extension/shared/formatters.js');
    assert.equal(truncate(null), '');
  });

  it('should return empty string for undefined', async () => {
    const { truncate } = await import('../../extension/shared/formatters.js');
    assert.equal(truncate(undefined), '');
  });

  it('should return short string as-is', async () => {
    const { truncate } = await import('../../extension/shared/formatters.js');
    assert.equal(truncate('hello'), 'hello');
  });

  it('should truncate long string with ellipsis', async () => {
    const { truncate } = await import('../../extension/shared/formatters.js');
    const result = truncate('This is a very long string that should be truncated', 20);
    assert.equal(result.length, 20);
    assert.ok(result.endsWith('\u2026'));
  });

  it('should use default max of 50', async () => {
    const { truncate } = await import('../../extension/shared/formatters.js');
    const long = 'a'.repeat(100);
    const result = truncate(long);
    assert.equal(result.length, 50);
  });
});

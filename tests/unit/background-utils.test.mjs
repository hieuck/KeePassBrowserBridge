import { describe, it, assert } from 'vitest';

const importModule = () => import('../../extension/shared/background-utils.js');

describe('background-utils - normalizeStringArray', () => {
  it('should return empty array for non-array', async () => {
    const { normalizeStringArray } = await importModule();
    assert.deepEqual(normalizeStringArray(null), []);
    assert.deepEqual(normalizeStringArray(undefined), []);
    assert.deepEqual(normalizeStringArray('hello'), []);
  });

  it('should trim and filter empty strings', async () => {
    const { normalizeStringArray } = await importModule();
    assert.deepEqual(normalizeStringArray(['  a  ', '', 'b', '  ', null]), ['a', 'b']);
  });

  it('should convert non-string values to strings', async () => {
    const { normalizeStringArray } = await importModule();
    assert.deepEqual(normalizeStringArray([123, true, { toString: () => 'obj' }]), ['123', 'true', 'obj']);
  });
});

describe('background-utils - normalizeFeatureMap', () => {
  it('should return empty object for non-array', async () => {
    const { normalizeFeatureMap } = await importModule();
    assert.deepEqual(normalizeFeatureMap(null), {});
  });

  it('should map features by Name with Enabled boolean', async () => {
    const { normalizeFeatureMap } = await importModule();
    const features = [
      { Name: 'auto-fill', Enabled: true },
      { Name: 'passkeys', Enabled: false },
      { Name: '' },
    ];
    assert.deepEqual(normalizeFeatureMap(features), { 'auto-fill': true, 'passkeys': false });
  });
});

describe('background-utils - normalizeFeatureDetails', () => {
  it('should return empty object for non-array', async () => {
    const { normalizeFeatureDetails } = await importModule();
    assert.deepEqual(normalizeFeatureDetails(null), {});
  });

  it('should create detailed feature map', async () => {
    const { normalizeFeatureDetails } = await importModule();
    const features = [
      { Name: 'auto-fill', Enabled: true },
      { Name: 'passkeys', Enabled: false, Status: 'prototype_disabled' },
    ];
    const result = normalizeFeatureDetails(features);
    assert.deepEqual(result['auto-fill'], { enabled: true, status: 'enabled', reason: '' });
    assert.deepEqual(result['passkeys'], { enabled: false, status: 'prototype_disabled', reason: '' });
  });
});

describe('background-utils - normalizeReleaseVersion', () => {
  it('should strip leading v', async () => {
    const { normalizeReleaseVersion } = await importModule();
    assert.equal(normalizeReleaseVersion('v2.0.0'), '2.0.0');
  });

  it('should trim whitespace', async () => {
    const { normalizeReleaseVersion } = await importModule();
    assert.equal(normalizeReleaseVersion('  2.0.0  '), '2.0.0');
  });

  it('should return empty string for null', async () => {
    const { normalizeReleaseVersion } = await importModule();
    assert.equal(normalizeReleaseVersion(null), '');
  });
});

describe('background-utils - compareVersions', () => {
  it('should return 0 for equal versions', async () => {
    const { compareVersions } = await importModule();
    assert.equal(compareVersions('2.0.0', '2.0.0'), 0);
  });

  it('should return positive when left is newer', async () => {
    const { compareVersions } = await importModule();
    assert.ok(compareVersions('2.1.0', '2.0.0') > 0);
  });

  it('should return negative when left is older', async () => {
    const { compareVersions } = await importModule();
    assert.ok(compareVersions('1.9.9', '2.0.0') < 0);
  });

  it('should handle versions with different patch levels', async () => {
    const { compareVersions } = await importModule();
    assert.ok(compareVersions('2.0.1', '2.0.0') > 0);
  });

  it('should handle v prefix', async () => {
    const { compareVersions } = await importModule();
    assert.equal(compareVersions('v2.0.0', '2.0.0'), 0);
  });
});

describe('background-utils - hasPartialPairingCredentials', () => {
  it('should return true when clientId but no sharedSecret', async () => {
    const { hasPartialPairingCredentials } = await importModule();
    assert.ok(hasPartialPairingCredentials({ clientId: 'abc', sharedSecret: '' }));
  });

  it('should return true when sharedSecret but no clientId', async () => {
    const { hasPartialPairingCredentials } = await importModule();
    assert.ok(hasPartialPairingCredentials({ clientId: '', sharedSecret: 'xyz' }));
  });

  it('should return false when both present', async () => {
    const { hasPartialPairingCredentials } = await importModule();
    assert.ok(!hasPartialPairingCredentials({ clientId: 'abc', sharedSecret: 'xyz' }));
  });

  it('should return false when neither present', async () => {
    const { hasPartialPairingCredentials } = await importModule();
    assert.ok(!hasPartialPairingCredentials({ clientId: '', sharedSecret: '' }));
  });
});

describe('background-utils - booleanSetting', () => {
  it('should return the boolean value when boolean', async () => {
    const { booleanSetting } = await importModule();
    assert.equal(booleanSetting(true, false), true);
    assert.equal(booleanSetting(false, true), false);
  });

  it('should return default when non-boolean', async () => {
    const { booleanSetting } = await importModule();
    assert.equal(booleanSetting(null, true), true);
    assert.equal(booleanSetting(undefined, false), false);
    assert.equal(booleanSetting('yes', true), true);
  });
});

describe('background-utils - numberSetting', () => {
  it('should return the parsed number when valid', async () => {
    const { numberSetting } = await importModule();
    assert.equal(numberSetting('30', 0, 300), 30);
  });

  it('should return default when value is negative', async () => {
    const { numberSetting } = await importModule();
    assert.equal(numberSetting(-5, 10, 300), 10);
  });

  it('should return default when value exceeds max', async () => {
    const { numberSetting } = await importModule();
    assert.equal(numberSetting(500, 10, 300), 10);
  });

  it('should return default for NaN', async () => {
    const { numberSetting } = await importModule();
    assert.equal(numberSetting('not-a-number', 42, 300), 42);
  });
});

describe('background-utils - isActivePairingTimestamp', () => {
  it('should return true for recent timestamp', async () => {
    const { isActivePairingTimestamp } = await importModule();
    assert.ok(isActivePairingTimestamp(Date.now() - 1000));
  });

  it('should return false for future timestamp', async () => {
    const { isActivePairingTimestamp } = await importModule();
    assert.ok(!isActivePairingTimestamp(Date.now() + 86400000));
  });

  it('should return false for zero', async () => {
    const { isActivePairingTimestamp } = await importModule();
    assert.ok(!isActivePairingTimestamp(0));
  });
});

describe('background-utils - normalizeClientPermissions', () => {
  it('should always include read permission', async () => {
    const { normalizeClientPermissions } = await importModule();
    assert.deepEqual(normalizeClientPermissions([], false), ['read']);
  });

  it('should include write when present', async () => {
    const { normalizeClientPermissions } = await importModule();
    assert.deepEqual(normalizeClientPermissions(['write'], false), ['read', 'write']);
  });

  it('should include passkey permissions when enabled', async () => {
    const { normalizeClientPermissions } = await importModule();
    const result = normalizeClientPermissions(['write', 'passkeyRead', 'passkeyWrite'], true);
    assert.ok(result.includes('passkeyRead'));
    assert.ok(result.includes('passkeyWrite'));
  });
});

describe('background-utils - clientPermissionAllowList', () => {
  it('should return base permissions without passkeys', async () => {
    const { clientPermissionAllowList } = await importModule();
    assert.deepEqual(clientPermissionAllowList(false), ['read', 'write', 'manageClients']);
  });

  it('should include passkey permissions when enabled', async () => {
    const { clientPermissionAllowList } = await importModule();
    const list = clientPermissionAllowList(true);
    assert.ok(list.includes('passkeyRead'));
    assert.ok(list.includes('passkeyWrite'));
  });
});

describe('background-utils - edge cases', () => {
  it('compareVersions should handle pre-release version tags', async () => {
    const { compareVersions } = await importModule();
    assert.equal(compareVersions('1.0.0-alpha', '1.0.0'), 0);
    assert.equal(compareVersions('2.0.0-beta', '2.0.0-alpha'), 0);
  });

  it('compareVersions should handle versions with different segment counts', async () => {
    const { compareVersions } = await importModule();
    assert.ok(compareVersions('1.0', '2.0.0.0') < 0);
    assert.ok(compareVersions('2.0.0.0', '1.0') > 0);
    assert.equal(compareVersions('1.0', '1.0.0.0'), 0);
  });

  it('normalizeStringArray should handle undefined values in array', async () => {
    const { normalizeStringArray } = await importModule();
    assert.deepEqual(normalizeStringArray(['a', undefined, 'b']), ['a', 'b']);
  });

  it('normalizeFeatureMap should handle features with missing Name or Enabled', async () => {
    const { normalizeFeatureMap } = await importModule();
    const result = normalizeFeatureMap([
      { Name: 'valid', Enabled: true },
      { Enabled: true },
      {},
      { Name: 'no-enabled' },
    ]);
    assert.deepEqual(result, { 'valid': true, 'no-enabled': false });
  });

  it('numberSetting should handle string "0" input', async () => {
    const { numberSetting } = await importModule();
    assert.equal(numberSetting('0', 10, 300), 0);
  });
});

describe('background-utils - getRelatedOrigins', () => {
  it('should return related origins for .com domain', async () => {
    const { getRelatedOrigins } = await importModule();
    const results = getRelatedOrigins('https://example.com/login');
    assert.ok(results.length > 0);
    assert.ok(results.some(r => r.startsWith('https://example.co.uk')));
    assert.ok(results.some(r => r.startsWith('https://example.ca')));
  });

  it('should preserve protocol, path and query', async () => {
    const { getRelatedOrigins } = await importModule();
    const results = getRelatedOrigins('http://example.com/path?q=1');
    assert.ok(results.every(r => r.startsWith('http://')));
    assert.ok(results.every(r => r.endsWith('/path?q=1')));
  });

  it('should return empty array for unknown TLD', async () => {
    const { getRelatedOrigins } = await importModule();
    assert.deepEqual(getRelatedOrigins('https://example.xyz'), []);
  });

  it('should return empty array for invalid URL', async () => {
    const { getRelatedOrigins } = await importModule();
    assert.deepEqual(getRelatedOrigins('not-a-url'), []);
  });

  it('should map .co.uk to .com', async () => {
    const { getRelatedOrigins } = await importModule();
    const results = getRelatedOrigins('https://example.co.uk/page');
    assert.ok(results.some(r => r.startsWith('https://example.com')));
  });

  it('should preserve port in related origins', async () => {
    const { getRelatedOrigins } = await importModule();
    const results = getRelatedOrigins('https://example.com:8080/app');
    assert.ok(results.every(r => r.includes(':8080/')));
  });

  it('should handle subdomains correctly', async () => {
    const { getRelatedOrigins } = await importModule();
    const results = getRelatedOrigins('https://sub.example.com/login');
    assert.ok(results.every(r => r.startsWith('https://sub.example')));
  });
});

describe('background-utils - isTerminalPairingError', () => {
  it('should return true for expired error', async () => {
    const { isTerminalPairingError } = await importModule();
    assert.ok(isTerminalPairingError(new Error('Pairing session expired')));
  });

  it('should return true for too many attempts', async () => {
    const { isTerminalPairingError } = await importModule();
    assert.ok(isTerminalPairingError(new Error('Too many invalid attempts')));
  });

  it('should return false for generic error', async () => {
    const { isTerminalPairingError } = await importModule();
    assert.ok(!isTerminalPairingError(new Error('Network error')));
  });

  it('should handle string input', async () => {
    const { isTerminalPairingError } = await importModule();
    assert.ok(isTerminalPairingError('Session expired'));
    assert.ok(!isTerminalPairingError('OK'));
  });
});

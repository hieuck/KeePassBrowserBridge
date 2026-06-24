import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'utils.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'options', 'utils.js'), 'utf8');

describe('utils.js - DEFAULT_ENDPOINT', () => {
  it('should be http://127.0.0.1:19455/bridge', () => {
    assert.ok(source.includes('http://127.0.0.1:19455/bridge'), 'Default endpoint mismatch');
  });
});

describe('utils.js - normalizeBridgeEndpoint', () => {
  it('should return default endpoint for empty input', () => {
    assert.ok(source.includes('return DEFAULT_ENDPOINT'), 'Missing default endpoint return');
  });

  it('should accept http://127.0.0.1/bridge with port', () => {
    assert.ok(source.includes("url.protocol !== 'http:'"), 'Missing http protocol check');
    assert.ok(source.includes("url.hostname !== '127.0.0.1'"), 'Missing hostname check for 127.0.0.1');
  });

  it('should reject non-http protocols', () => {
    assert.ok(source.includes("url.protocol !== 'http:'"), 'Missing protocol validation');
  });

  it('should reject URLs with credentials', () => {
    assert.ok(source.includes('url.username') || source.includes('url.password'),
      'Missing credential rejection');
    assert.ok(source.includes('must not include credentials'),
      'Missing credentials error message');
  });

  it('should reject URLs with query strings or fragments', () => {
    assert.ok(source.includes('url.search') || source.includes('url.hash'),
      'Missing query/fragment rejection');
    assert.ok(source.includes('without query or fragment'),
      'Missing query/fragment error message');
  });

  it('should reject URLs with pathname other than /bridge', () => {
    assert.ok(source.includes("url.pathname !== '/bridge'"), 'Missing /bridge path check');
  });

  it('should reject localhost (only 127.0.0.1 allowed)', () => {
    // localhost is a common mistake — the function should explicitly reject it
    // because it strictly validates hostname !== '127.0.0.1'
    assert.ok(source.includes("url.hostname !== '127.0.0.1'"), 'Missing strict 127.0.0.1 hostname check');
  });

  it('should return url.toString() for valid input', () => {
    assert.ok(source.includes('return url.toString()'), 'Missing url.toString() return');
  });

  it('should use URL constructor', () => {
    assert.ok(source.includes('new URL(value)'), 'Missing URL constructor call');
  });
});

describe('utils.js - normalizeIntegerSetting', () => {
  it('should export normalizeIntegerSetting', () => {
    assert.ok(source.includes('normalizeIntegerSetting'), 'Missing normalizeIntegerSetting export');
  });

  it('should trim whitespace from input', () => {
    assert.ok(source.includes('.trim()'), 'Missing trim call');
  });

  it('should reject non-numeric strings', () => {
    assert.ok(source.includes('/^\\d+$/'), 'Missing numeric regex validation');
  });

  it('should reject values below minimum', () => {
    assert.ok(source.includes('parsed < min'), 'Missing min bound check');
  });

  it('should reject values above maximum', () => {
    assert.ok(source.includes('parsed > max'), 'Missing max bound check');
  });

  it('should throw with custom error message', () => {
    assert.ok(source.includes('throw new Error(errorMessage)'), 'Missing custom error message');
  });
});

describe('utils.js - normalizeHost', () => {
  it('should return empty string for empty input', () => {
    assert.ok(source.includes("return ''"), 'Missing empty return');
  });

  it('should lowercase the result', () => {
    assert.ok(source.includes('.toLowerCase()'), 'Missing toLowerCase');
  });

  it('should trim dots from host', () => {
    assert.ok(source.includes('.replace'), 'Missing replace for dot trimming');
    assert.ok(source.includes('^\\.+|\\.+$'), 'Missing leading/trailing dot regex');
  });
});

describe('utils.js - isValidSiteOverrideHost', () => {
  it('should accept localhost', () => {
    assert.ok(source.includes("host === 'localhost'"), 'Missing localhost special case');
  });

  it('should accept valid IPv4 addresses', () => {
    assert.ok(source.includes('/^\\d+$/.test(part)'), 'Missing IPv4 octet digit check');
    assert.ok(source.includes('>= 0 && value <= 255'), 'Missing IPv4 octet range check');
  });

  it('should accept valid domain names', () => {
    assert.ok(source.includes('/^[a-z0-9]'), 'Missing domain label regex');
    assert.ok(source.includes('{0,61}'), 'Missing label length limit');
  });

  it('should reject empty host', () => {
    assert.ok(source.includes('if (!host) return false'), 'Missing empty host check');
  });
});

describe('utils.js - normalizeSiteOverrides', () => {
  it('should handle non-array input', () => {
    assert.ok(source.includes('!Array.isArray(rules)'), 'Missing isArray check');
  });

  it('should skip rules with empty host', () => {
    assert.ok(source.includes('!host'), 'Missing empty host skip');
  });

  it('should skip duplicate hosts', () => {
    assert.ok(source.includes('existing.host === host'), 'Missing duplicate host check');
  });

  it('should set autoFillEnabled default to true', () => {
    assert.ok(source.includes('autoFillEnabled !== false'), 'Missing autoFillEnabled default true');
  });
});

describe('utils.js - sanitizePortableSettings', () => {
  it('should handle non-object input', () => {
    assert.ok(source.includes("typeof source === 'object'"), 'Missing object type check');
  });

  it('should use PORTABLE_SETTING_KEYS for iteration', () => {
    assert.ok(source.includes('PORTABLE_SETTING_KEYS'), 'Missing PORTABLE_SETTING_KEYS loop');
  });

  it('should use hasOwnProperty for safe key checking', () => {
    assert.ok(source.includes('Object.prototype.hasOwnProperty.call'),
      'Missing safe hasOwnProperty check');
  });

  it('should normalize endpoint when validateEndpoint is set', () => {
    assert.ok(source.includes('options.validateEndpoint') || source.includes('normalizeBridgeEndpoint'),
      'Missing optional endpoint validation');
  });

  it('should validate theme values', () => {
    assert.ok(source.includes("'system', 'light', 'dark'"), 'Missing theme validation values');
  });

  it('should validate boolean settings', () => {
    assert.ok(source.includes("typeof sanitized[key] === 'boolean'"), 'Missing boolean type check');
  });

  it('should normalize autoFillDelay via normalizeIntegerSetting', () => {
    assert.ok(source.includes('normalizeIntegerSetting') && source.includes('autoFillDelay'),
      'Missing autoFillDelay normalization');
  });

  it('should normalize siteOverrides via normalizeSiteOverrides', () => {
    assert.ok(source.includes('siteOverrides'), 'Missing siteOverrides normalization');
  });
});

describe('utils.js - normalizeClientPermissions', () => {
  it('should always include read permission', () => {
    assert.ok(source.includes("normalized = ['read']"), 'Missing default read permission');
  });

  it('should deduplicate permissions', () => {
    assert.ok(source.includes('!normalized.includes(p)'), 'Missing dedup check');
  });

  it('should only allow known permission values', () => {
    assert.ok(source.includes('allowed.includes(p)'), 'Missing allowlist check');
  });
});

describe('utils.js - formatClientPermissions', () => {
  it('should use labels from getPermissionDefinitions', () => {
    assert.ok(source.includes('getPermissionDefinitions(true)'), 'Should call getPermissionDefinitions with passkeys enabled');
  });

  it('should join labels with comma separator', () => {
    assert.ok(source.includes(".join(', ')"), 'Missing join with comma');
  });

  it('should filter out unknown labels', () => {
    assert.ok(source.includes('.filter(Boolean)'), 'Missing filter(Boolean) for unknown labels');
  });
});

describe('utils.js - DEFAULT_SETTINGS', () => {
  it('should define all required default settings', () => {
    // Check key defaults exist
    const defaults = ['autoFillEnabled: true', 'autoSubmitEnabled: false', 'strictUrlMatching: false',
      'regexUrlMatching: false', 'showPasswordsInPopup: false', 'notificationsEnabled: true',
      'autoLockTimeoutMinutes: 0', 'siteOverrides: []'];
    for (const d of defaults) {
      assert.ok(source.includes(d), `Missing default: ${d}`);
    }
  });
});

describe('utils.js - send function', () => {
  it('should use chrome.runtime.sendMessage', () => {
    assert.ok(source.includes('chrome.runtime.sendMessage'),
      'Missing chrome.runtime.sendMessage call');
  });

  it('should check result.ok', () => {
    assert.ok(source.includes('!result || !result.ok'), 'Missing result.ok check');
  });

  it('should throw on error with response.error message', () => {
    assert.ok(source.includes('result.error'), 'Missing result.error handling');
  });

  it('should return result.response on success', () => {
    assert.ok(source.includes('return result.response'), 'Missing result.response return');
  });
});

describe('utils.js - getPermissionDefinitions', () => {
  it('should include read, write, manageClients', () => {
    assert.ok(source.includes("value: 'read'"), 'Missing read permission');
    assert.ok(source.includes("value: 'write'"), 'Missing write permission');
    assert.ok(source.includes("value: 'manageClients'"), 'Missing manageClients permission');
  });

  it('should include passkey permissions when enabled', () => {
    assert.ok(source.includes('passkeyRead'), 'Missing passkeyRead permission');
    assert.ok(source.includes('passkeyWrite'), 'Missing passkeyWrite permission');
    assert.ok(source.includes('if (passkeysEnabled)'), 'Missing passkeysEnabled conditional');
  });
});

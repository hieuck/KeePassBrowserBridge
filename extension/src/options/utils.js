export const DEFAULT_ENDPOINT = 'http://127.0.0.1:19455/bridge';

export const DEFAULT_SETTINGS = {
  theme: 'system',
  autoFillEnabled: true,
  autoSubmitEnabled: false,
  autoFillDelay: 1200,
  strictUrlMatching: false,
  regexUrlMatching: false,
  showPasswordsInPopup: false,
  notificationsEnabled: true,
  autoLockTimeoutMinutes: 0,
  clipboardClearDelay: 30,
  debugMode: false,
  siteOverrides: []
};

export function send(message) {
  return chrome.runtime.sendMessage(message).then((result) => {
    if (!result || !result.ok) {
      throw new Error(result && result.error ? result.error : 'Extension request failed.');
    }
    return result.response;
  });
}

export function normalizeBridgeEndpoint(endpoint) {
  const value = String(endpoint || '').trim();
  if (!value) {
    return DEFAULT_ENDPOINT;
  }
  const url = new URL(value);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') {
    throw new Error('Bridge endpoint must be an http://127.0.0.1 URL.');
  }
  if (url.username || url.password) {
    throw new Error('Bridge endpoint must not include credentials.');
  }
  if (url.pathname !== '/bridge' || url.search || url.hash) {
    throw new Error('Bridge endpoint must be an http://127.0.0.1 /bridge URL without query or fragment.');
  }
  return url.toString();
}

export function normalizeIntegerSetting(value, min, max, errorMessage) {
  const trimmed = String(value ?? '').trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(errorMessage);
  }
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(errorMessage);
  }
  return parsed;
}

export function normalizeHost(value) {
  const trimmed = String(value || '').trim().toLowerCase();
  if (!trimmed) {
    return '';
  }
  let host;
  try {
    const parsed = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    host = parsed.hostname;
  } catch {
    host = trimmed;
  }
  host = host.replace(/^\.+|\.+$/g, '');
  return isValidSiteOverrideHost(host) ? host : '';
}

function isValidSiteOverrideHost(host) {
  if (!host) return false;
  if (host === 'localhost') return true;
  const octets = host.split('.');
  if (octets.length === 4 && octets.every((part) => /^\d+$/.test(part))) {
    return octets.every((part) => {
      const value = Number.parseInt(part, 10);
      return value >= 0 && value <= 255 && String(value) === part;
    });
  }
  return octets.every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
  );
}

export function normalizeSiteOverrides(rules) {
  if (!Array.isArray(rules)) return [];
  const normalized = [];
  for (const rule of rules) {
    const host = normalizeHost(rule && rule.host);
    if (!host || normalized.some((existing) => existing.host === host)) continue;
    normalized.push({
      host,
      autoFillEnabled: rule.autoFillEnabled !== false,
      autoSubmitEnabled: rule.autoSubmitEnabled === true
    });
  }
  return normalized;
}

export const PORTABLE_SETTING_KEYS = [
  'endpoint',
  'theme',
  'autoFillEnabled',
  'autoSubmitEnabled',
  'autoFillDelay',
  'strictUrlMatching',
  'regexUrlMatching',
  'showPasswordsInPopup',
  'notificationsEnabled',
  'autoLockTimeoutMinutes',
  'clipboardClearDelay',
  'debugMode',
  'siteOverrides'
];

export function sanitizePortableSettings(settings, options = {}) {
  const source = settings && typeof settings === 'object' ? settings : {};
  const sanitized = {};
  for (const key of PORTABLE_SETTING_KEYS) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      sanitized[key] = source[key];
    }
  }
  if (Object.prototype.hasOwnProperty.call(sanitized, 'endpoint')) {
    sanitized.endpoint = options.validateEndpoint
      ? normalizeBridgeEndpoint(sanitized.endpoint)
      : String(sanitized.endpoint || '').trim() || DEFAULT_ENDPOINT;
  }
  if (Object.prototype.hasOwnProperty.call(sanitized, 'theme')) {
    const theme = String(sanitized.theme || DEFAULT_SETTINGS.theme);
    sanitized.theme = ['system', 'light', 'dark'].includes(theme) ? theme : DEFAULT_SETTINGS.theme;
  }
  for (const key of ['autoFillEnabled', 'autoSubmitEnabled', 'strictUrlMatching', 'regexUrlMatching', 'showPasswordsInPopup', 'notificationsEnabled', 'debugMode']) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      sanitized[key] = typeof sanitized[key] === 'boolean' ? sanitized[key] : DEFAULT_SETTINGS[key];
    }
  }
  if (Object.prototype.hasOwnProperty.call(sanitized, 'autoFillDelay')) {
    sanitized.autoFillDelay = normalizeIntegerSetting(
      sanitized.autoFillDelay, 0, 5000,
      'Auto-fill delay must be between 0 and 5000 milliseconds.'
    );
  }
  if (Object.prototype.hasOwnProperty.call(sanitized, 'autoLockTimeoutMinutes')) {
    sanitized.autoLockTimeoutMinutes = normalizeIntegerSetting(
      sanitized.autoLockTimeoutMinutes, 0, 1440,
      'Auto-lock timeout must be between 0 and 1440 minutes.'
    );
  }
  if (Object.prototype.hasOwnProperty.call(sanitized, 'clipboardClearDelay')) {
    sanitized.clipboardClearDelay = normalizeIntegerSetting(
      sanitized.clipboardClearDelay, 0, 300,
      'Clipboard clear delay must be between 0 and 300 seconds.'
    );
  }
  if (Object.prototype.hasOwnProperty.call(sanitized, 'siteOverrides')) {
    sanitized.siteOverrides = normalizeSiteOverrides(sanitized.siteOverrides);
  }
  return sanitized;
}

export function formatDate(ms) {
  const value = Number(ms || 0);
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleString();
}

export function getPermissionDefinitions(passkeysEnabled) {
  const definitions = [
    { value: 'read', label: 'Read' },
    { value: 'write', label: 'Write' },
    { value: 'manageClients', label: 'Manage browsers' }
  ];
  if (passkeysEnabled) {
    definitions.push(
      { value: 'passkeyRead', label: 'Passkey read' },
      { value: 'passkeyWrite', label: 'Passkey write' }
    );
  }
  return definitions;
}

export function normalizeClientPermissions(permissions) {
  const allowed = getPermissionDefinitions(true).map((d) => d.value);
  const normalized = ['read'];
  for (const p of Array.isArray(permissions) ? permissions : []) {
    if (allowed.includes(p) && !normalized.includes(p)) {
      normalized.push(p);
    }
  }
  return normalized;
}

export function formatClientPermissions(permissions) {
  const labels = Object.fromEntries(getPermissionDefinitions(true).map((d) => [d.value, d.label]));
  const values = normalizeClientPermissions(permissions);
  return values.map((p) => labels[p]).filter(Boolean).join(', ');
}

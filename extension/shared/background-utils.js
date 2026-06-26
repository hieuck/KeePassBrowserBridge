export function normalizeStringArray(values) {
  if (!Array.isArray(values)) return [];
  return values.map((value) => String(value || '').trim()).filter(Boolean);
}

export function normalizeFeatureMap(features) {
  if (!Array.isArray(features)) return {};
  return features.reduce((result, feature) => {
    const name = String(feature && feature.Name || '').trim();
    if (name) result[name] = Boolean(feature.Enabled);
    return result;
  }, {});
}

export function normalizeFeatureDetails(features) {
  if (!Array.isArray(features)) return {};
  return features.reduce((result, feature) => {
    const name = String(feature && feature.Name || '').trim();
    if (!name) return result;
    const enabled = Boolean(feature.Enabled);
    const status = String(feature && feature.Status || '').trim() || (enabled ? 'enabled' : 'disabled');
    result[name] = {
      enabled,
      status,
      reason: String(feature && feature.Reason || '').trim()
    };
    return result;
  }, {});
}

export function normalizeReleaseVersion(version) {
  return String(version || '').trim().replace(/^v/i, '');
}

export function compareVersions(left, right) {
  const leftParts = normalizeReleaseVersion(left).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const rightParts = normalizeReleaseVersion(right).split('.').map((part) => Number.parseInt(part, 10) || 0);
  const length = Math.max(leftParts.length, rightParts.length);
  for (let index = 0; index < length; index += 1) {
    const delta = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (delta !== 0) return delta;
  }
  return 0;
}

export function hasPartialPairingCredentials(state) {
  return Boolean(state && ((state.clientId && !state.sharedSecret) || (!state.clientId && state.sharedSecret)));
}

export function booleanSetting(value, defaultValue) {
  return typeof value === 'boolean' ? value : defaultValue;
}

export function numberSetting(value, defaultValue, maxValue) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && (maxValue === undefined || parsed <= maxValue)
    ? parsed
    : defaultValue;
}

export function isActivePairingTimestamp(value) {
  if (!Number.isFinite(value) || value <= 0 || value > Date.now()) {
    return false;
  }
  return Date.now() - value <= (5 * 60 * 1000);
}

export function normalizeClientPermissions(permissions, passkeysEnabled = false) {
  const allowed = clientPermissionAllowList(passkeysEnabled);
  const normalized = ['read'];
  for (const permission of Array.isArray(permissions) ? permissions : []) {
    if (allowed.includes(permission) && !normalized.includes(permission)) {
      normalized.push(permission);
    }
  }
  return normalized;
}

export function clientPermissionAllowList(passkeysEnabled = false) {
  const allowed = ['read', 'write', 'manageClients'];
  if (passkeysEnabled) {
    allowed.push('passkeyRead', 'passkeyWrite');
  }
  return allowed;
}

export function isTerminalPairingError(error) {
  const message = error && error.message ? error.message : String(error || '');
  return /expired|not found|too many invalid attempts/i.test(message);
}

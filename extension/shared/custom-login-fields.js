import { getSettings, setSettings } from './storage.js';

const STORAGE_KEY = 'customLoginFields';
const VALID_ROLES = new Set(['username', 'password', 'totp']);

export function normalizeDomain(urlOrDomain) {
  if (!urlOrDomain) return '';
  try {
    const url = new URL(urlOrDomain);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return urlOrDomain.replace(/^www\./, '').toLowerCase();
  }
}

export async function getCustomLoginFields(domainOrUrl) {
  const domain = normalizeDomain(domainOrUrl);
  if (!domain) return null;
  const settings = await getSettings();
  const all = settings[STORAGE_KEY] || {};
  return all[domain] || null;
}

export async function setCustomLoginField(domainOrUrl, role, selector) {
  const domain = normalizeDomain(domainOrUrl);
  if (!domain) {
    throw new Error('Invalid domain');
  }
  if (!VALID_ROLES.has(role)) {
    throw new Error(`Invalid role: ${role}. Must be one of ${[...VALID_ROLES].join(', ')}`);
  }
  if (!selector || typeof selector !== 'string') {
    throw new Error('Selector must be a non-empty string');
  }

  const settings = await getSettings();
  const all = settings[STORAGE_KEY] || {};
  const current = { ...(all[domain] || {}) };
  current[role] = selector;
  all[domain] = current;
  await setSettings({ [STORAGE_KEY]: all });
  return current;
}

export async function clearCustomLoginFields(domainOrUrl) {
  const domain = normalizeDomain(domainOrUrl);
  if (!domain) return;
  const settings = await getSettings();
  const all = settings[STORAGE_KEY] || {};
  if (!(domain in all)) return;
  const { [domain]: _removed, ...rest } = all;
  void _removed;
  await setSettings({ [STORAGE_KEY]: rest });
}

export function findCustomFields(root, mapping) {
  if (!mapping) return null;
  const result = {};
  for (const role of VALID_ROLES) {
    const selector = mapping[role];
    if (selector) {
      try {
        result[role] = root.querySelector(selector) || null;
      } catch {
        result[role] = null;
      }
    } else {
      result[role] = null;
    }
  }
  return result;
}

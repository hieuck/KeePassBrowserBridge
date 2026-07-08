import { getSettings, setSettings } from './storage.js';

const STORAGE_KEY = 'sitePreferences';
const VALID_KEYS = new Set([
  'disableAutofill',
  'disableSavePrompt',
  'disablePasskeys',
]);

export function normalizeDomain(urlOrDomain) {
  if (!urlOrDomain) return '';
  try {
    const url = new URL(urlOrDomain);
    return url.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return urlOrDomain.replace(/^www\./, '').toLowerCase();
  }
}

export async function getSitePreference(domainOrUrl, key) {
  const domain = normalizeDomain(domainOrUrl);
  if (!domain || !VALID_KEYS.has(key)) return undefined;
  const settings = await getSettings();
  const all = settings[STORAGE_KEY] || {};
  return (all[domain] || {})[key];
}

export async function setSitePreference(domainOrUrl, key, value) {
  const domain = normalizeDomain(domainOrUrl);
  if (!domain) {
    throw new Error('Invalid domain');
  }
  if (!VALID_KEYS.has(key)) {
    throw new Error(`Invalid preference key: ${key}`);
  }

  const settings = await getSettings();
  const all = settings[STORAGE_KEY] || {};
  const current = { ...(all[domain] || {}) };
  current[key] = value;
  all[domain] = current;
  await setSettings({ [STORAGE_KEY]: all });
  return current;
}

export async function clearSitePreferences(domainOrUrl) {
  const domain = normalizeDomain(domainOrUrl);
  if (!domain) return;
  const settings = await getSettings();
  const all = settings[STORAGE_KEY] || {};
  if (!(domain in all)) return;
  const { [domain]: _removed, ...rest } = all;
  void _removed;
  await setSettings({ [STORAGE_KEY]: rest });
}

export async function getAllSitePreferences() {
  const settings = await getSettings();
  return settings[STORAGE_KEY] || {};
}

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSitePreference,
  setSitePreference,
  clearSitePreferences,
  getAllSitePreferences,
  normalizeDomain,
} from '../../extension/shared/site-preferences.js';
import * as storage from '../../extension/shared/storage.js';

describe('site-preferences', () => {
  let stored = {};

  beforeEach(() => {
    stored = {};
    vi.spyOn(storage, 'getSettings').mockImplementation(() => Promise.resolve(stored));
    vi.spyOn(storage, 'setSettings').mockImplementation((obj) => {
      Object.assign(stored, obj);
      return Promise.resolve();
    });
  });

  it('normalizeDomain strips protocol, port, path and www', () => {
    expect(normalizeDomain('https://example.com/login')).toBe('example.com');
    expect(normalizeDomain('http://www.example.com:8080/')).toBe('example.com');
  });

  it('returns undefined when no preferences are stored', async () => {
    const result = await getSitePreference('example.com', 'disableAutofill');
    expect(result).toBeUndefined();
  });

  it('stores and retrieves a boolean preference per domain', async () => {
    await setSitePreference('https://app.example.com/login', 'disableAutofill', true);
    const result = await getSitePreference('app.example.com', 'disableAutofill');
    expect(result).toBe(true);
  });

  it('returns only the requested preference key', async () => {
    await setSitePreference('example.com', 'disableAutofill', true);
    await setSitePreference('example.com', 'disableSavePrompt', false);
    expect(await getSitePreference('example.com', 'disableAutofill')).toBe(true);
    expect(await getSitePreference('example.com', 'disableSavePrompt')).toBe(false);
  });

  it('clears all preferences for a domain', async () => {
    await setSitePreference('example.com', 'disableAutofill', true);
    await clearSitePreferences('example.com');
    expect(await getSitePreference('example.com', 'disableAutofill')).toBeUndefined();
  });

  it('rejects invalid preference keys', async () => {
    await expect(setSitePreference('example.com', 'invalidKey', true)).rejects.toThrow();
  });

  it('lists all stored preferences', async () => {
    await setSitePreference('example.com', 'disableAutofill', true);
    await setSitePreference('other.com', 'disablePasskeys', true);
    const all = await getAllSitePreferences();
    expect(all).toEqual({
      'example.com': { disableAutofill: true },
      'other.com': { disablePasskeys: true },
    });
  });
});

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCustomLoginFields,
  setCustomLoginField,
  clearCustomLoginFields,
  normalizeDomain,
  findCustomFields,
} from '../../extension/shared/custom-login-fields.js';
import * as storage from '../../extension/shared/storage.js';

describe('custom-login-fields', () => {
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
    expect(normalizeDomain('example.com')).toBe('example.com');
  });

  it('returns null when no custom fields are stored', async () => {
    const result = await getCustomLoginFields('example.com');
    expect(result).toBeNull();
  });

  it('stores and retrieves a custom login field mapping', async () => {
    await setCustomLoginField('https://app.example.com/login', 'username', '#user');
    await setCustomLoginField('app.example.com', 'password', '#pass');
    const result = await getCustomLoginFields('https://app.example.com/dashboard');
    expect(result).toEqual({
      username: '#user',
      password: '#pass',
    });
  });

  it('overwrites an existing field for the same domain and role', async () => {
    await setCustomLoginField('example.com', 'username', '#old');
    await setCustomLoginField('example.com', 'username', '#new');
    const result = await getCustomLoginFields('example.com');
    expect(result.username).toBe('#new');
  });

  it('clears all custom fields for a domain', async () => {
    await setCustomLoginField('example.com', 'username', '#user');
    await clearCustomLoginFields('example.com');
    const result = await getCustomLoginFields('example.com');
    expect(result).toBeNull();
  });

  it('ignores invalid roles', async () => {
    await expect(setCustomLoginField('example.com', 'invalid', '#x')).rejects.toThrow();
    const result = await getCustomLoginFields('example.com');
    expect(result).toBeNull();
  });

  describe('findCustomFields', () => {
    it('returns matching elements from a selector mapping', () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <input id="user" type="text" />
        <input id="pass" type="password" />
        <input id="otp" type="text" />
      `;
      const mapping = { username: '#user', password: '#pass', totp: '#otp' };
      const result = findCustomFields(root, mapping);
      expect(result.username.id).toBe('user');
      expect(result.password.id).toBe('pass');
      expect(result.totp.id).toBe('otp');
    });

    it('returns null for missing elements', () => {
      const root = document.createElement('div');
      root.innerHTML = '<input id="user" type="text" />';
      const mapping = { username: '#user', password: '#missing' };
      const result = findCustomFields(root, mapping);
      expect(result.username.id).toBe('user');
      expect(result.password).toBeNull();
    });

    it('returns null when mapping is null', () => {
      const root = document.createElement('div');
      expect(findCustomFields(root, null)).toBeNull();
    });
  });
});

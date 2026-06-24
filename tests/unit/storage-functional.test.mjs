import assert from 'node:assert/strict';
import { vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'storage-functional.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// Mock chrome.storage.local for this test
const mockStorage = { data: {} };
global.chrome = {
  ...global.chrome,
  storage: {
    local: {
      get: vi.fn((keys, cb) => {
        if (typeof keys === 'function') { cb = keys; keys = null; }
        cb(mockStorage.data);
      }),
      set: vi.fn((items, cb) => {
        Object.assign(mockStorage.data, items);
        if (cb) cb();
      }),
    },
  },
};

const { getSettings, setSetting, setSettings } = await import(
  path.join(projectRoot, 'extension', 'shared', 'storage.js')
);

describe('storage.js - getSettings functional', () => {
  beforeEach(() => {
    mockStorage.data = {};
  });

  it('should return empty object when no data stored', async () => {
    const result = await getSettings();
    assert.deepEqual(result, {});
  });

  it('should return all stored settings', async () => {
    mockStorage.data = { theme: 'dark', autoFillEnabled: true };
    const result = await getSettings();
    assert.deepEqual(result, { theme: 'dark', autoFillEnabled: true });
  });
});

describe('storage.js - setSetting functional', () => {
  beforeEach(() => {
    mockStorage.data = {};
  });

  it('should store a single key-value pair', async () => {
    await setSetting('theme', 'dark');
    assert.equal(mockStorage.data.theme, 'dark');
  });

  it('should overwrite existing key', async () => {
    mockStorage.data = { theme: 'light' };
    await setSetting('theme', 'dark');
    assert.equal(mockStorage.data.theme, 'dark');
  });
});

describe('storage.js - setSettings functional', () => {
  beforeEach(() => {
    mockStorage.data = {};
  });

  it('should store multiple key-value pairs', async () => {
    await setSettings({ theme: 'dark', autoFillEnabled: true });
    assert.equal(mockStorage.data.theme, 'dark');
    assert.equal(mockStorage.data.autoFillEnabled, true);
  });

  it('should merge with existing data', async () => {
    mockStorage.data = { existing: 'value' };
    await setSettings({ theme: 'dark' });
    assert.equal(mockStorage.data.existing, 'value');
    assert.equal(mockStorage.data.theme, 'dark');
  });
});

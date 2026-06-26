// RED: These behavioral tests define expected storage behavior
// They require a chrome.storage.local mock

import { describe, it, assert, beforeAll, afterAll } from 'vitest';

const mockStorage = {};

function setupChromeMock() {
  globalThis.chrome = {
    storage: {
      local: {
        get: (keys, cb) => {
          if (keys === null) cb({ ...mockStorage });
          else if (typeof keys === 'string') cb({ [keys]: mockStorage[keys] });
          else if (Array.isArray(keys)) {
            const result = {};
            keys.forEach(k => { if (k in mockStorage) result[k] = mockStorage[k]; });
            cb(result);
          }
        },
        set: (obj, cb) => {
          Object.assign(mockStorage, obj);
          if (cb) cb();
        },
      }
    }
  };
}

function cleanupChromeMock() {
  delete globalThis.chrome;
  for (const k of Object.keys(mockStorage)) delete mockStorage[k];
}

describe('storage.js - behavioral', () => {
  beforeAll(() => setupChromeMock());
  afterAll(() => cleanupChromeMock());

  beforeEach(() => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  });

  it('getSettings should return empty object when no data stored', async () => {
    const { getSettings } = await import('../../extension/shared/storage.js');
    const result = await getSettings();
    assert.deepEqual(result, {});
  });

  it('getSettings should return stored values', async () => {
    const { setSettings, getSettings } = await import('../../extension/shared/storage.js');
    await setSettings({ theme: 'dark', autoFillEnabled: true });
    const result = await getSettings();
    assert.equal(result.theme, 'dark');
    assert.equal(result.autoFillEnabled, true);
  });

  it('setSetting should store a single key', async () => {
    const { setSetting, getSettings } = await import('../../extension/shared/storage.js');
    await setSetting('endpoint', 'http://127.0.0.1:19455/bridge');
    const result = await getSettings();
    assert.equal(result.endpoint, 'http://127.0.0.1:19455/bridge');
  });

  it('setSetting should not overwrite other keys', async () => {
    const { setSetting, getSettings } = await import('../../extension/shared/storage.js');
    await setSetting('theme', 'light');
    await setSetting('autoFillEnabled', false);
    const result = await getSettings();
    assert.equal(result.theme, 'light');
    assert.equal(result.autoFillEnabled, false);
  });

  it('setSettings should store multiple keys', async () => {
    const { setSettings, getSettings } = await import('../../extension/shared/storage.js');
    await setSettings({ a: 1, b: 2, c: 3 });
    const result = await getSettings();
    assert.deepEqual(result, { a: 1, b: 2, c: 3 });
  });

  it('setSettings should merge with existing data', async () => {
    const { setSettings, getSettings } = await import('../../extension/shared/storage.js');
    await setSettings({ existing: 'keep' });
    await setSettings({ newKey: 'added' });
    const result = await getSettings();
    assert.equal(result.existing, 'keep');
    assert.equal(result.newKey, 'added');
  });

  it('should return empty object when chrome is undefined', async () => {
    cleanupChromeMock();
    const { getSettings } = await import('../../extension/shared/storage.js');
    const result = await getSettings();
    assert.deepEqual(result, {});
    setupChromeMock();
  });

  it('should resolve without error when chrome is undefined in setSetting', async () => {
    cleanupChromeMock();
    const { setSetting } = await import('../../extension/shared/storage.js');
    await setSetting('key', 'value');  // Should not throw
    setupChromeMock();
  });
});

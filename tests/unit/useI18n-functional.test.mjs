import { describe, it, assert, beforeAll, afterAll } from 'vitest';

describe('useI18n', () => {
  let useI18n;

  beforeAll(() => {
    globalThis.chrome.i18n = {
      getMessage(key, substitutions) {
        const messages = {
          hello: 'Hello',
          appName: 'KeePass Browser Bridge',
          greeting: 'Hello, {0}!'
        };
        if (!(key in messages)) return '';
        let msg = messages[key];
        if (substitutions) {
          const subs = Array.isArray(substitutions) ? substitutions : [substitutions];
          subs.forEach((s, i) => { msg = msg.replace(`{${i}}`, s); });
        }
        return msg;
      }
    };
  });

  afterAll(() => {
    delete globalThis.chrome.i18n;
  });

  beforeAll(async () => {
    const mod = await import('../../extension/src/composables/useI18n.js');
    useI18n = mod.useI18n;
  });

  it('should return a t function', () => {
    const { t } = useI18n();
    assert.equal(typeof t, 'function');
  });

  it('t() should return the translated string for a known key', () => {
    const { t } = useI18n();
    assert.equal(t('hello'), 'Hello');
  });

  it('t() should fall back to the key for an unknown key', () => {
    const { t } = useI18n();
    assert.equal(t('nonExistentKey'), 'nonExistentKey');
  });

  it('t() should handle string substitutions', () => {
    const { t } = useI18n();
    assert.equal(t('greeting', 'World'), 'Hello, World!');
  });

  it('t() should handle array substitutions', () => {
    const { t } = useI18n();
    assert.equal(t('greeting', ['World']), 'Hello, World!');
  });

  it('should also export i18n object with t function', async () => {
    const mod = await import('../../extension/src/composables/useI18n.js');
    assert.ok('i18n' in mod);
    assert.equal(typeof mod.i18n.t, 'function');
    assert.equal(mod.i18n.t('hello'), 'Hello');
  });

  it('should fall back to browser.i18n when chrome.i18n is missing', async () => {
    const saved = globalThis.chrome.i18n;
    delete globalThis.chrome.i18n;
    globalThis.browser = { i18n: { getMessage: () => 'from-browser' } };
    const mod = await import('../../extension/src/composables/useI18n.js');
    assert.equal(mod.i18n.t('test'), 'from-browser');
    globalThis.chrome.i18n = saved;
    delete globalThis.browser;
  });

  it('should return key when both i18n APIs are unavailable', async () => {
    const saved = globalThis.chrome.i18n;
    delete globalThis.chrome.i18n;
    delete globalThis.browser;
    const mod = await import('../../extension/src/composables/useI18n.js');
    assert.equal(mod.i18n.t('fallbackKey'), 'fallbackKey');
    globalThis.chrome.i18n = saved;
  });
});

import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor(id) {
    this.id = id;
    this.value = '';
    this.checked = false;
    this.textContent = '';
    this.href = '';
    this.className = '';
    this.classList = {
      toggle() {},
      add() {},
      remove() {}
    };
  }

  addEventListener() {}

  focus() {}

  querySelector() {
    return { textContent: '' };
  }
}

const ids = [
  'themeToggle',
  'bridgeEndpoint',
  'bridgeStatus',
  'checkBridgeStatus',
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
  'refreshTrustedBrowsers',
  'trustedBrowserList',
  'siteOverrideHost',
  'siteOverrideAutoFill',
  'siteOverrideAutoSubmit',
  'addSiteOverride',
  'siteOverrideList',
  'exportSettings',
  'importSettings',
  'importFile',
  'resetSettings',
  'aboutVersion',
  'aboutPluginVersion',
  'aboutBrowserId',
  'repositoryLink',
  'releasesLink',
  'checkUpdates',
  'saveSettings',
  'message'
];

const elements = Object.fromEntries(ids.map((id) => [id, new Element(id)]));
const storageSetCalls = [];
const sandbox = {
  console,
  setTimeout() {},
  document: {
    documentElement: {
      setAttribute() {},
      removeAttribute() {}
    },
    getElementById(id) {
      return elements[id] || new Element(id);
    },
    addEventListener() {},
    createElement() {
      return new Element('');
    }
  },
  window: {
    matchMedia: () => ({ matches: false })
  },
  chrome: {
    runtime: {
      sendMessage: async () => ({ ok: true, response: {} })
    },
    storage: {
      local: {
        get(_keys, callback) {
          if (callback) callback({});
        },
        set(values, callback) {
          storageSetCalls.push(values);
          if (callback) callback();
        }
      }
    }
  },
  URL,
  Blob
};
sandbox.globalThis = sandbox;

const source = fs.readFileSync(new URL('../../extension/options.js', import.meta.url), 'utf8');
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'options.js' });

function fillRequiredSettingsForm(overrides = {}) {
  elements.bridgeEndpoint.value = 'http://127.0.0.1:19455/bridge';
  elements.theme.value = 'system';
  elements.autoFillEnabled.checked = true;
  elements.autoSubmitEnabled.checked = false;
  elements.autoFillDelay.value = '1200';
  elements.strictUrlMatching.checked = false;
  elements.regexUrlMatching.checked = false;
  elements.showPasswordsInPopup.checked = false;
  elements.notificationsEnabled.checked = true;
  elements.autoLockTimeoutMinutes.value = '0';
  elements.clipboardClearDelay.value = '30';
  elements.debugMode.checked = false;
  elements.autoFillDelay.value = overrides.autoFillDelay ?? elements.autoFillDelay.value;
}

fillRequiredSettingsForm({ autoFillDelay: '-100' });
storageSetCalls.length = 0;
sandbox.saveSettings();
assert.equal(storageSetCalls.length, 0, 'settings save should not persist an invalid negative auto-fill delay');
assert.equal(elements.message.textContent, 'Auto-fill delay must be between 0 and 5000 milliseconds.',
  'settings save should explain invalid auto-fill delay values');

const portable = sandbox.sanitizePortableSettings({
  endpoint: 'http://127.0.0.1:19455/bridge',
  theme: 'dark',
  autoFillEnabled: false,
  autoSubmitEnabled: true,
  autoFillDelay: 500,
  strictUrlMatching: true,
  regexUrlMatching: false,
  showPasswordsInPopup: true,
  notificationsEnabled: false,
  autoLockTimeoutMinutes: 5,
  clipboardClearDelay: 10,
  debugMode: true,
  siteOverrides: [
    { host: 'https://Example.com/login', autoFillEnabled: false, autoSubmitEnabled: true },
    { host: 'example.com', autoFillEnabled: true, autoSubmitEnabled: false },
    { host: 'http://localhost:3000/admin', autoFillEnabled: true, autoSubmitEnabled: false },
    { host: 'bad host', autoFillEnabled: false, autoSubmitEnabled: true },
    { host: '*.example.com', autoFillEnabled: false, autoSubmitEnabled: true },
    { host: 'tenant_name.example.com', autoFillEnabled: false, autoSubmitEnabled: true },
    { host: '   ', autoFillEnabled: true, autoSubmitEnabled: true }
  ],
  clientId: 'client-secret-id',
  sharedSecret: 'pairing-secret',
  pairingSessionId: 'pairing-session',
  pairingStartedAt: 1700000000000,
  pairingExpiresAt: 1700000300000,
  locked: true,
  lastCredentialActivityAt: 1700000100000,
  unknownRuntimeState: { password: 'submitted-secret' }
});

assert.deepEqual(
  Object.keys(portable).sort(),
  [
    'autoFillDelay',
    'autoFillEnabled',
    'autoLockTimeoutMinutes',
    'autoSubmitEnabled',
    'clipboardClearDelay',
    'debugMode',
    'endpoint',
    'notificationsEnabled',
    'regexUrlMatching',
    'showPasswordsInPopup',
    'siteOverrides',
    'strictUrlMatching',
    'theme'
  ],
  'portable settings should contain only allowlisted user configuration keys'
);
assert.equal(
  JSON.stringify(portable.siteOverrides),
  JSON.stringify([
    { host: 'example.com', autoFillEnabled: false, autoSubmitEnabled: true },
    { host: 'localhost', autoFillEnabled: true, autoSubmitEnabled: false }
  ]),
  'portable settings should normalize site overrides and drop invalid or duplicate hosts before export or import'
);
assert.equal(Object.values(portable).some((value) => JSON.stringify(value).includes('secret')), false,
  'portable settings should not include pairing or credential runtime secrets');

const zeroValues = sandbox.sanitizePortableSettings({
  autoFillDelay: 0,
  autoLockTimeoutMinutes: 0,
  clipboardClearDelay: 0
});
assert.equal(zeroValues.autoFillDelay, 0, 'portable settings should preserve a zero auto-fill delay');
assert.equal(zeroValues.autoLockTimeoutMinutes, 0, 'portable settings should preserve disabled auto-lock');
assert.equal(zeroValues.clipboardClearDelay, 0, 'portable settings should preserve disabled clipboard clearing');

assert.throws(
  () => sandbox.sanitizePortableSettings({ endpoint: 'https://evil.example/bridge' }, { validateEndpoint: true }),
  /127\.0\.0\.1/,
  'portable settings import should reject non-loopback bridge endpoints'
);

console.log('Options tests passed.');

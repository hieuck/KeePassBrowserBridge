import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Element {
  constructor(id) {
    this.id = id;
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.type = '';
    this.dataset = {};
    this.children = [];
    this._textContent = '';
    this.textContent = '';
    this.href = '';
    this.className = '';
    this.classList = {
      toggle() {},
      add() {},
      remove() {}
    };
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value ?? '');
    if (this._textContent === '') {
      this.children = [];
    }
  }

  addEventListener() {}

  append(...children) {
    this.children.push(...children);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

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
const sentMessages = [];
let listClientsError = null;
const trustedClient = {
  ClientId: 'client-current',
  ClientName: 'Current Browser',
  Current: true,
  ExtensionOrigin: 'chrome-extension://abcdefghijklmnopabcdefghijklmnop',
  CreatedUtcMs: 1779990000000,
  LastUsedUtcMs: 1779990000000,
  Permissions: ['read', 'write', 'manageClients']
};
let nextTimeoutId = 1;
const pendingTimeouts = new Map();

function runTimeout(timeoutId) {
  const callback = pendingTimeouts.get(timeoutId);
  if (!callback) {
    return;
  }

  pendingTimeouts.delete(timeoutId);
  callback();
}

function findChildByPredicate(root, predicate) {
  if (!root) return null;
  if (predicate(root)) return root;
  for (const child of root.children || []) {
    const found = findChildByPredicate(child, predicate);
    if (found) return found;
  }
  return null;
}

const sandbox = {
  console,
  setTimeout(callback) {
    const timeoutId = nextTimeoutId++;
    pendingTimeouts.set(timeoutId, callback);
    return timeoutId;
  },
  clearTimeout(timeoutId) {
    pendingTimeouts.delete(timeoutId);
  },
  confirm: () => true,
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
      sendMessage: async (message) => {
        sentMessages.push(message);
        if (message.type === 'KBB_GET_ABOUT') {
          return {
            ok: true,
            response: {
              version: '0.9.0',
              pluginVersion: '0.9.0',
              browserId: 'abcdefghijklmnopabcdefghijklmnop'
            }
          };
        }

        if (message.type === 'KBB_LIST_CLIENTS') {
          if (listClientsError) {
            return { ok: false, error: listClientsError };
          }
          return { ok: true, response: { Clients: [trustedClient] } };
        }

        if (message.type === 'KBB_UPDATE_CLIENT_PERMISSIONS') {
          return {
            ok: true,
            response: {
              Updated: true,
              ClientId: message.clientId,
              Permissions: message.permissions
            }
          };
        }

        if (message.type === 'KBB_REVOKE_CLIENT') {
          return {
            ok: true,
            response: {
              Revoked: true,
              ClientId: message.clientId
            }
          };
        }

        return { ok: true, response: {} };
      }
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

pendingTimeouts.clear();
sandbox.showMessage('First status', 'success');
const firstMessageTimer = nextTimeoutId - 1;
sandbox.showMessage('Second status', 'error');
const secondMessageTimer = nextTimeoutId - 1;
runTimeout(firstMessageTimer);
assert.equal(elements.message.textContent, 'Second status',
  'stale options message timers should not clear newer messages');
assert.equal(elements.message.className, 'message error',
  'stale options message timers should not reset newer message styling');
runTimeout(secondMessageTimer);
assert.equal(elements.message.textContent, '', 'latest options message timer should clear the message');

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

assert.throws(
  () => sandbox.sanitizePortableSettings({ endpoint: 'http://evil.example@127.0.0.1:19455/bridge' }, { validateEndpoint: true }),
  /credentials/i,
  'portable settings import should reject credentialed loopback bridge endpoints'
);

for (const endpoint of [
  'http://127.0.0.1:19455/not-bridge',
  'http://127.0.0.1:19455/bridge?debug=1',
  'http://127.0.0.1:19455/bridge#fragment'
]) {
  assert.throws(
    () => sandbox.sanitizePortableSettings({ endpoint }, { validateEndpoint: true }),
    /\/bridge/i,
    'portable settings import should reject non-canonical bridge endpoints'
  );
}

sentMessages.length = 0;
await sandbox.listTrustedBrowsers();
let writePermissionCheckbox = findChildByPredicate(elements.trustedBrowserList, (element) =>
  element.type === 'checkbox' && element.dataset.permission === 'write'
);
let revokeCurrentButton = findChildByPredicate(elements.trustedBrowserList, (element) =>
  element.dataset.action === 'revoke-client'
);
assert.notEqual(writePermissionCheckbox, null, 'test should render the write permission checkbox');
assert.notEqual(revokeCurrentButton, null, 'test should render the current browser revoke button');
assert.equal(writePermissionCheckbox.disabled, false, 'trusted-browser controls should be enabled before manage permission is removed');
assert.equal(revokeCurrentButton.disabled, false, 'revoke should be enabled before manage permission is removed');

await sandbox.updateTrustedBrowserPermissions(trustedClient, 'manageClients', false);
writePermissionCheckbox = findChildByPredicate(elements.trustedBrowserList, (element) =>
  element.type === 'checkbox' && element.dataset.permission === 'write'
);
revokeCurrentButton = findChildByPredicate(elements.trustedBrowserList, (element) =>
  element.dataset.action === 'revoke-client'
);
assert.equal(writePermissionCheckbox.disabled, true, 'self-removing manage permission should disable permission controls');
assert.equal(revokeCurrentButton.disabled, true, 'self-removing manage permission should disable revoke controls');
assert.equal(elements.message.textContent, 'Browser permissions updated. Manage browsers permission was removed for this browser.',
  'self-removing manage permission should explain that management is no longer available');

trustedClient.Permissions = ['read', 'write', 'manageClients'];
await sandbox.listTrustedBrowsers();
sentMessages.length = 0;
await sandbox.revokeTrustedBrowser(trustedClient);
assert.deepEqual(
  sentMessages.map((message) => message.type),
  ['KBB_REVOKE_CLIENT'],
  'current browser revoke should not refresh trusted browsers after local pairing credentials are removed'
);
assert.equal(elements.trustedBrowserList.children.length, 1, 'current browser revoke should replace trusted browser rows with an empty state');
assert.equal(elements.trustedBrowserList.children[0].textContent, 'No trusted browsers.', 'current browser revoke should clear stale trusted browser rows');
assert.equal(elements.message.textContent, 'This browser was revoked. Pair again to use KeePass.',
  'current browser revoke should explain that pairing is required again');

trustedClient.Permissions = ['read', 'write', 'manageClients'];
listClientsError = null;
await sandbox.listTrustedBrowsers();
assert.equal(elements.trustedBrowserList.children.length > 0, true, 'test should render stale trusted browser rows before permission denial');
sentMessages.length = 0;
listClientsError = 'Trusted browser is not allowed to perform this action.';
await assert.rejects(
  () => sandbox.listTrustedBrowsers(),
  /not allowed/,
  'trusted browser refresh should surface backend permission failures'
);
assert.deepEqual(
  sentMessages.map((message) => message.type),
  ['KBB_GET_ABOUT', 'KBB_LIST_CLIENTS'],
  'permission-denied trusted browser refresh should not keep retrying privileged requests'
);
assert.equal(elements.trustedBrowserList.children.length, 1, 'permission-denied trusted browser refresh should replace stale rows with an empty state');
assert.equal(elements.trustedBrowserList.children[0].textContent, 'No trusted browsers.',
  'permission-denied trusted browser refresh should clear stale trusted browser rows');
listClientsError = null;

console.log('Options tests passed.');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class ClassList {
  constructor(initial = []) {
    this.values = new Set(initial);
  }

  add(name) {
    this.values.add(name);
  }

  remove(name) {
    this.values.delete(name);
  }

  toggle(name, enabled) {
    if (enabled) {
      this.add(name);
    } else {
      this.remove(name);
    }
  }

  contains(name) {
    return this.values.has(name);
  }
}

class Element {
  constructor(id, tagName = 'div') {
    this.id = id;
    this.tagName = tagName.toUpperCase();
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this._textContent = '';
    this.href = '';
    this.children = [];
    this.innerHTML = '';
    this.dataset = {};
    this.classList = new ClassList();
    this.listeners = new Map();
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

  addEventListener(type, handler) {
    this.listeners.set(type, handler);
  }

  focus() {
    fakeDocument.activeElement = this;
  }

  dispatch(type, event = {}) {
    const handler = this.listeners.get(type);
    if (handler) handler({
      target: this,
      preventDefault() {
        event.defaultPrevented = true;
      },
      ...event
    });
    return event;
  }

  click() {
    this.dispatch('click');
  }

  querySelector(selector) {
    if (selector === '.theme-icon') {
      if (!this.themeIcon) this.themeIcon = new Element('themeIcon', 'span');
      return this.themeIcon;
    }

    return null;
  }

  append(...children) {
    this.children.push(...children);
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }
}

const ids = [
  'themeToggle',
  'statusBadge',
  'endpoint',
  'saveEndpoint',
  'checkStatus',
  'beginPair',
  'autoFill',
  'autoSubmit',
  'listClients',
  'lockBridge',
  'clientsPanel',
  'pairingPanel',
  'pairingTimer',
  'pairingCode',
  'pastePairingCode',
  'completePair',
  'cancelPair',
  'queryLogins',
  'newLogin',
  'toggleSiteAutoFill',
  'toggleSiteAutoSubmit',
  'stateNotice',
  'aboutVersion',
  'aboutPluginVersion',
  'aboutBrowserId',
  'repositoryLink',
  'releasesLink',
  'checkUpdates',
  'currentUrl',
  'loginSearch',
  'results',
  'message'
];

const elements = Object.fromEntries(ids.map((id) => [id, new Element(id)]));
elements.pairingPanel.classList.add('hidden');
const sentMessages = [];
const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0));
function findChildByText(root, text) {
  if (!root) return null;
  if (root.textContent === text) return root;
  for (const child of root.children || []) {
    const found = findChildByText(child, text);
    if (found) return found;
  }
  return null;
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
const timerCalls = [];
const intervalCalls = [];
let fakeNow = 1779990000000;
let clipboardText = 'code: 955-963';
let queryLoginsResponse = { url: '', entries: [] };
let getStateResponse = {};
let statusResponse = { Trusted: true, Permissions: ['read', 'write', 'manageClients'] };
const storageState = {};

function pickStorageValues(keys) {
  if (Array.isArray(keys)) {
    return Object.fromEntries(keys.map((key) => [key, storageState[key]]));
  }

  if (typeof keys === 'string') {
    return { [keys]: storageState[keys] };
  }

  if (keys && typeof keys === 'object') {
    return Object.fromEntries(Object.entries(keys).map(([key, fallback]) => [
      key,
      Object.prototype.hasOwnProperty.call(storageState, key) ? storageState[key] : fallback
    ]));
  }

  return { ...storageState };
}

function plainJson(value) {
  return JSON.parse(JSON.stringify(value));
}

const fakeDocument = {
  activeElement: null,
  documentElement: {
    setAttribute() {},
    removeAttribute() {}
  },
  getElementById(id) {
    return elements[id];
  },
  addEventListener() {},
  querySelectorAll(selector) {
    if (selector === 'button') {
      return [elements.saveEndpoint, elements.checkStatus, elements.beginPair, elements.listClients, elements.lockBridge, elements.pastePairingCode, elements.completePair, elements.cancelPair, elements.queryLogins, elements.newLogin, elements.toggleSiteAutoFill, elements.toggleSiteAutoSubmit, elements.checkUpdates];
    }

    return [];
  },
  createElement() {
    return new Element('');
  }
};

const sandbox = {
  console,
  setTimeout(handler, delay) {
    const timer = { handler, delay, cleared: false };
    timerCalls.push(timer);
    return timer;
  },
  clearTimeout(timer) {
    if (timer) timer.cleared = true;
  },
  setInterval(handler, delay) {
    const interval = { handler, delay, cleared: false };
    intervalCalls.push(interval);
    return interval;
  },
  clearInterval(interval) {
    if (interval) interval.cleared = true;
  },
  URL,
  Date: class extends Date {
    constructor(...args) {
      super(...(args.length ? args : [fakeNow]));
    }

    static now() {
      return fakeNow;
    }
  },
  document: fakeDocument,
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
              name: 'KeePass Browser Bridge',
              version: '0.9.0',
              pluginVersion: '0.9.0',
              browserId: 'abcdefghijklmnopabcdefghijklmnop',
              repositoryUrl: 'https://github.com/hieuck/KeePassBrowserBridge',
              releasesUrl: 'https://github.com/hieuck/KeePassBrowserBridge/releases'
            }
          };
        }

        if (message.type === 'KBB_CHECK_UPDATES') {
          return {
            ok: true,
            response: {
              currentVersion: '0.9.0',
              latestVersion: '0.10.0',
              updateAvailable: true,
              releaseUrl: 'https://github.com/hieuck/KeePassBrowserBridge/releases/tag/v0.10.0'
            }
          };
        }

        if (message.type === 'KBB_GET_STATE') {
          return { ok: true, response: getStateResponse };
        }

        if (message.type === 'KBB_STATUS') {
          return { ok: true, response: statusResponse };
        }

        if (message.type === 'KBB_SET_AUTO_FILL') {
          return {
            ok: true,
            response: {
              endpoint: 'http://127.0.0.1:19455/bridge',
              paired: true,
              locked: false,
              autoFillEnabled: message.enabled,
              autoSubmitEnabled: false
            }
          };
        }

        if (message.type === 'KBB_SET_AUTO_SUBMIT') {
          return {
            ok: true,
            response: {
              endpoint: 'http://127.0.0.1:19455/bridge',
              paired: true,
              locked: false,
              autoFillEnabled: false,
              autoSubmitEnabled: message.enabled
            }
          };
        }

        if (message.type === 'KBB_SAVE_ENDPOINT') {
          return {
            ok: true,
            response: {
              endpoint: message.endpoint,
              paired: false,
              pairingSessionId: '',
              pairingExpiresAt: 0,
              autoFillEnabled: false
            }
          };
        }

        if (message.type === 'KBB_PAIR_COMPLETE') {
          return {
            ok: true,
            response: {
              endpoint: 'http://127.0.0.1:19455/bridge',
              paired: true,
              pairingSessionId: '',
              pairingExpiresAt: 0,
              autoFillEnabled: false
            }
          };
        }

        if (message.type === 'KBB_PAIR_CANCEL') {
          return {
            ok: true,
            response: {
              endpoint: 'http://127.0.0.1:19455/bridge',
              paired: false,
              pairingSessionId: '',
              pairingExpiresAt: 0,
              autoFillEnabled: false
            }
          };
        }

        if (message.type === 'KBB_QUERY_LOGINS') {
          return { ok: true, response: queryLoginsResponse };
        }

        return { ok: true, response: {} };
      }
    },
    storage: {
      local: {
        get(keys, callback) {
          const values = pickStorageValues(keys);
          if (callback) {
            callback(values);
            return undefined;
          }
          return Promise.resolve(values);
        },
        set(values, callback) {
          Object.assign(storageState, values);
          if (callback) callback();
          return Promise.resolve();
        }
      }
    }
  },
  navigator: {
    clipboard: {
      readText: async () => clipboardText
    }
  }
};
sandbox.globalThis = sandbox;

const source = fs.readFileSync(new URL('../../extension/popup.js', import.meta.url), 'utf8');
const markup = fs.readFileSync(new URL('../../extension/popup.html', import.meta.url), 'utf8');
assert.equal(markup.includes('pairingSession'), false, 'pairing session id element should not exist in popup markup');
assert.equal(markup.includes('aboutVersion'), true, 'popup should render an About version element');
assert.equal(markup.includes('aboutPluginVersion'), true, 'popup should render a plugin version element');
assert.equal(markup.includes('checkUpdates'), true, 'popup should provide a check updates action');
assert.equal(markup.includes('stateNotice'), true, 'popup should render state guidance text');
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'popup.js' });

sandbox.init();
await sandbox.renderAbout();
assert.equal(elements.aboutVersion.textContent, '0.9.0', 'popup should display the extension version');
assert.equal(elements.aboutPluginVersion.textContent, '0.9.0', 'popup should display the plugin version');
assert.equal(elements.aboutBrowserId.textContent, 'abcdefghijklmnopabcdefghijklmnop', 'popup should display the browser extension id');
assert.equal(elements.repositoryLink.href, 'https://github.com/hieuck/KeePassBrowserBridge', 'popup should link to the repository');
assert.equal(elements.releasesLink.href, 'https://github.com/hieuck/KeePassBrowserBridge/releases', 'popup should link to releases');

await sandbox.checkUpdates();
assert.equal(elements.message.textContent, 'Update 0.10.0 is available. Open GitHub Releases to install it.', 'popup should report newer releases without auto-installing');

sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: false,
  pairingSessionId: 'session-1',
  pairingExpiresAt: fakeNow + 125000,
  autoFillEnabled: false
});

assert.equal(elements.pairingPanel.classList.contains('hidden'), false, 'pairing panel should be visible');
assert.equal(elements.pairingTimer.textContent.includes('2:05'), true, 'pairing panel should show time remaining');
assert.equal(intervalCalls.length, 1, 'active pairing state should schedule countdown refresh');
assert.equal(intervalCalls[0].delay, 1000, 'pairing countdown should refresh every second');
fakeNow += 10000;
intervalCalls[0].handler();
assert.equal(elements.pairingTimer.textContent.includes('1:55'), true, 'pairing countdown should update while popup stays open');
assert.equal(elements.stateNotice.textContent, 'Enter the six digit code shown in KeePass to finish pairing.', 'pairing state should explain the next step');
assert.equal(elements.queryLogins.disabled, true, 'unpaired pairing state should disable credential query action');
assert.equal(elements.newLogin.disabled, true, 'unpaired pairing state should disable create action');
assert.equal(elements.toggleSiteAutoFill.disabled, true, 'unpaired pairing state should disable site auto-fill action');
assert.equal(elements.toggleSiteAutoSubmit.disabled, true, 'unpaired pairing state should disable site auto-submit action');
assert.equal(fakeDocument.activeElement, elements.pairingCode, 'pairing code input should receive focus');
assert.equal(elements.completePair.disabled, true, 'confirm should be disabled before a complete code is entered');

elements.pairingCode.value = '123';
elements.pairingCode.dispatch('input');
assert.equal(elements.completePair.disabled, true, 'confirm should stay disabled for short code');

elements.pairingCode.value = '123456';
elements.pairingCode.dispatch('input');
assert.equal(elements.completePair.disabled, false, 'confirm should enable for a six digit code');

sentMessages.length = 0;
const enterEvent = elements.pairingCode.dispatch('keydown', { key: 'Enter' });
await flushAsync();
assert.equal(enterEvent.defaultPrevented, true, 'Enter in the pairing code input should not submit the popup page');
assert.deepEqual(
  sentMessages.map((message) => message.type),
  ['KBB_PAIR_COMPLETE'],
  'Enter in the pairing code input should submit the pairing code'
);
assert.equal(sentMessages[0].pairingCode, '123456', 'Enter should submit the code currently typed in the input');
assert.equal(elements.pairingPanel.classList.contains('hidden'), true, 'Enter should hide the pairing panel after successful pair');

sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: false,
  pairingSessionId: 'session-escape',
  pairingExpiresAt: fakeNow + 125000,
  autoFillEnabled: false
});
sentMessages.length = 0;
const escapeEvent = elements.pairingCode.dispatch('keydown', { key: 'Escape' });
await flushAsync();
assert.equal(escapeEvent.defaultPrevented, true, 'Escape in the pairing code input should be handled');
assert.deepEqual(
  sentMessages.map((message) => message.type),
  ['KBB_PAIR_CANCEL'],
  'Escape in the pairing code input should cancel the active pairing session'
);
assert.equal(elements.pairingPanel.classList.contains('hidden'), true, 'Escape should hide the pairing panel after cancellation');

sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: false,
  pairingSessionId: 'session-1',
  pairingExpiresAt: fakeNow + 125000,
  autoFillEnabled: false
});
elements.pairingCode.value = '';
sentMessages.length = 0;
clipboardText = 'code: 955-963';
await sandbox.pastePairingCode();
assert.deepEqual(
  sentMessages.map((message) => message.type),
  ['KBB_PAIR_COMPLETE'],
  'paste should immediately submit a valid clipboard pairing code'
);
assert.equal(sentMessages[0].pairingCode, '955963', 'paste should submit the extracted pairing code');
assert.equal(elements.pairingPanel.classList.contains('hidden'), true, 'paste and pair should hide the pairing panel after success');
assert.equal(elements.message.textContent, 'Browser paired with KeePass.', 'paste and pair should confirm success to the user');

sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: false,
  pairingSessionId: 'session-invalid-clipboard',
  pairingExpiresAt: fakeNow + 125000,
  autoFillEnabled: false
});
elements.pairingCode.value = '';
sentMessages.length = 0;
clipboardText = 'session 123456789';
await assert.rejects(
  () => sandbox.pastePairingCode(),
  /Clipboard does not contain a six digit pairing code/,
  'paste should reject ambiguous clipboard text with more than six digits'
);
assert.deepEqual(sentMessages, [], 'paste should not submit an ambiguous clipboard code to the background');
assert.equal(elements.pairingCode.value, '', 'paste should leave the pairing input empty after an ambiguous clipboard code');

timerCalls.length = 0;
sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: false,
  pairingSessionId: 'session-expiring',
  pairingExpiresAt: fakeNow + 1000,
  autoFillEnabled: false
});
assert.equal(timerCalls.length, 1, 'active pairing state should schedule expiry handling');
assert.equal(timerCalls[0].delay <= 1000, true, 'pairing expiry handler should run when the code expires');
sentMessages.length = 0;
timerCalls[0].handler();
await flushAsync();
assert.deepEqual(
  sentMessages.map((message) => message.type),
  ['KBB_PAIR_CANCEL'],
  'expired pairing code should cancel the active pairing session'
);
assert.equal(elements.pairingPanel.classList.contains('hidden'), true, 'expired pairing code should hide the pairing panel');
assert.equal(elements.message.textContent, 'Pairing code expired. Start pairing again.', 'expired pairing code should explain the next action');

sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: true,
  pairingSessionId: 'stale-session',
  pairingExpiresAt: fakeNow + 125000,
  autoFillEnabled: false
});

assert.equal(elements.pairingPanel.classList.contains('hidden'), true, 'paired popup should hide stale pairing sessions');
assert.equal(elements.pairingTimer.textContent, '', 'paired popup should clear pairing countdown');
assert.equal(elements.stateNotice.textContent, 'Ready to find, fill, create, and update KeePass logins.', 'paired state should explain available actions');
assert.equal(elements.queryLogins.disabled, false, 'paired state should enable credential query action');
assert.equal(elements.newLogin.disabled, false, 'paired state should enable create action');
assert.equal(elements.toggleSiteAutoFill.disabled, false, 'paired state should enable site auto-fill action');
assert.equal(elements.toggleSiteAutoSubmit.disabled, false, 'paired state should enable site auto-submit action');

sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: true,
  permissions: ['read', 'write'],
  autoFillEnabled: false
});
assert.equal(elements.listClients.disabled, true, 'paired state without manage permission should disable trusted browser management');
sentMessages.length = 0;
await assert.rejects(
  () => sandbox.listClients(),
  /Manage browser permission/,
  'trusted browser management should require manageClients permission before sending a background request'
);
assert.deepEqual(sentMessages, [], 'trusted browser management should not contact the background without manageClients permission');

sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: true,
  permissions: ['read', 'write', 'manageClients'],
  autoFillEnabled: false
});
sandbox.renderClients([
  {
    ClientId: 'old-client',
    ClientName: 'Old Browser',
    ExtensionOrigin: 'chrome-extension://old',
    Current: false,
    CreatedUtcMs: fakeNow,
    LastUsedUtcMs: fakeNow,
    Permissions: ['read']
  }
]);
elements.clientsPanel.classList.remove('hidden');
assert.equal(elements.clientsPanel.children.length, 1, 'test should render a stale trusted browser before endpoint save');
elements.endpoint.value = 'http://127.0.0.1:19456/bridge';
sentMessages.length = 0;
await sandbox.saveEndpoint();
assert.deepEqual(sentMessages.map((message) => message.type), ['KBB_SAVE_ENDPOINT'], 'saving endpoint should send the updated bridge endpoint');
assert.equal(elements.clientsPanel.classList.contains('hidden'), true, 'endpoint save that unpairs should hide stale trusted browsers');
assert.equal(elements.clientsPanel.children.length, 0, 'endpoint save that unpairs should clear stale trusted browser rows');

sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: true,
  permissions: ['read'],
  autoFillEnabled: false
});
assert.equal(elements.stateNotice.textContent, 'Read-only access: this browser can find logins, but cannot create or update KeePass entries.', 'read-only state should explain write restrictions');
assert.equal(elements.newLogin.disabled, true, 'read-only state should disable create action');
await sandbox.renderResults([
  {
    EntryId: 'entry-readonly',
    Title: 'Read Only Entry',
    UserName: 'readonly@example.com',
    Password: 'readonly-secret',
    Url: 'https://example.com/login'
  }
]);
const readOnlyEditButton = findChildByPredicate(elements.results, (element) => element.textContent.includes('Edit'));
assert.notEqual(readOnlyEditButton, null, 'test should find the read-only edit button');
assert.equal(readOnlyEditButton.disabled, true, 'read-only rendered entries should disable edit buttons');
sentMessages.length = 0;
readOnlyEditButton.click();
await flushAsync();
assert.equal(findChildByPredicate(elements.results, (element) => element.className === 'edit-form'), null, 'read-only edit action should not open an edit form');
assert.deepEqual(sentMessages, [], 'read-only edit action should not send update requests');

getStateResponse = {
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: true,
  locked: false,
  autoFillEnabled: false
};
statusResponse = { Trusted: true, Permissions: ['read'] };
queryLoginsResponse = { url: 'https://example.com/login', entries: [] };
sentMessages.length = 0;
await sandbox.queryLogins();
assert.deepEqual(
  sentMessages.map((message) => message.type).slice(0, 3),
  ['KBB_GET_STATE', 'KBB_STATUS', 'KBB_QUERY_LOGINS'],
  'query refresh should hydrate permissions before rendering read-only controls'
);
assert.equal(elements.newLogin.disabled, true, 'read-only query refresh should keep create action disabled');
assert.equal(elements.listClients.disabled, true, 'read-only query refresh should keep trusted browser management disabled');

elements.autoFill.checked = true;
sentMessages.length = 0;
await sandbox.setAutoFill();
assert.deepEqual(
  sentMessages.map((message) => message.type).slice(0, 2),
  ['KBB_SET_AUTO_FILL', 'KBB_STATUS'],
  'auto-fill toggle should hydrate permissions before rendering read-only controls'
);
assert.equal(elements.newLogin.disabled, true, 'read-only auto-fill toggle should keep create action disabled');
assert.equal(elements.listClients.disabled, true, 'read-only auto-fill toggle should keep trusted browser management disabled');

elements.autoSubmit.checked = true;
sentMessages.length = 0;
await sandbox.setAutoSubmit();
assert.deepEqual(
  sentMessages.map((message) => message.type).slice(0, 2),
  ['KBB_SET_AUTO_SUBMIT', 'KBB_STATUS'],
  'auto-submit toggle should hydrate permissions before rendering read-only controls'
);
assert.equal(elements.newLogin.disabled, true, 'read-only auto-submit toggle should keep create action disabled');
assert.equal(elements.listClients.disabled, true, 'read-only auto-submit toggle should keep trusted browser management disabled');

sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: true,
  permissions: ['read', 'write'],
  autoFillEnabled: false
});

storageState.clipboardClearDelay = 999;
sentMessages.length = 0;
await sandbox.copyToClipboard('Password', 'clipboard-secret');
assert.equal(
  sentMessages.at(-1).clearAfterMs,
  30000,
  'out-of-range clipboard clear delay should fall back to the default clear timeout'
);
assert.equal(elements.message.textContent, 'Copied Password to clipboard.', 'copy action should confirm the copied label');
delete storageState.clipboardClearDelay;

const createdEntryWithoutReturnedPassword = sandbox.mergeCreatedEntry({
  title: 'Form Title',
  group: 'Accounts/Work',
  url: 'https://example.com/login',
  userName: 'form-user',
  password: 'local-secret'
}, {
  EntryId: 'entry-created',
  Title: 'Created Title',
  Group: 'Accounts/Work',
  Url: 'https://example.com/login',
  UserName: 'created-user',
  CustomFields: []
});
assert.equal(
  createdEntryWithoutReturnedPassword.Password,
  'local-secret',
  'created popup entry should keep the local password when bridge acknowledgement omits it'
);
assert.equal(createdEntryWithoutReturnedPassword.EntryId, 'entry-created', 'created popup entry should keep bridge metadata');
assert.equal(createdEntryWithoutReturnedPassword.UserName, 'created-user', 'created popup entry should prefer bridge metadata');

queryLoginsResponse = { url: 'https://login.example.com/signin', entries: [] };
storageState.siteOverrides = [{ host: 'https://login.example.com/signin', autoFillEnabled: false, autoSubmitEnabled: true }];
await sandbox.toggleSiteAutoFill();
assert.deepEqual(
  plainJson(storageState.siteOverrides),
  [],
  'URL-shaped exact site auto-fill override should normalize before toggling the current host'
);
assert.equal(elements.message.textContent, 'Auto-fill enabled for login.example.com.', 'URL-shaped exact site override should report the normalized current host');

storageState.siteOverrides = [{ host: 'example.com', autoFillEnabled: false, autoSubmitEnabled: true }];
await sandbox.toggleSiteAutoFill();
assert.deepEqual(
  plainJson(storageState.siteOverrides),
  [
    { host: 'example.com', autoFillEnabled: false, autoSubmitEnabled: true },
    { host: 'login.example.com', autoFillEnabled: true, autoSubmitEnabled: true }
  ],
  'site auto-fill toggle should add an exact-host enable rule without removing the inherited parent-domain disable rule'
);
assert.equal(elements.message.textContent, 'Auto-fill enabled for login.example.com.', 'site auto-fill toggle should report the exact current host');

storageState.siteOverrides = [{ host: 'example.com', autoFillEnabled: true, autoSubmitEnabled: true }];
await sandbox.toggleSiteAutoSubmit();
assert.deepEqual(
  plainJson(storageState.siteOverrides),
  [
    { host: 'example.com', autoFillEnabled: true, autoSubmitEnabled: true },
    { host: 'login.example.com', autoFillEnabled: true, autoSubmitEnabled: false }
  ],
  'site auto-submit toggle should add an exact-host disable rule without removing the inherited parent-domain enable rule'
);
assert.equal(elements.message.textContent, 'Auto-submit disabled for login.example.com.', 'site auto-submit toggle should report the exact current host');

sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: true,
  locked: true,
  autoFillEnabled: false
});

assert.equal(elements.stateNotice.textContent, 'Unlock KeePass Bridge to find, fill, create, or update logins.', 'locked state should explain disabled credential actions');
assert.equal(elements.stateNotice.classList.contains('warning'), true, 'locked state notice should use warning styling');
assert.equal(elements.queryLogins.disabled, true, 'locked state should disable credential query action');
assert.equal(elements.newLogin.disabled, true, 'locked state should disable create action');
assert.equal(elements.toggleSiteAutoFill.disabled, true, 'locked state should disable site auto-fill action');
assert.equal(elements.toggleSiteAutoSubmit.disabled, true, 'locked state should disable site auto-submit action');

await sandbox.renderResults([
  {
    EntryId: 'entry-locked',
    Title: 'Locked Entry',
    UserName: 'locked@example.com',
    Password: 'locked-secret',
    Url: 'https://example.com/login'
  }
]);
sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: true,
  locked: true,
  autoFillEnabled: false
});
sentMessages.length = 0;
const lockedEnterEvent = {
  key: 'Enter',
  target: { tagName: 'BODY' },
  defaultPrevented: false,
  preventDefault() {
    this.defaultPrevented = true;
  }
};
sandbox.handleKeyboardShortcuts(lockedEnterEvent);
await flushAsync();
assert.equal(lockedEnterEvent.defaultPrevented, false, 'locked popup should not intercept Enter to fill stale results');
assert.equal(sentMessages.some((message) => message.type === 'KBB_FILL_LOGIN'), false, 'locked popup should not fill stale rendered results from keyboard shortcuts');

const staleFillButton = findChildByText(elements.results, '✓ Fill');
assert.equal(staleFillButton, null, 'locked popup should clear stale rendered fill buttons');
sentMessages.length = 0;
assert.equal(sentMessages.some((message) => message.type === 'KBB_FILL_LOGIN'), false, 'locked popup should not fill stale rendered results from old buttons');

console.log('Popup tests passed.');

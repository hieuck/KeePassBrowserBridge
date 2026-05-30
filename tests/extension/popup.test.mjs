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
    this.textContent = '';
    this.href = '';
    this.children = [];
    this.innerHTML = '';
    this.classList = new ClassList();
    this.listeners = new Map();
  }

  addEventListener(type, handler) {
    this.listeners.set(type, handler);
  }

  focus() {
    fakeDocument.activeElement = this;
  }

  dispatch(type) {
    const handler = this.listeners.get(type);
    if (handler) handler({ target: this });
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

        return { ok: true, response: {} };
      }
    },
    storage: {
      local: {
        get(keys, callback) {
          callback({});
        },
        set(values, callback) {
          if (callback) callback();
        }
      }
    }
  },
  navigator: {
    clipboard: {
      readText: async () => 'code: 955-963'
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
  pairingExpiresAt: Date.now() + 125000,
  autoFillEnabled: false
});

assert.equal(elements.pairingPanel.classList.contains('hidden'), false, 'pairing panel should be visible');
assert.equal(elements.pairingTimer.textContent.includes('2:05'), true, 'pairing panel should show time remaining');
assert.equal(elements.stateNotice.textContent, 'Enter the six digit code shown in KeePass to finish pairing.', 'pairing state should explain the next step');
assert.equal(elements.queryLogins.disabled, true, 'unpaired pairing state should disable credential query action');
assert.equal(elements.newLogin.disabled, true, 'unpaired pairing state should disable create action');
assert.equal(fakeDocument.activeElement, elements.pairingCode, 'pairing code input should receive focus');
assert.equal(elements.completePair.disabled, true, 'confirm should be disabled before a complete code is entered');

elements.pairingCode.value = '123';
elements.pairingCode.dispatch('input');
assert.equal(elements.completePair.disabled, true, 'confirm should stay disabled for short code');

elements.pairingCode.value = '123456';
elements.pairingCode.dispatch('input');
assert.equal(elements.completePair.disabled, false, 'confirm should enable for a six digit code');

elements.pairingCode.value = '';
sentMessages.length = 0;
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
  paired: true,
  pairingSessionId: 'stale-session',
  pairingExpiresAt: Date.now() + 125000,
  autoFillEnabled: false
});

assert.equal(elements.pairingPanel.classList.contains('hidden'), true, 'paired popup should hide stale pairing sessions');
assert.equal(elements.pairingTimer.textContent, '', 'paired popup should clear pairing countdown');
assert.equal(elements.stateNotice.textContent, 'Ready to find, fill, create, and update KeePass logins.', 'paired state should explain available actions');
assert.equal(elements.queryLogins.disabled, false, 'paired state should enable credential query action');
assert.equal(elements.newLogin.disabled, false, 'paired state should enable create action');

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

console.log('Popup tests passed.');

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
  'currentUrl',
  'loginSearch',
  'results',
  'message'
];

const elements = Object.fromEntries(ids.map((id) => [id, new Element(id)]));
elements.pairingPanel.classList.add('hidden');

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
      return [elements.saveEndpoint, elements.checkStatus, elements.beginPair, elements.listClients, elements.pastePairingCode, elements.completePair, elements.cancelPair, elements.queryLogins, elements.newLogin, elements.toggleSiteAutoFill, elements.toggleSiteAutoSubmit];
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
      sendMessage: async () => ({ ok: true, response: {} })
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
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'popup.js' });

sandbox.init();
sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: false,
  pairingSessionId: 'session-1',
  pairingExpiresAt: Date.now() + 125000,
  autoFillEnabled: false
});

assert.equal(elements.pairingPanel.classList.contains('hidden'), false, 'pairing panel should be visible');
assert.equal(elements.pairingTimer.textContent.includes('2:05'), true, 'pairing panel should show time remaining');
assert.equal(fakeDocument.activeElement, elements.pairingCode, 'pairing code input should receive focus');
assert.equal(elements.completePair.disabled, true, 'confirm should be disabled before a complete code is entered');

elements.pairingCode.value = '123';
elements.pairingCode.dispatch('input');
assert.equal(elements.completePair.disabled, true, 'confirm should stay disabled for short code');

elements.pairingCode.value = '123456';
elements.pairingCode.dispatch('input');
assert.equal(elements.completePair.disabled, false, 'confirm should enable for a six digit code');

elements.pairingCode.value = '';
await sandbox.pastePairingCode();
assert.equal(elements.pairingCode.value, '955963', 'paste should extract the six digit pairing code from clipboard text');
assert.equal(elements.completePair.disabled, false, 'paste should enable confirm when clipboard contains a pairing code');
assert.equal(elements.message.textContent, 'Pairing code pasted.', 'paste should confirm success to the user');

sandbox.renderState({
  endpoint: 'http://127.0.0.1:19455/bridge',
  paired: true,
  pairingSessionId: 'stale-session',
  pairingExpiresAt: Date.now() + 125000,
  autoFillEnabled: false
});

assert.equal(elements.pairingPanel.classList.contains('hidden'), true, 'paired popup should hide stale pairing sessions');
assert.equal(elements.pairingTimer.textContent, '', 'paired popup should clear pairing countdown');

console.log('Popup tests passed.');

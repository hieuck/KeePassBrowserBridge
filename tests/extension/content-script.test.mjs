import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const DOCUMENT_POSITION_FOLLOWING = 4;

class MockInput {
  constructor(order, attrs, value = '') {
    this.order = order;
    this.attrs = { ...attrs };
    this.value = value;
    this.disabled = false;
    this.readOnly = false;
    this.parentElement = null;
  }

  getAttribute(name) {
    return this.attrs[name] || '';
  }

  get id() {
    return this.attrs.id || '';
  }

  compareDocumentPosition(other) {
    return this.order < other.order ? DOCUMENT_POSITION_FOLLOWING : 0;
  }

  getBoundingClientRect() {
    return { width: 160, height: 32, top: 0, right: 160 };
  }
}

class MockRoot {
  constructor(inputs) {
    this.inputs = inputs;
    for (const input of inputs) input.parentElement = this;
  }

  querySelectorAll(selector) {
    if (selector === 'input') {
      return this.inputs;
    }

    if (selector === 'input[type="password"]') {
      return this.inputs.filter((input) => (input.getAttribute('type') || '').toLowerCase() === 'password');
    }

    return [];
  }

  appendChild() {}
  contains() { return false; }
  addEventListener() {}
}

const unrelatedUser = new MockInput(1, {
  id: 'account-search',
  name: 'username',
  type: 'email',
  autocomplete: 'username'
}, 'wrong@example.com');

const targetUser = new MockInput(2, {
  id: 'login-email',
  name: 'email',
  type: 'email',
  autocomplete: 'username'
}, 'right@example.com');

const targetPassword = new MockInput(3, {
  id: 'login-password',
  name: 'password',
  type: 'password',
  autocomplete: 'current-password'
}, 'secret');

const unrelatedForm = new MockRoot([unrelatedUser]);
const targetForm = new MockRoot([targetUser, targetPassword]);
const documentRoot = new MockRoot([unrelatedUser, targetUser, targetPassword]);

const sandbox = {
  console,
  Node: { DOCUMENT_POSITION_FOLLOWING },
  MutationObserver: class {
    observe() {}
  },
  chrome: {
    runtime: {
      onMessage: { addListener() {} },
      sendMessage: async () => ({ ok: false })
    }
  },
  document: {
    title: 'Scoped Login',
    documentElement: documentRoot,
    querySelectorAll: (selector) => documentRoot.querySelectorAll(selector),
    addEventListener() {}
  },
  window: {
    location: { href: 'https://example.com/login' },
    getComputedStyle: () => ({ visibility: 'visible', display: 'block' }),
    setTimeout() {},
    addEventListener() {},
    sessionStorage: {
      getItem: () => null,
      setItem() {},
      removeItem() {}
    }
  }
};

sandbox.window.__keepassBrowserBridgeContentScriptLoaded = true;
sandbox.globalThis = sandbox;

const source = fs.readFileSync(new URL('../../extension/contentScript.js', import.meta.url), 'utf8');
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'contentScript.js' });

const credential = sandbox.collectCredentialFromForm(targetForm);

assert.equal(credential.userName, 'right@example.com');
assert.equal(credential.password, 'secret');
assert.equal(sandbox.collectCredentialFromForm(unrelatedForm).userName, 'wrong@example.com');

console.log('Content script tests passed.');

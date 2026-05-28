import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const DOCUMENT_POSITION_FOLLOWING = 4;
let activeDocument = null;

class MockInput {
  constructor(order, attrs, value = '') {
    this.order = order;
    this.attrs = { ...attrs };
    this.value = value;
    this.disabled = false;
    this.readOnly = false;
    this.parentElement = null;
    this.dispatchedEvents = [];
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

  focus() {
    if (activeDocument) activeDocument.activeElement = this;
  }

  dispatchEvent(event) {
    this.dispatchedEvents.push(event.type);
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

const focusedStepEmail = new MockInput(4, {
  id: 'signin-email',
  name: 'email',
  type: 'email',
  autocomplete: 'username'
});

const otherStepEmail = new MockInput(5, {
  id: 'recovery-email',
  name: 'email',
  type: 'email',
  autocomplete: 'username'
});

const splitOtpInputs = Array.from({ length: 6 }, (_, index) => new MockInput(10 + index, {
  id: `otp-${index + 1}`,
  name: `otp-${index + 1}`,
  type: 'text',
  inputmode: 'numeric',
  autocomplete: 'one-time-code',
  maxlength: '1',
  'aria-label': `Verification code digit ${index + 1}`
}));

const quotaPageSizeInput = new MockInput(30, {
  id: 'custom-accounts-per-page',
  name: 'accountsPerPage',
  type: 'number',
  inputmode: 'numeric',
  'aria-label': 'Custom accounts per page'
}, '20');

const unrelatedForm = new MockRoot([unrelatedUser]);
const targetForm = new MockRoot([targetUser, targetPassword]);
const documentRoot = new MockRoot([
  unrelatedUser,
  targetUser,
  targetPassword,
  focusedStepEmail,
  otherStepEmail,
  ...splitOtpInputs,
  quotaPageSizeInput
]);

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
    activeElement: null,
    title: 'Scoped Login',
    documentElement: documentRoot,
    querySelectorAll: (selector) => documentRoot.querySelectorAll(selector),
    addEventListener() {}
  },
  Event: class {
    constructor(type) {
      this.type = type;
    }
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
activeDocument = sandbox.document;

const source = fs.readFileSync(new URL('../../extension/contentScript.js', import.meta.url), 'utf8');
assert.equal(source.includes('more hidden'), false, 'inline picker should not hide additional matching entries');
assert.equal(source.includes('entries.slice(0, 8)'), false, 'inline picker should render every matching entry');
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'contentScript.js' });

assert.equal(sandbox.scoreOtpCandidate(quotaPageSizeInput) <= 0, true, 'numeric page-size input should not score as OTP');

const credential = sandbox.collectCredentialFromForm(targetForm);

assert.equal(credential.userName, 'right@example.com');
assert.equal(credential.password, 'secret');
assert.equal(sandbox.collectCredentialFromForm(unrelatedForm).userName, 'wrong@example.com');

focusedStepEmail.focus();
targetPassword.disabled = true;
const fillResult = sandbox.fillLogin({ UserName: 'alice@example.com' });
assert.equal(fillResult.usernameFilled, true);
assert.equal(focusedStepEmail.value, 'alice@example.com');
assert.equal(otherStepEmail.value, '');

const otpResult = sandbox.fillLogin({ OneTimePassword: '123456' });
assert.equal(otpResult.otpFilled, true);
assert.deepEqual(splitOtpInputs.map((input) => input.value), ['1', '2', '3', '4', '5', '6']);

console.log('Content script tests passed.');

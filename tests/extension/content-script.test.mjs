import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const DOCUMENT_POSITION_FOLLOWING = 4;
let activeDocument = null;
const sessionValues = new Map();
const runtimeMessages = [];

class MockInput {
  constructor(order, attrs, value = '') {
    this.order = order;
    this.attrs = { ...attrs };
    this.value = value;
    this.disabled = false;
    this.readOnly = false;
    this.parentElement = null;
    this.labelText = attrs.labelText || '';
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

  addEventListener() {}

  closest(selector) {
    if (selector === 'label' && this.labelText) {
      return { textContent: this.labelText };
    }

    return null;
  }
}

class MockRoot {
  constructor(inputs, textContent = '') {
    this.inputs = inputs;
    this.textContent = textContent;
    for (const input of inputs) {
      input.parentElement = this;
      if (!input.form) input.form = this;
    }
  }

  querySelectorAll(selector) {
    if (selector === 'input') {
      return this.inputs;
    }

    if (selector === 'input[type="password"]') {
      return this.inputs.filter((input) => (input.getAttribute('type') || '').toLowerCase() === 'password');
    }

    if (selector === 'button[type="submit"], input[type="submit"]') {
       return this.submitButtons || [];
    }

    return [];
  }

  querySelector(selector) {
    const matches = this.querySelectorAll(selector);
    return matches.length ? matches[0] : null;
  }

  submit() {
    this.submitted = true;
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

const viotpHistorySearchInput = new MockInput(31, {
  id: '',
  name: '',
  type: 'text',
  labelText: 'Search:'
}, '');

const newsletterEmailInput = new MockInput(32, {
  id: 'newsletter-email',
  name: 'email',
  type: 'email',
  autocomplete: 'email',
  placeholder: 'Email address',
  labelText: 'Subscribe to newsletter'
}, '');

const googleVietnameseTotpInput = new MockInput(33, {
  id: '',
  name: '',
  type: 'tel',
  inputmode: 'numeric',
  labelText: 'Nhập mã',
  'aria-label': ''
}, '');

const contactEmailInput = new MockInput(34, {
  id: 'contact-email',
  name: 'email',
  type: 'email',
  autocomplete: 'email',
  labelText: 'Email address'
}, '');

const usernameFirstEmailAddressInput = new MockInput(35, {
  id: 'email-address-login',
  name: 'email',
  type: 'email',
  autocomplete: 'username',
  labelText: 'Email address'
}, '');

const unrelatedForm = new MockRoot([unrelatedUser]);
const targetForm = new MockRoot([targetUser, targetPassword]);
const documentRoot = new MockRoot([
  unrelatedUser,
  targetUser,
  targetPassword,
  focusedStepEmail,
  otherStepEmail,
  ...splitOtpInputs,
  quotaPageSizeInput,
  viotpHistorySearchInput,
  newsletterEmailInput,
  googleVietnameseTotpInput,
  contactEmailInput,
  usernameFirstEmailAddressInput
]);

const sandbox = {
  console,
  Node: { DOCUMENT_POSITION_FOLLOWING },
  MutationObserver: class {
    observe() {}
  },
  chrome: {
    runtime: {
      onMessage: { addListener(fn) { sandbox.onMessageListener = fn; } },
      sendMessage: async (message) => {
        runtimeMessages.push(message);
        if (message.type === 'KBB_CONSUME_PENDING_CREDENTIAL') {
          return {
            ok: true,
            response: {
              credential: {
                EntryId: 'entry-work',
                UserName: 'work@example.com',
                Password: 'work-secret'
              }
            }
          };
        }
        if (message.type === 'KBB_CONSUME_SUBMITTED_CREDENTIAL') {
          return {
            ok: true,
            response: { credential: null }
          };
        }

        return { ok: true, response: { Success: true } };
      }
    }
  },
  document: {
    activeElement: null,
    title: 'Scoped Login',
    documentElement: documentRoot,
    querySelectorAll: (selector) => documentRoot.querySelectorAll(selector),
    querySelector: () => null,
    createElement: () => ({
      dataset: {}, setAttribute() {}, addEventListener() {}, style: {},
      remove() {},
      parentElement: { removeChild() {}, getBoundingClientRect() { return { left: 0, top: 0 }; } },
      getBoundingClientRect() { return { right: 0, top: 0, height: 0 }; },
      appendChild() {}
    }),
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
    setTimeout(fn) { fn(); },
    addEventListener() {},
    sessionStorage: {
      getItem: (key) => sessionValues.has(key) ? sessionValues.get(key) : null,
      setItem: (key, value) => sessionValues.set(key, String(value)),
      removeItem: (key) => sessionValues.delete(key)
    },
    __kbbCustomFields: {
      lastFields: null,
      fillCustomFields(fields) {
        this.lastFields = fields;
        return { filled: fields.length, fields: fields.map((field) => ({ name: field.Name, filled: true })) };
      }
    }
  }
};

sandbox.window.__keepassBrowserBridgeContentScriptLoaded = false;
sandbox.globalThis = sandbox;
activeDocument = sandbox.document;

const source = fs.readFileSync(new URL('../../extension/contentScript.js', import.meta.url), 'utf8');
assert.equal(source.includes('more hidden'), false, 'inline picker should not hide additional matching entries');
assert.equal(source.includes('entries.slice(0, 8)'), false, 'inline picker should render every matching entry');
assert.equal(source.includes('kbb-inline-picker-search'), true, 'inline picker should include a search input for many matching entries');
assert.equal(source.includes('filterInlinePickerItems'), true, 'inline picker should filter matching entries as the user types');
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'contentScript.js' });

assert.equal(sandbox.scoreOtpCandidate(quotaPageSizeInput) <= 0, true, 'numeric page-size input should not score as OTP');
assert.equal(sandbox.scoreUsernameCandidate(viotpHistorySearchInput) < -50, true, 'datatable search input should not score as username');
assert.equal(sandbox.scoreUsernameCandidate(newsletterEmailInput) < -50, true, 'newsletter email input should not score as username');
assert.equal(sandbox.findUsernameInput(null, new MockRoot([newsletterEmailInput])), null, 'newsletter-only pages should not expose email signup as username');
assert.equal(sandbox.findUsernameInput(null, new MockRoot([contactEmailInput], 'Contact support Email address Message Send message')), null, 'contact support pages should not expose email fields as username');
assert.equal(
  sandbox.findUsernameInput(null, new MockRoot([usernameFirstEmailAddressInput], 'Sign in Email address Continue')),
  usernameFirstEmailAddressInput,
  'username-first login pages should support Email address labels'
);
assert.equal(sandbox.scoreOtpCandidate(googleVietnameseTotpInput) > 0, true, 'Google Vietnamese authenticator code input should score as OTP');
assert.equal(sandbox.scoreUsernameCandidate(googleVietnameseTotpInput) < -50, true, 'Google Vietnamese authenticator code input should not score as username');
assert.equal(sandbox.findUsernameInput(null, new MockRoot([googleVietnameseTotpInput])), null, 'OTP-only pages should not expose an OTP field as username');

const pickerItems = [
  { dataset: { kbbSearchText: 'github hieu https://github.com' }, style: {} },
  { dataset: { kbbSearchText: 'openai chatgpt hjeupjn https://chatgpt.com' }, style: {} }
];
const emptyPickerState = { style: {} };
sandbox.filterInlinePickerItems(pickerItems, emptyPickerState, 'chat hje');
assert.equal(pickerItems[0].style.display, 'none', 'picker search should hide non-matching entries');
assert.equal(pickerItems[1].style.display, 'block', 'picker search should keep entries matching all words');
assert.equal(emptyPickerState.style.display, 'none', 'picker empty state should stay hidden when matches exist');
sandbox.filterInlinePickerItems(pickerItems, emptyPickerState, 'dropbox');
assert.equal(emptyPickerState.style.display, 'block', 'picker empty state should appear when no entries match');

const credential = sandbox.collectCredentialFromForm(targetForm);

assert.equal(credential.userName, 'right@example.com');
assert.equal(credential.password, 'secret');
assert.equal(sandbox.collectCredentialFromForm(unrelatedForm).userName, 'wrong@example.com');

sandbox.window.__keepassBrowserBridgeLastMultiStepCredential = { UserName: 'step@example.com' };
targetUser.disabled = true;
const passwordOnlyCredential = sandbox.collectCredentialFromForm(targetForm);
assert.equal(passwordOnlyCredential.userName, 'step@example.com', 'password-only submit should reuse selected multi-step username');
targetUser.disabled = false;
sandbox.window.__keepassBrowserBridgeLastMultiStepCredential = null;

sandbox.storePendingCredential({
  url: 'https://example.com/login',
  userName: 'submitted@example.com',
  password: 'submitted-secret'
});
const submittedRememberMessage = runtimeMessages.find((message) => message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL');
assert.equal(submittedRememberMessage.credential.password, 'submitted-secret', 'submitted credential should be sent to background for secure temporary storage');
assert.equal(sessionValues.has('__kbbPendingCredential'), false, 'submitted credential should not be stored in page sessionStorage');

focusedStepEmail.focus();
targetPassword.disabled = true;
const fillResult = sandbox.fillLogin({ UserName: 'alice@example.com' });
assert.equal(fillResult.usernameFilled, true);
assert.equal(focusedStepEmail.value, 'alice@example.com');
assert.equal(otherStepEmail.value, '');

const usernameOnlyResult = sandbox.fillCredentialForButton({
  dataset: { kbbFillRole: 'username' },
  __kbbTargetInput: focusedStepEmail
}, {
  EntryId: 'entry-work',
  UserName: 'work@example.com',
  Password: 'work-secret'
});
sandbox.rememberMultiStepCredentialIfNeeded(usernameOnlyResult, {
  EntryId: 'entry-work',
  UserName: 'work@example.com',
  Password: 'work-secret'
});
const rememberMessage = runtimeMessages.find((message) => message.type === 'KBB_REMEMBER_PENDING_CREDENTIAL');
assert.equal(rememberMessage.credential.EntryId, 'entry-work', 'username-only fill should ask background to remember selected credential');
assert.equal(sessionValues.has('__kbbPendingMultiStepCredential'), false, 'multi-step credential should not be stored in page sessionStorage');

const otpResult = sandbox.fillLogin({ OneTimePassword: '123456' });
assert.equal(otpResult.otpFilled, true);
assert.deepEqual(splitOtpInputs.map((input) => input.value), ['1', '2', '3', '4', '5', '6']);

viotpHistorySearchInput.focus();
let focusedFieldResponse = null;
sandbox.window.__keepassBrowserBridgeMessageListener(
  {
    type: 'KBB_FILL',
    credential: { Password: 'manual-secret' },
    fieldRole: 'password'
  },
  {},
  (response) => {
    focusedFieldResponse = response;
  }
);
assert.equal(focusedFieldResponse.filled, true, 'manual field fill should report success');
assert.equal(focusedFieldResponse.result.passwordFilled, true, 'manual password fill should mark the password as filled');
assert.equal(viotpHistorySearchInput.value, 'manual-secret', 'manual field fill should write to the focused editable input even when form detection would ignore it');

viotpHistorySearchInput.value = '';
activeDocument.activeElement = null;
focusedFieldResponse = null;
sandbox.window.__keepassBrowserBridgeMessageListener(
  {
    type: 'KBB_FILL',
    credential: { UserName: 'last-focused@example.com' },
    fieldRole: 'username'
  },
  {},
  (response) => {
    focusedFieldResponse = response;
  }
);
assert.equal(focusedFieldResponse.filled, true, 'manual field fill should use the last focused editable input when the page loses active focus');
assert.equal(focusedFieldResponse.result.usernameFilled, true, 'last focused manual fill should mark username as filled');
assert.equal(viotpHistorySearchInput.value, 'last-focused@example.com', 'manual field fill should write to the last focused editable input');

viotpHistorySearchInput.value = '';
focusedFieldResponse = null;
sandbox.window.__keepassBrowserBridgeMessageListener(
  {
    type: 'KBB_FILL',
    credential: {
      CustomFields: [
        { Name: 'Tenant', Value: 'production', IsProtected: false },
        { Name: 'ApiKey', Value: 'protected-secret', IsProtected: true }
      ]
    },
    fieldRole: 'custom',
    customFieldName: 'Tenant'
  },
  {},
  (response) => {
    focusedFieldResponse = response;
  }
);
assert.equal(focusedFieldResponse.filled, true, 'manual custom field fill should report success');
assert.equal(focusedFieldResponse.result.customFieldsFilled, 1, 'manual custom field fill should mark one custom field as filled');
assert.equal(viotpHistorySearchInput.value, 'production', 'manual custom field fill should write the selected custom field value');

const customFieldResult = sandbox.fillLogin({
  CustomFields: [
    { Name: 'Tenant', Value: 'production', IsProtected: false },
    { Name: 'ApiKey', Value: 'protected-secret', IsProtected: true }
  ]
});
assert.equal(customFieldResult.customFieldsFilled, 1, 'fillLogin should delegate custom fields to the custom field module');
assert.equal(sandbox.window.__kbbCustomFields.lastFields.length, 1, 'fillLogin should not delegate protected custom fields to page autofill');
assert.equal(sandbox.window.__kbbCustomFields.lastFields[0].Name, 'Tenant');

// Test auto-submit
targetPassword.disabled = false;
sandbox.window.__keepassBrowserBridgeMessageListener(
  { type: 'KBB_FILL', credential: { UserName: 'u', Password: 'p' }, autoSubmit: true },
  {},
  () => {}
);
assert.equal(targetForm.submitted, true, 'autoSubmit should call form.submit()');

let collectedCredentialResponse = null;
sandbox.window.__keepassBrowserBridgeMessageListener(
  { type: 'KBB_COLLECT_PAGE_CREDENTIAL' },
  {},
  (response) => {
    collectedCredentialResponse = response;
  }
);
assert.equal(collectedCredentialResponse.collected, true, 'content script should collect the current page credential');
assert.equal(collectedCredentialResponse.credential.userName, 'u', 'collected credential should include current username field value');
assert.equal(collectedCredentialResponse.credential.password, 'p', 'collected credential should include current password field value');

console.log('Content script tests passed.');

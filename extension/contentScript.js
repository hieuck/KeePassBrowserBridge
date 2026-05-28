'use strict';

if (!window.__keepassBrowserBridgeContentScriptLoaded) {
  window.__keepassBrowserBridgeContentScriptLoaded = true;

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || message.type !== 'KBB_FILL') {
      return;
    }

    try {
      const result = fillLogin(message.credential || {});
      sendResponse({ filled: true, result });
    } catch (error) {
      sendResponse({
        filled: false,
        error: error && error.message ? error.message : String(error)
      });
    }
  });
}

function fillLogin(credential) {
  const passwordInput = findPasswordInput();
  if (!passwordInput) {
    throw new Error('No password field found on this page.');
  }

  const usernameInput = findUsernameInput(passwordInput);
  if (usernameInput && credential.UserName) {
    setInputValue(usernameInput, credential.UserName);
  }

  if (credential.Password) {
    setInputValue(passwordInput, credential.Password);
  }

  return {
    usernameFilled: Boolean(usernameInput && credential.UserName),
    passwordFilled: Boolean(credential.Password)
  };
}

function findPasswordInput() {
  return visibleInputs('input[type="password"]').find((input) => !input.disabled && !input.readOnly) || null;
}

function findUsernameInput(passwordInput) {
  const candidates = visibleInputs('input')
    .filter((input) => {
      const type = (input.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'email', 'tel', 'url', 'search', ''].includes(type)
        && !input.disabled
        && !input.readOnly;
    });

  const beforePassword = candidates
    .filter((input) => input.compareDocumentPosition(passwordInput) & Node.DOCUMENT_POSITION_FOLLOWING);

  return beforePassword.length ? beforePassword[beforePassword.length - 1] : candidates[0] || null;
}

function visibleInputs(selector) {
  return Array.from(document.querySelectorAll(selector)).filter(isVisible);
}

function isVisible(element) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return style.visibility !== 'hidden'
    && style.display !== 'none'
    && rect.width > 0
    && rect.height > 0;
}

function setInputValue(input, value) {
  input.focus();
  const descriptor = Object.getOwnPropertyDescriptor(input.constructor.prototype, 'value');
  if (descriptor && descriptor.set) {
    descriptor.set.call(input, value);
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

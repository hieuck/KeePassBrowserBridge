"use strict";
if (!window.__keepassBrowserBridgeContentScriptLoaded) {
  window.__keepassBrowserBridgeContentScriptLoaded = true;
  window.__keepassBrowserBridgeInlineTargets = new WeakSet();
  window.__keepassBrowserBridgeActivePicker = null;
  window.__keepassBrowserBridgePickerReady = null;
  window.__keepassBrowserBridgePromptReady = null;
  window.__keepassBrowserBridgeBootAt = Date.now();
  window.__keepassBrowserBridgeLastCredentialKey = "";
  window.__keepassBrowserBridgeLastCredentialAt = 0;
  window.__keepassBrowserBridgePendingRemember = null;
  window.__keepassBrowserBridgePendingSubmitted = null;
  window.__keepassBrowserBridgeLastMultiStepCredential = null;
  window.__keepassBrowserBridgeLastFocusedInput = null;
  window.__keepassBrowserBridgeObservedShadowRoots = new WeakSet();
  window.__keepassBrowserBridgeEventRoots = new WeakSet();
  window.__keepassBrowserBridgeMessageListener = (message, sender, sendResponse) => {
    if (!message || (message.type !== "KBB_FILL" && message.type !== "KBB_COLLECT_PAGE_CREDENTIAL")) {
      return;
    }
    try {
      if (message.type === "KBB_COLLECT_PAGE_CREDENTIAL") {
        const credential = collectCredentialFromForm(credentialCollectionRoot());
        sendResponse({ collected: Boolean(credential), credential });
        return;
      }

      const fillRoot = message.fieldRole
        ? credentialScopeForInput(getFocusedEditableInput())
        : credentialFillRoot();
      const result = message.fieldRole
        ? fillFocusedField(message.credential || {}, message.fieldRole, message.customFieldName || "")
        : fillLogin(message.credential || {}, fillRoot);
      
      if (message.autoSubmit && (result.usernameFilled || result.passwordFilled)) {
        autoSubmitLoginForm(fillRoot);
      }

      sendResponse({ filled: true, result });
    } catch (error) {
      sendResponse({
        filled: false,
        error: error && error.message ? error.message : String(error),
      });
    }
  };
  chrome.runtime.onMessage.addListener(window.__keepassBrowserBridgeMessageListener);
  installShadowRootObserverHook();
  installInlineFillButtons();
  restorePendingCredential();
  fillPendingMultiStepCredential();
  const observer = new MutationObserver(() => {
    installInlineFillButtons();
    fillPendingMultiStepCredential();
    observeOpenShadowRoots(document);
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  observeOpenShadowRoots(document);
  installRootEventListeners(document);
}
function installRootEventListeners(root) {
  if (
    !root ||
    !root.addEventListener ||
    window.__keepassBrowserBridgeEventRoots.has(root)
  ) {
    return;
  }

  window.__keepassBrowserBridgeEventRoots.add(root);
  root.addEventListener(
    "mousedown",
    (event) => {
      const picker = window.__keepassBrowserBridgeActivePicker;
      if (
        picker &&
        !picker.contains(event.target) &&
        !event.target.classList.contains("kbb-inline-button")
      ) {
        closeInlinePicker();
      }
    },
    true,
  );
  root.addEventListener(
    "focusin",
    (event) => {
      const input = editableInputFromElement(event.target);
      if (input) {
        window.__keepassBrowserBridgeLastFocusedInput = input;
      }
    },
    true,
  );
  root.addEventListener(
    "keydown",
    (event) => {
      captureCredentialEnterKey(event);
    },
    true,
  );
  root.addEventListener(
    "submit",
    (event) => {
      captureLoginSubmit(event.target);
      waitForPendingCredentialMessages(event);
    },
    true,
  );
  root.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (target && target.closest) {
        if (
          target.closest(
            ".kbb-save-prompt, .kbb-update-prompt, .kbb-inline-picker, .kbb-inline-button",
          ) ||
          (typeof event.composedPath === "function" &&
            event.composedPath().some((node) => {
              if (!node || !node.tagName) return false;
              const tag = String(node.tagName || "").toLowerCase();
              return tag === "kbb-save-prompt" || tag === "kbb-update-prompt";
            }))
        ) {
          return;
        }
        const submit = target.closest('button, input[type="submit"], input[type="button"]');
        const isNativeSubmit = isSubmitControl(submit);
        const actionRoot = submit ? credentialActionRoot(submit) : null;
        if (submit && !isNativeSubmit && !isCredentialActionControl(submit, actionRoot)) {
          return;
        }
        if (submit) {
          captureLoginSubmit(actionRoot);
          if (isNativeSubmit) {
            waitForPendingCredentialMessages(event);
          }
        }
      }
    },
    true,
  );
}
import { isSubmitControl, fieldText, isNonCredentialAutocomplete, isProfileOrPaymentFieldText, isNonLoginCommunicationContext, isAccountRecoveryContext, isFilterOrSearchFieldText, hasLoginIntentText, isTelephoneIdentifierField, isLoginPasswordInput, isCurrentPasswordInput, isNewPasswordInput, isChangePasswordForm, isOtpDigitInput, scoreOtpCandidate, credentialContextText, documentOrder, isVisible, editableInputFromElement, credentialKey } from './shared/field-classifier.js';

function isCredentialActionControl(element, root) {
  if (!element || !element.tagName) return false;
  const tagName = element.tagName.toLowerCase();
  const type = (element.getAttribute("type") || "").toLowerCase();
  if (tagName !== "button" && !(tagName === "input" && type === "button")) {
    return false;
  }

  if (!findSubmittedPasswordInput(root || credentialActionRoot(element))) return false;

  const text = credentialActionControlText(element);
  if (!text) return false;
  if (isAccountRecoveryContext(text) || isNonLoginCommunicationContext(text)) return false;
  if (isProfileOrPaymentFieldText(text) && !/\b(password|passcode|secret)\b/.test(text)) return false;

  return /\bsign\s*in\b|\blog\s*in\b|\blogin\b|\bunlock\b|\bcontinue\b|\bnext\b|\bsubmit\b|\bupdate\s+password\b|\bchange\s+password\b|\bsave\s+password\b/.test(text);
}
function credentialActionControlText(element) {
  const parts = [
    element.textContent || "",
    element.getAttribute("value") || "",
    element.getAttribute("aria-label") || "",
    element.getAttribute("title") || "",
    element.getAttribute("name") || "",
    element.id || "",
  ];
  return parts.join(" ").toLowerCase();
}
function credentialActionRoot(control) {
  if (!control) return document;
  const form = control.form || (control.closest ? control.closest("form") : null);
  if (form) return form;

  const focusedScope = credentialScopeForInput(getFocusedEditableInput());
  if (focusedScope && hasSubmittedCredentialTarget(focusedScope)) return focusedScope;

  const region = control.closest
    ? control.closest('[role="form"], dialog, section, article, main')
    : null;
  return region || document;
}
function hasSubmittedCredentialTarget(root) {
  return Boolean(findSubmittedPasswordInput(root) || findUsernameInput(null, root));
}
function captureCredentialEnterKey(event) {
  if (!event || event.key !== "Enter" || event.isComposing) return;
  const target = event.target;
  if (!target || !target.closest) return;
  if (
    target.closest(
      ".kbb-save-prompt, .kbb-update-prompt, .kbb-inline-picker, .kbb-inline-button",
    ) ||
    (typeof event.composedPath === "function" &&
      event.composedPath().some((node) => {
        if (!node || !node.tagName) return false;
        const tag = String(node.tagName || "").toLowerCase();
        return tag === "kbb-save-prompt" || tag === "kbb-update-prompt";
      }))
  ) {
    return;
  }

  const input = editableInputFromElement(target);
  if (!input || (input.getAttribute("type") || "").toLowerCase() !== "password") return;

  const scope = credentialScopeForInput(input) || document;
  if (!findSubmittedPasswordInput(scope)) return;

  captureLoginSubmit(scope);
}
function autoSubmitLoginForm(root) {
  const passwordInput = findPasswordInput(root);
  const usernameInput = findUsernameInput(passwordInput, root);
  const input = passwordInput || usernameInput;
  if (!input) return;

  const form = input.form || (input.closest ? input.closest("form") : null);
  window.setTimeout(() => {
    if (form) {
      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
      } else {
        form.submit();
      }
    } else {
      const scope = root && root.querySelector ? root : document;
      const submitBtn = scope.querySelector('button[type="submit"], input[type="submit"]');
      if (submitBtn) submitBtn.click();
    }
  }, 100);
}
function fillLogin(credential, root) {
  const passwordInput = findPasswordInput(root);
  const usernameInput = findUsernameInput(passwordInput, root);
  const otpInput = findOtpInput(passwordInput, root);
  if (
    !passwordInput &&
    !usernameInput &&
    !otpInput
  ) {
    throw new Error("No login field found on this page.");
  }
  const customFieldsResult = fillCustomFields(credential, root);
  if (usernameInput && credential.UserName) {
    setInputValue(usernameInput, credential.UserName);
  }
  if (passwordInput && credential.Password) {
    setInputValue(passwordInput, credential.Password);
  }
  const otpFilled = credential.OneTimePassword
    ? fillOneTimePassword(otpInput, credential.OneTimePassword)
    : false;
  if (otpInput && credential.OneTimePassword && !otpFilled) {
    setInputValue(otpInput, credential.OneTimePassword);
  }
  return {
    usernameFilled: Boolean(usernameInput && credential.UserName),
    passwordFilled: Boolean(passwordInput && credential.Password),
    otpFilled: Boolean(otpFilled || (otpInput && credential.OneTimePassword)),
    customFieldsFilled: customFieldsResult ? customFieldsResult.filled : 0,
    customFields: customFieldsResult ? customFieldsResult.fields : [],
  };
}
function fillFocusedField(credential, role, customFieldName) {
  const target = getFocusedEditableInput();
  if (!target) {
    throw new Error("No focused editable field found on this page.");
  }

  if (role === "username" && credential.UserName) {
    setInputValue(target, credential.UserName);
    return { usernameFilled: true, passwordFilled: false, otpFilled: false };
  }
  if (role === "password" && credential.Password) {
    setInputValue(target, credential.Password);
    return { usernameFilled: false, passwordFilled: true, otpFilled: false };
  }
  if (role === "otp" && credential.OneTimePassword) {
    setOneTimePasswordValue(target, credential.OneTimePassword);
    return { usernameFilled: false, passwordFilled: false, otpFilled: true };
  }
  if (role === "custom" && customFieldName) {
    const field = (credential.CustomFields || []).find(
      (candidate) =>
        candidate &&
        candidate.IsProtected !== true &&
        candidate.Name === customFieldName &&
        typeof candidate.Value === "string",
    );
    if (field) {
      setInputValue(target, field.Value);
      return { usernameFilled: false, passwordFilled: false, otpFilled: false, customFieldsFilled: 1 };
    }
  }

  throw new Error("Selected KeePass entry does not contain a value for this field.");
}
function getFocusedEditableInput() {
  const activeInput = editableInputFromElement(document.activeElement);
  if (activeInput) {
    window.__keepassBrowserBridgeLastFocusedInput = activeInput;
    return activeInput;
  }

  return editableInputFromElement(window.__keepassBrowserBridgeLastFocusedInput);
}
function fillCustomFields(credential, root) {
  const fields = credential && Array.isArray(credential.CustomFields)
    ? credential.CustomFields.filter((field) => field && field.IsProtected !== true)
    : [];
  if (!fields.length || !window.__kbbCustomFields || !window.__kbbCustomFields.fillCustomFields) {
    return { filled: 0, fields: [] };
  }

  return window.__kbbCustomFields.fillCustomFields(fields, root);
}
function captureLoginSubmit(form) {
  const credential = collectCredentialFromForm(form || document);
  if (!credential || (!credential.userName && !credential.password)) {
    return;
  }
  const key = credentialKey(credential);
  const now = Date.now();
  if (
    window.__keepassBrowserBridgeLastCredentialKey === key &&
    now - window.__keepassBrowserBridgeLastCredentialAt < 2000
  ) {
    return;
  }
  window.__keepassBrowserBridgeLastCredentialKey = key;
  window.__keepassBrowserBridgeLastCredentialAt = now;
  storePendingCredential(credential);
  window.setTimeout(() => maybePromptSaveLogin(credential), 300);
}
function collectCredentialFromForm(root) {
  const scope = root && root.querySelectorAll ? root : document;
  const passwordInput = findSubmittedPasswordInput(scope);
  const usernameInput = findUsernameInput(passwordInput, scope);
  if (!passwordInput && !usernameInput) {
    return null;
  }
  const multiStepCredential = window.__keepassBrowserBridgeLastMultiStepCredential;
  const pageUrl = credentialPageUrl();
  return {
    title: document.title || titleFromCredentialUrl(pageUrl),
    url: pageUrl,
    userName: usernameInput
      ? usernameInput.value
      : (passwordInput && multiStepCredential && multiStepCredential.UserName ? multiStepCredential.UserName : ""),
    password: passwordInput ? passwordInput.value : "",
  };
}
function findSubmittedPasswordInput(scope) {
  const passwordInputs = Array.from(scope.querySelectorAll('input[type="password"]'))
    .filter(
      (input) =>
        isVisible(input) &&
        !input.disabled &&
        !input.readOnly &&
        input.value,
    );
  const changedPasswordInput = findChangedPasswordInput(passwordInputs);
  if (changedPasswordInput) return changedPasswordInput;
  if (isChangePasswordForm(passwordInputs)) return null;

  return (
    passwordInputs
      .filter((input) => isLoginPasswordInput(input))
      .sort((a, b) => b.value.length - a.value.length)[0] || null
  );
}
function findChangedPasswordInput(passwordInputs) {
  const hasCurrentPassword = passwordInputs.some((input) => isCurrentPasswordInput(input));
  if (!hasCurrentPassword) return null;

  const newPasswordInputs = passwordInputs.filter((input) => isNewPasswordInput(input));
  if (!newPasswordInputs.length) return null;

  const firstValue = newPasswordInputs[0].value;
  if (!firstValue || newPasswordInputs.some((input) => input.value !== firstValue)) {
    return null;
  }

  return newPasswordInputs[0];
}
function credentialCollectionRoot() {
  const input = getFocusedEditableInput();
  const scope = credentialScopeForInput(input);
  return scope && hasCredentialFillTarget(scope) ? scope : document;
}
function credentialFillRoot() {
  const input = editableInputFromElement(document.activeElement) ||
    editableInputFromElement(window.__keepassBrowserBridgeLastFocusedInput);
  if (!input) return document;
  const scope = credentialScopeForInput(input);
  if (scope && hasCredentialFillTarget(scope)) return scope;
  return isCredentialHostileField(input) ? emptyCredentialRoot() : document;
}
function hasCredentialFillTarget(root) {
  const passwordInput = findPasswordInput(root);
  return Boolean(passwordInput || findUsernameInput(passwordInput, root) || findOtpInput(passwordInput, root));
}
function isCredentialHostileField(input) {
  const context = credentialContextText(input);
  return (
    isNonCredentialAutocomplete(input) ||
    isProfileOrPaymentFieldText(context) ||
    isNonLoginCommunicationContext(context) ||
    isAccountRecoveryContext(context)
  );
}
function emptyCredentialRoot() {
  return {
    querySelectorAll() {
      return [];
    },
    querySelector() {
      return null;
    },
  };
}
async function maybePromptSaveLogin(credential) {
  if (!credential.password) {
    return;
  }
  try {
    if (!(await canMutateKeePassEntries())) {
      return;
    }

    const pageUrl = credential.url || credentialPageUrl();
    const result = await chrome.runtime.sendMessage({
      type: "KBB_QUERY_FOR_URL",
      url: pageUrl,
    });
    if (!result || !result.ok) {
      return;
    }
    const entries =
      result.response && Array.isArray(result.response.entries)
        ? sortCredentialEntries(result.response.entries)
        : [];
    const match = findCredentialMatch(entries, credential);
    if (!match) {
      showSaveLoginPrompt(credential);
    } else if (match.Password && match.Password !== credential.password) {
      showUpdateLoginPrompt(match, credential);
    }
  } catch (error) {
    /* Save prompts are opportunistic; manual extension actions surface bridge errors. */
  }
}
async function canMutateKeePassEntries() {
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
    return true;
  }

  try {
    const result = await chrome.runtime.sendMessage({ type: "KBB_STATUS" });
    if (!result || !result.ok || !result.response) return false;
    if (result.response.Trusted === false) return false;
    if (!Array.isArray(result.response.Permissions)) return false;
    return result.response.Permissions.includes("write");
  } catch (error) {
    return false;
  }
}
function storePendingCredential(credential) {
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
    return;
  }

  const request = chrome.runtime.sendMessage({
    type: "KBB_REMEMBER_SUBMITTED_CREDENTIAL",
    origin: window.location.origin,
    credential,
  });
  if (request && typeof request.catch === "function") {
    request.catch(() => {});
  }
  const pendingSubmitted = Promise.resolve(request)
    .catch(() => {})
    .finally(() => {
      if (window.__keepassBrowserBridgePendingSubmitted === pendingSubmitted) {
        window.__keepassBrowserBridgePendingSubmitted = null;
      }
    });
  window.__keepassBrowserBridgePendingSubmitted = pendingSubmitted;
}
function restorePendingCredential() {
  window.setTimeout(async () => {
    if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
      return;
    }

    try {
      const result = await chrome.runtime.sendMessage({
        type: "KBB_CONSUME_SUBMITTED_CREDENTIAL",
        origin: window.location.origin,
      });
      const credential =
        result && result.ok && result.response ? result.response.credential : null;
      if (credential) maybePromptSaveLogin(credential);
    } catch (error) {
      /* Pending credentials are best-effort and should never break the page. */
    }
  }, 500);
}
function findCredentialMatch(entries, credential) {
  if (!entries.length) return null;
  if (credential.userName) {
    const usernameMatch = entries.find((entry) =>
      stringEquals(entry.UserName, credential.userName),
    );
    if (usernameMatch) return usernameMatch;
  }
  return entries.length === 1 ? entries[0] : null;
}
function findPasswordInput(root) {
  return (
    visibleInputs('input[type="password"]', root).find(
      (input) => !input.disabled && !input.readOnly && isLoginPasswordInput(input),
    ) || null
  );
}
function findUsernameInput(passwordInput, root) {
  const hasPasswordContext = Boolean(passwordInput);
  const candidates = visibleInputs("input", root).filter((input) => {
    const type = (input.getAttribute("type") || "text").toLowerCase();
    return (
      ["text", "email", "tel", "url", ""].includes(type) &&
      !input.disabled &&
      !input.readOnly
    );
  });
  const scoredCandidates = candidates
    .map((input, index) => ({
      input,
      index,
      score:
        scoreUsernameCandidate(input) +
        passwordLoginUsernameBoost(input, passwordInput),
    }))
    .filter((candidate) =>
      hasPasswordContext
        ? candidate.score > -50
        : candidate.score >= 40 && isUsernameFirstLoginCandidate(candidate.input, candidate.score),
    );
  const scoped = passwordInput
    ? scoredCandidates.filter(
        (candidate) =>
          candidate.input.compareDocumentPosition(passwordInput) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      )
    : scoredCandidates;
  const validCandidates = scoped.length ? scoped : scoredCandidates;
  if (!validCandidates.length) {
    return null;
  }
  const active = document.activeElement;
  if (active) {
    const activeCandidate = validCandidates.find(
      (c) => c.input === active && c.score >= 0,
    );
    if (activeCandidate) return activeCandidate.input;
  }
  const ranked = validCandidates.sort(
    (a, b) => b.score - a.score || b.index - a.index,
  );
  return ranked[0].input;
}
function passwordLoginUsernameBoost(input, passwordInput) {
  if (!input || !passwordInput) return 0;

  const type = (input.getAttribute("type") || "text").toLowerCase();
  const autocomplete = (input.getAttribute("autocomplete") || "").toLowerCase();
  if (!isTelephoneIdentifierField(type, autocomplete)) return 0;

  const context = credentialContextText(passwordInput);
  if (!hasLoginIntentText(context)) return 0;

  return 260;
}
function findOtpInput(passwordInput, root) {
  const candidates = visibleInputs("input", root)
    .filter((input) => {
      const type = (input.getAttribute("type") || "text").toLowerCase();
      return (
        ["text", "tel", "number", "password", ""].includes(type) &&
        !input.disabled &&
        !input.readOnly &&
        input !== passwordInput
      );
    })
    .map((input, index) => ({ input, index, score: scoreOtpCandidate(input) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);
  return candidates.length ? candidates[0].input : null;
}
function fillOneTimePassword(otpInput, code) {
  const value = String(code || "").trim();
  if (!value) return false;
  const splitInputs = findSplitOtpInputs(otpInput, value.length);
  if (splitInputs.length < value.length) return false;
  for (let i = 0; i < value.length; ++i) {
    setInputValue(splitInputs[i], value.charAt(i));
  }
  return true;
}
function setOneTimePasswordValue(otpInput, code) {
  const value = String(code || "").trim();
  if (!otpInput || !value) return false;
  if (fillOneTimePassword(otpInput, value)) return true;
  setInputValue(otpInput, value);
  return true;
}
function findSplitOtpInputs(anchorInput, codeLength) {
  if (!anchorInput || codeLength < 2) return [];
  const scopes = [
    anchorInput.parentElement,
    anchorInput.closest ? anchorInput.closest("fieldset") : null,
    anchorInput.form || null,
    anchorInput.closest ? anchorInput.closest("main, section, article, div") : null,
    document,
  ].filter(Boolean);

  for (const scope of scopes) {
    const inputs = visibleInputs("input", scope)
      .filter(
        (input) => !input.disabled && !input.readOnly && isOtpDigitInput(input),
      )
      .sort((a, b) => documentOrder(a, b));
    if (inputs.length >= codeLength && inputs.includes(anchorInput)) {
      return inputs.slice(0, codeLength);
    }
  }

  return [];
}
function visibleInputs(selector, root) {
  const scope = root && root.querySelectorAll ? root : document;
  return querySelectorAllDeep(scope, selector).filter(isVisible);
}
function querySelectorAllDeep(root, selector) {
  const results = [];
  const visited = new Set();

  const visit = (scope) => {
    if (!scope || visited.has(scope) || !scope.querySelectorAll) return;
    visited.add(scope);
    for (const element of scope.querySelectorAll(selector)) {
      results.push(element);
    }
    for (const element of scope.querySelectorAll("*")) {
      if (element.shadowRoot) {
        visit(element.shadowRoot);
      }
    }
  };

  visit(root);
  return results;
}
function installShadowRootObserverHook() {
  if (
    window.__keepassBrowserBridgeAttachShadowHooked ||
    typeof Element === "undefined" ||
    !Element.prototype.attachShadow
  ) {
    return;
  }

  window.__keepassBrowserBridgeAttachShadowHooked = true;
  const originalAttachShadow = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function(options) {
    const shadowRoot = originalAttachShadow.call(this, options);
    if (!options || options.mode === "open") {
      observeShadowRoot(shadowRoot);
    }
    return shadowRoot;
  };
}
function observeOpenShadowRoots(root) {
  for (const host of querySelectorAllDeep(root || document, "*")) {
    if (host.shadowRoot) {
      observeShadowRoot(host.shadowRoot);
    }
  }
}
function observeShadowRoot(shadowRoot) {
  if (
    !shadowRoot ||
    !shadowRoot.querySelectorAll ||
    window.__keepassBrowserBridgeObservedShadowRoots.has(shadowRoot)
  ) {
    return;
  }

  window.__keepassBrowserBridgeObservedShadowRoots.add(shadowRoot);
  installRootEventListeners(shadowRoot);
  const observer = new MutationObserver(() => {
    installInlineFillButtons();
    fillPendingMultiStepCredential();
    observeOpenShadowRoots(shadowRoot);
  });
  observer.observe(shadowRoot, {
    childList: true,
    subtree: true,
  });
}
function setInputValue(input, value) {
  input.focus();
  const descriptor = Object.getOwnPropertyDescriptor(
    input.constructor.prototype,
    "value",
  );
  if (descriptor && descriptor.set) {
    descriptor.set.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}
function installInlineFillButtons() {
  const passwordInputs = visibleInputs('input[type="password"]').filter(
    (input) => !input.disabled && !input.readOnly && isLoginPasswordInput(input),
  );
  const attached = new Set();
  for (const passwordInput of passwordInputs) {
    if (window.__keepassBrowserBridgeInlineTargets.has(passwordInput)) {
      continue;
    }
    const usernameInput = findUsernameInput(passwordInput);
    if (
      usernameInput &&
      !window.__keepassBrowserBridgeInlineTargets.has(usernameInput)
    ) {
      attachInlineButton(usernameInput, "username");
      window.__keepassBrowserBridgeInlineTargets.add(usernameInput);
      attached.add(usernameInput);
    }
    if (!attached.has(passwordInput)) {
      attachInlineButton(passwordInput, "password");
    }
    window.__keepassBrowserBridgeInlineTargets.add(passwordInput);
  }
  if (passwordInputs.length === 0) {
    const usernameInput = findUsernameInput(null);
    if (
      usernameInput &&
      !window.__keepassBrowserBridgeInlineTargets.has(usernameInput)
    ) {
      attachInlineButton(usernameInput, "username");
      window.__keepassBrowserBridgeInlineTargets.add(usernameInput);
    }
  }
  const otpInput = findOtpInput(null);
  if (otpInput && !window.__keepassBrowserBridgeInlineTargets.has(otpInput)) {
    attachInlineButton(otpInput, "otp");
    window.__keepassBrowserBridgeInlineTargets.add(otpInput);
  }
}
function attachInlineButton(input, role) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "kbb-inline-button";
  button.dataset.kbbFillRole = role || "form";
  button.__kbbTargetInput = input;
  button.setAttribute(
    "aria-label",
    inlineButtonLabel(button.dataset.kbbFillRole),
  );
  button.title = inlineButtonLabel(button.dataset.kbbFillRole);
  button.textContent = "K";
  button.addEventListener("mousedown", (event) => event.preventDefault());
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    fillFromInlineButton(button);
  });
  placeInlineButton(input, button);
}
function inlineButtonLabel(role) {
  if (role === "username") return "Fill username from KeePass";
  if (role === "password") return "Fill password from KeePass";
  if (role === "otp") return "Fill one-time code from KeePass";
  return "Fill from KeePass";
}
function placeInlineButton(input, button) {
  const parent = input.parentElement;
  if (!parent) {
    return;
  }
  const parentStyle = window.getComputedStyle(parent);
  if (parentStyle.position === "static") {
    parent.style.position = "relative";
  }
  button.style.position = "absolute";
  button.style.zIndex = "2147483647";
  button.style.width = "20px";
  button.style.height = "20px";
  button.style.minWidth = "20px";
  button.style.minHeight = "20px";
  button.style.maxWidth = "20px";
  button.style.maxHeight = "20px";
  button.style.margin = "0";
  button.style.padding = "0";
  button.style.boxSizing = "border-box";
  button.style.border = "none";
  button.style.borderRadius = "50%";
  button.style.background = "#4a90e2";
  button.style.color = "#ffffff";
  button.style.appearance = "none";
  button.style.font =
    '14px/20px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  button.style.cursor = "pointer";
  button.style.textAlign = "center";
  button.style.boxShadow = "0 1px 4px rgba(15, 23, 42, 0.18)";
  parent.appendChild(button);
  positionInlineButton(input, button);
  window.addEventListener("resize", () => positionInlineButton(input, button));
  input.addEventListener("focus", () => positionInlineButton(input, button));
}
function positionInlineButton(input, button) {
  const parent = input.parentElement;
  if (!parent || !input.isConnected) {
    button.remove();
    return;
  }
  const inputRect = input.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  button.style.left = `${inputRect.right - parentRect.left - 30}px`;
  button.style.top = `${inputRect.top - parentRect.top + Math.max(4, (inputRect.height - 24) / 2)}px`;
}
async function fillFromInlineButton(button) {
  setInlineButtonState(button, "...");
  try {
    const pageUrl = credentialPageUrl();
    // Wake up service worker if inactive (MV3 can kill SW after ~30s)
    try {
      await chrome.runtime.sendMessage({ type: "KBB_PING" });
    } catch (wakeError) {
      const wakeMsg = String(wakeError);
      if (wakeMsg.includes('context invalidated')) {
        showInlineErrorPicker(button, "Extension was updated or reloaded. Please refresh the page.");
        setInlineButtonState(button, "!");
        return;
      }
      if (wakeMsg.includes('Could not establish connection')) {
        showInlineErrorPicker(button, "Extension not ready. Please open the popup to activate.");
        setInlineButtonState(button, "!");
        return;
      }
    }
    const result = await chrome.runtime.sendMessage({
      type: "KBB_QUERY_FOR_URL",
      url: pageUrl,
    });
    if (!result || !result.ok) {
      throw new Error(
        result && result.error ? result.error : "KeePass query failed.",
      );
    }
    const entries =
      result.response && Array.isArray(result.response.entries)
        ? result.response.entries
        : [];
    if (entries.length === 0) {
      const credential = collectCredentialFromForm(document);
      if (credential && credential.password && await canMutateKeePassEntries()) {
        showSaveLoginPrompt(credential);
      } else {
        showInlineEmptyPicker(button);
      }
      setInlineButtonState(button, "0");
      return;
    }
    if (entries.length > 1) {
      showInlinePicker(button, entries);
      setInlineButtonState(button, String(entries.length));
      return;
    }
    rememberMultiStepCredentialIfNeeded(fillCredentialForButton(button, entries[0]), entries[0]);
    acknowledgeFilledEntry(entries[0]);
    setInlineButtonState(button, "ok");
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    const stack = error && error.stack ? '\n' + error.stack.split('\n').slice(0, 3).join('\n') : '';
    const fullInfo = message + stack;
    if (message.includes('context invalidated') || message.includes('Extension context')) {
      console.warn('[KeePass] Extension context invalidated');
      showInlineErrorPicker(button, "Extension was updated. Please refresh this page.");
    } else if (message.includes('null') && message.includes('get')) {
      console.error('[KeePass] null.get error — likely chrome.storage or Map:', fullInfo);
      showInlineErrorPicker(button, 'Extension error. Check console (F12) for details.');
    } else {
      console.warn('[KeePass] Fill error:', fullInfo);
      showInlineErrorPicker(button, message);
    }
    setInlineButtonState(button, "!");
  }
}
function showInlineErrorPicker(button, messageText) {
  closeInlinePicker();
  const picker = document.createElement("div");
  picker.className = "kbb-inline-picker";
  picker.setAttribute("role", "alert");
  applyPickerStyle(picker);

  const error = document.createElement("div");
  error.className = "kbb-inline-picker-error";
  error.style.padding = "10px";
  error.style.color = "#b42318";
  error.style.font =
    '12px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  const title = document.createElement("div");
  title.textContent = messageText || "KeePass query failed.";
  title.style.fontWeight = "700";

  const hint = document.createElement("div");
  hint.textContent = "Open the extension popup to unlock or pair this browser.";
  hint.style.marginTop = "6px";
  hint.style.color = "#667085";

  const close = createInlinePickerCloseButton();
  error.appendChild(title);
  error.appendChild(hint);
  error.appendChild(close);
  picker.appendChild(error);
  document.documentElement.appendChild(picker);
  positionInlinePicker(button, picker);
  window.__keepassBrowserBridgeActivePicker = picker;
  close.focus();
}
function showInlineEmptyPicker(button) {
  closeInlinePicker();
  const picker = document.createElement("div");
  picker.className = "kbb-inline-picker";
  picker.setAttribute("role", "status");
  applyPickerStyle(picker);

  const empty = document.createElement("div");
  empty.className = "kbb-inline-picker-empty";
  empty.style.padding = "10px";
  empty.style.color = "#667085";
  empty.style.font =
    '12px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  const title = document.createElement("div");
  title.textContent = "No KeePass logins found for this page.";
  title.style.color = "#1f2933";
  title.style.fontWeight = "700";

  const hint = document.createElement("div");
  hint.textContent = "Enter a username and password, then submit the form to save a new KeePass entry.";
  hint.style.marginTop = "6px";

  const close = createInlinePickerCloseButton();
  empty.appendChild(title);
  empty.appendChild(hint);
  empty.appendChild(close);
  picker.appendChild(empty);
  document.documentElement.appendChild(picker);
  positionInlinePicker(button, picker);
  window.__keepassBrowserBridgeActivePicker = picker;
  close.focus();
}
function createInlinePickerCloseButton() {
  const close = document.createElement("button");
  close.type = "button";
  close.className = "kbb-inline-picker-close";
  close.textContent = "Close";
  close.style.marginTop = "8px";
  close.style.width = "100%";
  close.style.border = "1px solid #d7dde5";
  close.style.borderRadius = "6px";
  close.style.background = "#ffffff";
  close.style.color = "#1f2933";
  close.style.padding = "6px 8px";
  close.style.font =
    '600 12px/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  close.style.cursor = "pointer";
  close.addEventListener("mousedown", (event) => event.preventDefault());
  close.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeInlinePicker();
  });
  close.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    closeInlinePicker();
  });
  return close;
}
function showInlinePicker(button, entries) {
  closeInlinePicker();
  entries = sortCredentialEntries(entries || []);
  const items = entries.map((entry) => ({
    name: entry.Title || "(Untitled)",
    username: entry.UserName || "",
    url: entry.Url || "",
    group: entry.Group || "",
    password: entry.Password || "",
    oneTimePassword: entry.OneTimePassword || "",
    customFields: entry.CustomFields || [],
    entryId: entry.EntryId || "",
    selected: Boolean(entry.selected),
    _entry: entry,
  }));
  const mountPicker = () => {
    if (!customElements.get("kbb-picker")) {
      return false;
    }
    const picker = document.createElement("kbb-picker");
    picker.setAttribute("placeholder", "Search KeePass logins…");
    picker.setAttribute("show-search", String(items.length > 6));
    picker.setAttribute("aria-label", `${items.length} KeePass logins`);
    picker.addEventListener("kbb-fill", (event) => {
      const detail = event.detail || {};
      const cred = detail.credential || {};
      const entry = cred._entry;
      if (!entry) return;
      event.preventDefault();
      event.stopPropagation();
      rememberMultiStepCredentialIfNeeded(fillCredentialForButton(button, entry), entry);
      acknowledgeFilledEntry(entry);
      closeInlinePicker();
      setInlineButtonState(button, "ok");
    });
    picker.addEventListener("kbb-close", () => {
      closeInlinePicker();
    });
    document.documentElement.appendChild(picker);
    window.__keepassBrowserBridgeActivePicker = picker;
    picker.credentials = items;
    positionInlinePicker(button, picker);
    requestAnimationFrame(() => positionInlinePicker(button, picker));
    const searchInput = picker.shadowRoot && picker.shadowRoot.querySelector
      ? picker.shadowRoot.querySelector(".picker-search-input")
      : null;
    if (searchInput && searchInput.focus) {
      searchInput.focus();
    } else if (picker.focus) {
      picker.focus();
    }
    return true;
  };
  if (mountPicker()) return;
  if (customElements.whenDefined) {
    customElements
      .whenDefined("kbb-picker")
      .then(() => {
        if (!window.__keepassBrowserBridgeActivePicker) mountPicker();
      })
      .catch(() => {});
  }
  ensureInlinePickerComponent()
    .then(() => {
      if (!window.__keepassBrowserBridgeActivePicker) mountPicker();
    })
    .catch(() => {});
}
function sortCredentialEntries(entries) {
  return (entries || [])
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const usageDelta =
        Number(right.entry.UsageCount || 0) - Number(left.entry.UsageCount || 0);
      if (usageDelta !== 0) return usageDelta;

      const lastUsedDelta =
        Number(right.entry.LastUsed || 0) - Number(left.entry.LastUsed || 0);
      if (lastUsedDelta !== 0) return lastUsedDelta;

      return left.index - right.index;
    })
    .map((item) => item.entry);
}
function fillCredentialForButton(button, entry) {
  const role = button && button.dataset ? button.dataset.kbbFillRole : "form";
  const targetInput = button ? button.__kbbTargetInput : null;
  if (role === "username" && targetInput && entry.UserName) {
    setInputValue(targetInput, entry.UserName);
    return { usernameFilled: true, passwordFilled: false, otpFilled: false };
  }
  if (role === "password" && targetInput && entry.Password) {
    setInputValue(targetInput, entry.Password);
    return { usernameFilled: false, passwordFilled: true, otpFilled: false };
  }
  if (role === "otp" && targetInput && entry.OneTimePassword) {
    setOneTimePasswordValue(targetInput, entry.OneTimePassword);
    return { usernameFilled: false, passwordFilled: false, otpFilled: true };
  }
  return fillLogin(entry, credentialScopeForInput(targetInput));
}
function credentialScopeForInput(input) {
  if (!input) return null;
  if (input.form) return input.form;
  return input.closest ? input.closest("form, dialog, section, article, main") : null;
}
function rememberMultiStepCredentialIfNeeded(result, entry) {
  if (
    !result ||
    !result.usernameFilled ||
    result.passwordFilled ||
    !entry ||
    !entry.Password ||
    findPasswordInput()
  ) {
    return;
  }

  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
    return;
  }

  const request = chrome.runtime.sendMessage({
    type: "KBB_REMEMBER_PENDING_CREDENTIAL",
    origin: window.location.origin,
    credential: entry,
  });
  if (request && typeof request.catch === "function") {
    request.catch(() => {});
  }
  const pendingRemember = Promise.resolve(request)
    .catch(() => {})
    .finally(() => {
      if (window.__keepassBrowserBridgePendingRemember === pendingRemember) {
        window.__keepassBrowserBridgePendingRemember = null;
      }
    });
  window.__keepassBrowserBridgePendingRemember = pendingRemember;
  return request;
}
function waitForPendingCredentialMessages(event) {
  const pending = [
    window.__keepassBrowserBridgePendingRemember,
    window.__keepassBrowserBridgePendingSubmitted,
  ].filter(Boolean);
  if (!pending.length || !event || event.__kbbWaitingForPendingCredentialMessages) {
    return;
  }

  const form = event.target && event.target.closest
    ? event.target.closest("form")
    : event.target;
  if (!form || !form.submit) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();
  event.__kbbWaitingForPendingCredentialMessages = true;
  Promise.allSettled(pending).finally(() => {
    if (form.requestSubmit) {
      form.requestSubmit();
    } else {
      form.submit();
    }
  });
}
async function fillPendingMultiStepCredential() {
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
    return;
  }

  const passwordInput = findPasswordInput();
  if (!passwordInput) {
    return;
  }

  let result;
  try {
    result = await chrome.runtime.sendMessage({
      type: "KBB_CONSUME_PENDING_CREDENTIAL",
      origin: window.location.origin,
    });
  } catch (error) {
    return;
  }

  const credential =
    result && result.ok && result.response ? result.response.credential : null;
  if (!credential || !credential.Password) {
    return;
  }

  setInputValue(passwordInput, credential.Password);
  window.__keepassBrowserBridgeLastMultiStepCredential = credential;
  acknowledgeFilledEntry(credential);
}
function acknowledgeFilledEntry(entry) {
  if (!entry || !entry.EntryId || typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
    return;
  }
  const result = chrome.runtime.sendMessage({
    type: "KBB_FILL_ACK",
    entryId: entry.EntryId,
    url: credentialPageUrl(),
  });
  if (result && typeof result.catch === "function") {
    result.catch(() => {});
  }
}
function closeInlinePicker() {
  const picker = window.__keepassBrowserBridgeActivePicker;
  if (picker && picker.parentElement) {
    picker.parentElement.removeChild(picker);
  }
  window.__keepassBrowserBridgeActivePicker = null;
}
function anchorPositionNearForm(_credential) {
  // Try to find the form that was just submitted
  const passwordInput = findSubmittedPasswordInput(document);
  const usernameInput = findUsernameInput(passwordInput);
  const form = (passwordInput && passwordInput.form) ||
    (usernameInput && usernameInput.form) ||
    null;
  if (!form) return {};

  const rect = form.getBoundingClientRect();
  const viewWidth = window.innerWidth;
  const gap = 16;
  const right = Math.max(gap, viewWidth - rect.right + gap);
  return {
    "data-position": "anchored",
    "data-top": Math.max(gap, rect.top + 8) + "px",
    "data-right": right + "px",
  };
}

function showSaveLoginPrompt(credential) {
  const key = credentialKey(credential);
  const activePrompt = document.querySelector("kbb-save-prompt");
  if (activePrompt && activePrompt.dataset.credentialKey === key) {
    return;
  }
  document.querySelectorAll("kbb-save-prompt").forEach((el) => el.remove());

  const prompt = document.createElement("kbb-save-prompt");
  prompt.dataset.credentialKey = key;
  prompt.setAttribute("name", credential.title || titleFromCredentialUrl(credential.url) || "");
  prompt.setAttribute("url", credential.url || "");
  prompt.setAttribute("username", credential.userName || "");
  prompt.setAttribute("password", credential.password || "");

  // Apply anchored position
  const pos = anchorPositionNearForm(credential);
  if (pos["data-position"]) {
    prompt.setAttribute("data-position", pos["data-position"]);
    prompt.setAttribute("data-top", pos["data-top"]);
    prompt.setAttribute("data-right", pos["data-right"]);
  }

  // Pass folder options if available
  const folderAttr = prompt.getAttribute("data-folders");
  if (!folderAttr) {
    const groups = collectAvailableGroups();
    if (groups.length > 0) {
      prompt.setAttribute("folders", JSON.stringify(groups));
    }
  }
  if (credential.group) {
    prompt.setAttribute("folder", credential.group);
  }

  prompt.addEventListener("kbb-save", (event) => {
    const detail = (event && event.detail) || {};
    createLogin({
      Title: detail.title || detail.name || credential.title || titleFromCredentialUrl(credential.url) || "",
      Url: detail.url || credential.url || "",
      UserName: detail.username || credential.userName || "",
      Password: detail.password || credential.password || "",
    });
  });
  prompt.addEventListener("kbb-never", (event) => {
    const detail = (event && event.detail) || {};
    addNeverSaveUrl(detail.url || credential.url || "");
  });
  prompt.addEventListener("kbb-dismiss", () => {
    /* silent dismiss */
  });

  const mountTarget = document.body || document.documentElement;
  if (mountTarget) mountTarget.appendChild(prompt);
}

function collectAvailableGroups() {
  // Collect unique group names from existing entries if available
  try {
    const entries = window.__keepassBrowserBridgeEntries;
    if (Array.isArray(entries)) {
      const groups = new Set();
      entries.forEach(e => { if (e.Group) groups.add(e.Group); });
      return Array.from(groups).sort();
    }
  } catch {}
  return [];
}
function createLogin(login) {
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
    return;
  }
  try {
    chrome.runtime.sendMessage({ type: "KBB_CREATE_LOGIN", login });
  } catch (error) {
    /* best-effort; bridge errors surface in manual extension flows */
  }
}
function addNeverSaveUrl(url) {
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
    return;
  }
  try {
    chrome.runtime.sendMessage({ type: "KBB_NEVER_SAVE_URL", url: String(url || "") });
  } catch (error) {
    /* best-effort; persistence is implemented opportunistically by the background */
  }
}
function titleFromCredentialUrl(url) {
  try {
    return new URL(url).hostname || "New Login";
  } catch (error) {
    return "New Login";
  }
}
function credentialPageUrl() {
  const ownUrl = String(window.location && window.location.href ? window.location.href : "");
  if (!isAboutFrameUrl(ownUrl)) {
    return ownUrl;
  }

  const ancestorUrl = accessibleAncestorPageUrl();
  return ancestorUrl || ownUrl;
}
function isAboutFrameUrl(url) {
  return url === "about:blank" || url === "about:srcdoc";
}
function accessibleAncestorPageUrl() {
  let current = window;
  while (current && current.parent && current.parent !== current) {
    try {
      current = current.parent;
      const href = String(current.location && current.location.href ? current.location.href : "");
      if (href && !isAboutFrameUrl(href)) {
        return href;
      }
    } catch (error) {
      return "";
    }
  }
  return "";
}
function showUpdateLoginPrompt(entry, credential) {
  document.querySelectorAll("kbb-update-prompt").forEach((el) => el.remove());

  const prompt = document.createElement("kbb-update-prompt");
  prompt.dataset.entryId = entry && entry.EntryId ? String(entry.EntryId) : "";
  prompt.setAttribute("name", (entry && entry.Title) || titleFromCredentialUrl(credential.url) || "");
  prompt.setAttribute("old-username", (entry && entry.UserName) || "");
  prompt.setAttribute("username", credential.userName || (entry && entry.UserName) || "");
  prompt.setAttribute("password", credential.password || "");
  prompt.setAttribute("url", (entry && entry.Url) || credential.url || "");

  // Apply anchored position
  const pos = anchorPositionNearForm(credential);
  if (pos["data-position"]) {
    prompt.setAttribute("data-position", pos["data-position"]);
    prompt.setAttribute("data-top", pos["data-top"]);
    prompt.setAttribute("data-right", pos["data-right"]);
  }

  // Pass folder options
  const groups = collectAvailableGroups();
  if (groups.length > 0) {
    prompt.setAttribute("folders", JSON.stringify(groups));
  }

  prompt.addEventListener("kbb-update", (event) => {
    const detail = (event && event.detail) || {};
    updateLogin({
      EntryId: entry && entry.EntryId,
      PageUrl: credential.url,
      Title: detail.name || (entry && entry.Title) || titleFromCredentialUrl(credential.url) || "",
      Url: detail.url || (entry && entry.Url) || credential.url || "",
      UserName: detail.username || credential.userName || (entry && entry.UserName) || "",
      Password: detail.password || credential.password || "",
    });
  });
  prompt.addEventListener("kbb-skip", () => {
    /* silent skip */
  });
  prompt.addEventListener("kbb-dismiss", () => {
    /* silent dismiss */
  });

  const mountTarget = document.body || document.documentElement;
  if (mountTarget) mountTarget.appendChild(prompt);
}
function updateLogin(login) {
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
    return;
  }
  try {
    chrome.runtime.sendMessage({ type: "KBB_UPDATE_LOGIN", login });
  } catch (error) {
    /* best-effort; bridge errors surface in manual extension flows */
  }
}
function applyPickerStyle(picker) {
  picker.style.position = "fixed";
  picker.style.zIndex = "2147483647";
  picker.style.width = "360px";
  picker.style.maxWidth = "calc(100vw - 16px)";
  picker.style.maxHeight = "min(420px, calc(100vh - 32px))";
  picker.style.overflowY = "auto";
  picker.style.padding = "8px";
  picker.style.background = "#ffffff";
  picker.style.color = "#1f2933";
  picker.style.border = "1px solid #d7dde5";
  picker.style.borderRadius = "8px";
  picker.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.16)";
  picker.style.font =
    '13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}
function positionInlinePicker(anchor, picker) {
  const rect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const desiredWidth = 360;
  const maxAllowedWidth = Math.max(220, viewportWidth - 16);
  const width = Math.min(desiredWidth, maxAllowedWidth);
  const left = Math.max(
    8,
    Math.min(viewportWidth - width - 8, rect.right - width),
  );
  const naturalHeight = picker.scrollHeight || 320;
  const maxHeight = Math.min(420, viewportHeight - 32);
  const fitsBelow = rect.bottom + 8 + Math.min(naturalHeight, maxHeight) <= viewportHeight - 8;
  const top = fitsBelow
    ? rect.bottom + 8
    : Math.max(8, rect.top - Math.min(naturalHeight, maxHeight) - 8);
  picker.style.width = `${width}px`;
  picker.style.left = `${left}px`;
  picker.style.top = `${top}px`;
  picker.style.maxHeight = `${maxHeight}px`;
}
function setInlineButtonState(button, state) {
  button.classList.remove("kbb-inline-btn--success", "kbb-inline-btn--error");
  if (state === "ok") {
    button.textContent = "OK";
    button.style.background = "#067647";
    button.style.color = "#ffffff";
    button.classList.add("kbb-inline-btn--success");
  } else if (state === "!") {
    button.textContent = "!";
    button.style.background = "#b42318";
    button.style.color = "#ffffff";
    button.classList.add("kbb-inline-btn--error");
  } else {
    button.textContent = state;
    button.style.background = "#4a90e2";
    button.style.color = "#ffffff";
  }
  window.setTimeout(() => {
    if (document.documentElement.contains(button)) {
      button.textContent = "K";
      button.style.background = "#2563eb";
      button.style.color = "#ffffff";
      button.classList.remove("kbb-inline-btn--success", "kbb-inline-btn--error");
    }
  }, 1600);
}
function scoreUsernameCandidate(input) {
  const type = (input.getAttribute("type") || "text").toLowerCase();
  const autocomplete = (input.getAttribute("autocomplete") || "").toLowerCase();
  const text = fieldText(input);
  const context = credentialContextText(input);
  let score = 0;
  if (isNonCredentialAutocomplete(input)) score -= 260;
  if (type === "email") score += 50;
  if (isTelephoneIdentifierField(type, autocomplete) && hasLoginIntentText(context)) score += 320;
  if (/\busername\b/.test(text)) score += 80;
  if (/\bemail\b|e-mail|mail/.test(text)) score += 70;
  if (/\blogin\b|\buser\b|account/.test(text)) score += 45;
  if (/\bcurrent-password\b|\bnew-password\b/.test(text)) score -= 100;
  if (/\bfname\b|\blname\b|first|last|family|given|surname/.test(text))
    score -= 120;
  if (autocomplete !== "username" && isFilterOrSearchFieldText(text)) score -= 220;
  if (type === "search") score -= 100;
  if (/\bnewsletter\b|\bsubscribe\b|\bsubscription\b|\bmarketing\b|\bupdates\b/.test(text))
    score -= 220;
  if (isProfileOrPaymentFieldText(text)) score -= 260;
  if (/otp|totp|2fa|mfa|authenticator|verification|passcode/.test(text))
    score -= 100;
  if (/nhập mã|nhap ma|mã xác minh|ma xac minh|xác minh|xac minh|mã xác thực|ma xac thuc/.test(text))
    score -= 100;
  if (/\bcode\b|\btoken\b|\bpin\b/.test(text)) score -= 100;
  return score;
}
function isUsernameFirstLoginCandidate(input, score) {
  if (!input || score < 40) return false;
  const context = credentialContextText(input);
  if (isNonLoginCommunicationContext(context)) return false;
  if (isAccountRecoveryContext(context)) return false;
  if (isProfileOrPaymentFieldText(context)) return false;
  return /\busername\b|current-password|sign\s*in|log\s*in|\blogin\b|identifier|continue|next/.test(context);
}

function stringEquals(left, right) {
  return String(left || "").toLowerCase() === String(right || "").toLowerCase();
}
function ensureInlinePickerComponent() {
  if (window.__keepassBrowserBridgePickerReady) {
    return window.__keepassBrowserBridgePickerReady;
  }
  const getUrl = (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL)
    || (typeof browser !== "undefined" && browser.runtime && browser.runtime.getURL);
  if (!getUrl) {
    window.__keepassBrowserBridgePickerReady = Promise.reject(new Error("Extension URL unavailable"));
    return window.__keepassBrowserBridgePickerReady;
  }
  const moduleUrl = getUrl("src/components/Picker.web.js");
  window.__keepassBrowserBridgePickerReady = import(moduleUrl)
    .then(() => true)
    .catch((error) => {
      window.__keepassBrowserBridgePickerReady = null;
      throw error;
    });
  return window.__keepassBrowserBridgePickerReady;
}
function ensurePromptComponent() {
  if (window.__keepassBrowserBridgePromptReady) {
    return window.__keepassBrowserBridgePromptReady;
  }
  const getUrl = (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL)
    || (typeof browser !== "undefined" && browser.runtime && browser.runtime.getURL);
  if (!getUrl) {
    window.__keepassBrowserBridgePromptReady = Promise.reject(new Error("Extension URL unavailable"));
    return window.__keepassBrowserBridgePromptReady;
  }
  const moduleUrl = getUrl("src/components/Prompt.web.js");
  window.__keepassBrowserBridgePromptReady = import(moduleUrl)
    .then(() => true)
    .catch((error) => {
      window.__keepassBrowserBridgePromptReady = null;
      throw error;
    });
  return window.__keepassBrowserBridgePromptReady;
}
if (typeof window !== "undefined" && typeof customElements !== "undefined") {
  try {
    ensureInlinePickerComponent();
    ensurePromptComponent();
  } catch (error) {
    // best-effort preload; will retry on demand
  }
}

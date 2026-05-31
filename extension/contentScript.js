"use strict";
if (!window.__keepassBrowserBridgeContentScriptLoaded) {
  window.__keepassBrowserBridgeContentScriptLoaded = true;
  window.__keepassBrowserBridgeInlineTargets = new WeakSet();
  window.__keepassBrowserBridgeActivePicker = null;
  window.__keepassBrowserBridgeMutationPrompt = null;
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

      const result = message.fieldRole
        ? fillFocusedField(message.credential || {}, message.fieldRole, message.customFieldName || "")
        : fillLogin(message.credential || {}, credentialFillRoot());
      
      if (message.autoSubmit && (result.usernameFilled || result.passwordFilled)) {
        const passwordInput = findPasswordInput();
        const usernameInput = findUsernameInput(passwordInput);
        const input = passwordInput || usernameInput;
        if (input) {
          const form = input.form || input.closest('form');
          window.setTimeout(() => {
            if (form) {
              const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
              if (submitBtn) {
                submitBtn.click();
              } else {
                form.submit();
              }
            } else {
              const submitBtn = document.querySelector('button[type="submit"], input[type="submit"]');
              if (submitBtn) submitBtn.click();
            }
          }, 100);
        }
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
          )
        ) {
          return;
        }
        const submit = target.closest('button, input[type="submit"]');
        if (submit && !isSubmitControl(submit)) {
          return;
        }
        if (submit) {
          captureLoginSubmit(submit.form || submit.closest("form"));
          waitForPendingCredentialMessages(event);
        }
      }
    },
    true,
  );
}
function isSubmitControl(element) {
  if (!element || !element.tagName) return false;
  const tagName = element.tagName.toLowerCase();
  const type = (element.getAttribute("type") || "").toLowerCase();
  if (tagName === "input") return type === "submit";
  if (tagName === "button") return type === "" || type === "submit";
  return false;
}
function fillLogin(credential, root) {
  const passwordInput = findPasswordInput(root);
  const usernameInput = findUsernameInput(passwordInput, root);
  const otpInput = findOtpInput(passwordInput, root);
  const customFieldsResult = fillCustomFields(credential, root);
  if (
    !passwordInput &&
    !usernameInput &&
    !otpInput &&
    (!customFieldsResult || !customFieldsResult.filled)
  ) {
    throw new Error("No login field found on this page.");
  }
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
    setInputValue(target, credential.OneTimePassword);
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
function editableInputFromElement(element) {
  if (!element || !isVisible(element) || element.disabled || element.readOnly) {
    return null;
  }

  const tagName = String(element.tagName || element.nodeName || "").toLowerCase();
  if (tagName === "textarea") return element;
  if (tagName && tagName !== "input") {
    return null;
  }
  if (!tagName && typeof element.getAttribute !== "function") {
    return null;
  }

  const type = (element.getAttribute("type") || "text").toLowerCase();
  return ["text", "email", "tel", "url", "search", "number", "password", ""].includes(type)
    ? element
    : null;
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
  const passwordInput =
    Array.from(scope.querySelectorAll('input[type="password"]'))
      .filter(
        (input) =>
          isVisible(input) && !input.disabled && !input.readOnly && input.value,
      )
      .sort((a, b) => b.value.length - a.value.length)[0] || null;
  const usernameInput = findUsernameInput(passwordInput, scope);
  if (!passwordInput && !usernameInput) {
    return null;
  }
  const multiStepCredential = window.__keepassBrowserBridgeLastMultiStepCredential;
  return {
    title: document.title || new URL(window.location.href).hostname,
    url: window.location.href,
    userName: usernameInput
      ? usernameInput.value
      : (passwordInput && multiStepCredential && multiStepCredential.UserName ? multiStepCredential.UserName : ""),
    password: passwordInput ? passwordInput.value : "",
  };
}
function credentialCollectionRoot() {
  const input = getFocusedEditableInput();
  return credentialScopeForInput(input) || document;
}
function credentialFillRoot() {
  const input = editableInputFromElement(document.activeElement) ||
    editableInputFromElement(window.__keepassBrowserBridgeLastFocusedInput);
  return credentialScopeForInput(input) || null;
}
async function maybePromptSaveLogin(credential) {
  if (!credential.password) {
    return;
  }
  try {
    const pageUrl = credential.url || window.location.href;
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
function credentialKey(credential) {
  return [
    credential.url || "",
    String(credential.userName || "").toLowerCase(),
    credential.password || "",
  ].join("\n");
}
function findPasswordInput(root) {
  return (
    visibleInputs('input[type="password"]', root).find(
      (input) => !input.disabled && !input.readOnly,
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
      score: scoreUsernameCandidate(input),
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
function isOtpDigitInput(input) {
  const maxLength = Number(
    input.getAttribute("maxlength") || input.maxLength || 0,
  );
  if (maxLength !== 1) return false;
  const type = (input.getAttribute("type") || "text").toLowerCase();
  if (!["text", "tel", "number", "password", ""].includes(type)) return false;
  return scoreOtpCandidate(input) > 0;
}
function documentOrder(left, right) {
  if (left === right) return 0;
  return left.compareDocumentPosition(right) & Node.DOCUMENT_POSITION_FOLLOWING
    ? -1
    : 1;
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
function isVisible(element) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.visibility !== "hidden" &&
    style.display !== "none" &&
    rect.width > 0 &&
    rect.height > 0
  );
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
    (input) => !input.disabled && !input.readOnly,
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
  button.style.width = "24px";
  button.style.height = "24px";
  button.style.minWidth = "24px";
  button.style.minHeight = "24px";
  button.style.maxWidth = "24px";
  button.style.maxHeight = "24px";
  button.style.margin = "0";
  button.style.padding = "0";
  button.style.boxSizing = "border-box";
  button.style.border = "1px solid #176b87";
  button.style.borderRadius = "6px";
  button.style.background = "#ffffff";
  button.style.color = "#176b87";
  button.style.appearance = "none";
  button.style.font =
    '700 12px/22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  button.style.cursor = "pointer";
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
    const result = await chrome.runtime.sendMessage({
      type: "KBB_QUERY_FOR_URL",
      url: window.location.href,
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
      if (credential && credential.password) {
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
    showInlineErrorPicker(button, error && error.message ? error.message : String(error));
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
  const picker = document.createElement("div");
  picker.className = "kbb-inline-picker";
  picker.setAttribute("role", "menu");
  applyPickerStyle(picker);
  const header = document.createElement("div");
  header.textContent = `${entries.length} KeePass logins`;
  header.style.padding = "8px 10px";
  header.style.borderBottom = "1px solid #d7dde5";
  header.style.color = "#667085";
  header.style.font =
    '600 12px/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  picker.appendChild(header);
  const items = [];
  let empty = null;
  if (entries.length > 6) {
    const search = document.createElement("input");
    search.type = "search";
    search.className = "kbb-inline-picker-search";
    search.placeholder = "Search logins";
    search.setAttribute("aria-label", "Search KeePass logins");
    applyPickerSearchStyle(search);
    search.addEventListener("mousedown", (event) => event.stopPropagation());
    search.addEventListener("input", () => {
      filterInlinePickerItems(items, empty, search.value);
      positionInlinePicker(button, picker);
    });
    search.addEventListener("keydown", (event) =>
      handlePickerSearchKeydown(event, button, picker, items, empty, search),
    );
    picker.appendChild(search);
    empty = createInlinePickerEmptyState(() => {
      clearInlinePickerSearch(search, items, empty, button, picker);
    });
    empty.style.display = "none";
    picker.appendChild(empty);
  }
  const maxInitialItems = 5;
  let showMoreButton = null;
  for (const [index, entry] of entries.entries()) {
    const item = document.createElement("button");
    item.type = "button";
    item.setAttribute("role", "menuitem");
    item.title = "Fill from KeePass";
    item.dataset.kbbEntryTitle = entry.Title || "";
    item.dataset.kbbSearchText = inlinePickerSearchText(entry);
    if (index >= maxInitialItems) {
      item.dataset.kbbInitiallyHidden = "true";
    }
    applyPickerItemStyle(item);
    if (index >= maxInitialItems) {
      item.style.display = "none";
    }
    const title = document.createElement("div");
    title.textContent = entry.Title || "(Untitled)";
    title.style.fontWeight = "700";
    title.style.overflow = "hidden";
    title.style.textOverflow = "ellipsis";
    title.style.whiteSpace = "nowrap";
    const detail = document.createElement("div");
    detail.textContent = [entry.Group, entry.UserName || entry.Url || ""].filter(Boolean).join(" - ");
    detail.style.color = "#667085";
    detail.style.fontSize = "12px";
    detail.style.overflow = "hidden";
    detail.style.textOverflow = "ellipsis";
    detail.style.whiteSpace = "nowrap";
    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.gap = "6px";
    actions.style.marginTop = "7px";
    actions.appendChild(createPickerActionButton("Fill", "form", button, entry));
    if (entry.UserName) {
      actions.appendChild(createPickerActionButton("User", "username", button, entry));
      actions.appendChild(createPickerActionButton("Copy User", "copy-username", button, entry));
    }
    if (entry.Password) {
      actions.appendChild(createPickerActionButton("Pass", "password", button, entry));
      actions.appendChild(createPickerActionButton("Copy Pass", "copy-password", button, entry));
    }
    if (entry.OneTimePassword) {
      actions.appendChild(createPickerActionButton("OTP", "otp", button, entry));
      actions.appendChild(createPickerActionButton("Copy OTP", "copy-otp", button, entry));
    }
    for (const field of entry.CustomFields || []) {
      if (!field || field.IsProtected === true || !field.Name || typeof field.Value !== "string") continue;
      const custom = createPickerActionButton(field.Name, "custom-field", button, entry);
      custom.dataset.kbbCustomField = field.Name;
      actions.appendChild(custom);
      const copyCustom = createPickerActionButton(`Copy ${field.Name}`, "copy-custom-field", button, entry);
      copyCustom.dataset.kbbCustomField = field.Name;
      actions.appendChild(copyCustom);
    }
    item.appendChild(title);
    item.appendChild(detail);
    item.appendChild(actions);
    item.addEventListener("mousedown", (event) => event.preventDefault());
    item.addEventListener("keydown", (event) =>
      handlePickerItemKeydown(event, button, picker, items),
    );
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      rememberMultiStepCredentialIfNeeded(fillCredentialForButton(button, entry), entry);
      acknowledgeFilledEntry(entry);
      closeInlinePicker();
      setInlineButtonState(button, "ok");
    });
    picker.appendChild(item);
    items.push(item);
  }
  if (entries.length > maxInitialItems) {
    showMoreButton = document.createElement("button");
    showMoreButton.type = "button";
    showMoreButton.dataset.kbbAction = "show-more";
    showMoreButton.textContent = `Show ${entries.length - maxInitialItems} more`;
    applyPickerShowMoreStyle(showMoreButton);
    showMoreButton.addEventListener("mousedown", (event) => event.preventDefault());
    showMoreButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      for (const item of items) {
        item.dataset.kbbInitiallyHidden = "false";
        item.style.display = "block";
      }
      showMoreButton.remove();
      positionInlinePicker(button, picker);
    });
    picker.appendChild(showMoreButton);
  }
  document.documentElement.appendChild(picker);
  positionInlinePicker(button, picker);
  window.__keepassBrowserBridgeActivePicker = picker;
  focusInlinePickerStart(picker, items);
}
function createPickerActionButton(label, action, sourceButton, entry) {
  const actionButton = document.createElement("span");
  actionButton.setAttribute("role", "button");
  actionButton.setAttribute("tabindex", "0");
  actionButton.dataset.kbbAction = action;
  actionButton.textContent = label;
  applyPickerActionStyle(actionButton);
  const run = (event) => {
    event.preventDefault();
    event.stopPropagation();
    rememberMultiStepCredentialIfNeeded(
      fillCredentialAction(sourceButton, entry, action, actionButton.dataset.kbbCustomField || ""),
      entry,
    );
    acknowledgeFilledEntry(entry);
    closeInlinePicker();
    setInlineButtonState(sourceButton, "ok");
  };
  actionButton.addEventListener("mousedown", (event) => event.preventDefault());
  actionButton.addEventListener("click", run);
  actionButton.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") run(event);
  });
  return actionButton;
}
function handlePickerItemKeydown(event, sourceButton, picker, items) {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    event.stopPropagation();
    const visibleItems = getVisiblePickerItems(items);
    if (!visibleItems.length) return;
    const currentIndex = Math.max(0, visibleItems.indexOf(event.currentTarget));
    const delta = event.key === "ArrowDown" ? 1 : -1;
    const nextIndex =
      (currentIndex + delta + visibleItems.length) % visibleItems.length;
    visibleItems[nextIndex].focus();
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    closeInlinePicker();
    if (sourceButton && sourceButton.focus) sourceButton.focus();
    return;
  }

  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.click();
  }
}
function handlePickerSearchKeydown(event, sourceButton, picker, items, empty, search) {
  if (event.key === "ArrowDown") {
    event.preventDefault();
    event.stopPropagation();
    focusFirstVisiblePickerItem(items);
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    if (search && search.value) {
      clearInlinePickerSearch(search, items, empty, sourceButton, picker);
      return;
    }
    closeInlinePicker();
    if (sourceButton && sourceButton.focus) sourceButton.focus();
    return;
  }

  if (event.key === "Enter") {
    const first = getVisiblePickerItems(items)[0];
    if (!first) return;
    event.preventDefault();
    event.stopPropagation();
    first.click();
  }
}
function createInlinePickerEmptyState(onClear) {
  const empty = document.createElement("div");
  empty.className = "kbb-inline-picker-empty";
  empty.style.padding = "10px";
  empty.style.color = "#667085";
  empty.style.font =
    '12px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  const message = document.createElement("div");
  message.textContent = "No matching logins";

  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "kbb-inline-picker-clear-search";
  clear.textContent = "Clear Search";
  clear.style.marginTop = "8px";
  clear.style.width = "100%";
  clear.style.border = "1px solid #176b87";
  clear.style.borderRadius = "6px";
  clear.style.background = "#ffffff";
  clear.style.color = "#176b87";
  clear.style.padding = "6px 8px";
  clear.style.font =
    '600 12px/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  clear.style.cursor = "pointer";
  clear.addEventListener("mousedown", (event) => event.preventDefault());
  clear.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    onClear();
  });

  empty.appendChild(message);
  empty.appendChild(clear);
  return empty;
}
function clearInlinePickerSearch(search, items, empty, sourceButton, picker) {
  if (!search) return;
  search.value = "";
  filterInlinePickerItems(items, empty, "");
  positionInlinePicker(sourceButton, picker);
  search.focus();
}
function focusInlinePickerStart(picker, items) {
  const search = picker ? picker.querySelector(".kbb-inline-picker-search") : null;
  if (search && search.focus) {
    search.focus();
    return;
  }

  focusFirstVisiblePickerItem(items);
}
function focusFirstVisiblePickerItem(items) {
  const first = getVisiblePickerItems(items)[0];
  if (first && first.focus) first.focus();
}
function getVisiblePickerItems(items) {
  return items.filter((item) => item.style.display !== "none");
}
function fillCredentialAction(button, entry, action, customFieldName) {
  const targetInput = button ? button.__kbbTargetInput : null;
  if (action === "copy-username" && entry.UserName) {
    copyTextToClipboard(entry.UserName);
    return { usernameFilled: false, passwordFilled: false, otpFilled: false, copied: true };
  }
  if (action === "copy-password" && entry.Password) {
    copyTextToClipboard(entry.Password);
    return { usernameFilled: false, passwordFilled: false, otpFilled: false, copied: true };
  }
  if (action === "copy-otp" && entry.OneTimePassword) {
    copyTextToClipboard(entry.OneTimePassword);
    return { usernameFilled: false, passwordFilled: false, otpFilled: false, copied: true };
  }
  if (action === "copy-custom-field" && customFieldName) {
    const field = (entry.CustomFields || []).find(
      (candidate) => candidate && candidate.IsProtected !== true && candidate.Name === customFieldName && typeof candidate.Value === "string",
    );
    if (field) {
      copyTextToClipboard(field.Value);
      return { usernameFilled: false, passwordFilled: false, otpFilled: false, copied: true };
    }
  }
  if (action === "username" && entry.UserName) {
    setInputValue(resolveFieldTarget(button, "username"), entry.UserName);
    return { usernameFilled: true, passwordFilled: false, otpFilled: false };
  }
  if (action === "password" && entry.Password) {
    setInputValue(resolveFieldTarget(button, "password"), entry.Password);
    return { usernameFilled: false, passwordFilled: true, otpFilled: false };
  }
  if (action === "otp" && entry.OneTimePassword) {
    setInputValue(resolveFieldTarget(button, "otp"), entry.OneTimePassword);
    return { usernameFilled: false, passwordFilled: false, otpFilled: true };
  }
  if (action === "custom-field" && customFieldName && targetInput) {
    const field = (entry.CustomFields || []).find(
      (candidate) => candidate && candidate.IsProtected !== true && candidate.Name === customFieldName && typeof candidate.Value === "string",
    );
    if (field) {
      setInputValue(targetInput, field.Value);
      return { usernameFilled: false, passwordFilled: false, otpFilled: false, customFieldsFilled: 1 };
    }
  }
  if (action === "form") {
    return fillLogin(entry, credentialScopeForInput(targetInput));
  }
  if (targetInput) {
    return fillCredentialForButton(button, entry);
  }
  return fillLogin(entry);
}
function copyTextToClipboard(value) {
  if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.sendMessage) {
    return;
  }
  const result = getInlineClipboardClearDelayMs()
    .then((clearAfterMs) =>
      chrome.runtime.sendMessage({
        type: "KBB_COPY_TO_CLIPBOARD",
        text: String(value || ""),
        clearAfterMs,
      }),
    );
  if (result && typeof result.catch === "function") {
    result.catch(() => {});
  }
}
function getInlineClipboardClearDelayMs() {
  return new Promise((resolve) => {
    const finish = (settings) => {
      const seconds = Number(settings && settings.clipboardClearDelay);
      resolve(Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 30000);
    };

    try {
      if (!chrome.storage || !chrome.storage.local || !chrome.storage.local.get) {
        finish(null);
        return;
      }

      const maybePromise = chrome.storage.local.get(["clipboardClearDelay"], finish);
      if (maybePromise && typeof maybePromise.then === "function") {
        maybePromise.then(finish, () => finish(null));
      }
    } catch (error) {
      finish(null);
    }
  });
}
function resolveFieldTarget(button, role) {
  const currentRole = button && button.dataset ? button.dataset.kbbFillRole : "";
  if (currentRole === role && button.__kbbTargetInput) {
    return button.__kbbTargetInput;
  }
  const scope = credentialScopeForInput(button ? button.__kbbTargetInput : null);
  const passwordInput = findPasswordInput(scope);
  if (role === "username") return findUsernameInput(passwordInput, scope);
  if (role === "password") return passwordInput;
  if (role === "otp") return findOtpInput(passwordInput, scope);
  return button ? button.__kbbTargetInput : null;
}
function filterInlinePickerItems(items, empty, query) {
  const words = String(query || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const hasQuery = words.length > 0;
  let visible = 0;
  for (const item of items) {
    const text =
      item.dataset && item.dataset.kbbSearchText
        ? item.dataset.kbbSearchText
        : "";
    const matched = words.every((word) => text.indexOf(word) !== -1);
    const hiddenByCollapsedList =
      !hasQuery && item.dataset && item.dataset.kbbInitiallyHidden === "true";
    item.style.display = matched && !hiddenByCollapsedList ? "block" : "none";
    if (matched) visible += 1;
  }
  if (empty) {
    empty.style.display = visible === 0 ? "block" : "none";
  }
}
function inlinePickerSearchText(entry) {
  const customText = (entry.CustomFields || [])
    .map((field) => [field && field.Name, field && field.Value].filter(Boolean).join(" "))
    .join(" ");
  return [entry.Title || "", entry.Group || "", entry.UserName || "", entry.Url || "", customText]
    .join(" ")
    .toLowerCase();
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
    setInputValue(targetInput, entry.OneTimePassword);
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
    url: window.location.href,
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
function showSaveLoginPrompt(credential) {
  const key = credentialKey(credential);
  const activePrompt = window.__keepassBrowserBridgeMutationPrompt;
  if (
    activePrompt &&
    activePrompt.classList &&
    activePrompt.classList.contains("kbb-save-prompt") &&
    activePrompt.dataset.credentialKey === key
  ) {
    return;
  }
  closeMutationPrompt();
  const prompt = document.createElement("div");
  prompt.className = "kbb-save-prompt";
  prompt.dataset.credentialKey = key;
  applySavePromptStyle(prompt);
  const title = document.createElement("div");
  title.textContent = "Save login to KeePass?";
  title.style.fontWeight = "700";
  title.style.marginBottom = "8px";
  const fields = document.createElement("div");
  fields.style.display = "grid";
  fields.style.gap = "7px";
  const titleInput = createPromptInput("title", "Title", credential.title || titleFromCredentialUrl(credential.url));
  const groupInput = createPromptInput("group", "Group", credential.group || "");
  const usernameInput = createPromptInput("userName", "Username", credential.userName || "");
  const urlInput = createPromptInput("url", "URL", credential.url || "");
  const otpInput = createPromptInput("otp", "TOTP secret", credential.otp || "");
  fields.appendChild(titleInput.label);
  fields.appendChild(groupInput.label);
  fields.appendChild(usernameInput.label);
  fields.appendChild(urlInput.label);
  fields.appendChild(otpInput.label);
  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.justifyContent = "flex-end";
  actions.style.gap = "8px";
  actions.style.marginTop = "10px";
  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.textContent = "Not now";
  applyPromptButtonStyle(dismiss, false);
  dismiss.addEventListener("click", closeMutationPrompt);
  const save = document.createElement("button");
  save.type = "button";
  save.textContent = "Save";
  applyPromptButtonStyle(save, true);
  save.addEventListener("click", async () => {
    save.disabled = true;
    save.textContent = "Saving...";
    const login = {
      title: titleInput.input.value,
      group: groupInput.input.value,
      url: urlInput.input.value,
      userName: usernameInput.input.value,
      password: credential.password || "",
    };
    addOptionalSecret(login, "otp", otpInput.input.value);
    const result = await chrome.runtime.sendMessage({
      type: "KBB_CREATE_LOGIN",
      login,
    });
    if (result && result.ok && result.response && result.response.Success) {
      save.textContent = "Saved";
      window.setTimeout(closeMutationPrompt, 900);
    } else {
      save.disabled = false;
      save.textContent = "Retry";
    }
  });
  actions.appendChild(dismiss);
  actions.appendChild(save);
  prompt.appendChild(title);
  prompt.appendChild(fields);
  prompt.appendChild(actions);
  document.documentElement.appendChild(prompt);
  window.__keepassBrowserBridgeMutationPrompt = prompt;
}
function createPromptInput(name, text, value) {
  const label = document.createElement("label");
  label.textContent = text;
  label.style.display = "grid";
  label.style.gap = "3px";
  label.style.color = "#667085";
  label.style.font =
    '600 12px/1.25 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const input = document.createElement("input");
  input.name = name;
  input.value = value || "";
  input.type = name === "url" ? "url" : name === "password" || name === "otp" ? "password" : "text";
  input.spellcheck = false;
  applyPromptInputStyle(input);
  label.appendChild(input);
  return { label, input };
}
function createPromptCheckbox(name, text, checked) {
  const label = document.createElement("label");
  label.style.display = "flex";
  label.style.alignItems = "center";
  label.style.gap = "7px";
  label.style.color = "#667085";
  label.style.font =
    '600 12px/1.25 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const input = document.createElement("input");
  input.name = name;
  input.type = "checkbox";
  input.checked = Boolean(checked);
  input.style.margin = "0";
  input.style.width = "16px";
  input.style.height = "16px";
  input.style.minWidth = "16px";
  input.style.minHeight = "16px";
  label.appendChild(input);
  label.appendChild(document.createTextNode(text));
  return { label, input };
}
function addOptionalSecret(payload, name, value) {
  const trimmed = String(value || "").trim();
  if (trimmed) {
    payload[name] = trimmed;
  }
}
function titleFromCredentialUrl(url) {
  try {
    return new URL(url).hostname || "New Login";
  } catch (error) {
    return "New Login";
  }
}
function showUpdateLoginPrompt(entry, credential) {
  closeMutationPrompt();
  const prompt = document.createElement("div");
  prompt.className = "kbb-update-prompt";
  applySavePromptStyle(prompt);
  const title = document.createElement("div");
  title.textContent = "Update KeePass password?";
  title.style.fontWeight = "700";
  title.style.marginBottom = "8px";
  const fields = document.createElement("div");
  fields.style.display = "grid";
  fields.style.gap = "7px";
  const titleInput = createPromptInput("title", "Title", entry.Title || titleFromCredentialUrl(credential.url));
  const groupInput = createPromptInput("group", "Group", entry.Group || "");
  const urlInput = createPromptInput("url", "URL", entry.Url || credential.url || "");
  const usernameInput = createPromptInput("userName", "Username", credential.userName || entry.UserName || "");
  const passwordInput = createPromptInput("password", "Password", credential.password || "");
  const otpInput = createPromptInput("otp", "TOTP secret", credential.otp || "");
  const clearOtpInput = createPromptCheckbox("clearOtp", "Clear TOTP secret", false);
  fields.appendChild(titleInput.label);
  fields.appendChild(groupInput.label);
  fields.appendChild(urlInput.label);
  fields.appendChild(usernameInput.label);
  fields.appendChild(passwordInput.label);
  fields.appendChild(otpInput.label);
  fields.appendChild(clearOtpInput.label);
  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.justifyContent = "flex-end";
  actions.style.gap = "8px";
  actions.style.marginTop = "10px";
  const dismiss = document.createElement("button");
  dismiss.type = "button";
  dismiss.textContent = "Not now";
  applyPromptButtonStyle(dismiss, false);
  dismiss.addEventListener("click", closeMutationPrompt);
  const update = document.createElement("button");
  update.type = "button";
  update.textContent = "Update";
  applyPromptButtonStyle(update, true);
  update.addEventListener("click", async () => {
    update.disabled = true;
    update.textContent = "Updating...";
    const login = {
      entryId: entry.EntryId,
      pageUrl: credential.url,
      title: titleInput.input.value,
      group: groupInput.input.value,
      url: urlInput.input.value,
      userName: usernameInput.input.value,
      password: passwordInput.input.value,
      clearOtp: clearOtpInput.input.checked,
    };
    if (!login.clearOtp) {
      addOptionalSecret(login, "otp", otpInput.input.value);
    }
    const result = await chrome.runtime.sendMessage({
      type: "KBB_UPDATE_LOGIN",
      login,
    });
    if (result && result.ok && result.response && result.response.Success) {
      update.textContent = "Updated";
      window.setTimeout(closeMutationPrompt, 900);
    } else {
      update.disabled = false;
      update.textContent = "Retry";
    }
  });
  actions.appendChild(dismiss);
  actions.appendChild(update);
  prompt.appendChild(title);
  prompt.appendChild(fields);
  prompt.appendChild(actions);
  document.documentElement.appendChild(prompt);
  window.__keepassBrowserBridgeMutationPrompt = prompt;
}
function closeMutationPrompt() {
  const prompt = window.__keepassBrowserBridgeMutationPrompt;
  if (prompt && prompt.parentElement) prompt.parentElement.removeChild(prompt);
  window.__keepassBrowserBridgeMutationPrompt = null;
}
function applySavePromptStyle(prompt) {
  prompt.style.position = "fixed";
  prompt.style.right = "16px";
  prompt.style.bottom = "16px";
  prompt.style.zIndex = "2147483647";
  prompt.style.width = "300px";
  prompt.style.maxWidth = "calc(100vw - 32px)";
  prompt.style.padding = "12px";
  prompt.style.border = "1px solid #d7dde5";
  prompt.style.borderRadius = "8px";
  prompt.style.background = "#ffffff";
  prompt.style.color = "#1f2933";
  prompt.style.boxShadow = "0 12px 30px rgba(15, 23, 42, 0.22)";
  prompt.style.font =
    '13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}
function applyPromptButtonStyle(button, primary) {
  button.style.margin = "0";
  button.style.minHeight = "30px";
  button.style.padding = "0 10px";
  button.style.border = primary ? "1px solid #176b87" : "1px solid #d7dde5";
  button.style.borderRadius = "6px";
  button.style.background = primary ? "#176b87" : "#ffffff";
  button.style.color = primary ? "#ffffff" : "#1f2933";
  button.style.font =
    '13px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  button.style.cursor = "pointer";
}
function applyPromptInputStyle(input) {
  input.style.width = "100%";
  input.style.minHeight = "30px";
  input.style.boxSizing = "border-box";
  input.style.border = "1px solid #cbd5e1";
  input.style.borderRadius = "6px";
  input.style.padding = "0 8px";
  input.style.background = "#ffffff";
  input.style.color = "#1f2933";
  input.style.font =
    '13px/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  input.style.outline = "none";
}
function applyPickerStyle(picker) {
  picker.style.position = "fixed";
  picker.style.zIndex = "2147483647";
  picker.style.width = "280px";
  picker.style.maxWidth = "calc(100vw - 16px)";
  picker.style.maxHeight = "320px";
  picker.style.overflowY = "auto";
  picker.style.background = "#ffffff";
  picker.style.color = "#1f2933";
  picker.style.border = "1px solid #d7dde5";
  picker.style.borderRadius = "8px";
  picker.style.boxShadow = "0 12px 30px rgba(15, 23, 42, 0.22)";
  picker.style.font =
    '13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}
function applyPickerItemStyle(item) {
  item.style.display = "block";
  item.style.width = "100%";
  item.style.margin = "0";
  item.style.padding = "9px 10px";
  item.style.border = "0";
  item.style.borderBottom = "1px solid #edf0f3";
  item.style.borderRadius = "0";
  item.style.background = "#ffffff";
  item.style.color = "#1f2933";
  item.style.textAlign = "left";
  item.style.cursor = "pointer";
  item.style.appearance = "none";
  item.style.font =
    '13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  item.addEventListener("mouseenter", () => {
    item.style.background = "#f3f7fa";
  });
  item.addEventListener("mouseleave", () => {
    item.style.background = "#ffffff";
  });
}
function applyPickerActionStyle(actionButton) {
  actionButton.style.display = "inline-flex";
  actionButton.style.alignItems = "center";
  actionButton.style.justifyContent = "center";
  actionButton.style.minWidth = "40px";
  actionButton.style.height = "24px";
  actionButton.style.padding = "0 7px";
  actionButton.style.border = "1px solid #d7dde5";
  actionButton.style.borderRadius = "6px";
  actionButton.style.background = "#f8fafc";
  actionButton.style.color = "#176b87";
  actionButton.style.font =
    '600 12px/1 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  actionButton.style.cursor = "pointer";
}
function applyPickerShowMoreStyle(button) {
  button.style.display = "block";
  button.style.width = "100%";
  button.style.margin = "0";
  button.style.padding = "9px 10px";
  button.style.border = "0";
  button.style.borderTop = "1px solid #edf0f3";
  button.style.borderRadius = "0";
  button.style.background = "#f8fafc";
  button.style.color = "#176b87";
  button.style.textAlign = "center";
  button.style.cursor = "pointer";
  button.style.appearance = "none";
  button.style.font =
    '600 12px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}
function applyPickerSearchStyle(search) {
  search.style.display = "block";
  search.style.width = "calc(100% - 16px)";
  search.style.margin = "8px";
  search.style.padding = "7px 9px";
  search.style.border = "1px solid #cbd5e1";
  search.style.borderRadius = "6px";
  search.style.boxSizing = "border-box";
  search.style.background = "#ffffff";
  search.style.color = "#1f2933";
  search.style.font =
    '13px/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  search.style.outline = "none";
}
function positionInlinePicker(button, picker) {
  const rect = button.getBoundingClientRect();
  const width = Math.min(280, window.innerWidth - 16);
  const left = Math.max(
    8,
    Math.min(window.innerWidth - width - 8, rect.right - width),
  );
  const below = rect.bottom + 8;
  const top =
    below + 320 < window.innerHeight
      ? below
      : Math.max(8, rect.top - Math.min(320, picker.scrollHeight || 320) - 8);
  picker.style.width = `${width}px`;
  picker.style.left = `${left}px`;
  picker.style.top = `${top}px`;
}
function setInlineButtonState(button, state) {
  if (state === "ok") {
    button.textContent = "OK";
    button.style.borderColor = "#067647";
    button.style.color = "#067647";
  } else if (state === "!") {
    button.textContent = "!";
    button.style.borderColor = "#b42318";
    button.style.color = "#b42318";
  } else {
    button.textContent = state;
    button.style.borderColor = "#176b87";
    button.style.color = "#176b87";
  }
  window.setTimeout(() => {
    if (document.documentElement.contains(button)) {
      button.textContent = "K";
      button.style.borderColor = "#176b87";
      button.style.color = "#176b87";
    }
  }, 1600);
}
function scoreUsernameCandidate(input) {
  const type = (input.getAttribute("type") || "text").toLowerCase();
  const text = fieldText(input);
  let score = 0;
  if (type === "email") score += 50;
  if (/\busername\b/.test(text)) score += 80;
  if (/\bemail\b|e-mail|mail/.test(text)) score += 70;
  if (/\blogin\b|\buser\b|account/.test(text)) score += 45;
  if (/\bcurrent-password\b|\bnew-password\b/.test(text)) score -= 100;
  if (/\bfname\b|\blname\b|first|last|family|given|surname/.test(text))
    score -= 120;
  if (/\bsearch\b/.test(text)) score -= 60;
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
  if (isProfileOrPaymentFieldText(context)) return false;
  return /\busername\b|current-password|sign\s*in|log\s*in|\blogin\b|identifier|continue|next/.test(context);
}
function isProfileOrPaymentFieldText(text) {
  const normalized = String(text || "").replace(/\be-?mail[\s_-]+address\b/g, "email");
  return /\b(city|address|street|postal|postcode|zip|state|province|country|shipping|billing|checkout|receipt|profile|full\s*name|first\s*name|last\s*name|card|cardholder|ccname|cc-name|ccnumber|cc-number|cc-csc|cvc|cvv|security\s*code|payment|pay\s*now|accounts\s*per\s*page|pagesize)\b/.test(normalized);
}
function isNonLoginCommunicationContext(text) {
  return /\b(contact|support|message|send\s+message|feedback|comment|inquiry|enquiry|help\s+request|ticket)\b/.test(String(text || ""));
}
function scoreOtpCandidate(input) {
  const autocomplete = (input.getAttribute("autocomplete") || "").toLowerCase();
  const inputMode = (input.getAttribute("inputmode") || "").toLowerCase();
  const text = fieldText(input);
  let score = 0;
  if (isProfileOrPaymentFieldText(text)) score -= 999;
  if (autocomplete === "one-time-code") score += 120;
  if (/otp|totp|2fa|mfa|authenticator|verification|passcode/.test(text))
    score += 90;
  if (/nhập mã|nhap ma|mã xác minh|ma xac minh|xác minh|xac minh|mã xác thực|ma xac thuc/.test(text))
    score += 90;
  if (/\bcode\b|\btoken\b|\bpin\b/.test(text)) score += 45;
  if (inputMode === "numeric" && score > 0) score += 10;
  /* Penalty mạnh hơn cho search - không bao giờ chọn ô search làm OTP */ if (
    /\bsearch\b/i.test(text)
  )
    score -= 999;
  if (/\busername\b|\bemail\b|\buser\b|\blogin\b|first|last|name/.test(text))
    score -= 500;
  if ((input.getAttribute("type") || "").toLowerCase() === "password")
    score -= 15;
  return score;
}
function fieldText(input) {
  const parts = [
    input.getAttribute("autocomplete") || "",
    input.getAttribute("name") || "",
    input.id || "",
    input.getAttribute("placeholder") || "",
    input.getAttribute("aria-label") || "",
    referencedElementText(input, "aria-labelledby"),
    referencedElementText(input, "aria-describedby"),
  ];
  const label = input.closest ? input.closest("label") : null;
  if (label && label.textContent) parts.push(label.textContent);
  return parts.join(" ").toLowerCase();
}
function credentialContextText(input) {
  const parts = [fieldText(input)];
  const form = input && input.form ? input.form : input && input.closest ? input.closest("form") : null;
  if (form && form.textContent) parts.push(form.textContent);
  const region = input && input.closest ? input.closest("main, section, article, dialog") : null;
  if (region && region.textContent) parts.push(region.textContent.slice(0, 2000));
  return parts.join(" ").toLowerCase();
}
function referencedElementText(input, attributeName) {
  const ids = String(input.getAttribute(attributeName) || "")
    .split(/\s+/)
    .filter(Boolean);
  if (!ids.length) return "";

  const ownerDocument = input.ownerDocument || document;
  return ids
    .map((id) => {
      const element = ownerDocument.getElementById(id);
      return element && element.textContent ? element.textContent : "";
    })
    .join(" ");
}
function stringEquals(left, right) {
  return String(left || "").toLowerCase() === String(right || "").toLowerCase();
}

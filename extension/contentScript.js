'use strict';

if (!window.__keepassBrowserBridgeContentScriptLoaded) {
  window.__keepassBrowserBridgeContentScriptLoaded = true;
  window.__keepassBrowserBridgeInlineTargets = new WeakSet();
  window.__keepassBrowserBridgeActivePicker = null;
  window.__keepassBrowserBridgeMutationPrompt = null;
  window.__keepassBrowserBridgeBootAt = Date.now();
  window.__keepassBrowserBridgeLastCredentialKey = '';
  window.__keepassBrowserBridgeLastCredentialAt = 0;

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

  installInlineFillButtons();
  restorePendingCredential();
  const observer = new MutationObserver(() => installInlineFillButtons());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('mousedown', (event) => {
    const picker = window.__keepassBrowserBridgeActivePicker;
    if (picker && !picker.contains(event.target) && !event.target.classList.contains('kbb-inline-button')) {
      closeInlinePicker();
    }
  }, true);
  document.addEventListener('submit', (event) => captureLoginSubmit(event.target), true);
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target && target.closest) {
      if (target.closest('.kbb-save-prompt, .kbb-update-prompt, .kbb-inline-picker, .kbb-inline-button')) {
        return;
      }
      const submit = target.closest('button, input[type="submit"]');
      if (submit) captureLoginSubmit(submit.form || submit.closest('form'));
    }
  }, true);
}

function fillLogin(credential) {
  const passwordInput = findPasswordInput();
  const usernameInput = findUsernameInput(passwordInput);
  const otpInput = findOtpInput(passwordInput);
  if (!passwordInput && !usernameInput && !otpInput) {
    throw new Error('No login field found on this page.');
  }

  if (usernameInput && credential.UserName) {
    setInputValue(usernameInput, credential.UserName);
  }

  if (passwordInput && credential.Password) {
    setInputValue(passwordInput, credential.Password);
  }

  if (otpInput && credential.OneTimePassword) {
    setInputValue(otpInput, credential.OneTimePassword);
  }

  return {
    usernameFilled: Boolean(usernameInput && credential.UserName),
    passwordFilled: Boolean(passwordInput && credential.Password),
    otpFilled: Boolean(otpInput && credential.OneTimePassword)
  };
}

function captureLoginSubmit(form) {
  const credential = collectCredentialFromForm(form || document);
  if (!credential || (!credential.userName && !credential.password)) {
    return;
  }

  const key = credentialKey(credential);
  const now = Date.now();
  if (window.__keepassBrowserBridgeLastCredentialKey === key &&
      now - window.__keepassBrowserBridgeLastCredentialAt < 2000) {
    return;
  }

  window.__keepassBrowserBridgeLastCredentialKey = key;
  window.__keepassBrowserBridgeLastCredentialAt = now;
  storePendingCredential(credential);
  window.setTimeout(() => maybePromptSaveLogin(credential), 300);
}

function collectCredentialFromForm(root) {
  const scope = root && root.querySelectorAll ? root : document;
  const passwordInput = Array.from(scope.querySelectorAll('input[type="password"]'))
    .filter((input) => isVisible(input) && !input.disabled && !input.readOnly && input.value)
    .sort((a, b) => b.value.length - a.value.length)[0] || null;
  const usernameInput = findUsernameInput(passwordInput);

  if (!passwordInput && !usernameInput) {
    return null;
  }

  return {
    title: document.title || new URL(window.location.href).hostname,
    url: window.location.href,
    userName: usernameInput ? usernameInput.value : '',
    password: passwordInput ? passwordInput.value : ''
  };
}

async function maybePromptSaveLogin(credential) {
  if (!credential.password) {
    return;
  }

  try {
    const pageUrl = credential.url || window.location.href;
    const result = await chrome.runtime.sendMessage({
      type: 'KBB_QUERY_FOR_URL',
      url: pageUrl
    });

    if (!result || !result.ok) {
      return;
    }

    const entries = result.response && Array.isArray(result.response.entries)
      ? result.response.entries
      : [];
    const match = findCredentialMatch(entries, credential);
    if (!match) {
      showSaveLoginPrompt(credential);
    } else if (match.Password && match.Password !== credential.password) {
      showUpdateLoginPrompt(match, credential);
    }
  } catch (error) {
    // Save prompts are opportunistic; manual extension actions surface bridge errors.
  }
}

function storePendingCredential(credential) {
  try {
    window.sessionStorage.setItem('__kbbPendingCredential', JSON.stringify({
      credential,
      savedAt: Date.now()
    }));
  } catch (error) {
    // Session storage can be disabled; immediate prompt still runs.
  }
}

function restorePendingCredential() {
  window.setTimeout(() => {
    try {
      const raw = window.sessionStorage.getItem('__kbbPendingCredential');
      if (!raw) return;

      window.sessionStorage.removeItem('__kbbPendingCredential');
      const pending = JSON.parse(raw);
      if (!pending || !pending.credential || Date.now() - Number(pending.savedAt || 0) > 2 * 60 * 1000) {
        return;
      }
      if (Number(pending.savedAt || 0) >= window.__keepassBrowserBridgeBootAt) {
        return;
      }

      maybePromptSaveLogin(pending.credential);
    } catch (error) {
      // Pending credentials are best-effort and should never break the page.
    }
  }, 500);
}

function findCredentialMatch(entries, credential) {
  if (!entries.length) return null;

  if (credential.userName) {
    const usernameMatch = entries.find((entry) => stringEquals(entry.UserName, credential.userName));
    if (usernameMatch) return usernameMatch;
  }

  return entries.length === 1 ? entries[0] : null;
}

function credentialKey(credential) {
  return [
    credential.url || '',
    String(credential.userName || '').toLowerCase(),
    credential.password || ''
  ].join('\n');
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

  const scoped = passwordInput
    ? candidates.filter((input) => input.compareDocumentPosition(passwordInput) & Node.DOCUMENT_POSITION_FOLLOWING)
    : candidates;

  if (!scoped.length) {
    return candidates[0] || null;
  }

  const ranked = scoped
    .map((input, index) => ({ input, index, score: scoreUsernameCandidate(input) }))
    .sort((a, b) => (b.score - a.score) || (b.index - a.index));

  return ranked[0].input;
}

function findOtpInput(passwordInput) {
  const candidates = visibleInputs('input')
    .filter((input) => {
      const type = (input.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'tel', 'number', 'password', ''].includes(type)
        && !input.disabled
        && !input.readOnly
        && input !== passwordInput;
    })
    .map((input, index) => ({ input, index, score: scoreOtpCandidate(input) }))
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => (b.score - a.score) || (a.index - b.index));

  return candidates.length ? candidates[0].input : null;
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

function installInlineFillButtons() {
  const passwordInputs = visibleInputs('input[type="password"]')
    .filter((input) => !input.disabled && !input.readOnly);
  const attached = new Set();

  for (const passwordInput of passwordInputs) {
    if (window.__keepassBrowserBridgeInlineTargets.has(passwordInput)) {
      continue;
    }

    const usernameInput = findUsernameInput(passwordInput);
    if (usernameInput && !window.__keepassBrowserBridgeInlineTargets.has(usernameInput)) {
      attachInlineButton(usernameInput, 'username');
      window.__keepassBrowserBridgeInlineTargets.add(usernameInput);
      attached.add(usernameInput);
    }

    if (!attached.has(passwordInput)) {
      attachInlineButton(passwordInput, 'password');
    }

    window.__keepassBrowserBridgeInlineTargets.add(passwordInput);
  }

  if (passwordInputs.length === 0) {
    const usernameInput = findUsernameInput(null);
    if (usernameInput && !window.__keepassBrowserBridgeInlineTargets.has(usernameInput)) {
      attachInlineButton(usernameInput, 'username');
      window.__keepassBrowserBridgeInlineTargets.add(usernameInput);
    }
  }

  const otpInput = findOtpInput(null);
  if (otpInput && !window.__keepassBrowserBridgeInlineTargets.has(otpInput)) {
    attachInlineButton(otpInput, 'otp');
    window.__keepassBrowserBridgeInlineTargets.add(otpInput);
  }
}

function attachInlineButton(input, role) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'kbb-inline-button';
  button.dataset.kbbFillRole = role || 'form';
  button.__kbbTargetInput = input;
  button.setAttribute('aria-label', inlineButtonLabel(button.dataset.kbbFillRole));
  button.title = inlineButtonLabel(button.dataset.kbbFillRole);
  button.textContent = 'K';
  button.addEventListener('mousedown', (event) => event.preventDefault());
  button.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    fillFromInlineButton(button);
  });

  placeInlineButton(input, button);
}

function inlineButtonLabel(role) {
  if (role === 'username') return 'Fill username from KeePass';
  if (role === 'password') return 'Fill password from KeePass';
  if (role === 'otp') return 'Fill one-time code from KeePass';
  return 'Fill from KeePass';
}

function placeInlineButton(input, button) {
  const parent = input.parentElement;
  if (!parent) {
    return;
  }

  const parentStyle = window.getComputedStyle(parent);
  if (parentStyle.position === 'static') {
    parent.style.position = 'relative';
  }

  button.style.position = 'absolute';
  button.style.zIndex = '2147483647';
  button.style.width = '24px';
  button.style.height = '24px';
  button.style.minWidth = '24px';
  button.style.minHeight = '24px';
  button.style.maxWidth = '24px';
  button.style.maxHeight = '24px';
  button.style.margin = '0';
  button.style.padding = '0';
  button.style.boxSizing = 'border-box';
  button.style.border = '1px solid #176b87';
  button.style.borderRadius = '6px';
  button.style.background = '#ffffff';
  button.style.color = '#176b87';
  button.style.appearance = 'none';
  button.style.font = '700 12px/22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 1px 4px rgba(15, 23, 42, 0.18)';

  parent.appendChild(button);
  positionInlineButton(input, button);
  window.addEventListener('resize', () => positionInlineButton(input, button));
  input.addEventListener('focus', () => positionInlineButton(input, button));
}

function positionInlineButton(input, button) {
  const parent = input.parentElement;
  if (!parent || !document.documentElement.contains(input)) {
    button.remove();
    return;
  }

  const inputRect = input.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  button.style.left = `${inputRect.right - parentRect.left - 30}px`;
  button.style.top = `${inputRect.top - parentRect.top + Math.max(4, (inputRect.height - 24) / 2)}px`;
}

async function fillFromInlineButton(button) {
  setInlineButtonState(button, '...');

  try {
    const result = await chrome.runtime.sendMessage({
      type: 'KBB_QUERY_FOR_URL',
      url: window.location.href
    });

    if (!result || !result.ok) {
      throw new Error(result && result.error ? result.error : 'KeePass query failed.');
    }

    const entries = result.response && Array.isArray(result.response.entries)
      ? result.response.entries
      : [];

    if (entries.length === 0) {
      const credential = collectCredentialFromForm(document);
      if (credential && credential.password) {
        showSaveLoginPrompt(credential);
      }
      setInlineButtonState(button, '0');
      return;
    }

    if (entries.length > 1) {
      showInlinePicker(button, entries);
      setInlineButtonState(button, String(entries.length));
      return;
    }

    fillCredentialForButton(button, entries[0]);
    setInlineButtonState(button, 'ok');
  } catch (error) {
    setInlineButtonState(button, '!');
  }
}

function showInlinePicker(button, entries) {
  closeInlinePicker();

  const picker = document.createElement('div');
  picker.className = 'kbb-inline-picker';
  picker.setAttribute('role', 'menu');
  applyPickerStyle(picker);

  const header = document.createElement('div');
  header.textContent = `${entries.length} KeePass logins`;
  header.style.padding = '8px 10px';
  header.style.borderBottom = '1px solid #d7dde5';
  header.style.color = '#667085';
  header.style.font = '600 12px/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  picker.appendChild(header);

  for (const entry of entries.slice(0, 8)) {
    const item = document.createElement('button');
    item.type = 'button';
    item.setAttribute('role', 'menuitem');
    item.title = 'Fill from KeePass';
    applyPickerItemStyle(item);

    const title = document.createElement('div');
    title.textContent = entry.Title || '(Untitled)';
    title.style.fontWeight = '700';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';
    title.style.whiteSpace = 'nowrap';

    const detail = document.createElement('div');
    detail.textContent = entry.UserName || entry.Url || '';
    detail.style.color = '#667085';
    detail.style.fontSize = '12px';
    detail.style.overflow = 'hidden';
    detail.style.textOverflow = 'ellipsis';
    detail.style.whiteSpace = 'nowrap';

    item.appendChild(title);
    item.appendChild(detail);
    item.addEventListener('mousedown', (event) => event.preventDefault());
    item.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      fillCredentialForButton(button, entry);
      closeInlinePicker();
      setInlineButtonState(button, 'ok');
    });

    picker.appendChild(item);
  }

  if (entries.length > 8) {
    const footer = document.createElement('div');
    footer.textContent = `${entries.length - 8} more hidden`;
    footer.style.padding = '7px 10px';
    footer.style.color = '#667085';
    footer.style.font = '12px/1.3 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    footer.style.borderTop = '1px solid #d7dde5';
    picker.appendChild(footer);
  }

  document.documentElement.appendChild(picker);
  positionInlinePicker(button, picker);
  window.__keepassBrowserBridgeActivePicker = picker;
}

function fillCredentialForButton(button, entry) {
  const role = button && button.dataset ? button.dataset.kbbFillRole : 'form';
  const targetInput = button ? button.__kbbTargetInput : null;

  if (role === 'username' && targetInput && entry.UserName) {
    setInputValue(targetInput, entry.UserName);
    return { usernameFilled: true, passwordFilled: false, otpFilled: false };
  }

  if (role === 'password' && targetInput && entry.Password) {
    setInputValue(targetInput, entry.Password);
    return { usernameFilled: false, passwordFilled: true, otpFilled: false };
  }

  if (role === 'otp' && targetInput && entry.OneTimePassword) {
    setInputValue(targetInput, entry.OneTimePassword);
    return { usernameFilled: false, passwordFilled: false, otpFilled: true };
  }

  return fillLogin(entry);
}

function closeInlinePicker() {
  const picker = window.__keepassBrowserBridgeActivePicker;
  if (picker && picker.parentElement) {
    picker.parentElement.removeChild(picker);
  }
  window.__keepassBrowserBridgeActivePicker = null;
}

function showSaveLoginPrompt(credential) {
  closeMutationPrompt();

  const prompt = document.createElement('div');
  prompt.className = 'kbb-save-prompt';
  applySavePromptStyle(prompt);

  const title = document.createElement('div');
  title.textContent = 'Save login to KeePass?';
  title.style.fontWeight = '700';
  title.style.marginBottom = '4px';

  const detail = document.createElement('div');
  detail.textContent = credential.userName || new URL(credential.url).hostname;
  detail.style.color = '#667085';
  detail.style.fontSize = '12px';
  detail.style.overflow = 'hidden';
  detail.style.textOverflow = 'ellipsis';
  detail.style.whiteSpace = 'nowrap';

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '8px';
  actions.style.marginTop = '10px';

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.textContent = 'Not now';
  applyPromptButtonStyle(dismiss, false);
  dismiss.addEventListener('click', closeMutationPrompt);

  const save = document.createElement('button');
  save.type = 'button';
  save.textContent = 'Save';
  applyPromptButtonStyle(save, true);
  save.addEventListener('click', async () => {
    save.disabled = true;
    save.textContent = 'Saving...';
    const result = await chrome.runtime.sendMessage({
      type: 'KBB_CREATE_LOGIN',
      login: credential
    });
    if (result && result.ok && result.response && result.response.Success) {
      save.textContent = 'Saved';
      window.setTimeout(closeMutationPrompt, 900);
    } else {
      save.disabled = false;
      save.textContent = 'Retry';
    }
  });

  actions.appendChild(dismiss);
  actions.appendChild(save);
  prompt.appendChild(title);
  prompt.appendChild(detail);
  prompt.appendChild(actions);
  document.documentElement.appendChild(prompt);
  window.__keepassBrowserBridgeMutationPrompt = prompt;
}

function showUpdateLoginPrompt(entry, credential) {
  closeMutationPrompt();

  const prompt = document.createElement('div');
  prompt.className = 'kbb-update-prompt';
  applySavePromptStyle(prompt);

  const title = document.createElement('div');
  title.textContent = 'Update KeePass password?';
  title.style.fontWeight = '700';
  title.style.marginBottom = '4px';

  const detail = document.createElement('div');
  detail.textContent = credential.userName || entry.Title || new URL(credential.url).hostname;
  detail.style.color = '#667085';
  detail.style.fontSize = '12px';
  detail.style.overflow = 'hidden';
  detail.style.textOverflow = 'ellipsis';
  detail.style.whiteSpace = 'nowrap';

  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.justifyContent = 'flex-end';
  actions.style.gap = '8px';
  actions.style.marginTop = '10px';

  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.textContent = 'Not now';
  applyPromptButtonStyle(dismiss, false);
  dismiss.addEventListener('click', closeMutationPrompt);

  const update = document.createElement('button');
  update.type = 'button';
  update.textContent = 'Update';
  applyPromptButtonStyle(update, true);
  update.addEventListener('click', async () => {
    update.disabled = true;
    update.textContent = 'Updating...';
    const result = await chrome.runtime.sendMessage({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        entryId: entry.EntryId,
        pageUrl: credential.url,
        userName: credential.userName,
        password: credential.password
      }
    });
    if (result && result.ok && result.response && result.response.Success) {
      update.textContent = 'Updated';
      window.setTimeout(closeMutationPrompt, 900);
    } else {
      update.disabled = false;
      update.textContent = 'Retry';
    }
  });

  actions.appendChild(dismiss);
  actions.appendChild(update);
  prompt.appendChild(title);
  prompt.appendChild(detail);
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
  prompt.style.position = 'fixed';
  prompt.style.right = '16px';
  prompt.style.bottom = '16px';
  prompt.style.zIndex = '2147483647';
  prompt.style.width = '300px';
  prompt.style.maxWidth = 'calc(100vw - 32px)';
  prompt.style.padding = '12px';
  prompt.style.border = '1px solid #d7dde5';
  prompt.style.borderRadius = '8px';
  prompt.style.background = '#ffffff';
  prompt.style.color = '#1f2933';
  prompt.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.22)';
  prompt.style.font = '13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}

function applyPromptButtonStyle(button, primary) {
  button.style.margin = '0';
  button.style.minHeight = '30px';
  button.style.padding = '0 10px';
  button.style.border = primary ? '1px solid #176b87' : '1px solid #d7dde5';
  button.style.borderRadius = '6px';
  button.style.background = primary ? '#176b87' : '#ffffff';
  button.style.color = primary ? '#ffffff' : '#1f2933';
  button.style.font = '13px/1.2 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  button.style.cursor = 'pointer';
}

function applyPickerStyle(picker) {
  picker.style.position = 'fixed';
  picker.style.zIndex = '2147483647';
  picker.style.width = '280px';
  picker.style.maxWidth = 'calc(100vw - 16px)';
  picker.style.maxHeight = '320px';
  picker.style.overflowY = 'auto';
  picker.style.background = '#ffffff';
  picker.style.color = '#1f2933';
  picker.style.border = '1px solid #d7dde5';
  picker.style.borderRadius = '8px';
  picker.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.22)';
  picker.style.font = '13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
}

function applyPickerItemStyle(item) {
  item.style.display = 'block';
  item.style.width = '100%';
  item.style.margin = '0';
  item.style.padding = '9px 10px';
  item.style.border = '0';
  item.style.borderBottom = '1px solid #edf0f3';
  item.style.borderRadius = '0';
  item.style.background = '#ffffff';
  item.style.color = '#1f2933';
  item.style.textAlign = 'left';
  item.style.cursor = 'pointer';
  item.style.appearance = 'none';
  item.style.font = '13px/1.35 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  item.addEventListener('mouseenter', () => {
    item.style.background = '#f3f7fa';
  });
  item.addEventListener('mouseleave', () => {
    item.style.background = '#ffffff';
  });
}

function positionInlinePicker(button, picker) {
  const rect = button.getBoundingClientRect();
  const width = Math.min(280, window.innerWidth - 16);
  const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width));
  const below = rect.bottom + 8;
  const top = below + 320 < window.innerHeight
    ? below
    : Math.max(8, rect.top - Math.min(320, picker.scrollHeight || 320) - 8);

  picker.style.width = `${width}px`;
  picker.style.left = `${left}px`;
  picker.style.top = `${top}px`;
}

function setInlineButtonState(button, state) {
  if (state === 'ok') {
    button.textContent = 'OK';
    button.style.borderColor = '#067647';
    button.style.color = '#067647';
  } else if (state === '!') {
    button.textContent = '!';
    button.style.borderColor = '#b42318';
    button.style.color = '#b42318';
  } else {
    button.textContent = state;
    button.style.borderColor = '#176b87';
    button.style.color = '#176b87';
  }

  window.setTimeout(() => {
    if (document.documentElement.contains(button)) {
      button.textContent = 'K';
      button.style.borderColor = '#176b87';
      button.style.color = '#176b87';
    }
  }, 1600);
}

function scoreUsernameCandidate(input) {
  const type = (input.getAttribute('type') || 'text').toLowerCase();
  const text = [
    input.getAttribute('autocomplete') || '',
    input.getAttribute('name') || '',
    input.id || '',
    input.getAttribute('placeholder') || '',
    input.getAttribute('aria-label') || ''
  ].join(' ').toLowerCase();

  let score = 0;
  if (type === 'email') score += 50;
  if (/\busername\b/.test(text)) score += 80;
  if (/\bemail\b|e-mail|mail/.test(text)) score += 70;
  if (/\blogin\b|\buser\b|account/.test(text)) score += 45;
  if (/\bcurrent-password\b|\bnew-password\b/.test(text)) score -= 100;
  if (/\bfname\b|\blname\b|first|last|family|given|surname/.test(text)) score -= 120;
  if (/\bsearch\b/.test(text)) score -= 60;
  return score;
}

function scoreOtpCandidate(input) {
  const autocomplete = (input.getAttribute('autocomplete') || '').toLowerCase();
  const inputMode = (input.getAttribute('inputmode') || '').toLowerCase();
  const text = [
    autocomplete,
    input.getAttribute('name') || '',
    input.id || '',
    input.getAttribute('placeholder') || '',
    input.getAttribute('aria-label') || ''
  ].join(' ').toLowerCase();

  let score = 0;
  if (autocomplete === 'one-time-code') score += 120;
  if (/\botp\b|\btotp\b|2fa|mfa|authenticator|verification/.test(text)) score += 90;
  if (/\bcode\b|\btoken\b/.test(text)) score += 45;
  if (inputMode === 'numeric') score += 10;
  if (/\busername\b|\bemail\b|\buser\b|\blogin\b|search|first|last|name/.test(text)) score -= 100;
  if ((input.getAttribute('type') || '').toLowerCase() === 'password') score -= 15;
  return score;
}

function stringEquals(left, right) {
  return String(left || '').toLowerCase() === String(right || '').toLowerCase();
}
